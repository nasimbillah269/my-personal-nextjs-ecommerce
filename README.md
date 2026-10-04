# Ultimate Organic Life — Next.js e‑commerce

Storefront + admin panel built with Next.js 16 (App Router), Tailwind CSS v4, Drizzle ORM and MySQL/MariaDB.

## Setup

1. **Start MySQL** (XAMPP: start the *MySQL* module) and create a database:
   ```sql
   CREATE DATABASE uol_ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. **Configure env** — copy `.env.example` to `.env.local` and set:
   - `DATABASE_URL` — e.g. `mysql://root:@localhost:3306/uol_ecommerce` (XAMPP's root has no password)
   - `SESSION_SECRET` — any random string of 32+ characters
3. **Install, migrate, seed:**
   ```bash
   npm install
   npm run db:migrate          # creates the tables
   npm run db:seed             # catalog, coupons, settings, admin user, demo orders
   ```
   The seed prints the admin email and password once. Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` before seeding to choose your own.
4. `npm run dev` → store at http://localhost:3000, admin at http://localhost:3000/admin

## Scripts

| Command | What it does |
|---|---|
| `npm run db:generate` | Create a new SQL migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed -- --reset` | Wipe catalog + orders and reseed (admins are kept). Add `--no-demo` to skip demo orders |
| `npm run db:studio` | Browse the database in Drizzle Studio |
| `npm run db:images` | Add the bundled product photos to products that have none (`-- --force` to replace) |

## Where things live

- `src/app/(shop)` — storefront pages (home, products, product detail, cart, checkout)
- `src/app/admin` — admin panel (login + dashboard, orders, products, categories, coupons, customers, settings)
- `src/db/schema.ts` — database tables
- `src/server/queries.ts`, `src/server/shop-actions.ts` — storefront data + order placement
- `src/server/admin/*` — admin queries and server actions (every one calls `requireAdmin()`)
- `uploads/` — product images uploaded from the admin (served at `/media/...`; back this folder up)
- `scripts/seed-images/` — starter product photos from Openverse/Flickr (CC0 / CC BY / CC BY-SA). Credits are in `credits.json` and shown under each product photo, as the licenses require. Replace them with your own product photos when you have them.

## Notes

- Prices, stock and coupons are always re-checked on the server when an order is placed; stock is reduced in the same transaction.
- Cancelling an order in the admin returns its items to stock.
- bKash/Nagad: set your merchant number in **Admin → Settings**. Card payment is not connected to a gateway yet.
