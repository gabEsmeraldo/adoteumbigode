export type ImportedExpense = {
  date: string;
  establishment: string;
  installment: string;
  category: string;
  city: string;
  value: number;
};

export type ParsedInvoice = {
  bank: string;
  expenses: ImportedExpense[];
  declaredTotal: number | null;
  dueDate: string | null;
  totalPages: number;
};

type ParseResult = Omit<ParsedInvoice, "bank" | "totalPages">;

type InvoiceParser = {
  bank: string;
  detect: RegExp;
  parse: (lines: string[]) => ParseResult;
};

const money = String.raw`[\d.]+,\d{2}`;

function parseBRL(value: string) {
  return Number(value.replace(/[−\s]/g, "-").replace(/\./g, "").replace(",", "."));
}

const round = (value: number) => Math.round(value * 100) / 100;

const isPayment = (description: string) =>
  /^(PGTO|PAGAMENTO|Pagamento em)/i.test(description);

function expense(
  date: string,
  establishment: string,
  value: number,
  extra: Partial<ImportedExpense> = {},
): ImportedExpense {
  return {
    date,
    establishment: establishment.trim(),
    installment: "",
    category: "",
    city: "",
    value,
    ...extra,
  };
}

function parseItau(lines: string[]): ParseResult {
  const transactionPattern = new RegExp(
    String.raw`^(\d{2}\/\d{2})\s+(.+?)\s+(-?${money})$`,
  );
  const installmentPattern = /^(.*?)\s+(\d{2}\/\d{2})$/;
  const expenses: ImportedExpense[] = [];
  let declaredTotal: number | null = null;
  let dueDate: string | null = null;
  let isInExpenses = false;
  let lastExpense: ImportedExpense | null = null;

  for (const line of lines) {
    const dueDateMatch = line.match(/^Vencimento:\s*(\d{2}\/\d{2}\/\d{4})/i);
    if (dueDateMatch && !dueDate) dueDate = dueDateMatch[1];

    if (/Lan[çc]amentos: compras e saques/i.test(line)) {
      isInExpenses = true;
      lastExpense = null;
      continue;
    }

    if (
      /^(Pagamentos efetuados|Compras parceladas - pr[óo]ximas faturas)/i.test(
        line,
      )
    ) {
      isInExpenses = false;
      lastExpense = null;
      continue;
    }

    if (/^DATA\s+(ESTABELECIMENTO\s+)?VALOR/i.test(line)) {
      lastExpense = null;
      continue;
    }

    const totalMatch = line.match(
      new RegExp(String.raw`^Lan[çc]amentos no cart[ãa]o\s+(${money})$`, "i"),
    );
    if (totalMatch) declaredTotal = parseBRL(totalMatch[1]);

    if (
      /^(Total|Lan[çc]amentos no cart|Pr[óo]xima fatura|Demais faturas)/i.test(
        line,
      )
    ) {
      isInExpenses = false;
      lastExpense = null;
      continue;
    }

    if (!isInExpenses) continue;

    const transactionMatch = line.match(transactionPattern);
    if (transactionMatch) {
      let [, date, establishment, value] = transactionMatch;
      let installment = "";
      const installmentMatch = establishment.match(installmentPattern);

      if (installmentMatch) {
        establishment = installmentMatch[1];
        installment = installmentMatch[2];
      }

      lastExpense = expense(date, establishment, parseBRL(value), {
        installment,
      });
      expenses.push(lastExpense);
      continue;
    }

    if (lastExpense && !/\d/.test(line) && line.split(/\s+/).length <= 5) {
      const [category, ...city] = line.split(/\s+/);
      lastExpense.category = category;
      lastExpense.city = city.join(" ");
    }
    lastExpense = null;
  }

  return { expenses, declaredTotal, dueDate };
}

const nubankMonths = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
];

function nubankDate(day: string, month: string) {
  const index = nubankMonths.indexOf(month.toUpperCase());
  return `${day}/${String(index + 1).padStart(2, "0")}`;
}

