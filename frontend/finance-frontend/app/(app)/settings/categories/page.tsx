const expenseCategories = [
  "Housing",
  "Food",
  "Transport",
  "Utilities",
  "Healthcare",
  "Lifestyle",
  "Education",
] as const;

const incomeCategories = ["Salary", "Business", "Freelance", "Investments", "Other"] as const;

export default function CategoriesSettingsPage() {
  return (
    <div className="space-y-6 text-slate-800">
      <section className="rounded-3xl border border-[#c6d2cb] bg-[linear-gradient(135deg,#f7faf8_0%,#eef4f1_50%,#f6f9f8_100%)] p-5 shadow-[0_20px_55px_rgba(15,23,42,0.08)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f7667]">
          Settings
        </p>
        <h1 className="mt-2 text-2xl font-[family-name:var(--font-geist-mono)] font-semibold text-slate-900 sm:text-3xl">
          Category management
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Organize income and expense categories for cleaner reporting.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Expense categories</h2>
            <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Add new
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {expenseCategories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
              >
                {category}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Income categories</h2>
            <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Add new
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {incomeCategories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700"
              >
                {category}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
