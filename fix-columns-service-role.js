#!/usr/bin/env node

/**
 * Fix Missing Columns Using Service Role
 * 
 * This script uses the service role key to add missing columns
 * Run with: node fix-columns-service-role.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Try to get service role key from environment
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🔧 Attempting to fix missing columns with service role...');
console.log('URL:', SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'missing');
console.log('Service key:', SERVICE_ROLE_KEY ? 'available' : 'missing');

if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL not found in environment variables');
  console.log('Set VITE_SUPABASE_URL or SUPABASE_URL');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Service role key not found');
  console.log('Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  console.log('');
  console.log('🔧 MANUAL FIX REQUIRED:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Open SQL Editor');
  console.log('3. Run this SQL:');
  console.log('');
  console.log('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;');
  console.log('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;');
  console.log('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

async function fixMissingColumns() {
  try {
    console.log('📋 Adding missing columns...');
    
    const commands = [
      'ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;',
      'ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;',
      'ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;'
    ];

    for (let i = 0; i < commands.length; i++) {
      const sql = commands[i];
      console.log(`Executing: ${sql}`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        query: sql
      });
      
      if (error) {
        console.error(`❌ Command ${i + 1} failed:`, error.message);
      } else {
        console.log(`✅ Command ${i + 1} succeeded`);
      }
    }

    // Verify columns exist
    console.log('🔍 Verifying columns were added...');
    const { data: columns, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name IN ('started_at', 'completed_at', 'auto_start')
        ORDER BY column_name;
      `
    });

    if (error) {
      console.error('❌ Verification failed:', error.message);
    } else {
      console.log('📊 Found columns:');
      console.table(columns);
      
      if (columns && columns.length === 3) {
        console.log('✅ SUCCESS: All required columns have been added!');
        console.log('🎉 Your campaign functionality should now work properly');
      } else {
        console.log('⚠️ Some columns may still be missing');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('🔧 MANUAL FIX REQUIRED:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Open SQL Editor'); 
    console.log('3. Run the SQL commands shown above');
  }
}

fixMissingColumns();
