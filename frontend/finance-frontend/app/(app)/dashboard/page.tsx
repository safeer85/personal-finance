import { auth } from "@/src/infra/auth/nextauth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-gray-600">
        Signed in as: <span className="font-medium">{session?.user?.email}</span>
      </p>

      <div className="mt-4 rounded-2xl border p-4">
        <p className="text-sm text-gray-600">
          Next: show account balances + quick add transaction.
        </p>
      </div>
    </div>
  );
}
