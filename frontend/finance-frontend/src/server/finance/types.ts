export const ACCOUNT_TYPES = [
  "bank",
  "e_wallet",
  "forex",
  "credit_card",
  "people_debt",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export type DebtDirection = "owe" | "owed";

export type TransactionType = "expense" | "income" | "transfer";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  openingBalance: number;
  archived: boolean;
  personName: string | null;
  debtDirection: DebtDirection | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  kind: "income" | "expense";
  archived: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionSplit {
  categoryId: string;
  amount: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  occurredAt: string;
  note: string;
  merchant: string;
  tags: string[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;

  accountId: string | null;
  categoryId: string | null;
  amount: number | null;
  currency: string | null;
  splits: TransactionSplit[];

  fromAccountId: string | null;
  toAccountId: string | null;
  fromAmount: number | null;
  toAmount: number | null;
  fromCurrency: string | null;
  toCurrency: string | null;
  exchangeRate: number | null;
}

export interface AuditEntry {
  id: string;
  entityType: "account" | "category" | "transaction";
  entityId: string;
  action: "create" | "update" | "archive" | "delete";
  at: string;
  before: unknown;
  after: unknown;
}

export interface FinanceDB {
  settings: {
    baseCurrency: string;
  };
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  audit: AuditEntry[];
}

export interface AccountWithBalance extends Account {
  balance: number;
}

