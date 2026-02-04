import { auth } from "@/src/infra/auth/nextauth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  return session;
}
