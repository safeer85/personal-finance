import { auth } from "@/src/infra/auth/nextauth";
import Link from "next/link";

const money = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

type MetricCard = {
  label: string;
  amount: number;
  change: string;
  tone: "good" | "bad";
  suffix?: string;
};

const metrics: MetricCard[] = [
  { label: "Net worth", amount: 1842000, change: "+8.4%", tone: "good" },
  { label: "Monthly income", amount: 465000, change: "+4.1%", tone: "good" },
  { label: "Monthly spend", amount: 302500, change: "-2.7%", tone: "good" },
  { label: "Savings rate", amount: 35, suffix: "%", change: "+3.0%", tone: "good" },
];

const cashflow = [
  { day: "Mon", in: 72, out: 48 },
  { day: "Tue", in: 40, out: 61 },
  { day: "Wed", in: 64, out: 34 },
  { day: "Thu", in: 52, out: 46 },
  { day: "Fri", in: 81, out: 39 },
  { day: "Sat", in: 35, out: 58 },
  { day: "Sun", in: 48, out: 44 },
] as const;

const budgets = [
  { category: "Housing", used: 76000, limit: 90000 },
  { category: "Food", used: 38200, limit: 45000 },
  { category: "Transport", used: 16800, limit: 24000 },
  { category: "Lifestyle", used: 22750, limit: 30000 },
] as const;

const recent = [
  { title: "Salary - ACME Ltd", category: "Income", date: "Mar 01", amount: 310000, kind: "credit" },
  { title: "Rent Payment", category: "Housing", date: "Mar 02", amount: -70000, kind: "debit" },
  { title: "Supermarket", category: "Food", date: "Mar 03", amount: -14250, kind: "debit" },
  { title: "Fuel", category: "Transport", date: "Mar 03", amount: -8800, kind: "debit" },
  { title: "Freelance Invoice", category: "Income", date: "Mar 04", amount: 52000, kind: "credit" },
] as const;

export default async function DashboardPage() {
  const session = await auth();
  const displayName =
    session?.user?.name?.split(" ")[0] ??
    session?.user?.email?.split("@")[0] ??
    "User";
  const today = new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(
    new Date(),
  );

  return (
    <div className="space-y-6 text-slate-800">
      <section
        className="overflow-hidden rounded-3xl border border-[#c6d2cb] bg-[linear-gradient(135deg,#f7faf8_0%,#eef4f1_50%,#f6f9f8_100%)] p-5 shadow-[0_20px_55px_rgba(15,23,42,0.08)] sm:p-6"
        style={{ animation: "dashboard-enter 450ms ease-out both" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f7667]">
              Dashboard
            </p>
            <h1 className="text-2xl font-[family-name:var(--font-geist-mono)] font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back, {displayName}
            </h1>
            <p className="text-sm text-slate-600">
              {today} - Signed in as{" "}
              <span className="font-medium text-slate-800">
                {session?.user?.email}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/transactions"
              className="rounded-xl bg-[#112033] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1a304d]"
            >
              Add transaction
            </Link>
            <Link
              href="/budgets"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Manage budgets
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, idx) => {
          const amountText = metric.suffix
            ? `${metric.amount}${metric.suffix}`
            : money.format(metric.amount);

          return (
            <article
              key={metric.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
              style={{
                animation: `dashboard-enter 500ms ${80 + idx * 60}ms ease-out both`,
              }}
            >
              <p className="text-sm font-medium text-slate-500">{metric.label}</p>
              <div className="mt-2 flex items-end justify-between gap-2">
                <p className="text-2xl font-semibold tracking-tight text-slate-900">
                  {amountText}
                </p>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    metric.tone === "good"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {metric.change}
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <section
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5"
          style={{ animation: "dashboard-enter 600ms 220ms ease-out both" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Cashflow trend</h2>
              <p className="text-sm text-slate-500">Income vs spending this week</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#2f7667]" />
                In
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#d4a53a]" />
                Out
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 items-end gap-2 rounded-xl bg-slate-50 p-3 sm:gap-3">
            {cashflow.map((entry) => (
              <div key={entry.day} className="space-y-2 text-center">
                <div className="mx-auto flex h-36 w-full max-w-[44px] items-end justify-center gap-1 rounded-lg bg-white p-1 shadow-sm">
                  <div
                    className="w-2 rounded-md bg-[#2f7667]/85"
                    style={{ height: `${entry.in}%` }}
                  />
                  <div
                    className="w-2 rounded-md bg-[#d4a53a]/88"
                    style={{ height: `${entry.out}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-slate-500">{entry.day}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5"
          style={{ animation: "dashboard-enter 600ms 280ms ease-out both" }}
        >
          <h2 className="text-lg font-semibold text-slate-900">Budget health</h2>
          <p className="text-sm text-slate-500">Current month category usage</p>

          <div className="mt-5 space-y-4">
            {budgets.map((item) => {
              const ratio = Math.min((item.used / item.limit) * 100, 100);
              return (
                <div key={item.category}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.category}</span>
                    <span className="text-slate-500">
                      {money.format(item.used)} / {money.format(item.limit)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${
                        ratio > 90
                          ? "bg-rose-400"
                          : ratio > 75
                            ? "bg-amber-400"
                            : "bg-emerald-500"
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

      <section
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5"
        style={{ animation: "dashboard-enter 650ms 340ms ease-out both" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
            <p className="text-sm text-slate-500">Latest transactions</p>
          </div>
          <Link
            href="/transactions"
            className="text-sm font-medium text-[#2f7667] transition hover:text-[#245d52]"
          >
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-400">
                <th className="pb-3 pr-3 font-semibold">Description</th>
                <th className="pb-3 pr-3 font-semibold">Category</th>
                <th className="pb-3 pr-3 font-semibold">Date</th>
                <th className="pb-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recent.map((row) => (
                <tr key={`${row.title}-${row.date}`}>
                  <td className="py-3 pr-3 font-medium text-slate-800">{row.title}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.category}</td>
                  <td className="py-3 pr-3 text-slate-500">{row.date}</td>
                  <td
                    className={`py-3 text-right font-semibold ${
                      row.kind === "credit" ? "text-emerald-700" : "text-slate-700"
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

      <style>{`
        @keyframes dashboard-enter {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <p className="text-xs text-slate-500">
        Preview data is currently static. Hook this screen to your real account,
        budget, and transaction APIs next.
      </p>
    </div>
  );
}
