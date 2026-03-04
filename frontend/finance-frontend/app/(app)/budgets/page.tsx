const money = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

const budgets = [
  { category: "Housing", allocated: 90000, used: 76000 },
  { category: "Food", allocated: 45000, used: 38200 },
  { category: "Transport", allocated: 24000, used: 16800 },
  { category: "Lifestyle", allocated: 30000, used: 22750 },
  { category: "Healthcare", allocated: 12000, used: 5400 },
] as const;

export default function BudgetsPage() {
  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalUsed = budgets.reduce((sum, b) => sum + b.used, 0);
  const remaining = totalAllocated - totalUsed;

  return (
    <div className="space-y-6 text-slate-800">
      <section className="rounded-3xl border border-[#c6d2cb] bg-[linear-gradient(135deg,#f7faf8_0%,#eef4f1_50%,#f6f9f8_100%)] p-5 shadow-[0_20px_55px_rgba(15,23,42,0.08)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f7667]">
          Budgets
        </p>
        <h1 className="mt-2 text-2xl font-[family-name:var(--font-geist-mono)] font-semibold text-slate-900 sm:text-3xl">
          Monthly budget planner
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Compare category allocation against actual spending.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-medium text-slate-500">Allocated</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{money.format(totalAllocated)}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-medium text-slate-500">Used</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{money.format(totalUsed)}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-medium text-slate-500">Remaining</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{money.format(remaining)}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5">
        <h2 className="text-lg font-semibold text-slate-900">Category progress</h2>
        <p className="text-sm text-slate-500">Current month status</p>

        <div className="mt-5 space-y-4">
          {budgets.map((budget) => {
            const ratio = Math.min((budget.used / budget.allocated) * 100, 100);
            return (
              <div key={budget.category}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{budget.category}</span>
                  <span className="text-slate-500">
                    {money.format(budget.used)} / {money.format(budget.allocated)}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div
                    className={`h-2.5 rounded-full ${
                      ratio > 90 ? "bg-rose-500" : ratio > 75 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${ratio}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
