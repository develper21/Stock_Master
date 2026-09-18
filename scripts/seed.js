#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

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
    north: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    south: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  },
  categories: {
    electronics: "33333333-3333-3333-3333-333333333333",
    consumables: "44444444-4444-4444-4444-444444444444",
    tools: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    safety: "dddddddd-dddd-dddd-dddd-dddddddddddd",
  },
  products: {
    scanner: "55555555-5555-5555-5555-555555555555",
    gloves: "66666666-6666-6666-6666-666666666666",
    drill: "77777777-7777-7777-7777-777777777777",
    helmet: "88888888-8888-8888-8888-888888888888",
    laptop: "99999999-9999-9999-9999-999999999999",
    mouse: "aaaaaaaa-aaaa-aaaa-aaaa-aaaabbbbbbbb",
    screwdriver: "bbbbbbbb-bbbb-bbbb-bbbb-cccccccccccc",
    mask: "cccccccc-cccc-cccc-cccc-dddddddddddd",
  },
  users: {
    manager1: "dddddddd-dddd-dddd-dddd-ddddddddddda",
    manager2: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeeb",
    staff1: "ffffffff-ffff-ffff-ffff-fffffffffffc",
    staff2: "11111111-1111-1111-1111-222222222222",
    staff3: "33333333-3333-3333-3333-444444444444",
  },
};

async function seedWarehouses() {
  const warehouses = [
    {
      id: ids.warehouses.central,
      name: "Central Distribution",
      code: "CD-01",
      address: "Plot 21, Industrial Hub, Pune",
      phone: "+91-20-12345678",
      email: "central@stockmaster.dev",
    },
    {
      id: ids.warehouses.city,
      name: "City Fulfillment",
      code: "CF-02",
      address: "85 Market Road, Mumbai",
      phone: "+91-22-23456789",
      email: "city@stockmaster.dev",
    },
    {
      id: ids.warehouses.north,
      name: "North Regional Hub",
      code: "NRH-03",
      address: "Sector 18, Industrial Area, Delhi",
      phone: "+91-11-34567890",
      email: "north@stockmaster.dev",
    },
    {
      id: ids.warehouses.south,
      name: "South Distribution Center",
      code: "SDC-04",
      address: "Tech Park, Chennai",
      phone: "+91-44-45678901",
      email: "south@stockmaster.dev",
    },
  ];

  const { error } = await supabase.from("warehouses").upsert(warehouses);
  if (error) throw error;
  console.log("Warehouses seeded ✅");
}

async function seedLocations() {
  const locations = [
    // Central Warehouse Locations
    {
      id: "55555555-5555-5555-5555-555555555556",
      name: "Storage Rack A1",
      code: "SRA1",
      type: "storage",
      warehouse_id: ids.warehouses.central,
      capacity: 1000,
    },
    {
      id: "66666666-6666-6666-6666-666666666667",
      name: "Picking Zone B",
      code: "PZB",
      type: "picking",
      warehouse_id: ids.warehouses.central,
      capacity: 500,
    },
    {
      id: "77777777-7777-7777-7777-777777777778",
      name: "Packing Station C",
      code: "PSC",
      type: "packing",
      warehouse_id: ids.warehouses.central,
      capacity: 200,
    },
    // City Warehouse Locations
    {
      id: "88888888-8888-8888-8888-888888888889",
      name: "Storage Zone D",
      code: "SZD",
      type: "storage",
      warehouse_id: ids.warehouses.city,
      capacity: 800,
    },
    {
      id: "99999999-9999-9999-9999-999999999990",
      name: "Shipping Dock E",
      code: "SDE",
      type: "shipping",
      warehouse_id: ids.warehouses.city,
      capacity: 300,
    },
    // North Warehouse Locations
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaabbbbbbbb",
      name: "Main Storage F",
      code: "MSF",
      type: "storage",
      warehouse_id: ids.warehouses.north,
      capacity: 1200,
    },
    {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-cccccccccccc",
      name: "Picking Area G",
      code: "PAG",
      type: "picking",
      warehouse_id: ids.warehouses.north,
      capacity: 400,
    },
    // South Warehouse Locations
    {
      id: "cccccccc-cccc-cccc-cccc-dddddddddddd",
      name: "Storage H1",
      code: "SH1",
      type: "storage",
      warehouse_id: ids.warehouses.south,
      capacity: 900,
    },
    {
      id: "eeeeeeee-eeee-eeee-eeee-fffffffffffe",
      name: "Packing Area I",
      code: "PAI",
      type: "packing",
      warehouse_id: ids.warehouses.south,
      capacity: 250,
    },
  ];

  const { error } = await supabase.from("locations").upsert(locations);
  if (error) throw error;
  console.log("Locations seeded ✅");
}

