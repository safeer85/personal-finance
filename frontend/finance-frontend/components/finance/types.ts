export type Entry = {
  id: string;
  kind: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  minimum: number;
  target: number;
  debtType?: "unspecified" | "personal" | "credit_card";
  cardIssuer?: string;
  creditLimit?: number;
  dueDate?: string;
  annualRateBps?: number | null;
};

export type Debt = Entry & { balance: number };
export type MoneyFormatter = (minorUnits: number) => string;
