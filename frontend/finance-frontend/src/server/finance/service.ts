import { randomUUID } from "node:crypto";
import { z } from "zod";
import { readDB, updateDB } from "@/src/server/finance/db";
import {
  ACCOUNT_TYPES,
  Account,
  AccountWithBalance,
  AuditEntry,
  Category,
  FinanceDB,
  Transaction,
  TransactionSplit,
} from "@/src/server/finance/types";

function nowIso() {
  return new Date().toISOString();
}

function badRequest(message: string): never {
  throw new Error(message);
}

function pushAudit(
  db: FinanceDB,
  entry: Omit<AuditEntry, "id" | "at"> & Partial<Pick<AuditEntry, "id" | "at">>,
) {
  db.audit.unshift({
    id: entry.id ?? randomUUID(),
    at: entry.at ?? nowIso(),
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
    before: entry.before ?? null,
    after: entry.after ?? null,
  });
}

function accountBalanceMap(db: FinanceDB): Map<string, number> {
  const balances = new Map<string, number>();
  for (const account of db.accounts) {
    balances.set(account.id, account.openingBalance);
  }

  for (const tx of db.transactions) {
    if (tx.deletedAt) continue;

    if ((tx.type === "income" || tx.type === "expense") && tx.accountId && tx.amount) {
      const current = balances.get(tx.accountId) ?? 0;
      balances.set(
        tx.accountId,
        tx.type === "income" ? current + tx.amount : current - tx.amount,
      );
      continue;
    }

    if (
      tx.type === "transfer" &&
      tx.fromAccountId &&
      tx.toAccountId &&
      tx.fromAmount &&
      tx.toAmount
    ) {
      const fromCurrent = balances.get(tx.fromAccountId) ?? 0;
      const toCurrent = balances.get(tx.toAccountId) ?? 0;
      balances.set(tx.fromAccountId, fromCurrent - tx.fromAmount);
      balances.set(tx.toAccountId, toCurrent + tx.toAmount);
    }
  }
  return balances;
}

function ensureAccount(db: FinanceDB, id: string): Account {
  const account = db.accounts.find((a) => a.id === id);
  if (!account) badRequest(`Account not found: ${id}`);
  return account;
}

function ensureCategory(db: FinanceDB, id: string): Category {
  const category = db.categories.find((c) => c.id === id);
  if (!category) badRequest(`Category not found: ${id}`);
  return category;
}

const accountCreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(ACCOUNT_TYPES),
  currency: z.string().trim().min(3).max(6),
  openingBalance: z.number().default(0),
  personName: z.string().trim().optional(),
  debtDirection: z.enum(["owe", "owed"]).optional(),
});

const accountUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(ACCOUNT_TYPES).optional(),
  currency: z.string().trim().min(3).max(6).optional(),
  openingBalance: z.number().optional(),
  personName: z.string().trim().nullable().optional(),
  debtDirection: z.enum(["owe", "owed"]).nullable().optional(),
  archived: z.boolean().optional(),
});

const categoryCreateSchema = z.object({
  name: z.string().trim().min(1),
  kind: z.enum(["income", "expense"]),
});

const categoryUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  archived: z.boolean().optional(),
});

const splitSchema = z.object({
  categoryId: z.string().min(1),
  amount: z.number().positive(),
});

const txCreateSchema = z.object({
  type: z.enum(["expense", "income", "transfer"]),
  occurredAt: z.string().datetime().optional(),
  note: z.string().optional(),
  merchant: z.string().optional(),
  tags: z.array(z.string()).optional(),

  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().trim().min(3).max(6).optional(),
  splits: z.array(splitSchema).optional(),

  fromAccountId: z.string().optional(),
  toAccountId: z.string().optional(),
  fromAmount: z.number().positive().optional(),
  toAmount: z.number().positive().optional(),
  exchangeRate: z.number().positive().optional(),
});

const txUpdateSchema = txCreateSchema.partial();

