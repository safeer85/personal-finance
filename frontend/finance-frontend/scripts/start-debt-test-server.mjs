import nextEnv from "@next/env";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
nextEnv.loadEnvConfig(process.cwd());
const schema = (
  await readFile(
    new URL("../.local/debt-test-schema.txt", import.meta.url),
    "utf8",
  )
).trim();
if (!/^pocket_debt_check_[a-f0-9]+$/.test(schema))
  throw Error("Invalid test schema name");
const url = new URL(process.env.DATABASE_URL);
url.searchParams.set("schema", schema);
const direct = new URL(process.env.DIRECT_URL);
direct.searchParams.set("schema", schema);
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3010",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: url.toString(),
      DIRECT_URL: direct.toString(),
    },
  },
);
process.on("SIGINT", () => child.kill());
child.on("exit", (code) => {
  process.exitCode = code || 0;
});