async function seedCategories() {
  const categories = [
    { id: ids.categories.electronics, name: "Electronics", description: "Devices, scanners, IoT equipment" },
    { id: ids.categories.consumables, name: "Consumables", description: "Packaging materials, gloves, tapes" },
    { id: ids.categories.tools, name: "Tools & Equipment", description: "Power tools, hand tools, equipment" },
    { id: ids.categories.safety, name: "Safety Equipment", description: "Helmets, masks, safety gear" },
  ];

  const { error } = await supabase.from("product_categories").upsert(categories);
  if (error) throw error;
  console.log("Categories seeded ✅");
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
      max_stock: 50,
      cost_price: 2500,
      selling_price: 3500,
      description: "High-frequency RFID scanner for inventory tracking",
    },
    {
      id: ids.products.gloves,
      name: "Nitrile Gloves Pack",
      sku: "GLV-PCK-010",
      category_id: ids.categories.consumables,
      unit: "box",
      reorder_level: 20,
      max_stock: 200,
      cost_price: 150,
      selling_price: 250,
      description: "Pack of 100 nitrile gloves, size L",
    },
    {
      id: ids.products.drill,
      name: "Cordless Power Drill",
      sku: "PWR-DRL-020",
      category_id: ids.categories.tools,
      unit: "pcs",
      reorder_level: 10,
      max_stock: 40,
      cost_price: 1800,
      selling_price: 2500,
      description: "18V cordless drill with battery pack",
    },
    {
      id: ids.products.helmet,
      name: "Safety Helmet",
      sku: "SFT-HLM-030",
      category_id: ids.categories.safety,
      unit: "pcs",
      reorder_level: 15,
      max_stock: 100,
      cost_price: 350,
      selling_price: 500,
      description: "Industrial safety helmet with ventilation",
    },
    {
      id: ids.products.laptop,
      name: "Business Laptop",
      sku: "ELC-LPT-040",
      category_id: ids.categories.electronics,
      unit: "pcs",
      reorder_level: 3,
      max_stock: 20,
      cost_price: 45000,
      selling_price: 55000,
      description: "15-inch business laptop with 16GB RAM",
    },
    {
      id: ids.products.mouse,
      name: "Wireless Mouse",
      sku: "ELC-MSE-050",
      category_id: ids.categories.electronics,
      unit: "pcs",
      reorder_level: 25,
      max_stock: 150,
      cost_price: 350,
      selling_price: 500,
      description: "Ergonomic wireless mouse with USB receiver",
    },
    {
      id: ids.products.screwdriver,
      name: "Precision Screwdriver Set",
      sku: "TOL-SDV-060",
      category_id: ids.categories.tools,
      unit: "set",
      reorder_level: 10,
      max_stock: 50,
      cost_price: 450,
      selling_price: 650,
      description: "32-piece precision screwdriver set",
    },
    {
      id: ids.products.mask,
      name: "N95 Face Mask",
      sku: "SFT-MSK-070",
      category_id: ids.categories.safety,
      unit: "box",
      reorder_level: 30,
      max_stock: 300,
      cost_price: 200,
      selling_price: 350,
      description: "Box of 50 N95 respirator masks",
    },
  ];

  const { error } = await supabase.from("products").upsert(products);
  if (error) throw error;
  console.log("Products seeded ✅");
}