function validateAndNormalizeTxInput(
  db: FinanceDB,
  input: z.infer<typeof txCreateSchema>,
): Omit<Transaction, "id" | "createdAt" | "updatedAt" | "deletedAt"> {
  const occurredAt = input.occurredAt ?? nowIso();
  const note = (input.note ?? "").trim();
  const merchant = (input.merchant ?? "").trim();
  const tags = (input.tags ?? []).map((t) => t.trim()).filter(Boolean);

  if (input.type === "income" || input.type === "expense") {
    if (!input.accountId) badRequest("accountId is required for income/expense");
    if (!input.categoryId) badRequest("categoryId is required for income/expense");
    if (!input.amount || input.amount <= 0) badRequest("amount must be greater than zero");

    const account = ensureAccount(db, input.accountId);
    const category = ensureCategory(db, input.categoryId);
    if (category.kind !== input.type) {
      badRequest(`category kind must be ${input.type}`);
    }

    const splits = normalizeSplits(db, input.splits ?? [], input.amount);
    return {
      type: input.type,
      occurredAt,
      note,
      merchant,
      tags,
      accountId: account.id,
      categoryId: category.id,
      amount: input.amount,
      currency: input.currency?.toUpperCase() ?? account.currency.toUpperCase(),
      splits,
      fromAccountId: null,
      toAccountId: null,
      fromAmount: null,
      toAmount: null,
      fromCurrency: null,
      toCurrency: null,
      exchangeRate: null,
    };
  }

  if (!input.fromAccountId || !input.toAccountId) {
    badRequest("fromAccountId and toAccountId are required for transfer");
  }
  if (input.fromAccountId === input.toAccountId) {
    badRequest("fromAccountId and toAccountId must be different");
  }
  if (!input.fromAmount || input.fromAmount <= 0) badRequest("fromAmount must be > 0");
  if (!input.toAmount || input.toAmount <= 0) badRequest("toAmount must be > 0");

  const fromAccount = ensureAccount(db, input.fromAccountId);
  const toAccount = ensureAccount(db, input.toAccountId);
  const fromCurrency = fromAccount.currency.toUpperCase();
  const toCurrency = toAccount.currency.toUpperCase();
  const sameCurrency = fromCurrency === toCurrency;
  const exchangeRate =
    input.exchangeRate ?? (sameCurrency ? 1 : Number((input.toAmount / input.fromAmount).toFixed(8)));
  if (!exchangeRate || exchangeRate <= 0) badRequest("exchangeRate must be > 0");

  return {
    type: "transfer",
    occurredAt,
    note,
    merchant,
    tags,
    accountId: null,
    categoryId: null,
    amount: null,
    currency: null,
    splits: [],
    fromAccountId: fromAccount.id,
    toAccountId: toAccount.id,
    fromAmount: input.fromAmount,
    toAmount: input.toAmount,
    fromCurrency,
    toCurrency,
    exchangeRate,
  };
}

function normalizeSplits(
  db: FinanceDB,
  splits: TransactionSplit[],
  totalAmount: number,
): TransactionSplit[] {
  if (splits.length === 0) return [];
  const normalized = splits.map((split) => {
    if (!split.categoryId) badRequest("split categoryId is required");
    if (split.amount <= 0) badRequest("split amount must be > 0");
    ensureCategory(db, split.categoryId);
    return {
      categoryId: split.categoryId,
      amount: Number(split.amount.toFixed(2)),
    };
  });

  const sum = normalized.reduce((acc, split) => acc + split.amount, 0);
  if (Math.abs(sum - totalAmount) > 0.005) {
    badRequest("split totals must exactly equal parent amount");
  }
  return normalized;
}

export async function listAccounts(): Promise<AccountWithBalance[]> {
  const db = await readDB();
  const balances = accountBalanceMap(db);
  return db.accounts.map((account) => ({
    ...account,
    balance: Number((balances.get(account.id) ?? account.openingBalance).toFixed(2)),
  }));
}

