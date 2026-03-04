import { updateAccount } from "@/src/server/finance/service";
import { withSession } from "@/src/server/finance/http";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json();
  return withSession(async () => updateAccount(id, body));
}

