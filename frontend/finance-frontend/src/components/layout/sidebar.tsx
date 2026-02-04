import Link from "next/link";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/accounts", label: "Accounts" },
  { href: "/transactions", label: "Transactions" },
  { href: "/budgets", label: "Budgets" },
  { href: "/reports", label: "Reports" },
  { href: "/settings/categories", label: "Settings" },
  { href: "/audit", label: "Audit" },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r p-4 hidden md:block">
      <div className="text-lg font-semibold">Finance Tracker</div>

      <nav className="mt-6 space-y-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg px-3 py-2 hover:bg-gray-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