async function seedStockLevels() {
  const stockLevels = [
    // Central Warehouse Stock
    {
      product_id: ids.products.scanner,
      warehouse_id: ids.warehouses.central,
      location_id: "55555555-5555-5555-5555-555555555556",
      quantity: 25,
      reserved_quantity: 5,
    },
    {
      product_id: ids.products.drill,
      warehouse_id: ids.warehouses.central,
      location_id: "55555555-5555-5555-5555-555555555556",
      quantity: 15,
      reserved_quantity: 2,
    },
    {
      product_id: ids.products.laptop,
      warehouse_id: ids.warehouses.central,
      location_id: "55555555-5555-5555-5555-555555555556",
      quantity: 8,
      reserved_quantity: 0,
    },
    {
      product_id: ids.products.mouse,
      warehouse_id: ids.warehouses.central,
      location_id: "66666666-6666-6666-6666-666666666667",
      quantity: 40,
      reserved_quantity: 5,
    },
    {
      product_id: ids.products.screwdriver,
      warehouse_id: ids.warehouses.central,
      location_id: "66666666-6666-6666-6666-666666666667",
      quantity: 25,
      reserved_quantity: 3,
    },
    // City Warehouse Stock
    {
      product_id: ids.products.gloves,
      warehouse_id: ids.warehouses.city,
      location_id: "88888888-8888-8888-8888-888888888889",
      quantity: 120,
      reserved_quantity: 20,
    },
    {
      product_id: ids.products.mouse,
      warehouse_id: ids.warehouses.city,
      location_id: "88888888-8888-8888-8888-888888888889",
      quantity: 85,
      reserved_quantity: 15,
    },
    {
      product_id: ids.products.mask,
      warehouse_id: ids.warehouses.city,
      location_id: "88888888-8888-8888-8888-888888888889",
      quantity: 200,
      reserved_quantity: 30,
    },
    {
      product_id: ids.products.helmet,
      warehouse_id: ids.warehouses.city,
      location_id: "99999999-9999-9999-9999-999999999990",
      quantity: 60,
      reserved_quantity: 10,
    },
    // North Warehouse Stock
    {
      product_id: ids.products.helmet,
      warehouse_id: ids.warehouses.north,
      location_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaabbbbbbbb",
      quantity: 45,
      reserved_quantity: 10,
    },
    {
      product_id: ids.products.screwdriver,
      warehouse_id: ids.warehouses.north,
      location_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaabbbbbbbb",
      quantity: 30,
      reserved_quantity: 5,
    },
    {
      product_id: ids.products.drill,
      warehouse_id: ids.warehouses.north,
      location_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaabbbbbbbb",
      quantity: 12,
      reserved_quantity: 3,
    },
    {
      product_id: ids.products.gloves,
      warehouse_id: ids.warehouses.north,
      location_id: "bbbbbbbb-bbbb-bbbb-bbbb-cccccccccccc",
      quantity: 75,
      reserved_quantity: 8,
    },
    // South Warehouse Stock
    {
      product_id: ids.products.scanner,
      warehouse_id: ids.warehouses.south,
      location_id: "cccccccc-cccc-cccc-cccc-dddddddddddd",
      quantity: 18,
      reserved_quantity: 4,
    },
    {
      product_id: ids.products.gloves,
      warehouse_id: ids.warehouses.south,
      location_id: "cccccccc-cccc-cccc-cccc-dddddddddddd",
      quantity: 90,
      reserved_quantity: 15,
    },
    {
      product_id: ids.products.helmet,
      warehouse_id: ids.warehouses.south,
      location_id: "cccccccc-cccc-cccc-cccc-dddddddddddd",
      quantity: 35,
      reserved_quantity: 8,
    },
    {
      product_id: ids.products.mask,
      warehouse_id: ids.warehouses.south,
      location_id: "eeeeeeee-eeee-eeee-eeee-fffffffffffe",
      quantity: 150,
      reserved_quantity: 20,
    },
  ];

  const { error } = await supabase.from("stock_levels").upsert(stockLevels);
  if (error) throw error;
  console.log("Stock levels seeded ✅");
}

async function seedUsers() {
  await ensureUser({
    id: ids.users.manager1,
    email: "sachaniyanarvin21@gmail.com",
    password: "StrongPass#1",
    login_id: "manager.central",
    role: "inventory_manager",
    full_name: "Rajesh Kumar",
    default_warehouse_id: ids.warehouses.central,
  });

  await ensureUser({
    id: ids.users.manager2,
    email: "sachaniyanarvin21+manager.city@gmail.com",
    password: "StrongPass#1",
    login_id: "manager.city",
    role: "inventory_manager",
    full_name: "Priya Sharma",
    default_warehouse_id: ids.warehouses.city,
  });

  await ensureUser({
    id: ids.users.staff1,
    email: "narvincg@gmail.com",
    password: "StrongPass#1",
    login_id: "staff.north",
    role: "warehouse_staff",
    full_name: "Amit Singh",
    default_warehouse_id: ids.warehouses.north,
  });

  await ensureUser({
    id: ids.users.staff2,
    email: "sachaniya4324@gmail.com",
    password: "StrongPass#1",
    login_id: "staff.south",
    role: "warehouse_staff",
    full_name: "Sneha Patel",
    default_warehouse_id: ids.warehouses.south,
  });

  await ensureUser({
    id: ids.users.staff3,
    email: "githubnarvin@gmail.com",
    password: "StrongPass#1",
    login_id: "staff.central",
    role: "warehouse_staff",
    full_name: "Vikram Reddy",
    default_warehouse_id: ids.warehouses.central,
  });
  console.log("Users seeded ✅");
}

