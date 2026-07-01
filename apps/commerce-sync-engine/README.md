# commerce-sync-engine

Next.js + SQLite/Drizzle commerce sync workflow app.

## Stack

- Next.js
- TypeScript
- shadcn/ui-style local components
- lucide-react
- SQLite
- Drizzle ORM

## Functional behavior

- Dry-run diff classifies source rows as create, update, skip, or fail.
- Dry-run results are persisted as sync runs and run items.
- Execution applies ready rows to a local SQLite target table.
- One create row fails deterministically to show partial failure handling.
- Retry applies only failed rows.
- Idempotency keys prevent duplicate destination writes.
- Operation logs and final source/target state are visible in the UI.

No external commerce API, auth, payment, queue, Redis, Docker, or external service is used.

## Local commands

```powershell
cd apps/commerce-sync-engine
npm install
npm run db:reset
npm run dev -- -p 4102
```

Open:

```txt
http://127.0.0.1:4102
```

Validate:

```powershell
cd apps/commerce-sync-engine
npm run db:reset
npm run typecheck
npm test
npm run build
```
