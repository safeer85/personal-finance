# Pocket personal finance tracker

Local single-user tracker built with Next.js, React, a backend API, Prisma and PostgreSQL. Requires Node.js 20.9+.

## Run

```powershell
cd frontend/finance-frontend
npm install
docker compose up -d db
npm run db:setup
npm run dev
```

Open http://127.0.0.1:3000. Production: npm run build, then npm start -- --hostname 127.0.0.1.

Track income, expenses, savings contributions, debts and linked debt payments. Filter by month and see spending by category. The app starts empty.

Monthly debt capacity = recorded income minus expenses, savings and payments, with a floor of zero and capped at outstanding debt. Only entries through today count. Expected income, interest and unrecorded bills are excluded. Savings entries are independent contributions with optional individual goals.

Currency defaults to LKR. Changing currency changes formatting only, without conversion. Use one currency consistently.

## Storage and API

Data persists in the pocket_postgres Docker volume. Back up PostgreSQL with pg_dump. Configure DATABASE_URL in .env (and .env.local if present); see .env.example. Docker Desktop must be running. The compose credentials are for local development only. To use hosted PostgreSQL, set its connection URL instead and skip Docker.

GET /api/records lists records. POST /api/records creates a record with kind (income, expense, saving, debt, payment), name, category, amount and date (YYYY-MM-DD), plus optional minimum and target amounts. Payment category is the debt ID. API amounts use currency units; storage uses integer minor units. DELETE /api/records?id=... removes a record. Deleting a debt also deletes its linked payments.

This app is for a trusted local computer and has no authentication. The development server binds to loopback. Add authentication and user isolation before network deployment.

Checks: npm run typecheck and npm run build.

