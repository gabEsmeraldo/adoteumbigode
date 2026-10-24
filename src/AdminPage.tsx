import {
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { extractText, getDocumentProxy } from "unpdf";
import logo from "./imports/sticker_logo.png";
import { parseInvoice, supportedBanks, type ParsedInvoice } from "./invoices";
import { auth, isFirebaseConfigured } from "./firebase";
import {
  currency,
  fetchReport,
  formatDate,
  monthLabel as formatMonthLabel,
  saveReport,
  totalSpent,
  type Expense,
} from "./reports";

type ExpenseDraft = Omit<Expense, "id" | "value"> & {
  value: string;
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

const newId = () => crypto.randomUUID();

const emptyExpense: ExpenseDraft = {
  date: "",
  product: "",
  supplier: "",
  payment: "Pix",
  details: "",
  value: "",
};

function Login({
  error,
  onLocalLogin,
}: {
  error: string;
  onLocalLogin: () => void;
}) {
  const [loginError, setLoginError] = useState("");

  const login = async () => {
    if (!auth) {
      onLocalLogin();
      return;
    }
    setLoginError("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch {
      setLoginError("Não foi possível entrar. Tente novamente.");
    }
  };

  return (
    <main className="grid min-h-screen bg-[#f7f5ef] text-[#18314a] lg:grid-cols-[.85fr_1.15fr]">
      <section className="flex min-h-[38vh] flex-col justify-between overflow-hidden bg-[#1263a5] p-7 text-white sm:p-12 lg:min-h-screen lg:p-16">
        <a
          href="/"
          className="w-fit rounded-xl border border-white/30 bg-white px-4 py-3 shadow-[4px_4px_0_#18314a]"
          aria-label="Adote um Bigode — início"
        >
          <img
            src={logo}
            alt="Adote um Bigode"
            className="h-14 w-auto object-contain sm:h-16"
          />
        </a>

        <div className="max-w-xl py-12 lg:py-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f5c65c]">
            Área administrativa
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-[1.04] tracking-[-0.045em] sm:text-6xl">
            Cuidado também se faz com transparência.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-white/70">
            Organize entradas e despesas para manter a prestação de contas do
            projeto sempre atualizada.
          </p>
        </div>

        <p className="hidden text-xs leading-relaxed text-white/50 lg:block">
          Adote um Bigode · Painel de gestão
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-md">
          <p className="eyebrow">Acesso restrito</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
            Entre no painel
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#18314a]/65">
            {isFirebaseConfigured
              ? "Entre com a conta Google autorizada para editar a prestação de contas."
              : "Modo local: o Firebase ainda não foi configurado, então os relatórios ficam salvos apenas neste navegador."}
          </p>

          <button
            type="button"
            onClick={login}
            className="button-primary mt-8 w-full"
          >
            {isFirebaseConfigured ? "Entrar com Google" : "Entrar no modo local"}{" "}
            <span aria-hidden="true">→</span>
          </button>

          {(error || loginError) && (
            <p role="alert" className="mt-4 text-sm font-bold text-[#9f2f2f]">
              {error || loginError}
            </p>
          )}

          <a
            href="/"
            className="mt-7 inline-flex border-b border-[#18314a]/35 pb-1 text-sm font-bold"
          >
            ← Voltar para o site
          </a>
        </div>
      </section>
    </main>
  );
}

function AdminDashboard({
  email,
  onLogout,
}: {
  email: string;
  onLogout: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const paintingRef = useRef<boolean | null>(null);
  const selectionAnchorRef = useRef<number | null>(null);
  const [month, setMonth] = useState(currentMonth);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [published, setPublished] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [draft, setDraft] = useState<ExpenseDraft>(emptyExpense);
  const [importedFile, setImportedFile] = useState("");
  const [parsedInvoice, setParsedInvoice] = useState<ParsedInvoice | null>(
    null,
  );
  const [selectedImported, setSelectedImported] = useState<boolean[]>([]);
  const [isReadingInvoice, setIsReadingInvoice] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const spent = useMemo(() => totalSpent(expenses), [expenses]);
  const monthLabel = formatMonthLabel(month || currentMonth());
  const selectedImportedExpenses =
    parsedInvoice?.expenses.filter((_, index) => selectedImported[index]) ?? [];
  const selectedImportedTotal = selectedImportedExpenses.reduce(
    (total, expense) => total + expense.value,
    0,
  );
  const readInvoiceTotal =
    parsedInvoice?.expenses.reduce(
      (total, expense) => total + expense.value,
      0,
    ) ?? 0;

  useEffect(() => {
    if (!month) return;
    let isCurrent = true;
    setIsLoadingReport(true);
    setSavedMessage("");

    fetchReport(month)
      .then((report) => {
        if (!isCurrent) return;
        setExpenses(report?.expenses ?? []);
        setPublished(report?.published ?? false);
        setIsDirty(false);
      })
      .catch(() => {
        if (isCurrent) setSavedMessage("Não foi possível carregar este mês.");
      })
      .finally(() => {
        if (isCurrent) setIsLoadingReport(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [month]);

  useEffect(() => {
    const stopPainting = () => {
      paintingRef.current = null;
    };

    window.addEventListener("pointerup", stopPainting);
    return () => window.removeEventListener("pointerup", stopPainting);
  }, []);

  useEffect(() => {
    if (!selectAllRef.current || !parsedInvoice) return;
    const selectedCount = selectedImported.filter(Boolean).length;
    selectAllRef.current.indeterminate =
      selectedCount > 0 && selectedCount < parsedInvoice.expenses.length;
  }, [parsedInvoice, selectedImported]);

  const updateDraft = (field: keyof ExpenseDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const addExpense = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(draft.value.replace(",", "."));
    if (!value) return;

    setExpenses((current) => [
      ...current,
      {
        ...draft,
        id: newId(),
        value,
      },
    ]);
    setIsDirty(true);
    setDraft(emptyExpense);
    setSavedMessage("");
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setImportError("Selecione um arquivo no formato PDF.");
      return;
    }

    setImportedFile(file.name);
    setParsedInvoice(null);
    setSelectedImported([]);
    setImportError("");
    setImportMessage(`Lendo ${file.name}...`);
    setIsReadingInvoice(true);

    try {
      const pdf = await getDocumentProxy(
        new Uint8Array(await file.arrayBuffer()),
      );
      const { totalPages, text } = await extractText(pdf, {
        mergePages: false,
      });
      const result = parseInvoice(text.join("\n"), totalPages);

      if (!result.expenses.length) {
        throw new Error(
          `Nenhum lançamento foi encontrado. A leitura automática reconhece faturas ${supportedBanks.join(", ")}.`,
        );
      }

      setParsedInvoice(result);
      setSelectedImported(result.expenses.map(() => true));
      setImportMessage(
        `Fatura ${result.bank}: ${result.expenses.length} lançamentos encontrados em ${totalPages} página(s).`,
      );

      if (result.dueDate) {
        const [, dueMonth, dueYear] = result.dueDate.split("/");
        const dueMonthValue = `${dueYear}-${dueMonth}`;
        if (dueMonthValue !== month && !isDirty) setMonth(dueMonthValue);
      }
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "Não foi possível ler esta fatura.",
      );
      setImportMessage("");
    } finally {
      setIsReadingInvoice(false);
    }
  };

  const startPainting = (
    event: ReactPointerEvent<HTMLTableRowElement>,
    index: number,
  ) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (event.pointerType !== "mouse" && !target.closest("td[data-selection]")) {
      return;
    }

    event.preventDefault();
    setSelectedImported((current) => {
      const next = [...current];

      if (event.shiftKey && selectionAnchorRef.current !== null) {
        const anchor = selectionAnchorRef.current;
        const state = current[anchor];
        for (
          let position = Math.min(anchor, index);
          position <= Math.max(anchor, index);
          position += 1
        ) {
          next[position] = state;
        }
      } else {
        paintingRef.current = !current[index];
        next[index] = paintingRef.current;
        selectionAnchorRef.current = index;
      }

      return next;
    });
  };

  const paintRow = (index: number) => {
    if (paintingRef.current === null) return;
    setSelectedImported((current) => {
      if (current[index] === paintingRef.current) return current;
      const next = [...current];
      next[index] = paintingRef.current as boolean;
      return next;
    });
  };

  const addImportedExpenses = () => {
    const reportYear = (month || currentMonth()).split("-")[0];
    const imported = selectedImportedExpenses.map((expense) => {
      const [day, expenseMonth] = expense.date.split("/");
      const location = expense.city ? `Compra em ${expense.city}` : "";
      const installment = expense.installment
        ? `Parcela ${expense.installment}`
        : "";

      return {
        id: newId(),
        date: `${reportYear}-${expenseMonth}-${day}`,
        product: expense.category
          ? `${expense.category} — ${expense.establishment}`
          : expense.establishment,
        supplier: expense.establishment,
        payment: expense.installment
          ? `Cartão · ${expense.installment}`
          : "Cartão",
        details:
          [location, installment].filter(Boolean).join(" · ") ||
          "Importado da fatura",
        value: expense.value,
      };
    });

    setExpenses((current) => [...current, ...imported]);
    setIsDirty(true);
    setSelectedImported((current) => current.map(() => false));
    setSavedMessage(
      `${imported.length} lançamentos importados e adicionados ao relatório.`,
    );
  };

  const removeExpense = (id: string) => {
    setExpenses((current) => current.filter((item) => item.id !== id));
    setIsDirty(true);
  };

  const persist = async (nextPublished: boolean) => {
    setIsSaving(true);
    setSavedMessage("");
    try {
      await saveReport({ month, expenses, published: nextPublished });
      setPublished(nextPublished);
      setIsDirty(false);
      setSavedMessage(
        nextPublished
          ? `${monthLabel} publicado com ${expenses.length} lançamentos.`
          : `${monthLabel} salvo como rascunho (não aparece na página pública).`,
      );
    } catch {
      setSavedMessage("Não foi possível salvar. Verifique sua conexão e permissão.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#18314a]">
      <header className="sticky top-0 z-40 border-b border-[#18314a]/15 bg-[#f7f5ef]/95 backdrop-blur">
        <div className="page-shell flex min-h-16 items-center justify-between gap-4 py-2 sm:min-h-20 sm:py-3 lg:min-h-24">
          <div className="flex items-center gap-4">
            <a href="/" aria-label="Adote um Bigode — início">
              <img
                src={logo}
                alt="Adote um Bigode"
                className="h-10 w-auto object-contain sm:h-12 lg:h-16"
              />
            </a>
            <span className="hidden border-l border-[#18314a]/20 pl-4 text-xs font-bold uppercase tracking-[0.12em] text-[#18314a]/55 sm:block">
              Administração
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-xs font-bold">Conectado como</p>
              <p className="mt-0.5 text-xs text-[#18314a]/50">{email}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="min-h-10 rounded-full border border-[#18314a]/25 px-4 text-xs font-bold transition-colors hover:bg-white"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <section className="border-b border-[#18314a]/15 bg-[#e8f0f5]">
        <div className="page-shell grid gap-5 py-7 sm:gap-8 sm:py-10 lg:grid-cols-[1fr_auto] lg:items-end lg:py-14">
          <div>
            <p className="eyebrow">Prestação de contas</p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] sm:text-4xl md:text-5xl">
              Relatório mensal
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#18314a]/65 sm:text-base">
              Importe uma fatura ou cadastre as despesas do mês. Elas só
              aparecem na página pública depois de publicadas.
            </p>
          </div>
          <a href="/prestacao-de-contas" className="button-secondary w-fit">
            Ver página pública <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <div className="page-shell pb-28 pt-6 sm:py-12">
        <section className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
          <div className="rounded-2xl border border-[#18314a]/15 bg-white p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1263a5]">
              1. Período
            </p>
            <div className="mt-5 grid gap-5">
              <label className="block text-sm font-bold">
                Mês do relatório
                <input
                  type="month"
                  value={month}
                  onChange={(event) => {
                    if (
                      isDirty &&
                      !window.confirm("Descartar as alterações não salvas deste mês?")
                    ) {
                      return;
                    }
                    setMonth(event.target.value);
                  }}
                  className="mt-2 min-h-12 w-full rounded-lg border border-[#18314a]/25 bg-[#f7f5ef] px-4 font-normal outline-none focus:border-[#1263a5]"
                />
              </label>
              <p className="text-sm text-[#18314a]/65">
                {isLoadingReport
                  ? "Carregando..."
                  : published
                    ? "Este mês está publicado."
                    : expenses.length
                      ? "Este mês está salvo como rascunho."
                      : "Nenhum lançamento salvo neste mês."}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#18314a]/15 bg-white p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1263a5]">
              2. Importar fatura
            </p>
            <button
              type="button"
              disabled={isReadingInvoice}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleFile(event.dataTransfer.files[0]);
              }}
              className="mt-5 flex min-h-32 w-full sm:min-h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#18314a]/25 bg-[#f7f5ef] p-6 text-center transition-colors hover:border-[#1263a5] hover:bg-[#e8f0f5] disabled:cursor-wait disabled:opacity-60"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#18314a] text-xl font-bold text-white"
              >
                ↑
              </span>
              <span className="mt-4 font-bold">
                {isReadingInvoice
                  ? "Lendo a fatura..."
                  : importedFile || (
                      <>
                        <span className="sm:hidden">Toque para selecionar a fatura em PDF</span>
                        <span className="hidden sm:inline">Selecione ou arraste a fatura em PDF</span>
                      </>
                    )}
              </span>
              <span className="mt-1 text-xs text-[#18314a]/50">
                Itaú, Nubank, Banco do Brasil, Bradesco e Banco do Nordeste — o banco é detectado automaticamente
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            {(importMessage || importError) && (
              <p
                role="status"
                className={`mt-3 text-sm ${
                  importError
                    ? "font-bold text-[#9f2f2f]"
                    : "text-[#18314a]/65"
                }`}
              >
                {importError || importMessage}
              </p>
            )}
          </div>
        </section>

        {parsedInvoice && (
          <section className="mt-8 overflow-clip rounded-2xl border-2 border-[#18314a] bg-white shadow-[5px_5px_0_#f0b43b]">
            <div className="flex flex-col gap-4 border-b border-[#18314a]/15 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1263a5]">
                  Conferência da importação
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
                  Lançamentos encontrados
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#18314a]/55 md:hidden">
                  Toque em um lançamento para marcar ou desmarcar.
                </p>
                <p className="mt-2 hidden text-sm leading-relaxed text-[#18314a]/55 md:block">
                  Clique ou arraste sobre as linhas para marcar e desmarcar.
                  Use Shift+clique para selecionar um intervalo.
                </p>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#18314a]/45">
                  Fatura {parsedInvoice.bank}
                </p>
                <p className="mt-1 text-sm font-bold">{importedFile}</p>
                <p className="mt-1 text-xs text-[#18314a]/50">
                  {parsedInvoice.totalPages} página(s)
                  {parsedInvoice.dueDate
                    ? ` · Vencimento ${parsedInvoice.dueDate}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="md:hidden">
              <div className="sticky top-16 z-10 flex items-center justify-between gap-3 bg-[#18314a] px-5 py-3 text-white">
                <p className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.08em]">
                  {selectedImportedExpenses.length} de {parsedInvoice.expenses.length} ·{" "}
                  {currency.format(selectedImportedTotal)}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImported((current) => {
                      const allSelected = current.every(Boolean);
                      return current.map(() => !allSelected);
                    })
                  }
                  className="min-h-9 whitespace-nowrap rounded-full border border-white/40 px-3 text-xs font-bold"
                >
                  {selectedImported.every(Boolean) ? "Limpar" : "Marcar todos"}
                </button>
              </div>
              <ul>
                {parsedInvoice.expenses.map((expense, index) => (
                  <li key={`${expense.date}-${expense.establishment}-${index}`}>
                    <button
                      type="button"
                      aria-pressed={selectedImported[index] ?? false}
                      onClick={() =>
                        setSelectedImported((current) =>
                          current.map((selected, i) => (i === index ? !selected : selected)),
                        )
                      }
                      className={`flex w-full items-center gap-4 border-b border-[#18314a]/10 px-5 py-4 text-left ${
                        selectedImported[index]
                          ? "bg-white"
                          : "bg-[#f7f5ef] text-[#18314a]/35"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedImported[index] ?? false}
                        readOnly
                        tabIndex={-1}
                        aria-hidden="true"
                        className="pointer-events-none h-5 w-5 shrink-0 accent-[#1263a5]"
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate font-bold ${
                            selectedImported[index] ? "" : "line-through"
                          }`}
                        >
                          {expense.establishment}
                        </span>
                        <span className="mt-0.5 block text-xs text-[#18314a]/50">
                          {[expense.date, expense.installment, expense.category]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <span className="shrink-0 font-bold">
                        {currency.format(expense.value)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead className="bg-[#18314a] text-white">
                  <tr className="text-xs uppercase tracking-[0.08em]">
                    <th className="w-14 px-5 py-4">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={
                          selectedImported.length > 0 &&
                          selectedImported.every(Boolean)
                        }
                        onChange={(event) =>
                          setSelectedImported((current) =>
                            current.map(() => event.target.checked),
                          )
                        }
                        aria-label="Selecionar todos os lançamentos"
                        className="h-4 w-4 accent-[#f0b43b]"
                      />
                    </th>
                    <th className="px-5 py-4">Data</th>
                    <th className="px-5 py-4">Estabelecimento</th>
                    <th className="px-5 py-4">Parcela</th>
                    <th className="px-5 py-4">Categoria</th>
                    <th className="px-5 py-4">Cidade</th>
                    <th className="px-5 py-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedInvoice.expenses.map((expense, index) => (
                    <tr
                      key={`${expense.date}-${expense.establishment}-${index}`}
                      onPointerDown={(event) => startPainting(event, index)}
                      onPointerEnter={() => paintRow(index)}
                      className={`cursor-pointer select-none border-b border-[#18314a]/10 transition-colors last:border-0 ${
                        selectedImported[index]
                          ? "bg-white hover:bg-[#e8f0f5]/60"
                          : "bg-[#f7f5ef] text-[#18314a]/35 line-through"
                      }`}
                    >
                      <td data-selection className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selectedImported[index] ?? false}
                          readOnly
                          tabIndex={-1}
                          aria-label={`${selectedImported[index] ? "Desmarcar" : "Marcar"} ${expense.establishment}`}
                          className="pointer-events-none h-4 w-4 accent-[#1263a5]"
                        />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold">
                        {expense.date}
                      </td>
                      <td className="px-5 py-4 font-bold">
                        {expense.establishment}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {expense.installment || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {expense.category || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {expense.city || "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-bold">
                        {currency.format(expense.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-[#18314a] bg-[#f7f5ef]">
                  <tr>
                    <td colSpan={6} className="px-5 py-4 text-sm font-bold">
                      Selecionados: {selectedImportedExpenses.length} de{" "}
                      {parsedInvoice.expenses.length}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-lg font-bold">
                      {currency.format(selectedImportedTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-[#18314a]/15 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div className="text-sm">
                {parsedInvoice.declaredTotal === null ? (
                  <p className="text-[#18314a]/55">
                    A fatura não informou um total comparável.
                  </p>
                ) : Math.abs(
                    readInvoiceTotal - parsedInvoice.declaredTotal,
                  ) < 0.005 ? (
                  <p className="font-bold text-[#28724f]">
                    Conferido: os {parsedInvoice.expenses.length} lançamentos
                    batem com o total da fatura (
                    {currency.format(parsedInvoice.declaredTotal)}).
                  </p>
                ) : (
                  <p className="font-bold text-[#9f2f2f]">
                    Atenção: a fatura informa{" "}
                    {currency.format(parsedInvoice.declaredTotal)}, mas a
                    leitura encontrou {currency.format(readInvoiceTotal)}.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={addImportedExpenses}
                disabled={!selectedImportedExpenses.length}
                className="button-primary w-full shrink-0 disabled:cursor-not-allowed sm:w-auto disabled:opacity-35"
              >
                Adicionar selecionados ao relatório
              </button>
            </div>
          </section>
        )}

        <section className="mt-8 rounded-2xl border-2 border-[#18314a] bg-white p-5 shadow-[5px_5px_0_#f0b43b] sm:p-7">
          <div className="flex flex-col gap-3 border-b border-[#18314a]/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1263a5]">
                3. Novo lançamento
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
                Adicionar despesa
              </h2>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-[#18314a]/50">
              Os campos seguem a estrutura usada na prestação de contas
              pública.
            </p>
          </div>

          <form
            onSubmit={addExpense}
            className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
          >
            <label className="block text-sm font-bold">
              Data
              <input
                id="expense-date"
                type="date"
                value={draft.date}
                onChange={(event) => updateDraft("date", event.target.value)}
                required
                className="admin-field"
              />
            </label>
            <label className="block text-sm font-bold md:col-span-2">
              Produto ou serviço
              <input
                type="text"
                value={draft.product}
                onChange={(event) => updateDraft("product", event.target.value)}
                required
                placeholder="Ex.: Consulta veterinária — Amora"
                className="admin-field"
              />
            </label>
            <label className="block text-sm font-bold">
              Valor
              <input
                type="text"
                inputMode="decimal"
                value={draft.value}
                onChange={(event) => updateDraft("value", event.target.value)}
                required
                placeholder="0,00"
                className="admin-field"
              />
            </label>
            <label className="block text-sm font-bold">
              Fornecedor
              <input
                type="text"
                value={draft.supplier}
                onChange={(event) => updateDraft("supplier", event.target.value)}
                required
                placeholder="Nome do fornecedor"
                className="admin-field"
              />
            </label>
            <label className="block text-sm font-bold">
              Forma de pagamento
              <select
                value={draft.payment}
                onChange={(event) => updateDraft("payment", event.target.value)}
                className="admin-field"
              >
                <option>Pix</option>
                <option>Cartão</option>
                <option>Transferência</option>
                <option>Dinheiro</option>
              </select>
            </label>
            <label className="block text-sm font-bold md:col-span-2">
              Detalhes
              <input
                type="text"
                value={draft.details}
                onChange={(event) => updateDraft("details", event.target.value)}
                required
                placeholder="Ex.: Atendimento clínico"
                className="admin-field"
              />
            </label>
            <div className="flex items-end md:col-span-2 xl:col-span-4 xl:justify-end">
              <button type="submit" className="button-primary w-full sm:w-auto">
                Adicionar lançamento <span aria-hidden="true">＋</span>
              </button>
            </div>
          </form>
        </section>

        <section className="mt-10">
          <div className="flex flex-col gap-3 border-b-2 border-[#18314a] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Lançamentos do período</p>
              <h2 className="mt-2 text-3xl font-bold tracking-[-0.035em]">
                {monthLabel}
              </h2>
              <p className="mt-2 text-sm text-[#18314a]/60">
                {expenses.length === 1
                  ? "1 despesa cadastrada"
                  : `${expenses.length} despesas cadastradas`}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#18314a]/55">
                Total utilizado
              </p>
              <p className="mt-1 text-3xl font-bold text-[#1263a5]">
                {currency.format(spent)}
              </p>
            </div>
          </div>

          {expenses.length > 0 && (
          <div className="mt-5 hidden overflow-hidden rounded-xl border border-[#18314a]/15 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse text-left">
                <thead className="bg-[#18314a] text-white">
                  <tr className="text-xs uppercase tracking-[0.1em]">
                    <th className="px-5 py-4">Data</th>
                    <th className="px-5 py-4">Produto ou serviço</th>
                    <th className="px-5 py-4">Fornecedor</th>
                    <th className="px-5 py-4">Pagamento</th>
                    <th className="px-5 py-4 text-right">Valor</th>
                    <th className="px-5 py-4 text-right">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-[#18314a]/10 last:border-0"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold">{expense.product}</p>
                        <p className="mt-1 text-xs text-[#18314a]/50">
                          {expense.details}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm">{expense.supplier}</td>
                      <td className="px-5 py-4 text-sm">{expense.payment}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-bold">
                        {currency.format(expense.value)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => removeExpense(expense.id)}
                          className="text-xs font-bold text-[#18314a]/55 underline decoration-[#f0b43b] decoration-2 underline-offset-4 hover:text-[#18314a]"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          )}

          {expenses.length > 0 && (
          <div className="grid gap-4 pt-5 md:hidden">
            {expenses.map((expense) => (
              <article
                key={expense.id}
                className="rounded-xl border border-[#18314a]/15 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#18314a]/45">
                    {formatDate(expense.date)}
                  </p>
                  <p className="text-lg font-bold">
                    {currency.format(expense.value)}
                  </p>
                </div>
                <h3 className="mt-4 text-lg font-bold">{expense.product}</h3>
                <p className="mt-1 text-sm text-[#18314a]/60">
                  {expense.details}
                </p>
                <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#18314a]/10 pt-4">
                  <p className="text-sm">
                    <span className="block text-xs text-[#18314a]/45">
                      {expense.payment}
                    </span>
                    <span className="font-semibold">{expense.supplier}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => removeExpense(expense.id)}
                    className="text-xs font-bold underline decoration-[#f0b43b] decoration-2 underline-offset-4"
                  >
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>

          )}

          {expenses.length === 0 && !isLoadingReport && (
            <div className="mt-5 flex flex-col items-center rounded-xl border-2 border-dashed border-[#18314a]/20 bg-white/60 px-6 py-12 text-center">
              <p className="font-bold">Nenhuma despesa neste mês ainda</p>
              <p className="mt-1 max-w-sm text-sm leading-relaxed text-[#18314a]/55">
                Importe uma fatura em PDF ou use o formulário acima para
                adicionar o primeiro lançamento.
              </p>
              <button
                type="button"
                onClick={() => {
                  const field = document.getElementById("expense-date");
                  field?.scrollIntoView({ behavior: "smooth", block: "center" });
                  field?.focus({ preventScroll: true });
                }}
                className="mt-5 inline-flex min-h-10 items-center rounded-full bg-[#f5c65c] px-5 text-sm font-bold transition-transform hover:-translate-y-0.5"
              >
                Adicionar despesa <span className="ml-2" aria-hidden="true">＋</span>
              </button>
            </div>
          )}
        </section>

        <section className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-3 bg-[#18314a] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-white shadow-[0_-6px_20px_rgb(16_38_58/0.25)] sm:static sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:p-8 sm:shadow-none">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#f5c65c]">
              {published ? "Relatório publicado" : "Relatório em edição"}
              {isDirty ? " · alterações não salvas" : ""}
            </p>
            <p className="mt-2 hidden max-w-xl text-sm leading-relaxed text-white/65 sm:block">
              Salve como rascunho para continuar depois, ou publique para exibir
              este mês na página de prestação de contas.
            </p>
            {savedMessage && (
              <p role="status" className="mt-1 sm:mt-3 text-sm font-bold text-white">
                {savedMessage}
              </p>
            )}
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => persist(false)}
              disabled={isSaving || isLoadingReport}
              className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-white/60 px-4 sm:px-6 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#18314a] disabled:opacity-40"
            >
              {published ? "Despublicar" : "Salvar rascunho"}
            </button>
            <button
              type="button"
              onClick={() => persist(true)}
              disabled={isSaving || isLoadingReport || !expenses.length}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f5c65c] px-4 text-sm font-bold text-[#18314a] transition-transform hover:-translate-y-0.5 disabled:opacity-40 sm:px-6"
            >
              {isSaving ? "Salvando..." : published ? "Salvar e publicar" : "Publicar"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

const ADMIN_EMAILS = ["adoteumbigodeceara@gmail.com"];

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLocalSession, setIsLocalSession] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsCheckingAuth(false);
    });
  }, []);

  if (isCheckingAuth) return null;

  if (!isFirebaseConfigured) {
    return isLocalSession ? (
      <AdminDashboard
        email="Modo local (sem Firebase)"
        onLogout={() => setIsLocalSession(false)}
      />
    ) : (
      <Login error="" onLocalLogin={() => setIsLocalSession(true)} />
    );
  }

  const isAdmin = Boolean(user?.email && ADMIN_EMAILS.includes(user.email));
  const logout = () => {
    if (auth) signOut(auth);
  };

  if (!user || !isAdmin) {
    return (
      <Login
        error={user ? `A conta ${user.email} não tem acesso ao painel.` : ""}
        onLocalLogin={() => {}}
      />
    );
  }

  return <AdminDashboard email={user.email ?? ""} onLogout={logout} />;
}
