import { auth } from "@/src/infra/auth/nextauth";
import { redirect } from "next/navigation";
import { Topbar } from "@/src/components/layout/topbar";
import { Sidebar } from "@/src/components/layout/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Extra safety (middleware already redirects, but this is durable)
  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}
