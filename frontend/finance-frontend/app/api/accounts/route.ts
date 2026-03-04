import { createAccount, listAccounts } from "@/src/server/finance/service";
import { withSession } from "@/src/server/finance/http";

export const runtime = "nodejs";

export async function GET() {
  return withSession(async () => listAccounts());
}

export async function POST(request: Request) {
  const body = await request.json();
  return withSession(async () => createAccount(body));
}

