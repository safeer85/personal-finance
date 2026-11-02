import { z } from "zod";

export const money = z
  .number()
  .finite()
  .min(0)
  .max(20000000)
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001,
    "Use at most two decimal places",
  );
export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
    "Invalid date",
  );
const details = z.object({
  name: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(100),
  minimum: money.default(0),
  debtType: z
    .enum(["unspecified", "personal", "credit_card"])
    .default("unspecified"),
  cardIssuer: z.enum(["", "hnb_gold", "boc_gold"]).default(""),
  creditLimit: money.default(0),
  dueDate: z.union([date, z.literal("")]).default(""),
  annualRate: z
    .number()
    .finite()
    .min(0)
    .max(100)
    .refine(
      (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001,
      "Use at most two decimal places for the interest rate",
    )
    .nullable()
    .default(null),
});
function cardRequirements(
  value: { debtType: string; cardIssuer: string; annualRate: number | null },
  context: z.RefinementCtx,
) {
  if (value.debtType === "credit_card") {
    if (!value.cardIssuer)
      context.addIssue({
        code: "custom",
        message: "Select HNB Gold or BOC Gold.",
        path: ["cardIssuer"],
      });
    if (value.annualRate === null)
      context.addIssue({
        code: "custom",
        message: "Enter the annual interest rate from your card statement.",
        path: ["annualRate"],
      });
  }
}
export const recordSchema = details
  .extend({
    kind: z.enum([
      "income",
      "expense",
      "saving",
      "debt",
      "payment",
      "card_charge",
    ]),
    amount: money,
    date,
    target: money.default(0),
  })
  .superRefine((value, context) => {
    if (
      value.amount === 0 &&
      !(value.kind === "debt" && value.debtType === "credit_card")
    )
      context.addIssue({
        code: "custom",
        message: "Amount must be greater than zero.",
        path: ["amount"],
      });
    if (value.kind === "debt") {
      cardRequirements(value, context);
      if (value.minimum > value.amount)
        context.addIssue({
          code: "custom",
          message: "Monthly payment cannot exceed the opening balance.",
          path: ["minimum"],
        });
    }
  });
export const debtDetailsSchema = details
  .extend({ id: z.string().min(1) })
  .superRefine(cardRequirements);
export function debtFields(value: {
  debtType: string;
  cardIssuer: string;
  creditLimit: number;
  dueDate: string;
  annualRate: number | null;
}) {
  const credit = value.debtType === "credit_card";
  return {
    debtType: value.debtType,
    cardIssuer: credit ? value.cardIssuer : "",
    creditLimit: credit ? Math.round(value.creditLimit * 100) : 0,
    dueDate: value.dueDate,
    annualRateBps:
      credit && value.annualRate !== null
        ? Math.round(value.annualRate * 100)
        : value.debtType === "personal"
          ? 0
          : null,
  };
}