function parseNubank(lines: string[]): ParseResult {
  const months = nubankMonths.join("|");
  const rowPattern = new RegExp(
    String.raw`^(\d{2}) (${months})\s+(?:•+ \d{4}\s+)?(.+?)(?:\s+([−-]?R\$ ${money}))?$`,
  );
  const valuePattern = new RegExp(String.raw`^([−-]?)R\$ (${money})$`);
  const expenses: ImportedExpense[] = [];
  let dueDate: string | null = null;
  let total: number | null = null;
  let previous = 0;
  let paid = 0;
  let isInExpenses = false;
  let pending: ImportedExpense | null = null;

  const signed = (raw: string) => {
    const [, sign, value] = raw.match(valuePattern)!;
    return sign ? -parseBRL(value) : parseBRL(value);
  };

  for (const line of lines) {
    const dueMatch = line.match(
      new RegExp(String.raw`^Data de vencimento: (\d{2}) (${months}) (\d{4})`),
    );
    if (dueMatch && !dueDate) {
      dueDate = `${nubankDate(dueMatch[1], dueMatch[2])}/${dueMatch[3]}`;
    }

    const summary = line.match(
      new RegExp(String.raw`^(Fatura anterior|Pagamento recebido|Total a pagar) [−-]?R\$ (${money})$`),
    );
    if (summary) {
      const value = parseBRL(summary[2]);
      if (summary[1] === "Fatura anterior") previous = value;
      else if (summary[1] === "Pagamento recebido") paid = value;
      else total = value;
    }

    if (/^TRANSA[ÇC][ÕO]ES DE/i.test(line)) {
      isInExpenses = true;
      continue;
    }
    if (/^Pagamentos [−-]?R\$/.test(line)) {
      isInExpenses = false;
      pending = null;
      continue;
    }
    if (!isInExpenses) continue;

    if (pending && valuePattern.test(line)) {
      pending.value = signed(line);
      expenses.push(pending);
      pending = null;
      continue;
    }

    const row = line.match(rowPattern);
    if (!row) continue;

    const [, day, month, rawDescription, rawValue] = row;
    if (isPayment(rawDescription)) continue;

    let description = rawDescription;
    let installment = "";
    const installmentMatch = description.match(/^(.*?) - Parcela (\d+\/\d+)$/);
    if (installmentMatch) {
      description = installmentMatch[1];
      installment = installmentMatch[2];
    }

    const item = expense(nubankDate(day, month), description, 0, {
      installment,
    });
    if (rawValue) {
      item.value = signed(rawValue);
      expenses.push(item);
    } else {
      pending = item;
    }
  }

  return {
    expenses,
    declaredTotal: total === null ? null : round(total - previous + paid),
    dueDate,
  };
}

function parseBancoDoBrasil(lines: string[]): ParseResult {
  const rowPattern = new RegExp(
    String.raw`^(\d{2}\/\d{2}) (.+?) ([A-Z]{2}) R\$ (-?${money})$`,
  );
  const expenses: ImportedExpense[] = [];
  let dueDate: string | null = null;
  let total: number | null = null;
  let previous = 0;
  let paid = 0;
  let category = "";
  let isInExpenses = false;
  let awaitingDueDate = false;

  for (const line of lines) {
    if (awaitingDueDate && /^\d{2}\/\d{2}\/\d{4}$/.test(line)) {
      dueDate = line;
    }
    awaitingDueDate = line === "Vencimento" && !dueDate;

    const previousMatch = line.match(
      new RegExp(String.raw`^Saldo fatura anterior R\$ (${money})$`),
    );
    if (previousMatch) previous = parseBRL(previousMatch[1]);

    const totalMatch = line.match(
      new RegExp(String.raw`^Total da Fatura R\$ (${money})$`, "i"),
    );
    if (totalMatch) {
      total = parseBRL(totalMatch[1]);
      isInExpenses = false;
      continue;
    }

    if (/^Lan[çc]amentos nesta fatura/i.test(line)) {
      isInExpenses = true;
      continue;
    }
    if (!isInExpenses) continue;

    const row = line.match(rowPattern);
    if (!row) {
      if (!/\d/.test(line) && line.split(/\s+/).length <= 4) category = line;
      continue;
    }

    const [, date, rawDescription, , rawValue] = row;
    const value = parseBRL(rawValue);
    if (isPayment(rawDescription)) {
      paid += -value;
      continue;
    }

    let description = rawDescription;
    let installment = "";
    let city = "";
    const installmentMatch = description.match(/^(.*?) PARC (\d+\/\d+)\s*(.*)$/);
    if (installmentMatch) {
      [, description, installment, city] = installmentMatch;
    }

    expenses.push(
      expense(date, description, value, {
        installment,
        city,
        category: /^Pagamentos/i.test(category) ? "" : category,
      }),
    );
  }

  return {
    expenses,
    declaredTotal: total === null ? null : round(total - previous + paid),
    dueDate,
  };
}

