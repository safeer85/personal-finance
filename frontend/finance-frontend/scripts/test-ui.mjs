import { chromium, expect } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3010";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw Error("Run the UI fixture test against a local server only.");
const credentials = await readFile(
  new URL("../.local/owner-login.txt", import.meta.url),
  "utf8",
);
const username = credentials.match(/^Username: (.+)$/m)?.[1];
const password = credentials.match(/^Password: (.+)$/m)?.[1];
assert(username && password, "A generated local owner login is required.");
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (
    message.type() === "error" &&
    /hydration|didn't match|uncontrolled|controlled input|DialogContent.*requires/i.test(
      message.text(),
    )
  )
    errors.push(message.text());
});
const fixtureDate = new Date().toISOString().slice(0, 10);
let records = [
  {
    id: "legacy-fixture",
    kind: "debt",
    name: "Existing unclassified debt",
    category: "Legacy",
    amount: 100000,
    date: fixtureDate,
    minimum: 10000,
    target: 0,
    debtType: "unspecified",
    cardIssuer: "",
    creditLimit: 0,
    dueDate: "",
    annualRateBps: null,
  },
];
const submissions = [];
let sequence = 0;

// Exercise the real UI without creating or changing any financial database rows.
await page.route("**/api/records*", async (route) => {
  const request = route.request();
  if (request.method() === "POST") {
    const data = request.postDataJSON();
    submissions.push(data);
    const record = {
      ...data,
      id: `ui-fixture-${++sequence}`,
      amount: Math.round(data.amount * 100),
      minimum: Math.round(data.minimum * 100),
      target: Math.round(data.target * 100),
      creditLimit: Math.round((data.creditLimit || 0) * 100),
      annualRateBps:
        data.debtType === "personal"
          ? 0
          : data.annualRate == null
            ? null
            : Math.round(data.annualRate * 100),
    };
    records.unshift(record);
    return route.fulfill({ status: 201, json: record });
  }
  if (request.method() === "PATCH") {
    const data = request.postDataJSON();
    const existing = records.find((record) => record.id === data.id);
    Object.assign(existing, {
      name: data.name,
      category: data.category,
      minimum: Math.round(data.minimum * 100),
      debtType: data.debtType,
      cardIssuer: data.debtType === "credit_card" ? data.cardIssuer : "",
      creditLimit:
        data.debtType === "credit_card"
          ? Math.round(data.creditLimit * 100)
          : 0,
      dueDate: data.dueDate,
      annualRateBps:
        data.debtType === "personal" ? 0 : Math.round(data.annualRate * 100),
    });
    return route.fulfill({ json: existing });
  }
  if (request.method() === "DELETE") {
    const id = new URL(request.url()).searchParams.get("id");
    records = records.filter(
      (record) =>
        record.id !== id &&
        !(
          ["payment", "card_charge"].includes(record.kind) &&
          record.category === id
        ),
    );
    return route.fulfill({ json: { ok: true } });
  }
  return route.fulfill({ json: records });
});

