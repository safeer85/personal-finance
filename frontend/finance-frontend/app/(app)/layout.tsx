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
    <div className="min-h-screen flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
