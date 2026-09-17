import { createClient } from '@supabase/supabase-js';

// Migration manager for database schema changes
export class MigrationManager {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.migrationsTable = 'schema_migrations';
  }

  // Initialize migrations table
  async init() {
    try {
      const { error } = await this.supabase.rpc('create_migrations_table');
      if (error && error.code !== 'PGRST116') {
        console.error('Error creating migrations table:', error);
      }
    } catch (error) {
      console.error('Error initializing migrations:', error);
    }
  }

  // Get all executed migrations
  async getExecutedMigrations() {
    try {
      const { data, error } = await this.supabase
        .from(this.migrationsTable)
        .select('version')
        .order('version', { ascending: true });

      if (error) throw error;
      return data ? data.map(m => m.version) : [];
    } catch (error) {
      console.error('Error getting executed migrations:', error);
      return [];
    }
  }

  // Mark migration as executed
  async markMigrationExecuted(version, description) {
    try {
      const { error } = await this.supabase
        .from(this.migrationsTable)
        .insert({
          version,
          description,
          executed_at: new Date().toISOString(),
        });

      if (error) throw error;
      console.log(`Migration ${version} marked as executed`);
    } catch (error) {
      console.error('Error marking migration as executed:', error);
      throw error;
    }
  }

  // Execute a migration
  async executeMigration(migration) {
    try {
      console.log(`Executing migration ${migration.version}: ${migration.description}`);
      
      // Execute the migration SQL
      const { error } = await this.supabase.rpc('execute_sql', { sql: migration.sql });
      
      if (error) {
        console.error(`Migration ${migration.version} failed:`, error);
        throw error;
      }

      // Mark as executed
      await this.markMigrationExecuted(migration.version, migration.description);
      
      console.log(`Migration ${migration.version} completed successfully`);
      return true;
    } catch (error) {
      console.error(`Error executing migration ${migration.version}:`, error);
      throw error;
    }
  }

  // Run all pending migrations
  async runMigrations(migrations) {
    await this.init();
    
    const executedMigrations = await this.getExecutedMigrations();
    const pendingMigrations = migrations.filter(
      m => !executedMigrations.includes(m.version)
    );

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      await this.executeMigration(migration);
    }

    console.log('All migrations completed successfully');
  }

  // Rollback a migration (if rollback SQL is provided)
  async rollbackMigration(version) {
    try {
      console.log(`Rolling back migration ${version}`);
      
      // Get migration details
      const { data, error } = await this.supabase
        .from(this.migrationsTable)
        .select('*')
        .eq('version', version)
        .single();

      if (error) throw error;

      // Execute rollback if available
      if (data.rollback_sql) {
        const { error: rollbackError } = await this.supabase.rpc('execute_sql', { 
          sql: data.rollback_sql 
        });
        
        if (rollbackError) throw rollbackError;
      }

      // Remove from migrations table
      await this.supabase
        .from(this.migrationsTable)
        .delete()
        .eq('version', version);

      console.log(`Migration ${version} rolled back successfully`);
    } catch (error) {
      console.error(`Error rolling back migration ${version}:`, error);
      throw error;
    }
  }
}

