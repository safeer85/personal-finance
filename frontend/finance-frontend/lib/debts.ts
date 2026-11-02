import type { Debt, Entry } from "@/components/finance/types";

export const cardNames: Record<string, string> = {
  hnb_gold: "HNB Gold",
  boc_gold: "BOC Gold",
};

// A forward-looking simple-interest scenario, not a bank statement calculation.
// The user supplies the annual rate; no HNB or BOC tariff is assumed.
export function estimateInterest(
  balance: number,
  annualRateBps: number | null | undefined,
  days = 30,
): number | null {
  if (annualRateBps == null) return null;
  return Math.round(
    (((Math.max(0, balance) * annualRateBps) / 10000) * days) / 365,
  );
}

export function remainingMonthlyPayment(debt: Debt, payments: Entry[]): number {
  const paid = payments
    .filter(
      (record) => record.kind === "payment" && record.category === debt.id,
    )
    .reduce((total, record) => total + record.amount, 0);
  return Math.min(debt.balance, Math.max(0, debt.minimum - paid));
}
