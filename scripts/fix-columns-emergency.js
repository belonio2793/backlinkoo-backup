#!/usr/bin/env node

/**
 * Emergency fix for missing database columns
 * Run: node scripts/fix-columns-emergency.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingColumns() {
  console.log('🔧 Adding missing columns to automation_campaigns...');

  const sql = `
    ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;
    ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;
    ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false NOT NULL;
  `;

  try {
    // Try using exec_sql function
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Missing columns added successfully');
    
    // Verify the fix
    const { data: columns, error: verifyError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name IN ('started_at', 'completed_at', 'auto_start');
      `
    });
    
    if (verifyError) {
      console.warn('⚠️ Could not verify columns, but fix likely succeeded');
    } else {
      console.log('✅ Verified columns:', columns?.map(c => c.column_name) || []);
    }
    
  } catch (error) {
    console.error('❌ Failed to add columns:', error.message);
    console.log('\n📋 Manual fix required - run this SQL in Supabase:');
    console.log(sql);
  }
}

fixMissingColumns().catch(console.error);
