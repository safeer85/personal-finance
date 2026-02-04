import { auth } from "@/src/infra/auth/nextauth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  redirect(session?.user?.email ? "/dashboard" : "/login");
}
