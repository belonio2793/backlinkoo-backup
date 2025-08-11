#!/usr/bin/env node

/**
 * Check if the SQL commands were executed successfully
 * Verifies that the started_at column exists in automation_campaigns table
 */

import { createClient } from '@supabase/supabase-js';
import { SecureConfig } from './src/lib/secure-config.ts';

// Get Supabase configuration
const envUrl = process.env.VITE_SUPABASE_URL;
const envKey = process.env.VITE_SUPABASE_ANON_KEY;

const SUPABASE_URL = envUrl || SecureConfig.SUPABASE_URL;
const SUPABASE_ANON_KEY = envKey || SecureConfig.SUPABASE_ANON_KEY;

console.log('🔍 Checking if SQL commands were executed...');
console.log('URL:', SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'missing');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchemaExecution() {
  try {
    console.log('\n📋 Checking automation_campaigns table schema...');
    
    // Check if started_at column exists
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'automation_campaigns')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (error) {
      console.error('❌ Failed to check schema:', error.message);
      return false;
    }

    if (!columns || columns.length === 0) {
      console.error('❌ automation_campaigns table not found');
      return false;
    }

    console.log('\n📊 Current automation_campaigns table structure:');
    console.table(columns);

    // Check for specific required columns
    const requiredColumns = ['started_at', 'completed_at', 'auto_start'];
    const missingColumns = [];

    for (const requiredCol of requiredColumns) {
      const exists = columns.some(col => col.column_name === requiredCol);
      if (exists) {
        console.log(`✅ ${requiredCol} column exists`);
      } else {
        console.log(`❌ ${requiredCol} column missing`);
        missingColumns.push(requiredCol);
      }
    }

    // Test campaign functionality by trying to query campaigns
    console.log('\n🧪 Testing campaign table access...');
    
    const { data: campaigns, error: campaignError } = await supabase
      .from('automation_campaigns')
      .select('id, name, status, started_at, created_at')
      .limit(5);

    if (campaignError) {
      console.error('❌ Failed to query campaigns:', campaignError.message);
      return false;
    }

    console.log(`✅ Successfully queried campaigns (found ${campaigns?.length || 0} campaigns)`);
    
    if (campaigns && campaigns.length > 0) {
      console.log('\n📋 Sample campaign data:');
      campaigns.forEach(campaign => {
        console.log(`- ${campaign.name} (${campaign.status}) - started_at: ${campaign.started_at || 'NULL'}`);
      });
    }

    // Summary
    if (missingColumns.length === 0) {
      console.log('\n🎉 SUCCESS: All required columns exist in automation_campaigns table');
      console.log('✅ SQL commands appear to have been executed successfully');
      return true;
    } else {
      console.log(`\n⚠️  WARNING: ${missingColumns.length} columns still missing:`, missingColumns.join(', '));
      console.log('❌ SQL commands may not have been executed or failed');
      return false;
    }

  } catch (error) {
    console.error('❌ Error checking schema execution:', error.message);
    return false;
  }
}

// Run the check
checkSchemaExecution().then(success => {
  if (success) {
    console.log('\n🚀 Database schema is ready for campaign operations');
    process.exit(0);
  } else {
    console.log('\n🔧 Run the SQL commands from add-missing-columns.sql to fix the schema');
    process.exit(1);
  }
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
