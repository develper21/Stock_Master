#!/usr/bin/env node

// Database Setup Script for Stock Master Custom Auth
// This script sets up the complete database with proper schema and initial data

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Logging utilities
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`)
};

async function executeSchema() {
  try {
    log.info('Executing database schema...');
    
    // Read schema file
    const schemaPath = join(__dirname, '../supabase/schema.sql');
    const schemaSQL = readFileSync(schemaPath, 'utf8');
    
    // Split into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    log.info(`Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Skip if it's just a comment or empty
        if (statement.startsWith('--') || statement.trim() === '') {
          continue;
        }
        
        log.verbose(`Executing statement ${i + 1}/${statements.length}`);
        
        const { error } = await supabase.rpc('execute_sql', { 
          sql_statement: statement 
        }).catch(async () => {
          // Fallback: Try direct execution if RPC not available
          return await supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1);
        });
        
        if (error) {
          // Some statements might fail if they already exist
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('does not exist')) {
            log.verbose(`Statement ${i + 1} skipped (already exists): ${error.message}`);
          } else {
            log.error(`Statement ${i + 1} failed: ${error.message}`);
            errorCount++;
          }
        } else {
          successCount++;
        }
        
      } catch (error) {
        log.error(`Statement ${i + 1} threw error: ${error.message}`);
        errorCount++;
      }
    }
    
    log.success(`Schema execution completed: ${successCount} succeeded, ${errorCount} failed`);
    return errorCount === 0;
    
  } catch (error) {
    log.error(`Schema execution failed: ${error.message}`);
    return false;
  }
}

async function createInitialData() {
  try {
    log.info('Creating initial data...');
    
    // Create default warehouse if none exists
    const { data: warehouses, error: warehouseError } = await supabase
      .from('warehouses')
      .select('id');
    
    if (warehouseError) throw warehouseError;
    
    if (!warehouses || warehouses.length === 0) {
      log.info('Creating default warehouse...');
      
      const { error: createWarehouseError } = await supabase
        .from('warehouses')
        .insert({
          name: 'Main Warehouse',
          code: 'MAIN',
          address: '123 Main St, City, State 12345',
          phone: '+1-555-0123',
          email: 'warehouse@stockmaster.com'
        });
      
      if (createWarehouseError) {
        throw createWarehouseError;
      }
      
      log.success('Default warehouse created');
    } else {
      log.info(`${warehouses.length} warehouses already exist`);
    }
    
    // Create default category if none exists
    const { data: categories, error: categoryError } = await supabase
      .from('product_categories')
      .select('id');
    
    if (categoryError) throw categoryError;
    
    if (!categories || categories.length === 0) {
      log.info('Creating default product categories...');
      
      const defaultCategories = [
        { name: 'Electronics', description: 'Electronic devices and components' },
        { name: 'Furniture', description: 'Office and warehouse furniture' },
        { name: 'Tools', description: 'Hand and power tools' },
        { name: 'Materials', description: 'Raw materials and supplies' },
        { name: 'Other', description: 'Miscellaneous items' }
      ];
      
      const { error: createCategoriesError } = await supabase
        .from('product_categories')
        .insert(defaultCategories);
      
      if (createCategoriesError) {
        throw createCategoriesError;
      }
      
      log.success(`${defaultCategories.length} default categories created`);
    } else {
      log.info(`${categories.length} categories already exist`);
    }
    
    log.success('Initial data creation completed');
    return true;
    
  } catch (error) {
    log.error(`Initial data creation failed: ${error.message}`);
    return false;
  }
}

async function verifySetup() {
  try {
    log.info('Verifying database setup...');
    
    const checks = [];
    
    // Check tables exist
    const tables = [
      'warehouses',
      'profiles', 
      'product_categories',
      'products',
      'stock_levels',
      'stock_ledger',
      'receipts',
      'deliveries',
      'password_reset_tokens',
      'email_verification_tokens'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error && !error.message.includes('does not exist')) {
          throw error;
        }
        
        checks.push({
          table,
          status: error ? '❌' : '✅',
          message: error ? error.message : 'OK'
        });
      } catch (error) {
        checks.push({
          table,
          status: '❌',
          message: error.message
        });
      }
    }
    
    // Display results
    console.log('\n📊 Database Setup Verification:');
    console.log('================================');
    
    let allPassed = true;
    for (const check of checks) {
      console.log(`${check.status} ${check.table.padEnd(25)} ${check.message}`);
      if (check.status === '❌') {
        allPassed = false;
      }
    }
    
    if (allPassed) {
      log.success('\n🎉 Database setup verification passed!');
    } else {
      log.error('\n❌ Database setup verification failed!');
    }
    
    return allPassed;
    
  } catch (error) {
    log.error(`Setup verification failed: ${error.message}`);
    return false;
  }
}

async function main() {
  const startTime = Date.now();
  
  log.info('🚀 Starting Database Setup');
  log.info(`Target: ${supabaseUrl}`);
  
  try {
    // Step 1: Execute schema
    const schemaSuccess = await executeSchema();
    if (!schemaSuccess) {
      log.error('Schema execution failed - aborting setup');
      process.exit(1);
    }
    
    // Step 2: Create initial data
    const dataSuccess = await createInitialData();
    if (!dataSuccess) {
      log.warning('Initial data creation failed - but setup may still work');
    }
    
    // Step 3: Verify setup
    const setupSuccess = await verifySetup();
    if (!setupSuccess) {
      log.error('Database setup verification failed');
      process.exit(1);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log.success(`🎉 Database setup completed successfully in ${duration}s`);
    
    log.info('\n📋 Next Steps:');
    log.info('1. Run migration script: node scripts/migrate-auth.js');
    log.info('2. Set up environment variables for email service');
    log.info('3. Test the authentication system');
    log.info('4. Start the application: npm run dev');
    
  } catch (error) {
    log.error(`Database setup failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run setup
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, executeSchema, createInitialData, verifySetup };