async function ensureUser({ id, email, password, login_id, role, full_name, default_warehouse_id }) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("login_id", login_id)
    .maybeSingle();

  const password_hash = await bcrypt.hash(password, 10);

  const userId = id || randomUUID();

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    login_id,
    full_name,
    email,
    password_hash,
    role,
    default_warehouse_id,
    email_verified: true,
  });

  if (profileError) throw profileError;

  if (existing) {
    console.log(`Updated user ${login_id}`);
  } else {
    console.log(`Created user ${login_id}`);
  }
}

async function seedReceipts() {
  const receipts = [
    {
      id: "55555555-5555-5555-5555-555555555557",
      reference_no: "RCT-2024-001",
      supplier_name: "Tech Supplies Ltd",
      supplier_email: "orders@techsupplies.com",
      status: "done",
      warehouse_id: ids.warehouses.central,
      created_by: ids.users.manager1,
      received_by: ids.users.staff3,
      notes: "Monthly electronics supply",
      total_amount: 87500,
    },
    {
      id: "66666666-6666-6666-6666-666666666668",
      reference_no: "RCT-2024-002",
      supplier_name: "Safety First Corp",
      supplier_email: "sales@safetyfirst.com",
      status: "ready",
      warehouse_id: ids.warehouses.city,
      created_by: ids.users.manager2,
      notes: "Safety equipment order",
      total_amount: 24500,
    },
    {
      id: "eeeeeeee-eeee-eeee-eeee-aaaaaaaaaaaa",
      reference_no: "RCT-2024-003",
      supplier_name: "Industrial Tools Inc",
      supplier_email: "sales@industrialtools.com",
      status: "waiting",
      warehouse_id: ids.warehouses.north,
      created_by: ids.users.staff1,
      notes: "Power tools restock",
      total_amount: 18500,
    },
    {
      id: "ffffffff-ffff-ffff-ffff-bbbbbbbbbbbb",
      reference_no: "RCT-2024-004",
      supplier_name: "Global Packaging Co",
      supplier_email: "orders@globalpack.com",
      status: "draft",
      warehouse_id: ids.warehouses.south,
      created_by: ids.users.staff2,
      notes: "Packaging materials",
      total_amount: 12000,
    },
  ];

  const { error } = await supabase.from("receipts").upsert(receipts);
  if (error) throw error;

  const receiptItems = [
    {
      receipt_id: "55555555-5555-5555-5555-555555555557",
      product_id: ids.products.scanner,
      quantity: 10,
      unit_price: 2500,
      location_id: "55555555-5555-5555-5555-555555555556",
      batch_number: "BATCH-2024-001",
      expiry_date: "2026-12-31",
    },
    {
      receipt_id: "55555555-5555-5555-5555-555555555557",
      product_id: ids.products.laptop,
      quantity: 5,
      unit_price: 45000,
      location_id: "55555555-5555-5555-5555-555555555556",
      batch_number: "BATCH-2024-002",
      expiry_date: null,
    },
    {
      receipt_id: "66666666-6666-6666-6666-666666666668",
      product_id: ids.products.helmet,
      quantity: 30,
      unit_price: 350,
      location_id: "88888888-8888-8888-8888-888888888889",
      batch_number: "BATCH-2024-003",
      expiry_date: "2027-06-30",
    },
    {
      receipt_id: "66666666-6666-6666-6666-666666666668",
      product_id: ids.products.mask,
      quantity: 50,
      unit_price: 200,
      location_id: "88888888-8888-8888-8888-888888888889",
      batch_number: "BATCH-2024-004",
      expiry_date: "2025-12-31",
    },
    {
      receipt_id: "eeeeeeee-eeee-eeee-eeee-aaaaaaaaaaaa",
      product_id: ids.products.drill,
      quantity: 8,
      unit_price: 1800,
      location_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaabbbbbbbb",
      batch_number: "BATCH-2024-005",
      expiry_date: null,
    },
    {
      receipt_id: "eeeeeeee-eeee-eeee-eeee-aaaaaaaaaaaa",
      product_id: ids.products.screwdriver,
      quantity: 15,
      unit_price: 450,
      location_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaabbbbbbbb",
      batch_number: "BATCH-2024-006",
      expiry_date: null,
    },
    {
      receipt_id: "ffffffff-ffff-ffff-ffff-bbbbbbbbbbbb",
      product_id: ids.products.gloves,
      quantity: 40,
      unit_price: 150,
      location_id: "cccccccc-cccc-cccc-cccc-dddddddddddd",
      batch_number: "BATCH-2024-007",
      expiry_date: "2026-06-30",
    },
  ];

  const { error: itemsError } = await supabase.from("receipt_items").upsert(receiptItems);
  if (itemsError) throw itemsError;
  console.log("Receipts seeded ✅");
}

