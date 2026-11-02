import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3010";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw Error("Use the isolated local debt-test server.");
await readFile(
  new URL("../.local/debt-test-schema.txt", import.meta.url),
  "utf8",
);
const saved = await readFile(
  new URL("../.local/owner-login.txt", import.meta.url),
  "utf8",
);
const username = saved.match(/^Username: (.+)$/m)[1],
  password = saved.match(/^Password: (.+)$/m)[1];
let cookie = "";
async function request(path, options = {}) {
  const response = await fetch(base + path, {
    redirect: "manual",
    ...options,
    headers: { cookie, ...options.headers },
  });
  for (const header of response.headers.getSetCookie()) {
    const pair = header.split(";")[0],
      name = pair.split("=")[0];
    cookie = cookie
      .split("; ")
      .filter((value) => value && !value.startsWith(name + "="))
      .concat(pair)
      .join("; ");
  }
  return response;
}
async function write(method, data) {
  const response = await request("/api/records", {
    method,
    headers: { origin: base, "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return { status: response.status, data: await response.json() };
}
const list = async () => await (await request("/api/records")).json();
const parents = new Set();
try {
  for (const method of ["GET", "POST", "PATCH", "DELETE"])
    assert.equal((await request("/api/records", { method })).status, 401);
  const { csrfToken } = await (await request("/api/auth/csrf")).json();
  await request("/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      origin: base,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      username,
      password,
      csrfToken,
      callbackUrl: base,
    }),
  });
  const before = await list();
  const legacy = before.find(
    (record) =>
      record.id === "legacy-debt" && record.name === "Legacy test debt",
  );
  assert(
    legacy,
    "Server is not using the isolated fixture database; aborting before writes.",
  );
  const common = {
    kind: "debt",
    name: "API test",
    category: "Test",
    date: "2026-11-01",
    amount: 1000,
    minimum: 50,
  };
  const personal = await write("POST", {
    ...common,
    debtType: "personal",
    annualRate: 28,
    creditLimit: 5000,
    cardIssuer: "hnb_gold",
  });
  assert.equal(personal.status, 201);
  parents.add(personal.data.id);
  assert.equal(personal.data.annualRateBps, 0);
  assert.equal(personal.data.cardIssuer, "");
  assert.equal(personal.data.creditLimit, 0);
  const hnb = await write("POST", {
    ...common,
    debtType: "credit_card",
    cardIssuer: "hnb_gold",
    annualRate: 28.5,
    creditLimit: 5000,
    dueDate: "2026-11-20",
  });
  assert.equal(hnb.status, 201);
  parents.add(hnb.data.id);
  assert.equal(hnb.data.annualRateBps, 2850);
  assert.equal(hnb.data.creditLimit, 500000);
  const boc = await write("POST", {
    ...common,
    name: "BOC Gold API fixture",
    amount: 0,
    minimum: 0,
    debtType: "credit_card",
    cardIssuer: "boc_gold",
    annualRate: 28,
  });
  assert.equal(boc.status, 201);
  parents.add(boc.data.id);
  const charge = await write("POST", {
    kind: "card_charge",
    name: "Card purchase",
    category: boc.data.id,
    amount: 500,
    date: "2026-11-02",
  });
  assert.equal(charge.status, 201);
  const badCharge = await write("POST", {
    kind: "card_charge",
    name: "Invalid personal charge",
    category: personal.data.id,
    amount: 1,
    date: "2026-11-02",
  });
  assert.equal(badCharge.status, 400);
  const updated = await write("PATCH", {
    id: boc.data.id,
    name: boc.data.name,
    category: "Test",
    debtType: "credit_card",
    cardIssuer: "boc_gold",
    annualRate: 28,
    minimum: 50,
    creditLimit: 5000,
    amount: 99999,
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.amount, 0);
  assert.equal(updated.data.minimum, 5000);
  assert.equal(
    (
      await write("POST", {
        kind: "payment",
        name: "Overpayment",
        category: boc.data.id,
        amount: 600,
        date: "2026-11-02",
      })
    ).status,
    400,
  );
  const payment = await write("POST", {
    kind: "payment",
    name: "Card payment",
    category: boc.data.id,
    amount: 100,
    date: "2026-11-02",
  });
  const futureCharge = await write("POST", {
    kind: "card_charge",
    name: "Future card purchase",
    category: boc.data.id,
    amount: 800,
    date: "2026-11-05",
  });
  assert.equal(futureCharge.status, 201);
  assert.equal(
    (
      await write("POST", {
        kind: "payment",
        name: "Payment against future charge",
        category: boc.data.id,
        amount: 600,
        date: "2026-11-02",
      })
    ).status,
    400,
  );
  assert.equal(payment.status, 201);
  assert.equal(
    (
      await write("PATCH", {
        id: boc.data.id,
        name: boc.data.name,
        category: "Test",
        debtType: "personal",
      })
    ).status,
    400,
  );
  const classify = await write("PATCH", {
    id: legacy.id,
    name: legacy.name,
    category: legacy.category,
    debtType: "personal",
    minimum: 100,
    amount: 99999,
  });
  assert.equal(classify.status, 200);
  assert.equal(classify.data.amount, 100000);
  const after = await list();
  assert(
    after.some(
      (record) =>
        record.id === "legacy-payment" &&
        record.category === legacy.id &&
        record.amount === 25000,
    ),
  );
  assert.equal(
    (
      await request("/api/records?id=" + boc.data.id, {
        method: "DELETE",
        headers: { origin: base },
      })
    ).status,
    200,
  );
  parents.delete(boc.data.id);
  const remaining = await list();
  assert(
    !remaining.some(
      (record) => record.id === charge.data.id || record.id === payment.data.id,
    ),
  );
  console.log(
    "PASS: protected debt API, personal 0% enforcement, both card types, rate precision, zero-balance cards, charges, payment limits, metadata editing, legacy payment preservation, and linked cleanup. All writes used the isolated test schema.",
  );
} catch (error) {
  console.error(String(error.message).split(password).join("[redacted]"));
  process.exitCode = 1;
} finally {
  for (const id of parents) {
    await request("/api/records?id=" + id, {
      method: "DELETE",
      headers: { origin: base },
    });
  }
}
