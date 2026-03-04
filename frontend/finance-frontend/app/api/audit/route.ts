import { listAudit } from "@/src/server/finance/service";
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
    listAudit({
      limit: num(q.get("limit")),
      offset: num(q.get("offset")),
    }),
  );
}

