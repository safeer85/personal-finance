# Pocket personal finance tracker

Private single-owner tracker built with Next.js, React, Tailwind CSS v4, shadcn/ui, Auth.js, a backend API, Prisma and PostgreSQL. Requires Node.js 20.9+. Hosting instructions: [DEPLOYMENT.md](DEPLOYMENT.md).

## Interface

Tailwind utilities control the responsive layout. `app/globals.css` contains the shared green theme tokens and base styles. The shadcn/ui component source is in `components/ui`; add more components with `npx shadcn@latest add <name>`. The dashboard uses these buttons, cards, inputs, labels, badges, selects, tables, progress bars, record dialogs, and delete confirmation dialogs. Finance-specific form and table components are in `components/finance`.

`npm run test:ui` runs Chrome interaction and mobile-layout checks against a local production server on port 3010 (`npm start -- --hostname 127.0.0.1 --port 3010`). It uses the generated local owner login, mocks financial API responses, and saves QA screenshots in ignored `.local`. Chrome must be installed; set `PLAYWRIGHT_CHANNEL=msedge` to use Edge instead. Financial records are not written by this UI test.

## Run

```powershell
cd frontend/finance-frontend
npm install
npm run db:setup
npm run auth:setup
npm run dev
```

Open http://127.0.0.1:3000. Production: npm run build, then npm start -- --hostname 127.0.0.1.

Track income, expenses, savings contributions, debts and linked debt payments. Filter by month and see spending by category. The app starts empty.

Monthly debt capacity = recorded income minus expenses, savings and payments, with a floor of zero and capped at outstanding debt. Only entries through today count. Expected income, interest and unrecorded bills are excluded. Savings entries are independent contributions with optional individual goals.

Currency defaults to LKR. Changing currency changes formatting only, without conversion. Use one currency consistently.

## Debt accounts

Debts can be HNB Gold or BOC Gold credit cards, or interest-free personal debts. Cards have editable annual interest rates, credit limits, statement minimums and due dates. No bank rate is preset: enter the rate from your statement. BOC can be opened with a zero balance. Existing debts remain unclassified until you choose their type using Details; classification preserves balances and payment history.

The interest display estimates 30 days of simple interest on the current recorded balance using `balance × annual rate × 30 / 365`. It assumes the balance is carried without new transactions and excludes bank-specific grace periods, billing rules and fees. Estimates are never posted automatically to recorded balances or cash flow. Interest-free personal debts always use 0%.

Use Add charge / interest for actual new card purchases, fees or interest shown by the bank; record repayments as Debt payment. Charges increase the card balance; payments reduce it. Card charges are not cash expenses and do not reduce monthly cash capacity a second time; the actual repayment does. Track cash expenses separately. Changing formatting currency does not convert amounts.

`PATCH /api/records` updates debt classification and terms only; opening amounts, dates and linked payments are preserved. `card_charge` entries must reference a credit card in category. Deleting a debt also deletes its linked payments and charges.

Debt checks: `npx playwright test tests/debts.spec.ts --workers=1`. The scripts `debt-test-database.mjs`, `start-debt-test-server.mjs` and `test-debt-api.mjs` support migration and API testing in a temporary isolated schema. Stop that server and run `node scripts/debt-test-database.mjs --cleanup` afterward. The browser UI fixture test also covers legacy debt classification and both Gold cards.

## Storage and API details

Configure DATABASE_URL and DIRECT_URL for your installed PostgreSQL in .env (and .env.local if present); see .env.example. Docker is optional. For Docker, run docker compose up -d db and use port 55432 with the credentials in compose.yaml. Back up PostgreSQL with pg_dump. Neon hosting uses pooled runtime and direct migration URLs.

GET /api/records lists records. POST /api/records creates a record with kind (income, expense, saving, debt, payment, card_charge), name, category, amount and date (YYYY-MM-DD), plus optional terms. Payment and card-charge categories are the debt ID. API amounts use currency units; storage uses integer minor units and basis points for annual rates. DELETE /api/records?id=... removes a record. Deleting a debt also deletes its linked payments and charges.

The dashboard and every records API method require owner login. Passwords are bcrypt-hashed, sessions last 12 hours, and login attempts are limited in PostgreSQL. Writes require the same origin. This is a single-owner app, not a multi-user service. A generated initial login, when used, is saved in ignored .local/owner-login.txt; change it with npm run auth:setup.

Checks: npm run typecheck and npm run build.

