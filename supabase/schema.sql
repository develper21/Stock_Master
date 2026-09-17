-- StockMaster Supabase schema with Custom Auth
-- Run with: psql < schema.sql or Supabase SQL editor (chunks)

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
-- Install pg_trgm in extensions schema to avoid security warning
create schema if not exists extensions;
create extension if not exists "pg_trgm" schema extensions;

-- =========================
-- ENUMERATIONS
-- =========================
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('inventory_manager', 'warehouse_staff');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'doc_status') then
    create type public.doc_status as enum ('draft', 'waiting', 'ready', 'done', 'cancelled');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'operation_type') then
    create type public.operation_type as enum ('receipt', 'delivery', 'transfer', 'adjustment');
  end if;
end $$;

-- =========================
-- TABLES WITH CONSTRAINTS
-- =========================
create table if not exists public.warehouses (
  id uuid primary key default uuid_generate_v4(),
  name text not null check (length(name) >= 2),
  code text not null unique check (length(code) >= 2),
  address text,
  phone text,
  email text,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  login_id text not null unique check (length(login_id) >= 3),
  full_name text not null check (length(full_name) >= 2),
  email text not null unique check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone text check (phone ~* '^[+]?[0-9\s\-\(\)]+$' or phone is null),
  password_hash text not null check (length(password_hash) >= 60),
  email_verified boolean default false,
  role user_role not null default 'warehouse_staff',
  default_warehouse_id uuid references public.warehouses (id) on delete set null,
  is_active boolean default true,
  last_login timestamptz,
  login_attempts integer default 0 check (login_attempts >= 0),
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.password_reset_tokens (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  token text not null unique check (length(token) = 64),
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.email_verification_tokens (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  token text not null unique check (length(token) = 64),
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default uuid_generate_v4(),
  warehouse_id uuid not null references public.warehouses (id) on delete cascade,
  name text not null check (length(name) >= 2),
  code text not null,
  type text check (type in ('storage', 'picking', 'packing', 'shipping')),
  capacity numeric(18,4) check (capacity >= 0),
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (warehouse_id, code)
);

create table if not exists public.product_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique check (length(name) >= 2),
  description text,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null check (length(name) >= 2),
  sku text not null unique check (length(sku) >= 2),
  description text,
  category_id uuid references public.product_categories (id) on delete set null,
  unit text not null check (length(unit) >= 1),
  reorder_level integer default 0 check (reorder_level >= 0),
  max_stock numeric(18,4) check (max_stock >= 0),
  cost_price numeric(18,4) check (cost_price >= 0),
  selling_price numeric(18,4) check (selling_price >= 0),
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_levels (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products (id) on delete cascade,
  warehouse_id uuid not null references public.warehouses (id) on delete cascade,
  location_id uuid references public.locations (id) on delete set null,
  quantity numeric(18,4) not null default 0 check (quantity >= 0),
  reserved_quantity numeric(18,4) not null default 0 check (reserved_quantity >= 0),
  available_quantity numeric(18,4) generated always as (quantity - reserved_quantity) stored,
  last_count_date timestamptz,
  updated_at timestamptz not null default now(),
  unique (product_id, warehouse_id, location_id)
);

create table if not exists public.stock_ledger (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products (id) on delete cascade,
  warehouse_id uuid not null references public.warehouses (id) on delete cascade,
  location_id uuid references public.locations (id) on delete set null,
  operation_type operation_type not null,
  quantity numeric(18,4) not null check (quantity != 0),
  reference_id uuid,
  reference_type text check (reference_type in ('receipt', 'delivery', 'transfer', 'adjustment')),
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default uuid_generate_v4(),
  reference_no text not null unique check (length(reference_no) >= 3),
  supplier_name text check (length(supplier_name) >= 2),
  supplier_email text check (supplier_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' or supplier_email is null),
  status doc_status not null default 'draft',
  warehouse_id uuid not null references public.warehouses (id),
  created_by uuid not null references public.profiles (id),
  received_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  notes text,
  responsible_id uuid references public.profiles (id),
  scheduled_for timestamptz,
  total_amount numeric(18,4) default 0 check (total_amount >= 0)
);

create table if not exists public.receipt_items (
  id uuid primary key default uuid_generate_v4(),
  receipt_id uuid not null references public.receipts (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity numeric(18,4) not null check (quantity > 0),
  unit_price numeric(18,4) check (unit_price >= 0),
  total numeric(18,4) generated always as (quantity * unit_price) stored,
  location_id uuid references public.locations (id),
  batch_number text,
  expiry_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.deliveries (
  id uuid primary key default uuid_generate_v4(),
  reference_no text not null unique check (length(reference_no) >= 3),
  customer_name text check (length(customer_name) >= 2),
  customer_email text check (customer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' or customer_email is null),
  customer_phone text check (customer_phone ~* '^[+]?[0-9\s\-\(\)]+$' or customer_phone is null),
  status doc_status not null default 'draft',
  warehouse_id uuid not null references public.warehouses (id),
  created_by uuid not null references public.profiles (id),
  delivered_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  notes text,
  scheduled_for timestamptz,
  delivered_at timestamptz,
  total_amount numeric(18,4) default 0 check (total_amount >= 0)
);

create table if not exists public.delivery_items (
  id uuid primary key default uuid_generate_v4(),
  delivery_id uuid not null references public.deliveries (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity numeric(18,4) not null check (quantity > 0),
  unit_price numeric(18,4) check (unit_price >= 0),
  total numeric(18,4) generated always as (quantity * unit_price) stored,
  picked boolean default false,
  packed boolean default false,
  location_id uuid references public.locations (id),
  batch_number text,
  created_at timestamptz not null default now()
);

create table if not exists public.internal_transfers (
  id uuid primary key default uuid_generate_v4(),
  reference_no text not null unique check (length(reference_no) >= 3),
  from_warehouse_id uuid not null references public.warehouses (id),
  to_warehouse_id uuid not null references public.warehouses (id),
  from_location_id uuid references public.locations (id),
  to_location_id uuid references public.locations (id),
  status doc_status not null default 'draft',
  created_by uuid not null references public.profiles (id),
  approved_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  notes text,
  scheduled_for timestamptz,
  completed_at timestamptz
);

create table if not exists public.transfer_items (
  id uuid primary key default uuid_generate_v4(),
  transfer_id uuid not null references public.internal_transfers (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity numeric(18,4) not null check (quantity > 0),
  from_location_id uuid references public.locations (id),
  to_location_id uuid references public.locations (id),
  batch_number text,
  created_at timestamptz not null default now()
);

create table if not exists public.adjustments (
  id uuid primary key default uuid_generate_v4(),
  reference_no text not null unique check (length(reference_no) >= 3),
  adjustment_type text not null check (adjustment_type in ('increase', 'decrease')),
  reason text not null check (length(reason) >= 5),
  warehouse_id uuid not null references public.warehouses (id),
  created_by uuid not null references public.profiles (id),
  approved_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  notes text
);

create table if not exists public.adjustment_items (
  id uuid primary key default uuid_generate_v4(),
  adjustment_id uuid not null references public.adjustments (id) on delete cascade,
  product_id uuid not null references public.products (id),
  location_id uuid references public.locations (id),
  quantity numeric(18,4) not null check (quantity != 0),
  unit_cost numeric(18,4) check (unit_cost >= 0),
  total_cost numeric(18,4) generated always as (abs(quantity) * unit_cost) stored,
  batch_number text,
  expiry_date date,
  created_at timestamptz not null default now()
);

-- =========================
-- INDEXES FOR PERFORMANCE
-- =========================
CREATE INDEX IF NOT EXISTS idx_profiles_login_id ON public.profiles(login_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON public.profiles(email_verified);

CREATE INDEX IF NOT EXISTS idx_stock_levels_product_warehouse ON public.stock_levels(product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_warehouse ON public.stock_levels(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_product ON public.stock_levels(product_id);

CREATE INDEX IF NOT EXISTS idx_stock_ledger_product ON public.stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_warehouse ON public.stock_ledger(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_created_at ON public.stock_ledger(created_at);

CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_receipts_status ON public.receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_warehouse ON public.receipts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON public.receipts(created_at);

CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_warehouse ON public.deliveries(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON public.deliveries(created_at);

create unique index if not exists uq_stock_levels_product_location
  on public.stock_levels (product_id, warehouse_id, coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index if not exists idx_stock_levels_product_location on public.stock_levels (product_id, warehouse_id);
create index if not exists idx_stock_ledger_product_time on public.stock_ledger (product_id, created_at desc);
create index if not exists idx_receipts_status_warehouse on public.receipts (status, warehouse_id);
create index if not exists idx_deliveries_status_warehouse on public.deliveries (status, warehouse_id);
create index if not exists idx_transfers_status on public.internal_transfers (status);

-- =========================
-- TRIGGERS FOR UPDATED_AT
-- =========================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_warehouses_updated_at ON public.warehouses;
CREATE TRIGGER handle_warehouses_updated_at
    BEFORE UPDATE ON public.warehouses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_locations_updated_at ON public.locations;
CREATE TRIGGER handle_locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_product_categories_updated_at ON public.product_categories;
CREATE TRIGGER handle_product_categories_updated_at
    BEFORE UPDATE ON public.product_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_products_updated_at ON public.products;
CREATE TRIGGER handle_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_stock_levels_updated_at ON public.stock_levels;
CREATE TRIGGER handle_stock_levels_updated_at
    BEFORE UPDATE ON public.stock_levels
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =========================
-- RLS POLICIES (BASIC)
-- =========================
-- Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustment_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Stock levels policies (read-only for authenticated users)
DROP POLICY IF EXISTS "Authenticated users can view stock levels" ON public.stock_levels;
CREATE POLICY "Authenticated users can view stock levels" ON public.stock_levels
    FOR SELECT USING (auth.role() = 'authenticated');

-- Stock ledger policies (read-only for authenticated users)
DROP POLICY IF EXISTS "Authenticated users can view stock ledger" ON public.stock_ledger;
CREATE POLICY "Authenticated users can view stock ledger" ON public.stock_ledger
    FOR SELECT USING (auth.role() = 'authenticated');

-- Password reset tokens - only service role can access
DROP POLICY IF EXISTS "Service role only for password reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Service role only for password reset tokens" ON public.password_reset_tokens
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Email verification tokens - only service role can access
DROP POLICY IF EXISTS "Service role only for email verification tokens" ON public.email_verification_tokens;
CREATE POLICY "Service role only for email verification tokens" ON public.email_verification_tokens
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Adjustment items policies
DROP POLICY IF EXISTS "Authenticated users can view adjustment items" ON public.adjustment_items;
CREATE POLICY "Authenticated users can view adjustment items" ON public.adjustment_items
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Inventory managers can manage adjustment items" ON public.adjustment_items;
CREATE POLICY "Inventory managers can manage adjustment items" ON public.adjustment_items
    FOR ALL USING (public.require_role('inventory_manager'));

-- =========================
-- HELPER FUNCTIONS
-- =========================
create or replace function public.current_user_role()
returns user_role
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable;

create or replace function public.require_role(required user_role)
returns boolean
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = required
  );
$$ language sql stable;

-- =========================
-- ROW LEVEL SECURITY POLICIES
-- =========================
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

alter table public.warehouses enable row level security;
drop policy if exists "warehouses_all_authenticated" on public.warehouses;
create policy "warehouses_all_authenticated" on public.warehouses
  for select using (auth.role() = 'authenticated');
drop policy if exists "warehouses_insert_inventory_manager" on public.warehouses;
create policy "warehouses_insert_inventory_manager" on public.warehouses
  for insert with check (public.require_role('inventory_manager'));
drop policy if exists "warehouses_update_inventory_manager" on public.warehouses;
create policy "warehouses_update_inventory_manager" on public.warehouses
  for update using (public.require_role('inventory_manager')) with check (public.require_role('inventory_manager'));
drop policy if exists "warehouses_delete_inventory_manager" on public.warehouses;
create policy "warehouses_delete_inventory_manager" on public.warehouses
  for delete using (public.require_role('inventory_manager'));

alter table public.locations enable row level security;
drop policy if exists "locations_read_all" on public.locations;
create policy "locations_read_all" on public.locations for select using (auth.role() = 'authenticated');
drop policy if exists "locations_insert_inventory_manager" on public.locations;
create policy "locations_insert_inventory_manager" on public.locations
  for insert with check (public.require_role('inventory_manager'));
drop policy if exists "locations_update_inventory_manager" on public.locations;
create policy "locations_update_inventory_manager" on public.locations
  for update using (public.require_role('inventory_manager')) with check (public.require_role('inventory_manager'));
drop policy if exists "locations_delete_inventory_manager" on public.locations;
create policy "locations_delete_inventory_manager" on public.locations
  for delete using (public.require_role('inventory_manager'));

alter table public.product_categories enable row level security;
drop policy if exists "product_categories_read" on public.product_categories;
create policy "product_categories_read" on public.product_categories for select using (auth.role() = 'authenticated');
drop policy if exists "product_categories_insert" on public.product_categories;
create policy "product_categories_insert" on public.product_categories
  for insert with check (public.require_role('inventory_manager'));
drop policy if exists "product_categories_update" on public.product_categories;
create policy "product_categories_update" on public.product_categories
  for update using (public.require_role('inventory_manager')) with check (public.require_role('inventory_manager'));
drop policy if exists "product_categories_delete" on public.product_categories;
create policy "product_categories_delete" on public.product_categories
  for delete using (public.require_role('inventory_manager'));

alter table public.products enable row level security;
drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products for select using (auth.role() = 'authenticated');
drop policy if exists "products_insert" on public.products;
create policy "products_insert" on public.products
  for insert with check (public.require_role('inventory_manager'));
drop policy if exists "products_update" on public.products;
create policy "products_update" on public.products
  for update using (public.require_role('inventory_manager')) with check (public.require_role('inventory_manager'));
drop policy if exists "products_delete" on public.products;
create policy "products_delete" on public.products
  for delete using (public.require_role('inventory_manager'));

alter table public.stock_levels enable row level security;
drop policy if exists "stock_levels_read" on public.stock_levels;
create policy "stock_levels_read" on public.stock_levels for select using (auth.role() = 'authenticated');
drop policy if exists "stock_levels_write_via_rpc" on public.stock_levels;
create policy "stock_levels_write_via_rpc" on public.stock_levels for update using (false);

alter table public.receipts enable row level security;
drop policy if exists "receipts_visible" on public.receipts;
create policy "receipts_visible" on public.receipts for select using (auth.role() = 'authenticated');
drop policy if exists "receipts_insert" on public.receipts;
create policy "receipts_insert" on public.receipts
  for insert with check (public.require_role('inventory_manager'));
drop policy if exists "receipts_update" on public.receipts;
create policy "receipts_update" on public.receipts
  for update using (public.require_role('inventory_manager')) with check (public.require_role('inventory_manager'));
drop policy if exists "receipts_delete" on public.receipts;
create policy "receipts_delete" on public.receipts
  for delete using (public.require_role('inventory_manager'));

alter table public.receipt_items enable row level security;
drop policy if exists "receipt_items_read" on public.receipt_items;
create policy "receipt_items_read" on public.receipt_items for select using (auth.role() = 'authenticated');
drop policy if exists "receipt_items_insert" on public.receipt_items;
create policy "receipt_items_insert" on public.receipt_items
  for insert with check (public.require_role('inventory_manager'));
drop policy if exists "receipt_items_update" on public.receipt_items;
create policy "receipt_items_update" on public.receipt_items
  for update using (public.require_role('inventory_manager')) with check (public.require_role('inventory_manager'));
drop policy if exists "receipt_items_delete" on public.receipt_items;
create policy "receipt_items_delete" on public.receipt_items
  for delete using (public.require_role('inventory_manager'));

alter table public.deliveries enable row level security;
drop policy if exists "deliveries_visible" on public.deliveries;
create policy "deliveries_visible" on public.deliveries for select using (auth.role() = 'authenticated');
drop policy if exists "deliveries_insert" on public.deliveries;
create policy "deliveries_insert" on public.deliveries
  for insert with check (public.require_role('inventory_manager'));
drop policy if exists "deliveries_update" on public.deliveries;
create policy "deliveries_update" on public.deliveries
  for update using (public.require_role('inventory_manager')) with check (public.require_role('inventory_manager'));
drop policy if exists "deliveries_delete" on public.deliveries;
create policy "deliveries_delete" on public.deliveries
  for delete using (public.require_role('inventory_manager'));

alter table public.delivery_items enable row level security;
drop policy if exists "delivery_items_read" on public.delivery_items;
create policy "delivery_items_read" on public.delivery_items for select using (auth.role() = 'authenticated');
drop policy if exists "delivery_items_insert" on public.delivery_items;
create policy "delivery_items_insert" on public.delivery_items
  for insert with check (public.require_role('inventory_manager'));
drop policy if exists "delivery_items_update" on public.delivery_items;
create policy "delivery_items_update" on public.delivery_items
  for update using (public.require_role('inventory_manager')) with check (public.require_role('inventory_manager'));
drop policy if exists "delivery_items_delete" on public.delivery_items;
create policy "delivery_items_delete" on public.delivery_items
  for delete using (public.require_role('inventory_manager'));

alter table public.internal_transfers enable row level security;
drop policy if exists "transfers_read" on public.internal_transfers;
create policy "transfers_read" on public.internal_transfers for select using (auth.role() = 'authenticated');
drop policy if exists "transfers_insert" on public.internal_transfers;
create policy "transfers_insert" on public.internal_transfers
  for insert with check (public.require_role('inventory_manager'));
drop policy if exists "transfers_update" on public.internal_transfers;
create policy "transfers_update" on public.internal_transfers
  for update using (public.require_role('inventory_manager')) with check (public.require_role('inventory_manager'));
drop policy if exists "transfers_delete" on public.internal_transfers;
create policy "transfers_delete" on public.internal_transfers
  for delete using (public.require_role('inventory_manager'));

alter table public.transfer_items enable row level security;
drop policy if exists "transfer_items_read" on public.transfer_items;
create policy "transfer_items_read" on public.transfer_items for select using (auth.role() = 'authenticated');
drop policy if exists "transfer_items_insert" on public.transfer_items;
create policy "transfer_items_insert" on public.transfer_items
  for insert with check (public.require_role('inventory_manager'));
drop policy if exists "transfer_items_update" on public.transfer_items;
create policy "transfer_items_update" on public.transfer_items
  for update using (public.require_role('inventory_manager')) with check (public.require_role('inventory_manager'));
drop policy if exists "transfer_items_delete" on public.transfer_items;
create policy "transfer_items_delete" on public.transfer_items
  for delete using (public.require_role('inventory_manager'));

alter table public.adjustments enable row level security;
drop policy if exists "adjustments_read" on public.adjustments;
create policy "adjustments_read" on public.adjustments for select using (auth.role() = 'authenticated');
drop policy if exists "adjustments_insert" on public.adjustments;
create policy "adjustments_insert" on public.adjustments
  for insert with check (public.require_role('inventory_manager'));
drop policy if exists "adjustments_update" on public.adjustments;
create policy "adjustments_update" on public.adjustments
  for update using (public.require_role('inventory_manager')) with check (public.require_role('inventory_manager'));
drop policy if exists "adjustments_delete" on public.adjustments;
create policy "adjustments_delete" on public.adjustments
  for delete using (public.require_role('inventory_manager'));

alter table public.stock_ledger enable row level security;
drop policy if exists "stock_ledger_read" on public.stock_ledger;
create policy "stock_ledger_read" on public.stock_ledger for select using (auth.role() = 'authenticated');
drop policy if exists "stock_ledger_insert_via_rpc" on public.stock_ledger;
create policy "stock_ledger_insert_via_rpc" on public.stock_ledger for insert with check (false);

-- =========================
-- TRANSACTIONAL RPC FUNCTIONS
-- =========================
create or replace function public.ensure_stock_record(_product uuid, _warehouse uuid, _location uuid)
returns uuid as $$
  declare
    record_id uuid;
  begin
    select id into record_id
    from public.stock_levels
    where product_id = _product and warehouse_id = _warehouse and coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(_location, '00000000-0000-0000-0000-000000000000'::uuid)
    for update;

    if record_id is null then
      insert into public.stock_levels (product_id, warehouse_id, location_id, quantity)
      values (_product, _warehouse, _location, 0)
      returning id into record_id;
    end if;

    return record_id;
  end;
$$ language plpgsql security definer set search_path=public;

create or replace function public.create_ledger_entry(
  _product uuid,
  _warehouse uuid,
  _location uuid,
  _operation operation_type,
  _operation_id uuid,
  _qty_change numeric,
  _performed_by uuid
) returns void as $$
  declare
    balance numeric;
  begin
    select quantity into balance
    from public.stock_levels
    where product_id = _product and warehouse_id = _warehouse and coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(_location, '00000000-0000-0000-0000-000000000000'::uuid);

    insert into public.stock_ledger (
      product_id, warehouse_id, location_id, operation_type,
      operation_id, quantity_change, balance_after, performed_by
    ) values (
      _product, _warehouse, _location, _operation,
      _operation_id, _qty_change, balance, _performed_by
    );
  end;
$$ language plpgsql security definer set search_path=public;

create or replace function public.validate_receipt(receipt_id uuid)
returns void as $$
declare
  rec public.receipts%rowtype;
  item record;
  uid uuid := auth.uid();
begin
  select * into rec from public.receipts where id = receipt_id for update;
  if rec.status = 'done' then
    raise exception 'Receipt already validated';
  end if;
  if not public.require_role('inventory_manager') then
    raise exception 'Forbidden';
  end if;

  for item in select * from public.receipt_items where receipt_id = rec.id loop
    perform public.ensure_stock_record(item.product_id, rec.warehouse_id, item.location_id);
    update public.stock_levels
      set quantity = quantity + item.quantity
      where product_id = item.product_id and warehouse_id = rec.warehouse_id and coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(item.location_id, '00000000-0000-0000-0000-000000000000'::uuid);
    perform public.create_ledger_entry(item.product_id, rec.warehouse_id, item.location_id, 'receipt', rec.id, item.quantity, uid);
  end loop;

  update public.receipts set status = 'done', validated_at = now() where id = rec.id;
end;
$$ language plpgsql security definer set search_path=public;

create or replace function public.validate_delivery(delivery_id uuid)
returns void as $$
declare
  del public.deliveries%rowtype;
  item record;
  uid uuid := auth.uid();
  available numeric;
begin
  select * into del from public.deliveries where id = delivery_id for update;
  if del.status = 'done' then
    raise exception 'Delivery already validated';
  end if;
  if not public.require_role('inventory_manager') then
    raise exception 'Forbidden';
  end if;

  for item in select * from public.delivery_items where delivery_id = del.id loop
    select quantity into available from public.stock_levels
      where product_id = item.product_id and warehouse_id = del.warehouse_id and coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(item.location_id, '00000000-0000-0000-0000-000000000000'::uuid)
      for update;
    if available is null or available < item.quantity then
      raise exception 'Insufficient stock for product %', item.product_id;
    end if;
    update public.stock_levels
      set quantity = quantity - item.quantity
      where product_id = item.product_id and warehouse_id = del.warehouse_id and coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(item.location_id, '00000000-0000-0000-0000-000000000000'::uuid);
    perform public.create_ledger_entry(item.product_id, del.warehouse_id, item.location_id, 'delivery', del.id, -item.quantity, uid);
  end loop;

  update public.deliveries set status = 'done', validated_at = now() where id = del.id;
end;
$$ language plpgsql security definer set search_path=public;

create or replace function public.validate_transfer(transfer_id uuid)
returns void as $$
declare
  trx public.internal_transfers%rowtype;
  item record;
  uid uuid := auth.uid();
  available numeric;
begin
  select * into trx from public.internal_transfers where id = transfer_id for update;
  if trx.status = 'done' then
    raise exception 'Transfer already validated';
  end if;
  if not public.require_role('inventory_manager') then
    raise exception 'Forbidden';
  end if;

  for item in select * from public.transfer_items where transfer_id = trx.id loop
    select quantity into available from public.stock_levels
      where product_id = item.product_id and warehouse_id = trx.from_warehouse_id and coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(trx.from_location_id, '00000000-0000-0000-0000-000000000000'::uuid)
      for update;
    if available is null or available < item.quantity then
      raise exception 'Insufficient stock for transfer product %', item.product_id;
    end if;

    update public.stock_levels
      set quantity = quantity - item.quantity
      where product_id = item.product_id and warehouse_id = trx.from_warehouse_id and coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(trx.from_location_id, '00000000-0000-0000-0000-000000000000'::uuid);
    perform public.create_ledger_entry(item.product_id, trx.from_warehouse_id, trx.from_location_id, 'transfer', trx.id, -item.quantity, uid);

    perform public.ensure_stock_record(item.product_id, trx.to_warehouse_id, trx.to_location_id);
    update public.stock_levels
      set quantity = quantity + item.quantity
      where product_id = item.product_id and warehouse_id = trx.to_warehouse_id and coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(trx.to_location_id, '00000000-0000-0000-0000-000000000000'::uuid);
    perform public.create_ledger_entry(item.product_id, trx.to_warehouse_id, trx.to_location_id, 'transfer', trx.id, item.quantity, uid);
  end loop;

  update public.internal_transfers set status = 'done', validated_at = now() where id = trx.id;
end;
$$ language plpgsql security definer set search_path=public;

create or replace function public.commit_adjustment(adjustment_id uuid)
returns void as $$
declare
  adj public.adjustments%rowtype;
  delta numeric;
  uid uuid := auth.uid();
begin
  select * into adj from public.adjustments where id = adjustment_id;
  if not public.require_role('inventory_manager') then
    raise exception 'Forbidden';
  end if;
  delta := adj.difference;
  perform public.ensure_stock_record(adj.product_id, adj.warehouse_id, adj.location_id);
  update public.stock_levels set quantity = adj.counted_quantity where id = (
    select id from public.stock_levels
    where product_id = adj.product_id and warehouse_id = adj.warehouse_id and coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(adj.location_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
  perform public.create_ledger_entry(adj.product_id, adj.warehouse_id, adj.location_id, 'adjustment', adj.id, delta, uid);
end;
$$ language plpgsql security definer set search_path=public;

-- =========================
-- PASSWORD RULE CHECK (optional server enforcement)
-- =========================
create or replace function public.validate_password_strength(_password text)
returns boolean
stable
security definer
set search_path = public
as $$
  select _password ~ '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?\&#^_-])[A-Za-z\\d@$!%*?\&#^_-]{8,}$';
$$ language sql stable;