export async function createAccount(input: unknown): Promise<Account> {
  const parsed = accountCreateSchema.parse(input);
  return updateDB(async (db) => {
    if (parsed.type === "people_debt" && !parsed.personName) {
      badRequest("personName is required for people_debt accounts");
    }
    const timestamp = nowIso();
    const account: Account = {
      id: randomUUID(),
      name: parsed.name.trim(),
      type: parsed.type,
      currency: parsed.currency.toUpperCase(),
      openingBalance: parsed.openingBalance,
      archived: false,
      personName: parsed.personName?.trim() || null,
      debtDirection: parsed.debtDirection ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    db.accounts.push(account);
    pushAudit(db, {
      entityType: "account",
      entityId: account.id,
      action: "create",
      before: null,
      after: account,
    });
    return account;
  });
}

export async function updateAccount(id: string, input: unknown): Promise<Account> {
  const parsed = accountUpdateSchema.parse(input);
  return updateDB(async (db) => {
    const account = ensureAccount(db, id);
    const before = { ...account };
    if (parsed.name !== undefined) account.name = parsed.name.trim();
    if (parsed.type !== undefined) account.type = parsed.type;
    if (parsed.currency !== undefined) account.currency = parsed.currency.toUpperCase();
    if (parsed.openingBalance !== undefined) account.openingBalance = parsed.openingBalance;
    if (parsed.personName !== undefined) account.personName = parsed.personName?.trim() || null;
    if (parsed.debtDirection !== undefined) account.debtDirection = parsed.debtDirection;
    if (parsed.archived !== undefined) account.archived = parsed.archived;
    account.updatedAt = nowIso();

    pushAudit(db, {
      entityType: "account",
      entityId: account.id,
      action: parsed.archived ? "archive" : "update",
      before,
      after: account,
    });
    return account;
  });
}

export async function listCategories(): Promise<Category[]> {
  const db = await readDB();
  return db.categories;
}

export async function createCategory(input: unknown): Promise<Category> {
  const parsed = categoryCreateSchema.parse(input);
  return updateDB(async (db) => {
    const exists = db.categories.some(
      (c) => c.name.toLowerCase() === parsed.name.toLowerCase(),
    );
    if (exists) badRequest("category name must be unique");
    const timestamp = nowIso();
    const category: Category = {
      id: randomUUID(),
      name: parsed.name.trim(),
      kind: parsed.kind,
      archived: false,
      isDefault: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    db.categories.push(category);
    pushAudit(db, {
      entityType: "category",
      entityId: category.id,
      action: "create",
      before: null,
      after: category,
    });
    return category;
  });
}

export async function updateCategory(id: string, input: unknown): Promise<Category> {
  const parsed = categoryUpdateSchema.parse(input);
  return updateDB(async (db) => {
    const category = ensureCategory(db, id);
    const before = { ...category };
    if (parsed.name !== undefined) {
      const nextName = parsed.name.trim();
      const duplicate = db.categories.some(
        (c) => c.id !== id && c.name.toLowerCase() === nextName.toLowerCase(),
      );
      if (duplicate) badRequest("category name must be unique");
      category.name = nextName;
    }
    if (parsed.archived !== undefined) category.archived = parsed.archived;
    category.updatedAt = nowIso();

    pushAudit(db, {
      entityType: "category",
      entityId: category.id,
      action: parsed.archived ? "archive" : "update",
      before,
      after: category,
    });
    return category;
  });
}

function asTransactionList(
  db: FinanceDB,
  params: {
    limit?: number;
    offset?: number;
    accountId?: string;
    categoryId?: string;
    tag?: string;
    merchant?: string;
    dateFrom?: string;
    dateTo?: string;
  },
) {
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 200);
  const offset = Math.max(params.offset ?? 0, 0);
  const tag = params.tag?.toLowerCase();
  const merchant = params.merchant?.toLowerCase();

  let list = db.transactions.filter((tx) => !tx.deletedAt);

  if (params.accountId) {
    list = list.filter(
      (tx) =>
        tx.accountId === params.accountId ||
        tx.fromAccountId === params.accountId ||
        tx.toAccountId === params.accountId,
    );
  }
  if (params.categoryId) {
    list = list.filter(
      (tx) =>
        tx.categoryId === params.categoryId ||
        tx.splits.some((split) => split.categoryId === params.categoryId),
    );
  }
  if (tag) {
    list = list.filter((tx) => tx.tags.some((t) => t.toLowerCase() === tag));
  }
  if (merchant) {
    list = list.filter((tx) => tx.merchant.toLowerCase().includes(merchant));
  }
  if (params.dateFrom) {
    list = list.filter((tx) => tx.occurredAt >= params.dateFrom!);
  }
  if (params.dateTo) {
    list = list.filter((tx) => tx.occurredAt <= params.dateTo!);
  }

  list = list.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
  return {
    total: list.length,
    items: list.slice(offset, offset + limit),
    limit,
    offset,
  };
}

export async function listTransactions(params: {
  limit?: number;
  offset?: number;
  accountId?: string;
  categoryId?: string;
  tag?: string;
  merchant?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const db = await readDB();
  return asTransactionList(db, params);
}

export async function createTransaction(input: unknown): Promise<Transaction> {
  const parsed = txCreateSchema.parse(input);
  return updateDB(async (db) => {
    const data = validateAndNormalizeTxInput(db, parsed);
    const timestamp = nowIso();
    const tx: Transaction = {
      id: randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
      ...data,
    };
    db.transactions.push(tx);
    pushAudit(db, {
      entityType: "transaction",
      entityId: tx.id,
      action: "create",
      before: null,
      after: tx,
    });
    return tx;
  });
}

export async function updateTransaction(id: string, input: unknown): Promise<Transaction> {
  const patch = txUpdateSchema.parse(input);
  return updateDB(async (db) => {
    const tx = db.transactions.find((item) => item.id === id && !item.deletedAt);
    if (!tx) badRequest(`Transaction not found: ${id}`);
    const before = { ...tx };

    const merged = {
      type: patch.type ?? tx.type,
      occurredAt: patch.occurredAt ?? tx.occurredAt,
      note: patch.note ?? tx.note,
      merchant: patch.merchant ?? tx.merchant,
      tags: patch.tags ?? tx.tags,

      accountId: patch.accountId ?? tx.accountId ?? undefined,
      categoryId: patch.categoryId ?? tx.categoryId ?? undefined,
      amount: patch.amount ?? tx.amount ?? undefined,
      currency: patch.currency ?? tx.currency ?? undefined,
      splits: patch.splits ?? tx.splits,

      fromAccountId: patch.fromAccountId ?? tx.fromAccountId ?? undefined,
      toAccountId: patch.toAccountId ?? tx.toAccountId ?? undefined,
      fromAmount: patch.fromAmount ?? tx.fromAmount ?? undefined,
      toAmount: patch.toAmount ?? tx.toAmount ?? undefined,
      exchangeRate: patch.exchangeRate ?? tx.exchangeRate ?? undefined,
    };

    const normalized = validateAndNormalizeTxInput(db, merged);
    Object.assign(tx, normalized, { updatedAt: nowIso() });

    pushAudit(db, {
      entityType: "transaction",
      entityId: tx.id,
      action: "update",
      before,
      after: tx,
    });
    return tx;
  });
}

export async function deleteTransaction(id: string): Promise<{ id: string }> {
  return updateDB(async (db) => {
    const tx = db.transactions.find((item) => item.id === id && !item.deletedAt);
    if (!tx) badRequest(`Transaction not found: ${id}`);
    const before = { ...tx };
    tx.deletedAt = nowIso();
    tx.updatedAt = nowIso();
    pushAudit(db, {
      entityType: "transaction",
      entityId: tx.id,
      action: "delete",
      before,
      after: { ...tx },
    });
    return { id };
  });
}

export async function listAudit(params: { limit?: number; offset?: number }) {
  const db = await readDB();
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);
  const offset = Math.max(params.offset ?? 0, 0);
  return {
    total: db.audit.length,
    limit,
    offset,
    items: db.audit.slice(offset, offset + limit),
  };
}
