/**
 * Debug script to diagnose user reports issues
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseTables() {
  console.log('🔍 Diagnosing database tables...\n');

  // Check if campaign_reports table exists
  console.log('1. Checking campaign_reports table...');
  try {
    const { data, error } = await supabase
      .from('campaign_reports')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('�� Campaign reports table error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('✅ Campaign reports table accessible');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  // Check table schema
  console.log('\n2. Checking table schema...');
  try {
    const { data, error } = await supabase
      .rpc('get_table_schema', { table_name: 'campaign_reports' });
    
    if (error) {
      console.log('⚠️ Could not fetch schema (function might not exist)');
    } else {
      console.log('📋 Table schema available');
    }
  } catch (error) {
    console.log('⚠️ Schema check failed (expected if RPC function not available)');
  }

  // Test authentication
  console.log('\n3. Testing authentication...');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Auth error:', error.message);
    } else if (user) {
      console.log('✅ User authenticated:', user.id);
      
      // Test actual getUserReports query
      console.log('\n4. Testing getUserReports query...');
      try {
        const { data, error } = await supabase
          .from('campaign_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('generated_at', { ascending: false });

        if (error) {
          console.error('❌ Query error:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
        } else {
          console.log('✅ Query successful, found', data?.length || 0, 'reports');
        }
      } catch (error) {
        console.error('❌ Unexpected query error:', error);
      }
    } else {
      console.log('⚠️ No authenticated user');
    }
  } catch (error) {
    console.error('❌ Auth check failed:', error);
  }
}

// Run diagnostics
diagnoseTables()
  .then(() => {
    console.log('\n🏁 Diagnostics complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Diagnostics failed:', error);
    process.exit(1);
  });
