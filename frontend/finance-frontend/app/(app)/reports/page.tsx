const money = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

const categorySpend = [
  { category: "Housing", amount: 76000 },
  { category: "Food", amount: 38200 },
  { category: "Transport", amount: 16800 },
  { category: "Lifestyle", amount: 22750 },
  { category: "Healthcare", amount: 5400 },
] as const;

const monthlyNet = [
  { month: "Nov", value: 98000 },
  { month: "Dec", value: 114000 },
  { month: "Jan", value: 106500 },
  { month: "Feb", value: 121300 },
  { month: "Mar", value: 132500 },
] as const;

export default function ReportsPage() {
  const highest = categorySpend.reduce((max, item) =>
    item.amount > max.amount ? item : max,
  );

  return (
    <div className="space-y-6 text-slate-800">
      <section className="rounded-3xl border border-[#c6d2cb] bg-[linear-gradient(135deg,#f7faf8_0%,#eef4f1_50%,#f6f9f8_100%)] p-5 shadow-[0_20px_55px_rgba(15,23,42,0.08)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f7667]">
          Reports
        </p>
        <h1 className="mt-2 text-2xl font-[family-name:var(--font-geist-mono)] font-semibold text-slate-900 sm:text-3xl">
          Financial insights
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Monitor trends, identify top spending categories, and track net growth.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">Category spend share</h2>
          <p className="text-sm text-slate-500">This month</p>

          <div className="mt-4 space-y-3">
            {categorySpend.map((item) => {
              const max = Math.max(...categorySpend.map((s) => s.amount));
              const width = (item.amount / max) * 100;
              return (
                <div key={item.category}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.category}</span>
                    <span className="text-slate-500">{money.format(item.amount)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100">
                    <div className="h-2.5 rounded-full bg-[#2f7667]" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">Key highlights</h2>
          <p className="text-sm text-slate-500">Auto-generated summary</p>

          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              Highest spending category: <span className="font-semibold">{highest.category}</span> (
              {money.format(highest.amount)})
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              Net savings trend has remained positive for the last 5 months.
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              Food and lifestyle together contribute the highest variable spend.
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5">
        <h2 className="text-lg font-semibold text-slate-900">Monthly net savings</h2>
        <p className="text-sm text-slate-500">Last 5 months</p>

        <div className="mt-5 grid grid-cols-5 items-end gap-3 rounded-xl bg-slate-50 p-3">
          {monthlyNet.map((item) => {
            const max = Math.max(...monthlyNet.map((m) => m.value));
            const height = Math.round((item.value / max) * 100);
            return (
              <div key={item.month} className="text-center">
                <div className="mx-auto flex h-40 w-full max-w-[58px] items-end rounded-lg bg-white p-1 shadow-sm">
                  <div className="w-full rounded-md bg-[#112033]" style={{ height: `${height}%` }} />
                </div>
                <p className="mt-2 text-xs font-medium text-slate-500">{item.month}</p>
                <p className="text-xs text-slate-600">{money.format(item.value)}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
