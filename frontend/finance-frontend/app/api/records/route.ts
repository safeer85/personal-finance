import { db } from "@/lib/db";
import {
  recordSchema,
  debtDetailsSchema,
  debtFields,
} from "@/lib/record-validation";
import { auth } from "@/auth";
import { isSameOrigin } from "@/lib/request-origin";
export const runtime = "nodejs";
export async function GET() {
  if (!(await auth())?.user)
    return Response.json({ error: "Please sign in." }, { status: 401 });
  try {
    return Response.json(
      await db.record.findMany({
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
    );
  } catch {
    return Response.json(
      { error: "Unable to load your records." },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  if (!(await auth())?.user)
    return Response.json({ error: "Please sign in." }, { status: 401 });
  if (!isSameOrigin(request))
    return Response.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  try {
    const parsed = recordSchema.safeParse(await request.json());
    if (!parsed.success)
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    const d = parsed.data;
    if (d.kind === "debt" && d.minimum > d.amount)
      return Response.json(
        { error: "Minimum payment cannot exceed the debt balance." },
        { status: 400 },
      );
    const record = await db.$transaction(
      async (tx) => {
        if (d.kind === "payment" || d.kind === "card_charge") {
          const debt = await tx.record.findUnique({
            where: { id: d.category },
          });
          if (!debt || debt.kind !== "debt")
            throw new Error("Select an existing debt.");
          if (d.kind === "card_charge" && debt.debtType !== "credit_card")
            throw new Error("Charges can only be added to a credit card.");
          if (d.date < debt.date)
            throw new Error(
              "Payment date cannot be before the debt opening date.",
            );
          const paid = await tx.record.aggregate({
            where: { kind: "payment", category: debt.id },
            _sum: { amount: true },
          });
          const charges = await tx.record.aggregate({
            where: {
              kind: "card_charge",
              category: debt.id,
              date: { lte: d.date },
            },
            _sum: { amount: true },
          });
          if (
            d.kind === "payment" &&
            Math.round(d.amount * 100) >
              debt.amount + (charges._sum.amount ?? 0) - (paid._sum.amount ?? 0)
          )
            throw new Error("Payment exceeds the remaining debt.");
        }
        const { annualRate, ...entry } = d;
        void annualRate;
        return tx.record.create({
          data: {
            ...entry,
            ...debtFields(
              d.kind === "debt"
                ? d
                : {
                    ...d,
                    debtType: "unspecified",
                    cardIssuer: "",
                    creditLimit: 0,
                    dueDate: "",
                    annualRate: null,
                  },
            ),
            amount: Math.round(d.amount * 100),
            minimum: Math.round(d.minimum * 100),
            target: Math.round(d.target * 100),
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
    return Response.json(record, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (
      [
        "Select an existing debt.",
        "Charges can only be added to a credit card.",
        "Payment exceeds the remaining debt.",
        "Payment date cannot be before the debt opening date.",
      ].includes(message)
    )
      return Response.json({ error: message }, { status: 400 });
    return Response.json(
      { error: "Could not save this record. Please try again." },
      { status: 500 },
    );
  }
}
export async function PATCH(request: Request) {
  if (!(await auth())?.user)
    return Response.json({ error: "Please sign in." }, { status: 401 });
  if (!isSameOrigin(request))
    return Response.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  try {
    const parsed = debtDetailsSchema.safeParse(await request.json());
    if (!parsed.success)
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    const d = parsed.data;
    const existing = await db.record.findUnique({ where: { id: d.id } });
    if (!existing || existing.kind !== "debt")
      return Response.json({ error: "Debt not found." }, { status: 404 });
    if (
      d.debtType !== "credit_card" &&
      (await db.record.count({
        where: { kind: "card_charge", category: d.id },
      })) > 0
    )
      return Response.json(
        { error: "A card with charges must remain a credit card." },
        { status: 400 },
      );
    return Response.json(
      await db.record.update({
        where: { id: d.id },
        data: {
          name: d.name,
          category: d.category,
          minimum: Math.round(d.minimum * 100),
          ...debtFields(d),
        },
      }),
    );
  } catch {
    return Response.json(
      { error: "Could not update debt details." },
      { status: 500 },
    );
  }
}
export async function DELETE(request: Request) {
  if (!(await auth())?.user)
    return Response.json({ error: "Please sign in." }, { status: 401 });
  if (!isSameOrigin(request))
    return Response.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  const id = new URL(request.url).searchParams.get("id");
  if (!id)
    return Response.json({ error: "Missing record ID" }, { status: 400 });
  try {
    await db.$transaction([
      db.record.deleteMany({
        where: { kind: { in: ["payment", "card_charge"] }, category: id },
      }),
      db.record.delete({ where: { id } }),
    ]);
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Could not delete this record." },
      { status: 400 },
    );
  }
}
