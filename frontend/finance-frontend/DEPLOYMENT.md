# Deploy Pocket to Vercel and Neon

## Updating the existing website from GitHub

The existing project is `pocket-personal-finance` in `safeer85s-projects`, with production URL https://pocket-personal-finance.vercel.app. It is connected to `safeer85/personal-finance`, with production branch `main` and root directory `frontend/finance-frontend`.

Pushes to `main` automatically deploy the existing website. The tracked Git configuration disables other branches so preview builds do not use the production finance database. Production environment variables are already stored in Vercel; do not add credentials to GitHub or commit local env files. A separate manual Vercel deployment is no longer needed for routine updates.

From the repository root, update with:

```powershell
git status
git add frontend/finance-frontend
git diff --cached --stat
git commit -m "Describe your changes"
git push origin main
```

Review the staged files before committing. Env files, generated login credentials, and local Vercel metadata are ignored. Watch the deployment under the existing Vercel project's Deployments tab. Database migrations run during the production build; avoid destructive migrations against live records.

The instructions below describe the initial setup and database configuration.

This is a private, single-owner application. Every dashboard and records API request requires authentication. There is no public registration. The owner password is bcrypt-hashed; sessions expire after 12 hours. Login attempts are limited to 10 per 15-minute window across the owner account. Changing the username or password hash invalidates existing sessions.

## 1. Set your owner login

Run `npm run auth:setup` from this directory. Choose a username and a password of at least 12 characters. The script prompts without showing your password and writes the hash and a generated session secret to ignored `.env.local`. Restart your local server afterward. Never commit `.env` or `.env.local`.

## 2. Create Neon PostgreSQL

Create a Free project and choose a region close to your Vercel deployment. In Neon's connection dialog, copy both connection strings:

- `DATABASE_URL`: the pooled connection, with `-pooler` in the hostname; use `sslmode=require` and append `&connection_limit=1` for serverless runtime queries.
- `DIRECT_URL`: the direct connection without `-pooler`; use `sslmode=require`. Prisma migrations use this URL.

No local finance data needs transferring when the database is empty. Keep the hosted URL in Vercel; your local database can remain separate.

## 3. Import into Vercel

Import the repository, select the Hobby plan for personal use, and set **Root Directory** to `frontend/finance-frontend`. Framework: Next.js. The tracked `vercel.json` sets the build command. Use Node.js 22.x in Vercel project settings.

Add these environment variables for **Production**:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon pooled PostgreSQL URL |
| `DIRECT_URL` | Neon direct PostgreSQL URL |
| `OWNER_USERNAME` | Username from owner setup |
| `OWNER_PASSWORD_HASH` | Bcrypt hash from owner setup |
| `AUTH_SECRET` | Generated session secret from owner setup |
| `AUTH_TRUST_HOST` | `true` |

In the Vercel dashboard, enter raw values: no surrounding quotes, and no backslashes before the dollar signs in the password hash. The local setup script escapes dollar signs only because Next.js expands variables in dotenv files.

Do not copy old Google OAuth, credentials-password, or localhost URL settings into Vercel. Auth.js derives the website origin automatically. Use separate databases for previews; the build deliberately rejects Preview deployments until isolation is configured. Select a production deployment for the initial release.

## 4. Deploy and verify

The production build validates required settings, generates Prisma Client, runs checked-in PostgreSQL migrations, then builds Next.js. Migrations create tables on a fresh Neon database. No destructive resets or sample records are run.

Verify on the deployment URL:

1. Opening `/` while signed out redirects to `/login`.
2. Opening `/api/records` while signed out returns HTTP 401.
3. Correct owner credentials allow sign-in. Wrong credentials fail.
4. Add income and an expense, reload, and confirm persistence.
5. Sign out and confirm the data is inaccessible.

## Existing local database

`npm run db:setup` remains available for local development. Do not run production migrations against a database previously initialized by `db push` without baselining it. For the original local schema, first verify that its Record table matches the initial migration, then mark `20261026000100_initial` applied with `prisma migrate resolve`. The fresh Neon database does not need this step.

## Backups and credentials

Use PostgreSQL `pg_dump` for backups. Keep local credentials and production credentials separate. To change your owner password, run `npm run auth:setup`, update the three owner/session variables in Vercel, and redeploy. Keep the same production `AUTH_SECRET` between ordinary deployments. This app has one shared ledger for its one configured owner; it is not a multi-user service.
