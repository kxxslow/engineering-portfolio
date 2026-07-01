# Commands

Run commands from the repository root unless a section changes into an app directory.

## Prerequisites

- Node.js and npm available on `PATH`.
- PHP and Composer available on `PATH` for Booking Ops.
- SQLite support through the app dependencies.

## Booking Ops

Laravel + Inertia + React booking operations app.

```powershell
cd apps/booking-ops
composer install
npm install
php artisan migrate:fresh --seed
composer test
npm run build
php artisan serve --host=127.0.0.1 --port=4101
```

Open:

```txt
http://127.0.0.1:4101
```

Smoke routes:

```txt
/
/schedule
/staff
/settings
/customers
/customers/new
/customers/cust-mira
/bookings/bk-1001
```

## Commerce Sync Engine

Next.js + SQLite/Drizzle sync workflow app.

```powershell
cd apps/commerce-sync-engine
npm install
npm run db:reset
npm run typecheck
npm test
npm run build
npm run dev -- -p 4102
```

Open:

```txt
http://127.0.0.1:4102
```

Smoke routes:

```txt
/
/diff
/records
/log
/runs/sync-run-2026-07-15-exec
/runs/sync-run-2026-07-15-exec-retry
```

## Support RAG Console

Next.js + SQLite/Drizzle evidence review app.

```powershell
cd apps/support-rag-console
npm install
npm run db:reset
npm run typecheck
npm test
npm run build
npm run dev -- -p 4103
```

Open:

```txt
http://127.0.0.1:4103
```

Smoke routes:

```txt
/
/assistant
/review
/library
/evaluations
/settings
/tickets/ticket-return-iris
/tickets/ticket-account-nora
/answers/draft-ticket-return-iris
/answers/draft-ticket-discount-omar
/answers/draft-ticket-account-nora
```

## Hygiene

Do not commit generated dependencies, runtime databases, build output, logs, or local environment files:

- `node_modules`
- `vendor`
- `.next`
- `public/build`
- `.env`
- runtime SQLite files
- logs
- coverage output
