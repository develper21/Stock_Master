#!/usr/bin/env node

// Enhanced Migration Script: Supabase Auth to Custom Auth
// This script safely migrates existing users to custom authentication

import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '../lib/auth-custom.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const CONFIG = {
  defaultPassword: 'ChangeMe123!',
  dryRun: process.argv.includes('--dry-run'),
  backup: !process.argv.includes('--no-backup'),
  verbose: process.argv.includes('--verbose')
};

// Logging utilities
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  verbose: (msg) => CONFIG.verbose && console.log(`🔍 ${msg}`)
};

// Backup utilities
async function createBackup() {
  if (!CONFIG.backup) {
    log.info('Skipping backup ( --no-backup flag)');
    return;
  }

  try {
    log.info('Creating database backup...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) throw profilesError;
    
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      tables: {
        profiles: profiles
      }
    };
    
    const backupFile = join(__dirname, `../backup_${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    log.success(`Backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    log.error(`Backup failed: ${error.message}`);
    throw error;
  }
}

// Database validation
async function validateDatabase() {
  log.info('Validating database structure...');
  
  try {
    // Check if profiles table exists
    const { data: tables, error: tablesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (tablesError && !tablesError.message.includes('does not exist')) {
      throw tablesError;
    }
    
    // Check if password_hash column exists
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'profiles' })
      .catch(() => ({ data: [] }));
    
    const hasPasswordHash = columns?.some(col => col.column_name === 'password_hash');
    const hasEmailVerified = columns?.some(col => col.column_name === 'email_verified');
    
    if (!hasPasswordHash) {
      log.warning('password_hash column not found - migration will add it');
    }
    
    if (!hasEmailVerified) {
      log.warning('email_verified column not found - migration will add it');
    }
    
    log.success('Database validation completed');
    return true;
  } catch (error) {
    log.error(`Database validation failed: ${error.message}`);
    return false;
  }
}

// Migration functions
async function migrateUsers() {
  try {
    log.info('Starting user migration...');
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }
    
    if (!profiles || profiles.length === 0) {
      log.info('No users found to migrate');
      return { migrated: 0, skipped: 0, errors: 0 };
    }
    
    log.info(`Found ${profiles.length} users to migrate`);
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const profile of profiles) {
      try {
        log.verbose(`Processing user: ${profile.login_id} (${profile.email})`);
        
        // Check if already migrated
        if (profile.password_hash && profile.password_hash.length >= 60) {
          log.verbose(`✓ User ${profile.login_id} already has password hash`);
          skipped++;
          continue;
        }
        
        if (CONFIG.dryRun) {
          log.info(`[DRY RUN] Would migrate user: ${profile.login_id}`);
          migrated++;
          continue;
        }
        
        // Hash the default password
        const passwordHash = await hashPassword(CONFIG.defaultPassword);
        
        // Update the profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            password_hash: passwordHash,
            email_verified: profile.email_verified !== undefined ? profile.email_verified : true,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        if (updateError) {
          throw new Error(`Failed to update user ${profile.login_id}: ${updateError.message}`);
        }
        
        log.success(`✓ Migrated user: ${profile.login_id}`);
        migrated++;
        
      } catch (error) {
        log.error(`✗ Failed to migrate user ${profile.login_id}: ${error.message}`);
        errors++;
      }
    }
    
    log.success(`Migration completed: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
    
    return { migrated, skipped, errors };
  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    throw error;
  }
}

// Cleanup functions
async function cleanupExpiredTokens() {
  try {
    log.info('Cleaning up expired tokens...');
    
    const now = new Date().toISOString();
    
    // Clean expired password reset tokens
    const { error: resetError } = await supabase
      .from('password_reset_tokens')
      .delete()
      .lt('expires_at', now);
    
    if (resetError) {
      log.warning(`Failed to clean password reset tokens: ${resetError.message}`);
    }
    
    // Clean expired email verification tokens
    const { error: verifyError } = await supabase
      .from('email_verification_tokens')
      .delete()
      .lt('expires_at', now);
    
    if (verifyError) {
      log.warning(`Failed to clean verification tokens: ${verifyError.message}`);
    }
    
    log.success('Token cleanup completed');
  } catch (error) {
    log.warning(`Token cleanup failed: ${error.message}`);
  }
}

// Verification functions
async function verifyMigration() {
  try {
    log.info('Verifying migration...');
    
    // Check all users have password_hash
    const { data: usersWithoutHash, error: hashError } = await supabase
      .from('profiles')
      .select('id, login_id')
      .is('password_hash', null);
    
    if (hashError) throw hashError;
    
    if (usersWithoutHash && usersWithoutHash.length > 0) {
      log.error(`${usersWithoutHash.length} users still missing password hash`);
      return false;
    }
    
    // Check all users have email_verified set
    const { data: usersWithoutVerification, error: verifyError } = await supabase
      .from('profiles')
      .select('id, login_id')
      .is('email_verified', null);
    
    if (verifyError) throw verifyError;
    
    if (usersWithoutVerification && usersWithoutVerification.length > 0) {
      log.error(`${usersWithoutVerification.length} users still missing email verification`);
      return false;
    }
    
    log.success('Migration verification passed');
    return true;
  } catch (error) {
    log.error(`Migration verification failed: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  const startTime = Date.now();
  
  log.info('🚀 Starting Custom Auth Migration');
  log.info(`Configuration: ${JSON.stringify({
    dryRun: CONFIG.dryRun,
    backup: CONFIG.backup,
    verbose: CONFIG.verbose
  }, null, 2)}`);
  
  try {
    // Step 1: Validate database
    const isValid = await validateDatabase();
    if (!isValid) {
      process.exit(1);
    }
    
    // Step 2: Create backup
    if (CONFIG.backup) {
      await createBackup();
    }
    
    // Step 3: Migrate users
    const results = await migrateUsers();
    
    // Step 4: Cleanup (only if not dry run)
    if (!CONFIG.dryRun) {
      await cleanupExpiredTokens();
      
      // Step 5: Verify migration
      const isVerified = await verifyMigration();
      if (!isVerified) {
        log.error('Migration verification failed');
        process.exit(1);
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log.success(`🎉 Migration completed successfully in ${duration}s`);
    
    if (!CONFIG.dryRun && results.migrated > 0) {
      log.warning('\n📧 IMPORTANT: Users need to be notified!');
      log.warning(`   Default password: ${CONFIG.defaultPassword}`);
      log.warning('   All migrated users should reset their passwords');
      log.warning('   Send password reset emails to all users');
    }
    
  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    if (CONFIG.verbose) {
      console.error(error.stack);
    }
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

// Run migration
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, migrateUsers, validateDatabase };
