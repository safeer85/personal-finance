import { PrismaClient } from "@prisma/client";
import nextEnv from "@next/env";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";

nextEnv.loadEnvConfig(process.cwd());
const marker = new URL("../.local/debt-test-schema.txt", import.meta.url);
const db = new PrismaClient();
const cleanup = process.argv.includes("--cleanup");
try {
  if (cleanup) {
    const schema = (await readFile(marker, "utf8")).trim();
    if (!/^pocket_debt_check_[a-f0-9]+$/.test(schema))
      throw Error("Invalid test schema name");
    await db.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    await rm(marker);
    console.log("Temporary debt-test schema removed.");
  } else {
    const schema = "pocket_debt_check_" + randomBytes(8).toString("hex");
    await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    await mkdir(new URL("../.local/", import.meta.url), { recursive: true });
    await writeFile(marker, schema);
    const url = new URL(process.env.DIRECT_URL);
    url.searchParams.set("schema", schema);
    const fixture = new PrismaClient({
      datasources: { db: { url: url.toString() } },
    });
    try {
      for (const name of [
        "20261026000100_initial",
        "20261026000200_login_limits",
      ]) {
        const sql = await readFile(
          new URL(
            `../prisma/migrations/${name}/migration.sql`,
            import.meta.url,
          ),
          "utf8",
        );
        await fixture.$executeRawUnsafe(
          sql
            .replaceAll('"Record"', `"${schema}"."Record"`)
            .replaceAll('"LoginAttempt"', `"${schema}"."LoginAttempt"`),
        );
      }
      await fixture.$executeRawUnsafe(
        `INSERT INTO "${schema}"."Record" ("id","kind","name","category","amount","date","minimum") VALUES ('legacy-debt','debt','Legacy test debt','Test',100000,'2026-11-01',10000),('legacy-payment','payment','Legacy payment','legacy-debt',25000,'2026-11-01',0)`,
      );
      const before = await fixture.$queryRawUnsafe(
        `SELECT "id","amount","name","kind","category","date","minimum","target" FROM "${schema}"."Record" ORDER BY "id"`,
      );
      const sql = await readFile(
        new URL(
          "../prisma/migrations/20261102000100_debt_types/migration.sql",
          import.meta.url,
        ),
        "utf8",
      );
      await fixture.$executeRawUnsafe(
        sql.replaceAll('"Record"', `"${schema}"."Record"`),
      );
      const after = await fixture.$queryRawUnsafe(
        `SELECT "id","amount","name","kind","category","date","minimum","target" FROM "${schema}"."Record" ORDER BY "id"`,
      );
      if (JSON.stringify(before) !== JSON.stringify(after))
        throw Error("Migration changed an existing record");
      const legacy = await fixture.record.findUnique({
        where: { id: "legacy-debt" },
      });
      if (legacy.debtType !== "unspecified" || legacy.annualRateBps !== null)
        throw Error("Legacy debt was incorrectly classified");
      console.log(
        "PASS: additive migration preserves existing debt and payment records without assuming a debt type.",
      );
    } finally {
      await fixture.$disconnect();
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
