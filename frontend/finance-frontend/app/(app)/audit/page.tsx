const logs = [
  { at: "2026-03-04 09:42", user: "owner@finance.com", action: "Created transaction", entity: "txn_4021", status: "success" },
  { at: "2026-03-04 08:12", user: "owner@finance.com", action: "Updated budget", entity: "budget_food", status: "success" },
  { at: "2026-03-03 20:30", user: "owner@finance.com", action: "Deleted category", entity: "cat_temp", status: "warning" },
  { at: "2026-03-03 15:08", user: "owner@finance.com", action: "Login failed", entity: "google_oauth", status: "error" },
  { at: "2026-03-03 10:20", user: "owner@finance.com", action: "Password login", entity: "credentials", status: "success" },
] as const;

export default function AuditPage() {
  const successCount = logs.filter((log) => log.status === "success").length;
  const warningCount = logs.filter((log) => log.status === "warning").length;
  const errorCount = logs.filter((log) => log.status === "error").length;

  return (
    <div className="space-y-6 text-slate-800">
      <section className="rounded-3xl border border-[#c6d2cb] bg-[linear-gradient(135deg,#f7faf8_0%,#eef4f1_50%,#f6f9f8_100%)] p-5 shadow-[0_20px_55px_rgba(15,23,42,0.08)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f7667]">
          Audit
        </p>
        <h1 className="mt-2 text-2xl font-[family-name:var(--font-geist-mono)] font-semibold text-slate-900 sm:text-3xl">
          Activity log
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Review security-sensitive and data-changing actions.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-medium text-slate-500">Success</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{successCount}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-medium text-slate-500">Warnings</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{warningCount}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-medium text-slate-500">Errors</p>
          <p className="mt-1 text-2xl font-semibold text-rose-700">{errorCount}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-400">
                <th className="pb-3 pr-3 font-semibold">Date/Time</th>
                <th className="pb-3 pr-3 font-semibold">User</th>
                <th className="pb-3 pr-3 font-semibold">Action</th>
                <th className="pb-3 pr-3 font-semibold">Entity</th>
                <th className="pb-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {logs.map((log) => (
                <tr key={`${log.at}-${log.entity}`}>
                  <td className="py-3 pr-3 text-slate-500">{log.at}</td>
                  <td className="py-3 pr-3 text-slate-700">{log.user}</td>
                  <td className="py-3 pr-3 font-medium text-slate-800">{log.action}</td>
                  <td className="py-3 pr-3 text-slate-600">{log.entity}</td>
                  <td className="py-3 text-right">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        log.status === "success"
                          ? "bg-emerald-100 text-emerald-700"
                          : log.status === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {log.status}
                    </span>
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
