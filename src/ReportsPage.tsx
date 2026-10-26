import { useEffect, useState } from "react";
import logo from "./imports/sticker_logo.png";
import {
  currency,
  fetchPublishedReports,
  formatDate,
  monthLabel,
  totalSpent,
  type MonthReport,
} from "./reports";

type LoadState = "loading" | "ready" | "error";

export default function ReportsPage() {
  const [reports, setReports] = useState<MonthReport[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    fetchPublishedReports()
      .then((items) => {
        setReports(items);
        setSelectedMonth(items[0]?.month ?? "");
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  }, []);

  const selectedIndex = reports.findIndex(
    (item) => item.month === selectedMonth,
  );
  const report = reports[selectedIndex];
  const spent = report ? totalSpent(report.expenses) : 0;

  const selectMonthAt = (index: number) => {
    const nextReport = reports[index];
    if (nextReport) setSelectedMonth(nextReport.month);
  };

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#18314a]">
      <header className="sticky top-0 z-40 border-b border-[#18314a]/15 bg-[#f7f5ef]/95 backdrop-blur">
        <div className="page-shell flex h-20 items-center justify-between gap-5 lg:h-24">
          <a href="/" aria-label="Voltar para a página inicial">
            <img
              src={logo}
              alt="Adote um Bigode"
              className="h-12 w-auto object-contain lg:h-16"
            />
          </a>
          <a href="/" className="button-secondary">
            <span aria-hidden="true">←</span> Voltar ao site
          </a>
        </div>
      </header>

      <section className="border-b border-[#18314a]/15 bg-[#e8f0f5]">
        <div className="page-shell py-12 sm:py-16 lg:py-20">
          <p className="eyebrow">Prestação de contas</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_.55fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-bold leading-[1.04] tracking-[-0.045em] sm:text-6xl">
                Cada contribuição vira cuidado.
              </h1>
              <p className="body-copy mt-5 max-w-2xl">
                Acompanhe mês a mês como os recursos do projeto são usados em
                alimentação, atendimento veterinário e resgates.
              </p>
            </div>

            {reports.length > 0 && (
              <div className="rounded-2xl border-2 border-[#18314a] bg-[#f7f5ef] p-4 shadow-[5px_5px_0_#f0b43b]">
                <label
                  htmlFor="report-month"
                  className="text-xs font-bold uppercase tracking-[0.14em]"
                >
                  Período do relatório
                </label>
                <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2">
                  <button
                    type="button"
                    onClick={() => selectMonthAt(selectedIndex + 1)}
                    disabled={selectedIndex === reports.length - 1}
                    aria-label="Ver mês anterior"
                    className="min-h-12 rounded-lg border border-[#18314a]/25 px-4 font-bold transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ←
                  </button>
                  <select
                    id="report-month"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="min-h-12 w-full min-w-0 rounded-lg border border-[#18314a]/25 bg-white px-4 text-sm font-bold outline-none focus:border-[#1263a5]"
                  >
                    {reports.map((item) => (
                      <option key={item.month} value={item.month}>
                        {monthLabel(item.month)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => selectMonthAt(selectedIndex - 1)}
                    disabled={selectedIndex === 0}
                    aria-label="Ver mês seguinte"
                    className="min-h-12 rounded-lg border border-[#18314a]/25 px-4 font-bold transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="page-shell py-10 sm:py-14">
        {loadState === "loading" && (
          <p className="py-16 text-center text-sm text-[#18314a]/60">
            Carregando relatórios...
          </p>
        )}

        {loadState === "error" && (
          <p className="rounded-xl border border-[#18314a]/15 bg-white px-5 py-12 text-center text-sm text-[#18314a]/60">
            Não foi possível carregar os relatórios agora. Tente novamente mais
            tarde.
          </p>
        )}

        {loadState === "ready" && !report && (
          <p className="rounded-xl border border-[#18314a]/15 bg-white px-5 py-12 text-center text-sm text-[#18314a]/60">
            Ainda não há relatórios publicados.
          </p>
        )}

        {report && (
          <>
            <div className="flex flex-col gap-4 border-b-2 border-[#18314a] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Despesas detalhadas</p>
                <h2 className="mt-2 text-3xl font-bold tracking-[-0.035em]">
                  {monthLabel(report.month)}
                </h2>
                <p className="mt-2 text-sm text-[#18314a]/60">
                  {report.expenses.length} lançamentos no período
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

            <div className="mt-5 hidden overflow-hidden rounded-xl border border-[#18314a]/15 bg-white md:block">
              <table className="w-full border-collapse text-left">
                <thead className="bg-[#18314a] text-white">
                  <tr className="text-xs uppercase tracking-[0.1em]">
                    <th className="px-5 py-4 font-bold">Data</th>
                    <th className="px-5 py-4 font-bold">Produto ou serviço</th>
                    <th className="px-5 py-4 font-bold">Fornecedor</th>
                    <th className="px-5 py-4 font-bold">Pagamento</th>
                    <th className="px-5 py-4 text-right font-bold">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {report.expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-[#18314a]/10 last:border-b-0 hover:bg-[#e8f0f5]/55"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold">{expense.product}</p>
                        <p className="mt-1 text-xs text-[#18314a]/55">
                          {expense.details}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm">{expense.supplier}</td>
                      <td className="px-5 py-4 text-sm">{expense.payment}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-bold">
                        {currency.format(expense.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-[#18314a] bg-[#f7f5ef]">
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-4 text-sm font-bold uppercase tracking-[0.1em]"
                    >
                      Total utilizado
                    </td>
                    <td className="px-5 py-4 text-right text-lg font-bold">
                      {currency.format(spent)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="grid gap-4 pt-5 md:hidden">
              {report.expenses.map((expense) => (
                <article
                  key={expense.id}
                  className="rounded-xl border border-[#18314a]/15 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-bold">{expense.product}</h3>
                    <p className="whitespace-nowrap text-lg font-bold">
                      {currency.format(expense.value)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-[#18314a]/60">
                    {expense.details}
                  </p>
                  <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-[#18314a]/10 pt-4 text-sm">
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#18314a]/45">
                        Data
                      </dt>
                      <dd className="mt-1 font-semibold">
                        {formatDate(expense.date)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#18314a]/45">
                        Pagamento
                      </dt>
                      <dd className="mt-1 font-semibold">{expense.payment}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#18314a]/45">
                        Fornecedor
                      </dt>
                      <dd className="mt-1 font-semibold">{expense.supplier}</dd>
                    </div>
                  </dl>
                </article>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-[#18314a] p-5 text-white">
                <span className="text-sm font-bold uppercase tracking-[0.1em]">
                  Total utilizado
                </span>
                <strong className="text-xl">{currency.format(spent)}</strong>
              </div>
            </div>
          </>
        )}
      </section>

      <footer className="mt-8 bg-[#10263a] text-white">
        <div className="page-shell flex flex-col gap-7 py-10 sm:flex-row sm:items-end sm:justify-between">
          <img
            src={logo}
            alt="Adote um Bigode"
            className="h-16 w-auto self-start"
          />
          <p className="text-left text-xs leading-relaxed text-white/55 sm:text-right">
            Transparência também é uma forma de cuidado.
          </p>
        </div>
      </footer>
    </main>
  );
}