async function seedDeliveries() {
  const deliveries = [
    {
      id: "77777777-7777-7777-7777-777777777779",
      reference_no: "DLV-2024-001",
      customer_name: "Acme Corporation",
      customer_email: "procurement@acme.com",
      customer_phone: "+91-9876543210",
      status: "done",
      warehouse_id: ids.warehouses.city,
      created_by: ids.users.manager2,
      delivered_by: ids.users.staff2,
      notes: "Urgent delivery",
      total_amount: 15000,
    },
    {
      id: "88888888-8888-8888-8888-888888888880",
      reference_no: "DLV-2024-002",
      customer_name: "Global Industries",
      customer_email: "orders@globalind.com",
      status: "ready",
      warehouse_id: ids.warehouses.central,
      created_by: ids.users.manager1,
      notes: "Standard delivery",
      total_amount: 22500,
    },
    {
      id: "01010101-0101-0101-0101-010101010101",
      reference_no: "DLV-2024-003",
      customer_name: "Tech Solutions Ltd",
      customer_email: "orders@techsolutions.com",
      customer_phone: "+91-8765432109",
      status: "waiting",
      warehouse_id: ids.warehouses.north,
      created_by: ids.users.staff1,
      notes: "Bulk order for electronics",
      total_amount: 45000,
    },
    {
      id: "02020202-0202-0202-0202-020202020202",
      reference_no: "DLV-2024-004",
      customer_name: "Safety Equipment Co",
      customer_email: "purchase@safetyequip.com",
      status: "draft",
      warehouse_id: ids.warehouses.south,
      created_by: ids.users.staff2,
      notes: "Safety gear restock order",
      total_amount: 18000,
    },
  ];

  const { error } = await supabase.from("deliveries").upsert(deliveries);
  if (error) throw error;

  const deliveryItems = [
    {
      delivery_id: "77777777-7777-7777-7777-777777777779",
      product_id: ids.products.mouse,
      quantity: 30,
      unit_price: 500,
      picked: true,
      packed: true,
      location_id: "88888888-8888-8888-8888-888888888889",
      batch_number: "BATCH-2024-001",
    },
    {
      delivery_id: "88888888-8888-8888-8888-888888888880",
      product_id: ids.products.drill,
      quantity: 5,
      unit_price: 2500,
      picked: true,
      packed: false,
      location_id: "55555555-5555-5555-5555-555555555556",
      batch_number: "BATCH-2024-002",
    },
    {
      delivery_id: "88888888-8888-8888-8888-888888888880",
      product_id: ids.products.screwdriver,
      quantity: 10,
      unit_price: 650,
      picked: false,
      packed: false,
      location_id: "55555555-5555-5555-5555-555555555556",
      batch_number: "BATCH-2024-003",
    },
    {
      delivery_id: "01010101-0101-0101-0101-010101010101",
      product_id: ids.products.scanner,
      quantity: 8,
      unit_price: 3500,
      picked: true,
      packed: true,
      location_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaabbbbbbbb",
      batch_number: "BATCH-2024-008",
    },
    {
      delivery_id: "01010101-0101-0101-0101-010101010101",
      product_id: ids.products.laptop,
      quantity: 3,
      unit_price: 55000,
      picked: false,
      packed: false,
      location_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaabbbbbbbb",
      batch_number: "BATCH-2024-009",
    },
    {
      delivery_id: "02020202-0202-0202-0202-020202020202",
      product_id: ids.products.helmet,
      quantity: 25,
      unit_price: 500,
      picked: false,
      packed: false,
      location_id: "cccccccc-cccc-cccc-cccc-dddddddddddd",
      batch_number: "BATCH-2024-010",
    },
    {
      delivery_id: "02020202-0202-0202-0202-020202020202",
      product_id: ids.products.mask,
      quantity: 30,
      unit_price: 350,
      picked: false,
      packed: false,
      location_id: "eeeeeeee-eeee-eeee-eeee-fffffffffffe",
      batch_number: "BATCH-2024-011",
    },
  ];

  const { error: itemsError } = await supabase.from("delivery_items").upsert(deliveryItems);
  if (itemsError) throw itemsError;
  console.log("Deliveries seeded ✅");
}

