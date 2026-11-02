import { test, expect } from "@playwright/test";
import {
  recordSchema,
  debtDetailsSchema,
  debtFields,
} from "../lib/record-validation";
import { estimateInterest, remainingMonthlyPayment } from "../lib/debts";
import type { Debt, Entry } from "../components/finance/types";

const base = {
  kind: "debt",
  name: "Test debt",
  category: "Test",
  amount: 1000,
  date: "2026-11-01",
  minimum: 50,
};
test("personal debts are interest free even if credit terms are submitted", () => {
  const parsed = recordSchema.parse({
    ...base,
    debtType: "personal",
    annualRate: 28,
    cardIssuer: "hnb_gold",
    creditLimit: 5000,
  });
  expect(debtFields(parsed)).toMatchObject({
    debtType: "personal",
    annualRateBps: 0,
    cardIssuer: "",
    creditLimit: 0,
  });
});
test("both Gold cards require an explicit statement interest rate", () => {
  for (const cardIssuer of ["hnb_gold", "boc_gold"]) {
    expect(
      recordSchema.safeParse({ ...base, debtType: "credit_card", cardIssuer })
        .success,
    ).toBe(false);
    const parsed = recordSchema.parse({
      ...base,
      debtType: "credit_card",
      cardIssuer,
      annualRate: 28.5,
      creditLimit: 5000,
    });
    expect(debtFields(parsed)).toMatchObject({
      cardIssuer,
      annualRateBps: 2850,
      creditLimit: 500000,
    });
  }
});
test("a future-use credit card can be recorded with a zero balance", () => {
  expect(
    recordSchema.safeParse({
      ...base,
      amount: 0,
      minimum: 0,
      debtType: "credit_card",
      cardIssuer: "boc_gold",
      annualRate: 0,
    }).success,
  ).toBe(true);
  expect(
    recordSchema.safeParse({
      ...base,
      amount: 0,
      minimum: 0,
      debtType: "personal",
    }).success,
  ).toBe(false);
});
test("invalid terms and dates are rejected", () => {
  expect(
    recordSchema.safeParse({
      ...base,
      debtType: "credit_card",
      cardIssuer: "wrong",
      annualRate: 20,
    }).success,
  ).toBe(false);
  expect(
    recordSchema.safeParse({
      ...base,
      debtType: "credit_card",
      cardIssuer: "hnb_gold",
      annualRate: -1,
    }).success,
  ).toBe(false);
  expect(
    recordSchema.safeParse({ ...base, dueDate: "2026-02-30" }).success,
  ).toBe(false);
  expect(recordSchema.safeParse({ ...base, minimum: 1001 }).success).toBe(
    false,
  );
});
test("editing details never includes opening amounts or payment history", () => {
  const parsed = debtDetailsSchema.parse({
    ...base,
    id: "old-debt",
    debtType: "personal",
    amount: 9999,
  });
  expect(parsed).not.toHaveProperty("amount");
});
test("interest uses integer minor units and the supplied annual rate", () => {
  expect(estimateInterest(100000, 2800)).toBe(2301);
  expect(estimateInterest(50000, 2800)).toBe(1151);
  expect(estimateInterest(100000, 0)).toBe(0);
  expect(estimateInterest(0, 2800)).toBe(0);
  expect(estimateInterest(100000, null)).toBe(null);
});
test("a final partial payment does not erase the remaining monthly target", () => {
  const debt = {
    ...base,
    id: "debt",
    amount: 10000,
    balance: 2500,
    minimum: 10000,
    target: 0,
  } as Debt;
  const payment = {
    id: "p",
    kind: "payment",
    category: "debt",
    amount: 7500,
  } as Entry;
  expect(remainingMonthlyPayment(debt, [payment])).toBe(2500);
  expect(remainingMonthlyPayment(debt, [{ ...payment, amount: 10000 }])).toBe(
    0,
  );
});
