-- StockMaster Supabase schema, RLS policies, and transactional RPCs
-- Run with: psql < schema.sql or Supabase SQL editor (chunks)

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

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
-- TABLES
-- =========================
create table if not exists public.warehouses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text not null unique,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  login_id text not null unique,
  full_name text not null,
  email text not null unique,
  phone text,
  role user_role not null default 'warehouse_staff',
  default_warehouse_id uuid references public.warehouses (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default uuid_generate_v4(),
  warehouse_id uuid not null references public.warehouses (id) on delete cascade,
  name text not null,
  code text not null,
  type text,
  created_at timestamptz not null default now(),
  unique (warehouse_id, code)
);

create table if not exists public.product_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sku text not null unique,
  category_id uuid references public.product_categories (id) on delete set null,
  unit text not null,
  reorder_level integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.stock_levels (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products (id) on delete cascade,
  warehouse_id uuid not null references public.warehouses (id) on delete cascade,
  location_id uuid references public.locations (id) on delete set null,
  quantity numeric(18,4) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default uuid_generate_v4(),
  reference_no text not null unique,
  supplier_name text,
  status doc_status not null default 'draft',
  warehouse_id uuid not null references public.warehouses (id),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  notes text,
  responsible_id uuid references public.profiles (id),
  scheduled_for timestamptz
);

create table if not exists public.receipt_items (
  id uuid primary key default uuid_generate_v4(),
  receipt_id uuid not null references public.receipts (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity numeric(18,4) not null,
  unit_price numeric(18,4),
  total numeric(18,4),
  location_id uuid references public.locations (id)
);

create table if not exists public.deliveries (
  id uuid primary key default uuid_generate_v4(),
  reference_no text not null unique,
  customer text,
  status doc_status not null default 'draft',
  warehouse_id uuid not null references public.warehouses (id),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  notes text
);

create table if not exists public.delivery_items (
  id uuid primary key default uuid_generate_v4(),
  delivery_id uuid not null references public.deliveries (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity numeric(18,4) not null,
  picked boolean default false,
  packed boolean default false,
  location_id uuid references public.locations (id)
);

create table if not exists public.internal_transfers (
  id uuid primary key default uuid_generate_v4(),
  reference_no text not null unique,
  from_warehouse_id uuid not null references public.warehouses (id),
  to_warehouse_id uuid not null references public.warehouses (id),
  from_location_id uuid references public.locations (id),
  to_location_id uuid references public.locations (id),
  status doc_status not null default 'draft',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  notes text
);

create table if not exists public.transfer_items (
  id uuid primary key default uuid_generate_v4(),
  transfer_id uuid not null references public.internal_transfers (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity numeric(18,4) not null
);

create table if not exists public.adjustments (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products (id),
  warehouse_id uuid not null references public.warehouses (id),
  location_id uuid references public.locations (id),
  counted_quantity numeric(18,4) not null,
  system_quantity numeric(18,4) not null,
  difference numeric(18,4) not null,
  reason text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.stock_ledger (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products (id),
  warehouse_id uuid not null references public.warehouses (id),
  location_id uuid references public.locations (id),
  operation_type operation_type not null,
  operation_id uuid not null,
  quantity_change numeric(18,4) not null,
  balance_after numeric(18,4) not null,
  performed_by uuid not null references public.profiles (id),
  occurred_at timestamptz not null default now()
);

create unique index if not exists uq_stock_levels_product_location
  on public.stock_levels (product_id, warehouse_id, coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index if not exists idx_stock_levels_product_location on public.stock_levels (product_id, warehouse_id);
create index if not exists idx_stock_ledger_product_time on public.stock_ledger (product_id, occurred_at desc);
create index if not exists idx_receipts_status on public.receipts (status, warehouse_id);
create index if not exists idx_deliveries_status on public.deliveries (status, warehouse_id);
create index if not exists idx_transfers_status on public.internal_transfers (status);

-- =========================
-- TRIGGERS FOR UPDATED_AT
-- =========================
create or replace function public.set_current_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_product_updated_at on public.products;
create trigger set_product_updated_at before update on public.products
  for each row execute procedure public.set_current_timestamp();

drop trigger if exists set_stock_levels_updated_at on public.stock_levels;
create trigger set_stock_levels_updated_at before update on public.stock_levels
  for each row execute procedure public.set_current_timestamp();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_current_timestamp();

-- =========================
-- HELPER FUNCTIONS
-- =========================
create or replace function public.current_user_role()
returns user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable;

create or replace function public.require_role(required user_role)
returns boolean as $$
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
returns boolean as $$
  select _password ~ '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^_-])[A-Za-z\d@$!%*?&#^_-]{8,}$';
$$ language sql stable;