try {
  await page.goto(base + "/login");
  await expect(
    page.getByRole("heading", { name: "Your money. Your space." }),
  ).toBeVisible();
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your money, at a glance." }),
  ).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  for (const view of [
    "Transactions",
    "Income",
    "Expenses",
    "Savings",
    "Debts",
    "Overview",
  ]) {
    await nav.getByRole("button", { name: new RegExp("^" + view) }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      view === "Overview" ? "Your money, at a glance." : view,
    );
  }
  await page.getByRole("button", { name: "Add record", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add a record" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  assert(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
    "Focus escaped the record dialog.",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  async function add(kind, name, amount, extra = {}) {
    await page.getByRole("button", { name: "Add record", exact: true }).click();
    await dialog.getByLabel("Record type", { exact: true }).click();
    await page
      .getByRole("option", {
        name:
          kind === "payment"
            ? "Debt payment"
            : kind[0].toUpperCase() + kind.slice(1),
        exact: true,
      })
      .click();
    await dialog.getByLabel(/^(Description|Person \/ description)$/).fill(name);
    await dialog.getByLabel(/^(Amount|Opening balance)/).fill(String(amount));
    if (kind === "payment") {
      await dialog.getByLabel("Debt", { exact: true }).click();
      await page.getByRole("option", { name: /^UI test loan/ }).click();
    } else if (kind !== "debt")
      await dialog
        .getByLabel("Category", { exact: true })
        .fill(kind === "expense" ? "Groceries" : "UI fixtures");
    if (extra.minimum)
      await dialog
        .getByLabel(/^(Statement minimum payment|Planned monthly repayment)$/)
        .fill(String(extra.minimum));
    if (extra.target)
      await dialog
        .getByLabel("Goal amount (optional)", { exact: true })
        .fill(String(extra.target));
    await dialog
      .getByRole("button", { name: "Save record", exact: true })
      .click();
    await expect(dialog).toBeHidden();
  }
  await add("income", "UI test salary", 5000);
  await add("expense", "UI test groceries", 1000);
  await add("saving", "UI test savings", 500, { target: 2000 });
  await add("debt", "UI test loan", 10000, { minimum: 300 });
  await add("payment", "UI test payment", 200);
  assert.deepEqual(
    submissions.map((record) => record.kind),
    ["income", "expense", "saving", "debt", "payment"],
  );
  assert.equal(
    submissions[4].category,
    records.find((record) => record.kind === "debt").id,
    "The payment did not submit its selected debt ID.",
  );
  await nav.getByRole("button", { name: /^Debts/ }).click();
  await expect(
    page.getByText("Existing debts to classify", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Edit Existing unclassified debt",
      exact: true,
    })
    .click();
  const editDialog = page.getByRole("dialog", { name: "Edit debt details" });
  await editDialog.getByLabel("Debt type", { exact: true }).click();
  await page
    .getByRole("option", { name: "Personal debt — no interest", exact: true })
    .click();
  await editDialog
    .getByRole("button", { name: "Save debt details", exact: true })
    .click();
  await expect(editDialog).toBeHidden();
  assert.equal(
    records.find((record) => record.id === "legacy-fixture").amount,
    100000,
  );
  assert.equal(
    records.find((record) => record.id === "legacy-fixture").debtType,
    "personal",
  );
  for (const issuer of ["HNB", "BOC"]) {
    await page
      .getByRole("button", { name: `Add ${issuer} Gold`, exact: true })
      .click();
    await dialog
      .getByLabel(/^Opening balance/)
      .fill(issuer === "HNB" ? "2000" : "0");
    await dialog
      .getByLabel("Credit limit (optional)", { exact: true })
      .fill("5000");
    await dialog
      .getByLabel("Annual interest rate (% p.a.)", { exact: true })
      .fill("28");
    if (issuer === "HNB")
      await dialog
        .getByLabel("Statement minimum payment", { exact: true })
        .fill("100");
    await dialog
      .getByRole("button", { name: "Save record", exact: true })
      .click();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("heading", { name: `${issuer} Gold`, exact: true }),
    ).toBeVisible();
  }
  const boc = page
    .locator("article")
    .filter({
      has: page.getByRole("heading", { name: "BOC Gold", exact: true }),
    });
  await boc
    .getByRole("button", { name: "Add charge / interest", exact: true })
    .click();
  await dialog
    .getByLabel("Description", { exact: true })
    .fill("UI BOC purchase");
  await dialog.getByLabel(/^Amount/).fill("500");
  await dialog
    .getByRole("button", { name: "Save record", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  const bocRecord = records.find((record) => record.cardIssuer === "boc_gold");
  assert(
    records.some(
      (record) =>
        record.kind === "card_charge" && record.category === bocRecord.id,
    ),
  );
  await boc
    .getByRole("button", { name: "Record payment", exact: true })
    .click();
  await dialog
    .getByLabel("Description", { exact: true })
    .fill("UI BOC payment");
  await dialog.getByLabel(/^Amount/).fill("100");
  await dialog
    .getByRole("button", { name: "Save record", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await expect(boc.getByText(/400\.00/)).toBeVisible();
  await mkdir(new URL("../.local/", import.meta.url), { recursive: true });
  await page.screenshot({
    animations: "disabled",
    path: fileURLToPath(
      new URL("../.local/ui-debts-desktop.png", import.meta.url),
    ),
    fullPage: true,
  });
  await nav.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(
    page.getByRole("img", { name: /Spending by category/ }),
  ).toBeVisible();
  await nav.getByRole("button", { name: "Transactions", exact: true }).click();
  await expect(
    page.getByText("UI test groceries", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete UI test groceries", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  assert(
    records.some((record) => record.kind === "expense"),
    "Cancel deleted a record.",
  );
  await page
    .getByRole("button", { name: "Delete UI test groceries", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete record", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toBeHidden();
  await expect(
    page.getByText("UI test groceries", { exact: true }),
  ).toBeHidden();
  await nav.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByLabel("Display currency", { exact: true }).click();
  await page.getByRole("option", { name: "USD", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Display currency", { exact: true })).toHaveText(
    "USD",
  );
  await mkdir(new URL("../.local/", import.meta.url), { recursive: true });
  await page.screenshot({
    animations: "disabled",
    path: fileURLToPath(new URL("../.local/ui-desktop.png", import.meta.url)),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "The mobile page overflows horizontally.",
  );
  await nav.getByRole("button", { name: "Expenses", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Expenses", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add record", exact: true }).click();
  await expect(dialog).toBeVisible();
  assert(
    await dialog.evaluate(
      (element) => element.getBoundingClientRect().width <= innerWidth,
    ),
    "The mobile dialog overflows.",
  );
  await page.screenshot({
    animations: "disabled",
    path: fileURLToPath(new URL("../.local/ui-mobile.png", import.meta.url)),
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await nav.getByRole("button", { name: /^Debts/ }).click();
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Debt accounts overflow on mobile.",
  );
  await page.screenshot({
    animations: "disabled",
    path: fileURLToPath(
      new URL("../.local/ui-debts-mobile.png", import.meta.url),
    ),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Add BOC Gold", exact: true }).click();
  await dialog
    .getByLabel("Annual interest rate (% p.a.)", { exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    dialog.getByLabel("Annual interest rate (% p.a.)", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your money. Your space." }),
  ).toBeVisible();
  assert.deepEqual(errors, [], "Browser errors were detected.");
  console.log(
    "PASS: real login/logout, all navigation, five record forms, payment selection, deletion/cancel, keyboard dialog handling, currency persistence, and mobile layout. Financial API rows were mocked; no finance data changed.",
  );
} catch (error) {
  console.error("UI location:", page.url());
  console.error(
    "Form alerts:",
    await page
      .getByRole("alert")
      .allTextContents()
      .catch(() => []),
  );
  console.error(String(error.message).split(password).join("[redacted]"));
  process.exitCode = 1;
} finally {
  await browser.close();
}
