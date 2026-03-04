const money = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

const accounts = [
  { name: "Commercial Bank - Main", type: "Bank", balance: 562000, color: "bg-emerald-500" },
  { name: "HNB Savings", type: "Savings", balance: 318500, color: "bg-cyan-500" },
  { name: "Sampath Credit Card", type: "Credit Card", balance: -84200, color: "bg-amber-500" },
  { name: "Cash Wallet", type: "Cash", balance: 16450, color: "bg-violet-500" },
] as const;

const history = [
  { date: "Mar 01", total: 801500, change: "+2.3%" },
  { date: "Mar 02", total: 793900, change: "-0.9%" },
  { date: "Mar 03", total: 809100, change: "+1.9%" },
  { date: "Mar 04", total: 812750, change: "+0.5%" },
] as const;

export default function AccountsPage() {
  const totalAssets = accounts.reduce((sum, account) => sum + Math.max(account.balance, 0), 0);
  const totalLiabilities = Math.abs(
    accounts.reduce((sum, account) => sum + Math.min(account.balance, 0), 0),
  );

  return (
    <div className="space-y-6 text-slate-800">
      <section className="rounded-3xl border border-[#c6d2cb] bg-[linear-gradient(135deg,#f7faf8_0%,#eef4f1_50%,#f6f9f8_100%)] p-5 shadow-[0_20px_55px_rgba(15,23,42,0.08)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f7667]">
          Accounts
        </p>
        <h1 className="mt-2 text-2xl font-[family-name:var(--font-geist-mono)] font-semibold text-slate-900 sm:text-3xl">
          Account overview
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Track all balances across bank, savings, cash, and credit accounts.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-medium text-slate-500">Total assets</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{money.format(totalAssets)}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-medium text-slate-500">Total liabilities</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{money.format(totalLiabilities)}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-medium text-slate-500">Net balance</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">
            {money.format(totalAssets - totalLiabilities)}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-medium text-slate-500">Active accounts</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{accounts.length}</p>
        </article>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">Accounts list</h2>
          <p className="text-sm text-slate-500">Current balance by source</p>
          <div className="mt-4 space-y-3">
            {accounts.map((account) => (
              <div
                key={account.name}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${account.color}`} />
                  <div>
                    <p className="font-medium text-slate-800">{account.name}</p>
                    <p className="text-sm text-slate-500">{account.type}</p>
                  </div>
                </div>
                <p
                  className={`font-semibold ${
                    account.balance >= 0 ? "text-slate-800" : "text-rose-700"
                  }`}
                >
                  {money.format(account.balance)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">Balance trend</h2>
          <p className="text-sm text-slate-500">Last 4 days snapshot</p>
          <div className="mt-4 space-y-3">
            {history.map((row) => (
              <div
                key={row.date}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
              >
                <span className="text-sm font-medium text-slate-700">{row.date}</span>
                <span className="text-sm text-slate-600">{money.format(row.total)}</span>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    row.change.startsWith("+")
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {row.change}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