async function seedAdjustments() {
  const adjustments = [
    {
      id: "99999999-9999-9999-9999-999999999991",
      reference_no: "ADJ-2024-001",
      adjustment_type: "decrease",
      reason: "Damaged goods during inspection",
      warehouse_id: ids.warehouses.central,
      created_by: ids.users.manager1,
      approved_by: ids.users.manager1,
      notes: "3 scanners found damaged",
    },
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaacccccccc",
      reference_no: "ADJ-2024-002",
      adjustment_type: "increase",
      reason: "Stock count correction",
      warehouse_id: ids.warehouses.north,
      created_by: ids.users.staff1,
      approved_by: ids.users.manager1,
      notes: "Physical count revealed discrepancy",
    },
  ];

  const { error } = await supabase.from("adjustments").upsert(adjustments);
  if (error) throw error;

  const adjustmentItems = [
    {
      adjustment_id: "99999999-9999-9999-9999-999999999991",
      product_id: ids.products.scanner,
      location_id: "55555555-5555-5555-5555-555555555556",
      quantity: -3,
      unit_cost: 2500,
      batch_number: "BATCH-2024-001",
    },
    {
      adjustment_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaacccccccc",
      product_id: ids.products.helmet,
      location_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaabbbbbbbb",
      quantity: 5,
      unit_cost: 350,
      batch_number: "BATCH-2024-003",
    },
  ];

  const { error: itemsError } = await supabase.from("adjustment_items").upsert(adjustmentItems);
  if (itemsError) throw itemsError;
  console.log("Adjustments seeded ✅");
}

async function seedTransfers() {
  const transfers = [
    {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-dddddddddddd",
      reference_no: "TRF-2024-001",
      from_warehouse_id: ids.warehouses.central,
      to_warehouse_id: ids.warehouses.city,
      from_location_id: "55555555-5555-5555-5555-555555555556",
      to_location_id: "88888888-8888-8888-8888-888888888889",
      status: "done",
      created_by: ids.users.manager1,
      approved_by: ids.users.manager1,
      notes: "Emergency stock transfer",
      completed_at: new Date().toISOString(),
    },
    {
      id: "cccccccc-cccc-cccc-cccc-aaaaaaaaaaaa",
      reference_no: "TRF-2024-002",
      from_warehouse_id: ids.warehouses.north,
      to_warehouse_id: ids.warehouses.south,
      from_location_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaabbbbbbbb",
      to_location_id: "cccccccc-cccc-cccc-cccc-dddddddddddd",
      status: "ready",
      created_by: ids.users.staff1,
      approved_by: ids.users.manager1,
      notes: "Scheduled transfer",
    },
    {
      id: "dddddddd-dddd-dddd-dddd-bbbbbbbbbbbb",
      reference_no: "TRF-2024-003",
      from_warehouse_id: ids.warehouses.city,
      to_warehouse_id: ids.warehouses.central,
      from_location_id: "88888888-8888-8888-8888-888888888889",
      to_location_id: "66666666-6666-6666-6666-666666666667",
      status: "draft",
      created_by: ids.users.manager2,
      notes: "Pending approval",
    },
  ];

  const { error } = await supabase.from("internal_transfers").upsert(transfers);
  if (error) throw error;

  const transferItems = [
    {
      transfer_id: "bbbbbbbb-bbbb-bbbb-bbbb-dddddddddddd",
      product_id: ids.products.scanner,
      quantity: 5,
      from_location_id: "55555555-5555-5555-5555-555555555556",
      to_location_id: "88888888-8888-8888-8888-888888888889",
      batch_number: "BATCH-2024-001",
    },
    {
      transfer_id: "cccccccc-cccc-cccc-cccc-aaaaaaaaaaaa",
      product_id: ids.products.helmet,
      quantity: 10,
      from_location_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaabbbbbbbb",
      to_location_id: "cccccccc-cccc-cccc-cccc-dddddddddddd",
      batch_number: "BATCH-2024-003",
    },
    {
      transfer_id: "dddddddd-dddd-dddd-dddd-bbbbbbbbbbbb",
      product_id: ids.products.mouse,
      quantity: 20,
      from_location_id: "88888888-8888-8888-8888-888888888889",
      to_location_id: "66666666-6666-6666-6666-666666666667",
      batch_number: "BATCH-2024-005",
    },
  ];

  const { error: itemsError } = await supabase.from("transfer_items").upsert(transferItems);
  if (itemsError) throw itemsError;
  console.log("Transfers seeded ✅");
}

