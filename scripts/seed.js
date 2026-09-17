#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");
require("dotenv").config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ids = {
  warehouses: {
    central: "11111111-1111-1111-1111-111111111111",
    city: "22222222-2222-2222-2222-222222222222",
  },
  categories: {
    electronics: "33333333-3333-3333-3333-333333333333",
    consumables: "44444444-4444-4444-4444-444444444444",
  },
  products: {
    scanner: "55555555-5555-5555-5555-555555555555",
    gloves: "66666666-6666-6666-6666-666666666666",
  },
};

async function seedWarehouses() {
  const warehouses = [
    {
      id: ids.warehouses.central,
      name: "Central Distribution",
      code: "CD-01",
      address: "Plot 21, Industrial Hub, Pune",
    },
    {
      id: ids.warehouses.city,
      name: "City Fulfillment",
      code: "CF-02",
      address: "85 Market Road, Mumbai",
    },
  ];

  const { error } = await supabase.from("warehouses").upsert(warehouses);
  if (error) throw error;
}

async function seedLocations() {
  const locations = [
    {
      id: "77777777-7777-7777-7777-777777777777",
      name: "Rack A1",
      code: "RA1",
      type: "rack",
      warehouse_id: ids.warehouses.central,
    },
    {
      id: "88888888-8888-8888-8888-888888888888",
      name: "Zone B",
      code: "ZB",
      type: "zone",
      warehouse_id: ids.warehouses.city,
    },
  ];

  const { error } = await supabase.from("locations").upsert(locations);
  if (error) throw error;
}

async function seedCategories() {
  const categories = [
    { id: ids.categories.electronics, name: "Electronics", description: "Devices, scanners, IoT" },
    { id: ids.categories.consumables, name: "Consumables", description: "Packaging, gloves, etc." },
  ];

  const { error } = await supabase.from("product_categories").upsert(categories);
  if (error) throw error;
}

async function seedProducts() {
  const products = [
    {
      id: ids.products.scanner,
      name: "RFID Scanner",
      sku: "RF-SCN-001",
      category_id: ids.categories.electronics,
      unit: "pcs",
      reorder_level: 5,
    },
    {
      id: ids.products.gloves,
      name: "Nitrile Gloves Pack",
      sku: "GLV-PCK-010",
      category_id: ids.categories.consumables,
      unit: "box",
      reorder_level: 20,
    },
  ];

  const { error } = await supabase.from("products").upsert(products);
  if (error) throw error;
}

async function seedStockLevels() {
  const stockLevels = [
    {
      product_id: ids.products.scanner,
      warehouse_id: ids.warehouses.central,
      location_id: "77777777-7777-7777-7777-777777777777",
      quantity: 12,
    },
    {
      product_id: ids.products.gloves,
      warehouse_id: ids.warehouses.city,
      location_id: "88888888-8888-8888-8888-888888888888",
      quantity: 75,
    },
  ];

  const { error } = await supabase.from("stock_levels").upsert(stockLevels);
  if (error) throw error;
}

async function seedUsers() {
  await ensureUser({
    email: "manager@stockmaster.dev",
    password: "StrongPass#1",
    login_id: "manager.central",
    role: "inventory_manager",
    full_name: "Central Manager",
    default_warehouse_id: ids.warehouses.central,
  });

  await ensureUser({
    email: "staff@stockmaster.dev",
    password: "StrongPass#1",
    login_id: "staff.city",
    role: "warehouse_staff",
    full_name: "City Staff",
    default_warehouse_id: ids.warehouses.city,
  });
}

async function ensureUser({ email, password, login_id, role, full_name, default_warehouse_id }) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("login_id", login_id)
    .maybeSingle();

  if (existing) {
    console.log(`User ${login_id} already exists, skipping.`);
    return;
  }

  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, login_id, role },
  });

  if (error) throw error;

  const userId = created.user.id ?? randomUUID();

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    login_id,
    full_name,
    email,
    role,
    default_warehouse_id,
  });

  if (profileError) throw profileError;

  console.log(`Created user ${login_id}`);
}

async function main() {
  try {
    await seedWarehouses();
    await seedLocations();
    await seedCategories();
    await seedProducts();
    await seedStockLevels();
    await seedUsers();
    console.log("Seed completed ✅");
  } catch (error) {
    console.error("Seed failed", error);
    process.exit(1);
  }
}

main();
