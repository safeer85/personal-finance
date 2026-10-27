export type Entry = {
  id: string;
  kind: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  minimum: number;
  target: number;
};

export type Debt = Entry & { balance: number };
export type MoneyFormatter = (minorUnits: number) => string;
