#!/usr/bin/env node

/**
 * EMERGENCY FIX for "expected JSON array" errors
 * This fixes columns that are TEXT instead of TEXT[]
 * Run: node scripts/fix-array-columns-emergency.js
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

async function checkCurrentSchema() {
  console.log('🔍 Checking current schema...');
  
  try {
    // Check current column data types
    const { data: columns, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name IN ('keywords', 'anchor_texts', 'target_sites_used', 'available_sites');
      `
    });
    
    if (error) throw error;
    
    console.log('📋 Current schema for array columns:');
    columns.forEach(col => {
      const expectedType = col.column_name === 'available_sites' ? 'integer' : 'ARRAY';
      const status = col.data_type.includes('ARRAY') || col.data_type === 'integer' ? '✅' : '❌';
      console.log(`  ${status} ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    return columns;
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
    return null;
  }
}

async function fixArrayColumns() {
  console.log('\n🔧 Fixing array column data types...');
  
  const fixes = [
    {
      column: 'keywords',
      description: 'Convert keywords from TEXT to TEXT[]',
      sql: `
        -- Step 1: Create a backup column
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS keywords_backup TEXT;
        
        -- Step 2: Copy existing data to backup
        UPDATE automation_campaigns SET keywords_backup = keywords::TEXT WHERE keywords IS NOT NULL;
        
        -- Step 3: Drop the existing column
        ALTER TABLE automation_campaigns DROP COLUMN IF EXISTS keywords;
        
        -- Step 4: Recreate as TEXT[] with proper default
        ALTER TABLE automation_campaigns ADD COLUMN keywords TEXT[] DEFAULT '{}' NOT NULL;
        
        -- Step 5: Convert backup data back (handle both string and array formats)
        UPDATE automation_campaigns 
        SET keywords = 
          CASE 
            WHEN keywords_backup IS NULL OR keywords_backup = '' THEN '{}'::TEXT[]
            WHEN keywords_backup LIKE '{%}' THEN keywords_backup::TEXT[]
            ELSE ARRAY[keywords_backup]
          END
        WHERE keywords_backup IS NOT NULL;
        
        -- Step 6: Clean up backup column
        ALTER TABLE automation_campaigns DROP COLUMN keywords_backup;
      `
    },
    {
      column: 'anchor_texts',
      description: 'Convert anchor_texts from TEXT to TEXT[]',
      sql: `
        -- Step 1: Create a backup column
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS anchor_texts_backup TEXT;
        
        -- Step 2: Copy existing data to backup
        UPDATE automation_campaigns SET anchor_texts_backup = anchor_texts::TEXT WHERE anchor_texts IS NOT NULL;
        
        -- Step 3: Drop the existing column
        ALTER TABLE automation_campaigns DROP COLUMN IF EXISTS anchor_texts;
        
        -- Step 4: Recreate as TEXT[] with proper default
        ALTER TABLE automation_campaigns ADD COLUMN anchor_texts TEXT[] DEFAULT '{}' NOT NULL;
        
        -- Step 5: Convert backup data back (handle both string and array formats)
        UPDATE automation_campaigns 
        SET anchor_texts = 
          CASE 
            WHEN anchor_texts_backup IS NULL OR anchor_texts_backup = '' THEN '{}'::TEXT[]
            WHEN anchor_texts_backup LIKE '{%}' THEN anchor_texts_backup::TEXT[]
            ELSE ARRAY[anchor_texts_backup]
          END
        WHERE anchor_texts_backup IS NOT NULL;
        
        -- Step 6: Clean up backup column
        ALTER TABLE automation_campaigns DROP COLUMN anchor_texts_backup;
      `
    },
    {
      column: 'target_sites_used',
      description: 'Ensure target_sites_used is TEXT[]',
      sql: `
        -- Add target_sites_used as TEXT[] if it doesn't exist
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS target_sites_used TEXT[] DEFAULT '{}';
        
        -- If it exists but is wrong type, fix it
        DO $$
        DECLARE
          col_type TEXT;
        BEGIN
          SELECT data_type INTO col_type
          FROM information_schema.columns
          WHERE table_name = 'automation_campaigns' AND column_name = 'target_sites_used';
          
          IF col_type IS NOT NULL AND col_type != 'ARRAY' THEN
            -- Create backup and recreate
            ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS target_sites_used_backup TEXT;
            UPDATE automation_campaigns SET target_sites_used_backup = target_sites_used::TEXT WHERE target_sites_used IS NOT NULL;
            ALTER TABLE automation_campaigns DROP COLUMN target_sites_used;
            ALTER TABLE automation_campaigns ADD COLUMN target_sites_used TEXT[] DEFAULT '{}';
            UPDATE automation_campaigns 
            SET target_sites_used = 
              CASE 
                WHEN target_sites_used_backup IS NULL OR target_sites_used_backup = '' THEN '{}'::TEXT[]
                WHEN target_sites_used_backup LIKE '{%}' THEN target_sites_used_backup::TEXT[]
                ELSE ARRAY[target_sites_used_backup]
              END
            WHERE target_sites_used_backup IS NOT NULL;
            ALTER TABLE automation_campaigns DROP COLUMN target_sites_used_backup;
          END IF;
        END $$;
      `
    }
  ];

  for (const fix of fixes) {
    console.log(`\n🔧 ${fix.description}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { query: fix.sql });
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ ${fix.column} fixed successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to fix ${fix.column}:`, error.message);
      console.log(`\n📋 Manual SQL needed for ${fix.column}:`);
      console.log(fix.sql);
      console.log('\n');
    }
  }
}

async function testArrayInsertion() {
  console.log('\n🧪 Testing array insertion...');
  
  try {
    // Try to insert test data with arrays
    const testData = {
      name: 'ARRAY_TEST_DELETE_ME',
      engine_type: 'web2_platforms',
      user_id: '00000000-0000-0000-0000-000000000000', // Will be filtered by RLS
      status: 'draft',
      auto_start: false,
      keywords: ['test', 'keyword', 'array'],
      anchor_texts: ['test anchor', 'click here', 'read more'],
      target_url: 'https://example.com',
      target_sites_used: ['example1.com', 'example2.com']
    };

    console.log('Attempting array insertion...');
    
    // Use service role to bypass RLS for testing
    const { data, error } = await supabase
      .from('automation_campaigns')
      .insert(testData)
      .select('id, keywords, anchor_texts, target_sites_used')
      .single();

    if (error) {
      console.error('❌ Array insertion failed:', error.message);
      if (error.code) console.error('   Error code:', error.code);
      if (error.details) console.error('   Details:', error.details);
      if (error.hint) console.error('   Hint:', error.hint);
      return false;
    } else {
      console.log('✅ Array insertion successful!');
      console.log('   Keywords:', data.keywords);
      console.log('   Anchor texts:', data.anchor_texts);
      console.log('   Target sites used:', data.target_sites_used);
      
      // Clean up test data
      await supabase.from('automation_campaigns').delete().eq('id', data.id);
      console.log('✅ Test data cleaned up');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Array test failed:', error.message);
    return false;
  }
}

async function addMissingColumns() {
  console.log('\n🔧 Adding any missing columns...');
  
  const columnSql = `
    -- Add all missing columns with proper defaults
    ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS links_built INTEGER DEFAULT 0;
    ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS available_sites INTEGER DEFAULT 0;
    ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS published_articles JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;
    ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;
    ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS current_platform TEXT NULL;
    ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS execution_progress JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;
    
    -- Ensure proper defaults for existing records
    UPDATE automation_campaigns 
    SET 
      links_built = COALESCE(links_built, 0),
      available_sites = COALESCE(available_sites, 0),
      published_articles = COALESCE(published_articles, '[]'::jsonb),
      execution_progress = COALESCE(execution_progress, '{}'::jsonb),
      auto_start = COALESCE(auto_start, false)
    WHERE 
      links_built IS NULL OR 
      available_sites IS NULL OR 
      published_articles IS NULL OR
      execution_progress IS NULL OR
      auto_start IS NULL;
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { query: columnSql });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Missing columns added successfully');
    
  } catch (error) {
    console.error('❌ Failed to add missing columns:', error.message);
  }
}

async function main() {
  console.log('🚨 EMERGENCY ARRAY COLUMN FIX TOOL');
  console.log('This tool fixes "expected JSON array" errors by converting TEXT columns to TEXT[]');
  console.log('');
  
  // Step 1: Check current schema
  const currentSchema = await checkCurrentSchema();
  
  if (!currentSchema) {
    console.error('❌ Cannot proceed without schema information');
    process.exit(1);
  }
  
  // Step 2: Fix array columns
  await fixArrayColumns();
  
  // Step 3: Add any missing columns
  await addMissingColumns();
  
  // Step 4: Test the fix
  const testPassed = await testArrayInsertion();
  
  // Step 5: Final schema check
  console.log('\n🔍 Final schema verification...');
  await checkCurrentSchema();
  
  console.log('\n📋 Summary:');
  if (testPassed) {
    console.log('✅ Array insertion test PASSED - schema is now correct!');
    console.log('✅ Your application should now work without "expected JSON array" errors');
  } else {
    console.log('❌ Array insertion test FAILED - manual intervention needed');
    console.log('');
    console.log('🔧 MANUAL FIX REQUIRED:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the SQL commands that were logged above');
    console.log('4. Or contact support for assistance');
  }
}

main().catch(console.error);