async function seedStockLedger() {
  const ledgerEntries = [
    {
      product_id: ids.products.scanner,
      warehouse_id: ids.warehouses.central,
      location_id: "55555555-5555-5555-5555-555555555556",
      operation_type: "receipt",
      quantity: 10,
      reference_id: "55555555-5555-5555-5555-555555555557",
      reference_type: "receipt",
      notes: "Receipt RCT-2024-001",
      created_by: ids.users.manager1,
    },
    {
      product_id: ids.products.scanner,
      warehouse_id: ids.warehouses.central,
      location_id: "55555555-5555-5555-5555-555555555556",
      operation_type: "adjustment",
      quantity: -3,
      reference_id: "99999999-9999-9999-9999-999999999991",
      reference_type: "adjustment",
      notes: "Adjustment ADJ-2024-001",
      created_by: ids.users.manager1,
    },
    {
      product_id: ids.products.mouse,
      warehouse_id: ids.warehouses.city,
      location_id: "88888888-8888-8888-8888-888888888889",
      operation_type: "delivery",
      quantity: -30,
      reference_id: "77777777-7777-7777-7777-777777777779",
      reference_type: "delivery",
      notes: "Delivery DLV-2024-001",
      created_by: ids.users.manager2,
    },
    {
      product_id: ids.products.scanner,
      warehouse_id: ids.warehouses.central,
      location_id: "55555555-5555-5555-5555-555555555556",
      operation_type: "transfer",
      quantity: -5,
      reference_id: "bbbbbbbb-bbbb-bbbb-bbbb-dddddddddddd",
      reference_type: "transfer",
      notes: "Transfer TRF-2024-001 (out)",
      created_by: ids.users.manager1,
    },
    {
      product_id: ids.products.scanner,
      warehouse_id: ids.warehouses.city,
      location_id: "88888888-8888-8888-8888-888888888889",
      operation_type: "transfer",
      quantity: 5,
      reference_id: "bbbbbbbb-bbbb-bbbb-bbbb-dddddddddddd",
      reference_type: "transfer",
      notes: "Transfer TRF-2024-001 (in)",
      created_by: ids.users.manager1,
    },
  ];

  const { error } = await supabase.from("stock_ledger").upsert(ledgerEntries);
  if (error) throw error;
  console.log("Stock ledger seeded ✅");
}

async function clearExistingData() {
  console.log("Clearing existing seed data...");

  await supabase.from("stock_ledger").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("transfer_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("internal_transfers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("adjustment_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("adjustments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("delivery_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("deliveries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("receipt_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("receipts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("stock_levels").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("locations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("product_categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Delete from auth.users using admin API
  try {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    for (const user of users) {
      await supabase.auth.admin.deleteUser(user.id);
    }
  } catch (error) {
    console.log("Note: Could not clear auth.users (may be empty)");
  }

  await supabase.from("warehouses").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("Existing data cleared ✅");
}

async function main() {
  try {
    await clearExistingData();
    await seedWarehouses();
    await seedLocations();
    await seedCategories();
    await seedProducts();
    await seedStockLevels();
    await seedUsers();
    await seedReceipts();
    await seedDeliveries();
    await seedTransfers();
    await seedAdjustments();
    await seedStockLedger();
    console.log("Seed completed ✅");
  } catch (error) {
    console.error("Seed failed", error);
    process.exit(1);
  }
}

main();
