#!/usr/bin/env node

/**
 * Create affiliate_programs table script
 * Run this as an administrator to set up the affiliate system
 */

import { createClient } from '@supabase/supabase-js';
import { SecureConfig } from '../src/lib/secure-config.ts';

// Get configuration
const config = SecureConfig.getConfig();
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

console.log('🚀 Creating affiliate_programs table...');
console.log('📍 Database:', config.supabase.url);

async function createAffiliateTable() {
  try {
    // First check if table already exists
    console.log('🔍 Checking if table exists...');
    const { data: existsData, error: existsError } = await supabase
      .from('affiliate_programs')
      .select('id')
      .limit(1);

    if (!existsError) {
      console.log('✅ affiliate_programs table already exists');
      console.log('📊 Current records:', existsData?.length || 0);
      return true;
    }

    if (existsError.code !== '42P01') {
      console.error('❌ Unexpected error:', existsError);
      return false;
    }

    console.log('📋 Table does not exist, attempting to create...');
    
    // Try to use the migration content
    console.log('💡 To create the table, please run the SQL migration:');
    console.log('');
    console.log('📁 File: supabase/migrations/20241223000000_create_affiliate_tables_final.sql');
    console.log('');
    console.log('🔧 Methods to run the migration:');
    console.log('1. Use Supabase CLI: supabase db push');
    console.log('2. Copy and paste the SQL into Supabase Dashboard > SQL Editor');
    console.log('3. Use your database administration tool');
    console.log('');
    console.log('📋 The migration creates:');
    console.log('  • affiliate_programs table');
    console.log('  • affiliate_referrals table');
    console.log('  • affiliate_payments table');
    console.log('  • affiliate_clicks table');
    console.log('  • RLS policies for security');
    console.log('  • Indexes for performance');
    console.log('');
    
    return false;

  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Execute the creation
createAffiliateTable().then(success => {
  if (success) {
    console.log('🎉 Affiliate system is ready!');
    process.exit(0);
  } else {
    console.log('⚠️  Manual setup required - see instructions above');
    process.exit(1);
  }
});
