import { createTransaction, listTransactions } from "@/src/server/finance/service";
import { withSession } from "@/src/server/finance/http";

export const runtime = "nodejs";

function num(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams;
  return withSession(async () =>
    listTransactions({
      limit: num(q.get("limit")),
      offset: num(q.get("offset")),
      accountId: q.get("accountId") ?? undefined,
      categoryId: q.get("categoryId") ?? undefined,
      tag: q.get("tag") ?? undefined,
      merchant: q.get("merchant") ?? undefined,
      dateFrom: q.get("dateFrom") ?? undefined,
      dateTo: q.get("dateTo") ?? undefined,
    }),
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  return withSession(async () => createTransaction(body));
}

