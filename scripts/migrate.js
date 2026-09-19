#!/usr/bin/env node

const { runMigrations } = require('../lib/database/migrations.js');

async function main() {
  try {
    console.log('🚀 Starting database migrations...');
    
    await runMigrations();
    
    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
