#!/usr/bin/env node

/**
 * Database Management Utilities
 * Provides helper functions for common database operations
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PASSWORD = 'sbp_65f13d3ef84fae093dbb2b2d5368574f69b3cea2';

class DatabaseManager {
  
  /**
   * Execute a Supabase CLI command with password
   */
  static execSupabase(command, description = '') {
    console.log(`🔧 ${description || command}`);
    try {
      const result = execSync(`echo "${DB_PASSWORD}" | npx supabase ${command}`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log('✅ Success:', result);
      return result;
    } catch (error) {
      console.error('❌ Error:', error.message);
      if (error.stdout) console.log('Output:', error.stdout);
      if (error.stderr) console.log('Error details:', error.stderr);
      throw error;
    }
  }

  /**
   * Pull latest database schema
   */
  static pullSchema() {
    return this.execSupabase('db pull', 'Pulling latest database schema');
  }

  /**
   * Generate TypeScript types
   */
  static generateTypes() {
    return this.execSupabase(
      'gen types typescript --linked > src/integrations/supabase/types.ts',
      'Generating TypeScript types'
    );
  }

  /**
   * Create a new migration
   */
  static createMigration(name) {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
    const migrationPath = path.join('supabase', 'migrations', filename);
    
    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your SQL changes here

`;
    
    fs.writeFileSync(migrationPath, template);
    console.log(`✅ Created migration: ${filename}`);
    return migrationPath;
  }

  /**
   * Apply migrations
   */
  static applyMigrations() {
    return this.execSupabase('db push', 'Applying migrations to database');
  }

  /**
   * Check database status
   */
  static status() {
    try {
      return this.execSupabase('status', 'Checking database status');
    } catch (error) {
      console.log('ℹ️  Note: Some status checks require local Docker (normal in cloud environments)');
      return null;
    }
  }

  /**
   * Reset migrations (use with caution)
   */
  static resetMigrations() {
    console.log('⚠️  This will reset migration history. Use with caution!');
    return this.execSupabase('migration repair --status reverted', 'Resetting migration history');
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    switch (command) {
      case 'pull':
        DatabaseManager.pullSchema();
        break;
      case 'types':
        DatabaseManager.generateTypes();
        break;
      case 'create':
        if (!arg) {
          console.error('❌ Migration name required: node scripts/db-utils.js create "migration_name"');
          process.exit(1);
        }
        DatabaseManager.createMigration(arg);
        break;
      case 'push':
        DatabaseManager.applyMigrations();
        break;
      case 'status':
        DatabaseManager.status();
        break;
      case 'sync':
        console.log('🔄 Full database sync...');
        DatabaseManager.pullSchema();
        DatabaseManager.generateTypes();
        console.log('✅ Database sync complete!');
        break;
      default:
        console.log(`
📋 Database Management Commands:

  pull     - Pull latest schema from remote database
  types    - Generate TypeScript types
  create   - Create new migration (requires name)
  push     - Apply local migrations to database
  status   - Check database connection status
  sync     - Full sync (pull schema + generate types)

Examples:
  node scripts/db-utils.js pull
  node scripts/db-utils.js types
  node scripts/db-utils.js create "add_user_preferences"
  node scripts/db-utils.js push
  node scripts/db-utils.js sync
        `);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

export default DatabaseManager;
