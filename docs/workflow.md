# StockMaster Workflow Guide

This document explains how a user moves through StockMaster, from authentication to day-to-day stock operations and administrative settings. Use it as a high-level SOP for onboarding inventory managers and warehouse staff.

## 1. Authentication & Access

1. **Signup (inventory manager)**
   - Navigate to `/auth/signup`.
   - Enter login ID, email, full name, phone (optional), password, role.
   - Supabase sends an OTP email; user verifies to activate the account.

2. **Login (all roles)**
   - Go to `/auth/login` and use the *login ID* (not email) + password.
   - Upon success, the user is redirected to `/dashboard`.

3. **Forgot / Reset Password**
   - `/auth/forgot-password`: enter email to receive OTP.
   - `/auth/reset-password`: submit OTP + new password (validated against complexity rules).

## 2. Dashboard Overview

1. After login, users arrive at `/dashboard`.
2. KPIs show total products, low stock items, pending receipts, pending deliveries.
3. Filters and realtime refresh ensure the cards always represent the latest state (courtesy of Supabase Realtime + `StockRealtimeObserver`).
4. KPIs link to respective modules (e.g., “Pending Receipts” → `/receipts`).

## 3. Products & Categories

1. **View Products**: `/products` – list of products with SKU, unit, category, reorder level.
2. **Create**: `/products/create` – form to add a new SKU with category and thresholds.
3. **Edit**: `/products/[id]/edit` – update existing product data.
4. **Stock by Location**: `/products/[id]/stock` – see balances per warehouse/location.

## 4. Receipts (Inbound Stock)

1. **List**: `/receipts` – shows status, supplier, warehouse.
2. **Create Draft**: `/receipts/create` – fill header info and manage line items via the line-items editor.
3. **Submit / Validate**:
   - Draft → “Submit for Validation” transitions to waiting/ready state.
   - Inventory managers can open `/receipts/[id]` and click “Validate Receipt”.
   - Validation triggers the `validate_receipt` RPC, updating `stock_levels` + `stock_ledger`.

## 5. Deliveries (Outbound Stock)

1. **List**: `/deliveries` – shows reference, customer, status.
2. **Create Draft**: `/deliveries/create` – includes stock checks before submission.
3. **Pick / Pack / Validate**:
   - On `/deliveries/[id]`, warehouse staff/manager can toggle “picked” / “packed” per line item.
   - Once all items are ready, the inventory manager validates (RPC `validate_delivery`), decrementing stock and logging the movement.

## 6. Internal Transfers

1. **List**: `/transfers` – overview of source/destination warehouses, status.
2. **Create/Edit**: `/transfers/create` or `/transfers/[id]/edit` – transfer form ensures stock availability in the source warehouse.
3. **Validate**: `/transfers/[id]` – managers click “Validate Transfer” to execute `validate_transfer` RPC, moving stock between locations without changing overall totals.

## 7. Inventory Adjustments

1. **List**: `/adjustments` – shows product, warehouse, difference, reason.
2. **Create**: `/adjustments/create` – specify product, warehouse/location, counted quantity vs system quantity.
3. **Detail**: `/adjustments/[id]` – displays comparison cards and ledger impact. Validation occurs immediately via `commit_adjustment` RPC.

## 8. Ledger

1. `/ledger` – global audit trail with filters (product, warehouse, operation type, date).
2. Reflects every validated receipt, delivery, transfer, and adjustment with quantity deltas and balances.

## 9. Settings

1. **Warehouses** (`/settings/warehouses`, `/settings/create-warehouse`):
   - Only inventory managers can add or edit warehouses.
2. **Locations** (`/settings/locations`, `/settings/create-location`, `/settings/locations/[id]/edit`):
   - List, create, edit, and delete locations. Actions are gated so warehouse staff can only view.
3. All settings actions are backed by RLS policies requiring `inventory_manager` role.

## 10. Profile

1. `/profile/me` – users can view login ID, role, and update full name, phone, default warehouse.
2. Profile updates call `/api/profile`, respecting RLS (users can only edit their own profile).

## 11. Realtime Workflow

1. Supabase Realtime monitors `stock_levels` and `stock_ledger`.
2. `StockRealtimeObserver` (mounted in the workspace layout) refreshes all relevant pages after stock mutations (receipts/deliveries/transfers/adjustments).
3. Users see updated KPIs and tables without manual refresh.

## 12. Testing & Seeding Flow

1. `npm run seed` – seeds demo data (warehouses, locations, categories, products, stock, demo users).
2. `npm run test` – runs Vitest suites:
   - `tests/utils/ledger.js` – validates aggregation + flow simulations.
   - `tests/api/receipts.route.test.js` – mocks Supabase for GET/POST receipts.
   - `tests/api/integration.flow.test.js` – simulates receive → transfer → deliver → adjust.

## 13. Deployment Checklist

1. Ensure env vars are set on the hosting platform.
2. Run `supabase/schema.sql` on the production database.
3. Configure Supabase Auth email templates and OTP flows.
4. Enable Supabase Realtime (default in hosted Supabase).
5. Deploy Next.js app (e.g., Vercel). The service-role key must only exist on the server side.

---
Use this workflow document when training new users or preparing SOPs. Extend sections as new modules or automations are added.
