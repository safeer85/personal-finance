const money = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

const transactions = [
  { date: "2026-03-04", description: "Freelance payout", category: "Income", account: "Main Bank", amount: 52000 },
  { date: "2026-03-03", description: "Supermarket", category: "Food", account: "Credit Card", amount: -14250 },
  { date: "2026-03-03", description: "Fuel station", category: "Transport", account: "Main Bank", amount: -8800 },
  { date: "2026-03-02", description: "Rent", category: "Housing", account: "Main Bank", amount: -70000 },
  { date: "2026-03-01", description: "Salary", category: "Income", account: "Main Bank", amount: 310000 },
  { date: "2026-02-28", description: "Coffee", category: "Lifestyle", account: "Cash Wallet", amount: -1850 },
] as const;

export default function TransactionsPage() {
  const income = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const expense = Math.abs(
    transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0),
  );

  return (
    <div className="space-y-6 text-slate-800">
      <section className="rounded-3xl border border-[#c6d2cb] bg-[linear-gradient(135deg,#f7faf8_0%,#eef4f1_50%,#f6f9f8_100%)] p-5 shadow-[0_20px_55px_rgba(15,23,42,0.08)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f7667]">
          Transactions
        </p>
        <h1 className="mt-2 text-2xl font-[family-name:var(--font-geist-mono)] font-semibold text-slate-900 sm:text-3xl">
          Money movement
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Review income and spending across all linked accounts.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-medium text-slate-500">Income</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{money.format(income)}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-medium text-slate-500">Expenses</p>
          <p className="mt-1 text-2xl font-semibold text-rose-700">{money.format(expense)}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-medium text-slate-500">Net flow</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{money.format(income - expense)}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5">
        <div className="mb-4 flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">All</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-700">Income</span>
          <span className="rounded-full bg-rose-100 px-3 py-1.5 text-rose-700">Expense</span>
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-700">This month</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-400">
                <th className="pb-3 pr-3 font-semibold">Date</th>
                <th className="pb-3 pr-3 font-semibold">Description</th>
                <th className="pb-3 pr-3 font-semibold">Category</th>
                <th className="pb-3 pr-3 font-semibold">Account</th>
                <th className="pb-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {transactions.map((row) => (
                <tr key={`${row.date}-${row.description}`}>
                  <td className="py-3 pr-3 text-slate-500">{row.date}</td>
                  <td className="py-3 pr-3 font-medium text-slate-800">{row.description}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.category}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.account}</td>
                  <td
                    className={`py-3 text-right font-semibold ${
                      row.amount >= 0 ? "text-emerald-700" : "text-slate-700"
                    }`}
                  >
                    {money.format(row.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