// Migration definitions
export const migrations = [
  {
    version: '001',
    description: 'Create initial tables',
    sql: `
      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        login_id VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'warehouse_staff',
        default_warehouse_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create warehouses table
      CREATE TABLE IF NOT EXISTS warehouses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        postal_code VARCHAR(20),
        phone VARCHAR(50),
        email VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create locations table
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(warehouse_id, code)
      );

      -- Create categories table
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        parent_id UUID REFERENCES categories(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create products table
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        category_id UUID REFERENCES categories(id),
        unit VARCHAR(50) DEFAULT 'pcs',
        min_stock_level INTEGER DEFAULT 0,
        max_stock_level INTEGER DEFAULT 0,
        reorder_point INTEGER DEFAULT 0,
        cost_price DECIMAL(10,2),
        selling_price DECIMAL(10,2),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create stock_levels table
      CREATE TABLE IF NOT EXISTS stock_levels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
        location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 0,
        reserved_quantity INTEGER NOT NULL DEFAULT 0,
        available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(product_id, warehouse_id, location_id)
      );

      -- Create suppliers table
      CREATE TABLE IF NOT EXISTS suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        postal_code VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create receipts table
      CREATE TABLE IF NOT EXISTS receipts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        receipt_number VARCHAR(50) UNIQUE NOT NULL,
        supplier_id UUID REFERENCES suppliers(id),
        warehouse_id UUID NOT NULL REFERENCES warehouses(id),
        status VARCHAR(50) DEFAULT 'draft',
        total_amount DECIMAL(12,2) DEFAULT 0,
        received_date DATE,
        received_by UUID REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create receipt_items table
      CREATE TABLE IF NOT EXISTS receipt_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id),
        location_id UUID REFERENCES locations(id),
        quantity_ordered INTEGER NOT NULL,
        quantity_received INTEGER NOT NULL DEFAULT 0,
        unit_cost DECIMAL(10,2),
        total_cost DECIMAL(12,2),
        batch_number VARCHAR(100),
        expiry_date DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create deliveries table
      CREATE TABLE IF NOT EXISTS deliveries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        delivery_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        warehouse_id UUID NOT NULL REFERENCES warehouses(id),
        status VARCHAR(50) DEFAULT 'draft',
        total_amount DECIMAL(12,2) DEFAULT 0,
        delivery_date DATE,
        delivered_by UUID REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create delivery_items table
      CREATE TABLE IF NOT EXISTS delivery_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id),
        location_id UUID REFERENCES locations(id),
        quantity_ordered INTEGER NOT NULL,
        quantity_delivered INTEGER NOT NULL DEFAULT 0,
        unit_price DECIMAL(10,2),
        total_price DECIMAL(12,2),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create transfers table
      CREATE TABLE IF NOT EXISTS transfers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transfer_number VARCHAR(50) UNIQUE NOT NULL,
        from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
        to_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
        from_location_id UUID REFERENCES locations(id),
        to_location_id UUID REFERENCES locations(id),
        status VARCHAR(50) DEFAULT 'draft',
        notes TEXT,
        transferred_by UUID REFERENCES users(id),
        transfer_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create transfer_items table
      CREATE TABLE IF NOT EXISTS transfer_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create adjustments table
      CREATE TABLE IF NOT EXISTS adjustments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        adjustment_number VARCHAR(50) UNIQUE NOT NULL,
        warehouse_id UUID NOT NULL REFERENCES warehouses(id),
        location_id UUID REFERENCES locations(id),
        adjustment_type VARCHAR(50) NOT NULL, -- 'increase' or 'decrease'
        reason VARCHAR(255),
        notes TEXT,
        adjusted_by UUID REFERENCES users(id),
        adjustment_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create adjustment_items table
      CREATE TABLE IF NOT EXISTS adjustment_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        adjustment_id UUID NOT NULL REFERENCES adjustments(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id),
        quantity_before INTEGER NOT NULL,
        quantity_after INTEGER NOT NULL,
        difference INTEGER NOT NULL,
        unit_cost DECIMAL(10,2),
        total_cost DECIMAL(12,2),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create stock_movements table (audit trail)
      CREATE TABLE IF NOT EXISTS stock_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id),
        warehouse_id UUID NOT NULL REFERENCES warehouses(id),
        location_id UUID REFERENCES locations(id),
        movement_type VARCHAR(50) NOT NULL, -- 'receipt', 'delivery', 'transfer', 'adjustment'
        reference_id UUID, -- References the specific transaction
        quantity_change INTEGER NOT NULL,
        quantity_before INTEGER NOT NULL,
        quantity_after INTEGER NOT NULL,
        unit_cost DECIMAL(10,2),
        total_cost DECIMAL(12,2),
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        notes TEXT
      );
    `,
    rollbackSql: `
      DROP TABLE IF EXISTS stock_movements CASCADE;
      DROP TABLE IF EXISTS adjustment_items CASCADE;
      DROP TABLE IF EXISTS adjustments CASCADE;
      DROP TABLE IF EXISTS transfer_items CASCADE;
      DROP TABLE IF EXISTS transfers CASCADE;
      DROP TABLE IF EXISTS delivery_items CASCADE;
      DROP TABLE IF EXISTS deliveries CASCADE;
      DROP TABLE IF EXISTS receipt_items CASCADE;
      DROP TABLE IF EXISTS receipts CASCADE;
      DROP TABLE IF EXISTS suppliers CASCADE;
      DROP TABLE IF EXISTS stock_levels CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS locations CASCADE;
      DROP TABLE IF EXISTS warehouses CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `
  },
  {
    version: '002',
    description: 'Add indexes for performance',
    sql: `
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_login_id ON users(login_id);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      
      CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
      CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
      
      CREATE INDEX IF NOT EXISTS idx_stock_levels_product_warehouse ON stock_levels(product_id, warehouse_id);
      CREATE INDEX IF NOT EXISTS idx_stock_levels_location ON stock_levels(location_id);
      CREATE INDEX IF NOT EXISTS idx_stock_levels_available ON stock_levels(available_quantity) WHERE available_quantity > 0;
      
      CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
      CREATE INDEX IF NOT EXISTS idx_receipts_warehouse ON receipts(warehouse_id);
      CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(received_date);
      
      CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
      CREATE INDEX IF NOT EXISTS idx_deliveries_warehouse ON deliveries(warehouse_id);
      CREATE INDEX IF NOT EXISTS idx_deliveries_date ON deliveries(delivery_date);
      
      CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
      CREATE INDEX IF NOT EXISTS idx_transfers_warehouses ON transfers(from_warehouse_id, to_warehouse_id);
      
      CREATE INDEX IF NOT EXISTS idx_adjustments_type ON adjustments(adjustment_type);
      CREATE INDEX IF NOT EXISTS idx_adjustments_warehouse ON adjustments(warehouse_id);
      CREATE INDEX IF NOT EXISTS idx_adjustments_date ON adjustments(adjustment_date);
      
      CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse ON stock_movements(warehouse_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);
    `,
    rollbackSql: `
      DROP INDEX IF EXISTS idx_users_email;
      DROP INDEX IF EXISTS idx_users_login_id;
      DROP INDEX IF EXISTS idx_users_role;
      DROP INDEX IF EXISTS idx_products_code;
      DROP INDEX IF EXISTS idx_products_category_id;
      DROP INDEX IF EXISTS idx_products_is_active;
      DROP INDEX IF EXISTS idx_stock_levels_product_warehouse;
      DROP INDEX IF EXISTS idx_stock_levels_location;
      DROP INDEX IF EXISTS idx_stock_levels_available;
      DROP INDEX IF EXISTS idx_receipts_status;
      DROP INDEX IF EXISTS idx_receipts_warehouse;
      DROP INDEX IF EXISTS idx_receipts_date;
      DROP INDEX IF EXISTS idx_deliveries_status;
      DROP INDEX IF EXISTS idx_deliveries_warehouse;
      DROP INDEX IF EXISTS idx_deliveries_date;
      DROP INDEX IF EXISTS idx_transfers_status;
      DROP INDEX IF EXISTS idx_transfers_warehouses;
      DROP INDEX IF EXISTS idx_adjustments_type;
      DROP INDEX IF EXISTS idx_adjustments_warehouse;
      DROP INDEX IF EXISTS idx_adjustments_date;
      DROP INDEX IF EXISTS idx_stock_movements_product;
      DROP INDEX IF EXISTS idx_stock_movements_warehouse;
      DROP INDEX IF EXISTS idx_stock_movements_type;
      DROP INDEX IF EXISTS idx_stock_movements_date;
    `
  },
  {
    version: '003',
    description: 'Add RLS policies and triggers',
    sql: `
      -- Enable Row Level Security
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
      ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
      ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE adjustments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      -- Users can only see their own profile
      CREATE POLICY "Users can view own profile" ON users
        FOR SELECT USING (auth.uid() = id);

      -- Users can only update their own profile
      CREATE POLICY "Users can update own profile" ON users
        FOR UPDATE USING (auth.uid() = id);

      -- Users can only see stock levels for their warehouse
      CREATE POLICY "Users can view warehouse stock" ON stock_levels
        FOR SELECT USING (
          warehouse_id IN (
            SELECT default_warehouse_id FROM users WHERE id = auth.uid()
          )
        );

      -- Inventory managers can see all stock levels
      CREATE POLICY "Managers can view all stock" ON stock_levels
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'inventory_manager'
          )
        );

      -- Similar policies for other tables...
      
      -- Create triggers for updated_at timestamps
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON receipts
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON transfers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_adjustments_updated_at BEFORE UPDATE ON adjustments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `,
    rollbackSql: `
      -- Drop triggers
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      DROP TRIGGER IF EXISTS update_warehouses_updated_at ON warehouses;
      DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
      DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
      DROP TRIGGER IF EXISTS update_products_updated_at ON products;
      DROP TRIGGER IF EXISTS update_receipts_updated_at ON receipts;
      DROP TRIGGER IF EXISTS update_deliveries_updated_at ON deliveries;
      DROP TRIGGER IF EXISTS update_transfers_updated_at ON transfers;
      DROP TRIGGER IF EXISTS update_adjustments_updated_at ON adjustments;
      
      DROP FUNCTION IF EXISTS update_updated_at_column();
      
      -- Drop RLS policies
      DROP POLICY IF EXISTS "Users can view own profile" ON users;
      DROP POLICY IF EXISTS "Users can update own profile" ON users;
      DROP POLICY IF EXISTS "Users can view warehouse stock" ON stock_levels;
      DROP POLICY IF EXISTS "Managers can view all stock" ON stock_levels;
      
      -- Disable RLS
      ALTER TABLE users DISABLE ROW LEVEL SECURITY;
      ALTER TABLE stock_levels DISABLE ROW LEVEL SECURITY;
      ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;
      ALTER TABLE deliveries DISABLE ROW LEVEL SECURITY;
      ALTER TABLE transfers DISABLE ROW LEVEL SECURITY;
      ALTER TABLE adjustments DISABLE ROW LEVEL SECURITY;
      ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;
    `
  }
];

// Export migration runner function
export async function runMigrations() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  const migrationManager = new MigrationManager(supabaseUrl, supabaseKey);
  await migrationManager.runMigrations(migrations);
}
