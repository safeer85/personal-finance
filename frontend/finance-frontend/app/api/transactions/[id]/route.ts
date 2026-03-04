import { deleteTransaction, updateTransaction } from "@/src/server/finance/service";
import { withSession } from "@/src/server/finance/http";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json();
  return withSession(async () => updateTransaction(id, body));
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return withSession(async () => deleteTransaction(id));
}

