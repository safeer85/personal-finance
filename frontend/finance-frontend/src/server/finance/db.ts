import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { FinanceDB } from "@/src/server/finance/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "finance-db.json");

function nowIso() {
  return new Date().toISOString();
}

function defaultCategories() {
  const timestamp = nowIso();
  const mk = (name: string, kind: "income" | "expense") => ({
    id: randomUUID(),
    name,
    kind,
    archived: false,
    isDefault: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return [
    mk("Salary", "income"),
    mk("Freelance", "income"),
    mk("Other Income", "income"),
    mk("Housing", "expense"),
    mk("Food", "expense"),
    mk("Transport", "expense"),
    mk("Utilities", "expense"),
    mk("Healthcare", "expense"),
    mk("Lifestyle", "expense"),
  ];
}

function defaultDB(): FinanceDB {
  return {
    settings: { baseCurrency: "LKR" },
    accounts: [],
    categories: defaultCategories(),
    transactions: [],
    audit: [],
  };
}

async function ensureDbFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DB_PATH, "utf8");
  } catch {
    await writeFile(DB_PATH, JSON.stringify(defaultDB(), null, 2), "utf8");
  }
}

export async function readDB(): Promise<FinanceDB> {
  await ensureDbFile();
  const text = await readFile(DB_PATH, "utf8");
  return JSON.parse(text) as FinanceDB;
}

let writeQueue = Promise.resolve();

export async function updateDB<T>(
  mutator: (db: FinanceDB) => Promise<T> | T,
): Promise<T> {
  const run = writeQueue.then(async () => {
    const db = await readDB();
    const result = await mutator(db);
    await writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
    return result;
  });

  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}

