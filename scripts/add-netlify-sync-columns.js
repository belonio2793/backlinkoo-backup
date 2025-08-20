/**
 * Add Netlify sync tracking columns to domains table
 * Run this script to add the necessary columns for Netlify domain sync
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addNetlifySyncColumns() {
  console.log('🔧 Adding Netlify sync columns to domains table...');

  try {
    // Add netlify_id column
    console.log('Adding netlify_id column...');
    const { error: netlifyIdError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE domains 
        ADD COLUMN IF NOT EXISTS netlify_id TEXT;
      `
    });

    if (netlifyIdError) {
      console.warn('netlify_id column may already exist:', netlifyIdError.message);
    } else {
      console.log('✅ Added netlify_id column');
    }

    // Add netlify_synced column
    console.log('Adding netlify_synced column...');
    const { error: netlifyyncedError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE domains 
        ADD COLUMN IF NOT EXISTS netlify_synced BOOLEAN DEFAULT FALSE;
      `
    });

    if (netlifyyncedError) {
      console.warn('netlify_synced column may already exist:', netlifyyncedError.message);
    } else {
      console.log('✅ Added netlify_synced column');
    }

    // Create index on netlify_id for better performance
    console.log('Creating index on netlify_id...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_domains_netlify_id 
        ON domains(netlify_id);
      `
    });

    if (indexError) {
      console.warn('Index may already exist:', indexError.message);
    } else {
      console.log('✅ Created index on netlify_id');
    }

    // Verify the columns were added
    console.log('🔍 Verifying columns...');
    const { data: columns, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'domains' 
        AND column_name IN ('netlify_id', 'netlify_synced')
        ORDER BY column_name;
      `
    });

    if (verifyError) {
      console.error('❌ Error verifying columns:', verifyError);
    } else {
      console.log('✅ Column verification:');
      console.table(columns);
    }

    console.log('\n🎉 Netlify sync columns successfully added!');
    console.log('\nNext steps:');
    console.log('1. Go to /domains page');
    console.log('2. Configure your Netlify API token');
    console.log('3. Sync leadpages.org to Netlify');
    console.log('4. Enable automatic SSL and propagation');

  } catch (error) {
    console.error('❌ Error adding Netlify sync columns:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Starting Netlify sync column migration...\n');
  
  try {
    await addNetlifySyncColumns();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { addNetlifySyncColumns };
