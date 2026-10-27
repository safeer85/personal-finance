# Pocket personal finance tracker

Private single-owner tracker built with Next.js, React, Auth.js, a backend API, Prisma and PostgreSQL. Requires Node.js 20.9+. Hosting instructions: [DEPLOYMENT.md](DEPLOYMENT.md).

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

## Storage and API

Configure DATABASE_URL and DIRECT_URL for your installed PostgreSQL in .env (and .env.local if present); see .env.example. Docker is optional. For Docker, run docker compose up -d db and use port 55432 with the credentials in compose.yaml. Back up PostgreSQL with pg_dump. Neon hosting uses pooled runtime and direct migration URLs.

GET /api/records lists records. POST /api/records creates a record with kind (income, expense, saving, debt, payment), name, category, amount and date (YYYY-MM-DD), plus optional minimum and target amounts. Payment category is the debt ID. API amounts use currency units; storage uses integer minor units. DELETE /api/records?id=... removes a record. Deleting a debt also deletes its linked payments.

The dashboard and every records API method require owner login. Passwords are bcrypt-hashed, sessions last 12 hours, and login attempts are limited in PostgreSQL. Writes require the same origin. This is a single-owner app, not a multi-user service. A generated initial login, when used, is saved in ignored .local/owner-login.txt; change it with npm run auth:setup.

Checks: npm run typecheck and npm run build.