function parseBancoDoNordeste(lines: string[]): ParseResult {
  const rowPattern = new RegExp(
    String.raw`^(\d{2}\/\d{2}) (.+?) (-?${money}) ([DC])$`,
  );
  const expenses: ImportedExpense[] = [];
  let dueDate: string | null = null;
  let charges: number | null = null;
  let credits = 0;
  let paid = 0;

  for (const line of lines) {
    const dueMatch = line.match(/^Data de Vencimento: (\d{2}\/\d{2}\/\d{4})/i);
    if (dueMatch && !dueDate) dueDate = dueMatch[1];

    const chargesMatch = line.match(
      new RegExp(String.raw`^\(\+\) Total Despesas (${money})`),
    );
    if (chargesMatch) charges = parseBRL(chargesMatch[1]);

    const creditsMatch = line.match(
      new RegExp(String.raw`^\(-\) Total de Pagamentos\/Cr[ée]ditos (${money})`),
    );
    if (creditsMatch) credits = parseBRL(creditsMatch[1]);

    const row = line.match(rowPattern);
    if (!row) continue;

    const [, date, rawDescription, rawValue, kind] = row;
    const value = Math.abs(parseBRL(rawValue)) * (kind === "C" ? -1 : 1);
    if (isPayment(rawDescription)) {
      paid += -value;
      continue;
    }

    let description = rawDescription;
    let installment = "";
    const installmentMatch = description.match(/^(.*?) (\d{2}\/\d{2})$/);
    if (installmentMatch) [, description, installment] = installmentMatch;

    expenses.push(expense(date, description, value, { installment }));
  }

  return {
    expenses,
    declaredTotal: charges === null ? null : round(charges - credits + paid),
    dueDate,
  };
}

function parseBradesco(lines: string[]): ParseResult {
  const endPattern = new RegExp(
    String.raw`^(.*?) \d{3} ${money} ${money} R\$ ${money} (-?${money})$`,
  );
  const expenses: ImportedExpense[] = [];
  let declaredTotal: number | null = null;
  let buffer: { date: string; text: string } | null = null;

  for (const line of lines) {
    const totalMatch = line.match(
      new RegExp(String.raw`Total da Fatura em Real[ .]*R\$ (${money})`, "i"),
    );
    if (totalMatch) declaredTotal = parseBRL(totalMatch[1]);

    const start = line.match(/^(\d{2}\/\d{2}) (.*)$/);
    if (start) buffer = { date: start[1], text: start[2] };
    else if (buffer) buffer.text += ` ${line}`;
    else continue;

    const end = buffer.text.match(endPattern);
    if (!end) continue;

    const { date } = buffer;
    buffer = null;
    const [, rawDescription, rawValue] = end;
    if (isPayment(rawDescription)) continue;

    let description = rawDescription;
    let installment = "";
    const installmentMatch = description.match(/^(.*?) (\d+) ?\/ ?(\d+)$/);
    if (installmentMatch) {
      description = installmentMatch[1];
      installment = `${installmentMatch[2]}/${installmentMatch[3]}`;
    }

    expenses.push(
      expense(date, description.replace(/\s+\*\s*$/, ""), parseBRL(rawValue), {
        installment,
      }),
    );
  }

  return { expenses, declaredTotal, dueDate: null };
}

const parsers: InvoiceParser[] = [
  { bank: "Nubank", detect: /Nu Pagamentos|Nubank/i, parse: parseNubank },
  { bank: "Banco do Brasil", detect: /OUROCARD|bb\.com\.br/i, parse: parseBancoDoBrasil },
  { bank: "Banco do Nordeste", detect: /Banco do Nordeste|bnb\.gov\.br/i, parse: parseBancoDoNordeste },
  { bank: "Bradesco", detect: /Bradesco/i, parse: parseBradesco },
  { bank: "Itaú", detect: /Ita[uú]/i, parse: parseItau },
];

export const supportedBanks = parsers.map((parser) => parser.bank);

export function parseInvoice(text: string, totalPages: number): ParsedInvoice {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const detected = parsers.filter((parser) => parser.detect.test(text));
  const candidates = detected.length ? detected : parsers;

  // When detection is ambiguous, keep whichever parser read the most entries.
  let best: ParsedInvoice | null = null;
  for (const parser of candidates) {
    const result = { ...parser.parse(lines), bank: parser.bank, totalPages };
    if (!best || result.expenses.length > best.expenses.length) best = result;
    if (best.expenses.length && detected.length) break;
  }

  return best!;
}
