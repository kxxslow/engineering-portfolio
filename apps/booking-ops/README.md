# booking-ops

Laravel + Inertia React reservation operations workspace.

## Stack

- Laravel
- SQLite
- Inertia React + TypeScript
- Tailwind CSS
- shadcn/ui-style local components
- lucide-react icons

## Behavior covered

- Booking attempts are submitted from the UI and persisted.
- Staff overlap and resource overlap are blocked.
- Accepted attempts create bookings.
- Blocked attempts preserve the block reason and blocking booking.
- Cancelled bookings release capacity.
- Payment status is local metadata only; no payment workflow or external payment service is called.

## Local commands

Install dependencies once:

```powershell
cd apps/booking-ops
composer install
npm install
```

Run the app with two PowerShell terminals during development.

Ensure PHP and Composer are available on your PATH. Vite also needs PHP because the Laravel Wayfinder plugin runs `php artisan wayfinder:generate --with-form`.

Set up the local environment:

```powershell
cd apps/booking-ops
Copy-Item .env.example .env
php artisan key:generate
New-Item -ItemType File -Force database/database.sqlite | Out-Null
php artisan migrate:fresh --seed
```

Terminal 1 - Laravel app server:

```powershell
cd apps/booking-ops
php -v
php artisan serve --host=127.0.0.1 --port=4101
```

Terminal 2 - Vite dev server:

```powershell
cd apps/booking-ops
php -v
npm run dev -- --host 127.0.0.1 --port 5101
```

Open:

```txt
http://127.0.0.1:4101
```

Validate:

```powershell
cd apps/booking-ops
Copy-Item .env.example .env
php artisan key:generate
New-Item -ItemType File -Force database/database.sqlite | Out-Null
php artisan migrate:fresh --seed
composer test
npm run build
```
