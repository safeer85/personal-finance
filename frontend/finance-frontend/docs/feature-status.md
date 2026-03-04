# Personal Finance Feature Status

This project now includes a core backend MVP for:

- Accounts
- Categories
- Transactions (income/expense/transfer)
- Splits validation
- Audit log

Data is persisted in:

- `.data/finance-db.json`

## Implemented in this pass

### Accounts

- Create account with required `type` and `currency`, plus `openingBalance`
- Edit account details
- Archive account (`PATCH /api/accounts/:id` with `archived: true`)
- Live balance view support from transaction ledger
- Credit card modeled as liability naturally through balance math (expense decreases balance, payment transfer can reduce liability)
- People debt account type supported with `personName` and `debtDirection`

### Categories

- Default categories auto-seeded
- Create custom categories (unique name validation)
- Edit/archive categories

### Transactions

- Add expense/income
- Add transfer with currency conversion support (`fromAmount`, `toAmount`, `exchangeRate`)
- Split support for income/expense (`splits[]`)
- Validation: `sum(splits) == amount`
- Edit transaction with full re-validation
- Soft delete transaction with audit entry
- List transactions with pagination/filtering:
  - `limit`, `offset`
  - `accountId`, `categoryId`
  - `tag`, `merchant`
  - `dateFrom`, `dateTo`

### Audit

- Audit logging for create/update/archive/delete on:
  - accounts
  - categories
  - transactions
- Paginated audit listing

### Data integrity

- Rule enforcement for invalid transactions
- Split accuracy validation
- Balance consistency maintained by deriving balances from opening balances + non-deleted ledger transactions

## API Endpoints

- `GET /api/accounts`
- `POST /api/accounts`
- `PATCH /api/accounts/:id`
- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/:id`
- `GET /api/transactions`
- `POST /api/transactions`
- `PATCH /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET /api/audit`

All endpoints require an authenticated session.

## Not yet implemented (next phases)

- Budget alerts engine (80%/100% notifications)
- Export (CSV/Excel/PDF)
- Bank CSV import + mapping + duplicate detection + preview
- Recurring transaction scheduler
- Savings goals
- Bills due reminders
- Backup/restore workflows
- Restore-from-audit functionality
- 100k+ scale optimizations via indexed database (current store is file-based JSON MVP)

