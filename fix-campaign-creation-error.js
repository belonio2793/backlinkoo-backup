#!/usr/bin/env node

/**
 * Fix for "expected JSON array" error in campaign creation
 * This script diagnoses and fixes the data type issues
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseCampaignTable() {
  console.log('🔍 Diagnosing automation_campaigns table...');
  
  try {
    // Check table structure
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default, is_nullable')
      .eq('table_name', 'automation_campaigns')
      .eq('table_schema', 'public');

    if (error) {
      console.error('❌ Error checking table structure:', error);
      return false;
    }

    console.log('📊 Current table structure:');
    columns?.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (default: ${col.column_default || 'NULL'}, nullable: ${col.is_nullable})`);
    });

    // Check specifically for array columns
    const arrayColumns = columns?.filter(col => 
      col.column_name === 'keywords' || 
      col.column_name === 'anchor_texts' || 
      col.column_name === 'target_sites_used' ||
      col.column_name === 'published_articles'
    );

    console.log('\n🎯 Array-related columns:');
    arrayColumns?.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

    return true;
  } catch (error) {
    console.error('❌ Error in diagnosis:', error);
    return false;
  }
}

async function fixTableSchema() {
  console.log('\n🔧 Fixing table schema...');
  
  const fixSQL = `
    -- Ensure automation_campaigns table has correct array columns
    DO $$
    BEGIN
      -- Add missing columns with correct types
      BEGIN
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS keywords TEXT[];
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      
      BEGIN
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS anchor_texts TEXT[];
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      
      BEGIN
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS target_sites_used TEXT[] DEFAULT '{}';
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      
      BEGIN
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS published_articles JSONB DEFAULT '[]'::jsonb;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      
      BEGIN
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS links_built INTEGER DEFAULT 0;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      
      BEGIN
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS available_sites INTEGER DEFAULT 0;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      
      BEGIN
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      
      BEGIN
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      
      BEGIN
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS current_platform TEXT;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      
      BEGIN
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS execution_progress JSONB DEFAULT '{}'::jsonb;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      
      RAISE NOTICE '✅ All columns ensured to exist with correct types';
    END $$;
    
    -- Ensure proper defaults for array columns
    UPDATE automation_campaigns 
    SET target_sites_used = '{}' 
    WHERE target_sites_used IS NULL;
    
    UPDATE automation_campaigns 
    SET published_articles = '[]'::jsonb 
    WHERE published_articles IS NULL;
    
    UPDATE automation_campaigns 
    SET execution_progress = '{}'::jsonb 
    WHERE execution_progress IS NULL;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: fixSQL });
    
    if (error) {
      console.error('❌ Error executing schema fix:', error);
      return false;
    }
    
    console.log('✅ Schema fix completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Exception during schema fix:', error);
    return false;
  }
}

async function testCampaignCreation() {
  console.log('\n🧪 Testing campaign creation...');
  
  const testCampaign = {
    name: 'Test Campaign - Fix Validation',
    engine_type: 'web2_platforms',
    keywords: ['test keyword', 'seo tools'],
    anchor_texts: ['test anchor', 'click here'],
    target_url: 'https://example.com',
    user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
    status: 'draft',
    auto_start: false,
    links_built: 0,
    available_sites: 4,
    target_sites_used: [],
    published_articles: [],
    started_at: null
  };

  console.log('📝 Test data:', {
    keywords: Array.isArray(testCampaign.keywords) ? `Array[${testCampaign.keywords.length}]` : typeof testCampaign.keywords,
    anchor_texts: Array.isArray(testCampaign.anchor_texts) ? `Array[${testCampaign.anchor_texts.length}]` : typeof testCampaign.anchor_texts,
    target_sites_used: Array.isArray(testCampaign.target_sites_used) ? `Array[${testCampaign.target_sites_used.length}]` : typeof testCampaign.target_sites_used,
    published_articles: Array.isArray(testCampaign.published_articles) ? `Array[${testCampaign.published_articles.length}]` : typeof testCampaign.published_articles
  });

  try {
    const { data, error } = await supabase
      .from('automation_campaigns')
      .insert(testCampaign)
      .select()
      .single();

    if (error) {
      console.error('❌ Test campaign creation failed:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }

    console.log('✅ Test campaign created successfully!');
    console.log('📋 Created campaign ID:', data.id);
    
    // Clean up test campaign
    await supabase
      .from('automation_campaigns')
      .delete()
      .eq('id', data.id);
    
    console.log('🧹 Test campaign cleaned up');
    return true;
    
  } catch (error) {
    console.error('❌ Exception during test:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting campaign creation error fix...\n');
  
  const diagnosisSuccess = await diagnoseCampaignTable();
  if (!diagnosisSuccess) {
    console.log('❌ Diagnosis failed, cannot proceed');
    process.exit(1);
  }
  
  const schemaSuccess = await fixTableSchema();
  if (!schemaSuccess) {
    console.log('❌ Schema fix failed');
    process.exit(1);
  }
  
  const testSuccess = await testCampaignCreation();
  if (!testSuccess) {
    console.log('❌ Test campaign creation still failing');
    console.log('\n📋 Manual steps may be required:');
    console.log('1. Check Supabase dashboard for table structure');
    console.log('2. Ensure all columns have correct data types');
    console.log('3. Check RLS policies for automation_campaigns table');
    process.exit(1);
  }
  
  console.log('\n🎉 Campaign creation error fix completed successfully!');
  console.log('✅ The "expected JSON array" error should now be resolved');
}

main().catch(console.error);
