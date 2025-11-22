# StockMaster – Modular Inventory Management System

StockMaster digitizes multi-warehouse operations with Next.js 14 and Supabase (Postgres + Auth + Realtime). It bundles products, receipts, deliveries, transfers, adjustments, ledger, settings, and profile management into a realtime workspace for inventory managers and warehouse staff.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS
- **Backend**: Supabase (Postgres, Auth, RPCs, Realtime)
- **Auth**: Supabase email/password + OTP flows, login IDs distinct from email
- **Testing**: Vitest

## Project Structure

```
app/                     # Next.js routes (auth + workspace)
components/              # Shared UI components
lib/                     # Helpers (auth, Supabase clients, realtime observers)
supabase/schema.sql      # Database schema, enums, RPCs, RLS policies
scripts/seed.js          # Seed script (Supabase service-role powered)
tests/                   # Vitest suites (API mocks + utility tests)
```

## Environment Variables

```bash
# Add these to `.env.local` for Next.js and `.env` for seeds/tests.
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=service-role-key
```

## Setup & Development

```bash
# Install dependencies
npm install

# Apply the Supabase schema (SQL editor or CLI)
# supabase db reset --file supabase/schema.sql

# Seed demo data (warehouses, locations, products, users)
npm run seed

# Start development server
npm run dev
```

Visit `http://localhost:3000` to access the auth screens and workspace.

### Testing

```bash
# Run tests
npm run test
```

Vitest is configured via `vitest.config.js` with support for `@` path aliases. Tests cover ledger utilities, end-to-end flow simulations, and mocked receipts API handlers; extend as needed.

## Domains & Features

- **Auth**: Login via login ID, signup with OTP verification, forgot/reset password flow.
- **Dashboard**: KPI tiles (Total Products, Low Stock, Pending Receipts/Deliveries) with realtime refresh.
- **Products**: CRUD, categories, stock by warehouse/location.
- **Receipts**: Draft → validate, line-item editor, transactional RPC increments stock + ledger.
- **Deliveries**: Draft → pick/pack → validate, per-item toggles, RPC decrements stock.
- **Transfers**: Draft/edit/validate internal moves (RPC-managed stock adjustments).
- **Adjustments**: Count vs recorded, commits stock + ledger with detail view.
- **Ledger**: Filterable audit trail for every movement.
- **Settings**: Warehouses + locations with role-gated CRUD.
- **Profile**: Update personal info and default warehouse.

## Realtime

- `StockRealtimeObserver` subscribes to `stock_levels` and `stock_ledger` via Supabase Realtime and triggers `router.refresh()`, keeping dashboard KPIs, product tables, and stock views live.

## RBAC & RLS

- RLS policies in `supabase/schema.sql` restrict write access to `inventory_manager` for sensitive tables.
- UI mirrors policies by hiding validation buttons or CRUD actions for `warehouse_staff` users.

## Seed Script

- `npm run seed` executes `scripts/seed.js`, creating demo warehouses, locations, categories, products, stock levels, and two users (inventory_manager + warehouse_staff). Requires `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL`.

## Deployment Notes

1. Configure environment variables in your hosting provider (Vercel, etc.). Never expose the service-role key client-side.
2. Run `supabase/schema.sql` against the database when provisioning new environments.
3. Configure Supabase Auth email templates for OTP/verification flows.
4. Use `npm run seed` only for local/staging data; production should rely on curated imports.
5. Supabase Realtime must be enabled (default for hosted projects) for live updates to work.

## Roadmap / Extensions

- Expand Vitest coverage to additional API routes.
- Enhance realtime UX with toasts or optimistic UI updates.
- Add reporting/export capabilities or integrate barcode/RFID scanners.

---
For customization or enterprise features, extend Supabase RPCs and Next.js routes using the provided structure.