#!/usr/bin/env node

/**
 * Fix Missing Columns in automation_campaigns table
 * 
 * This script adds the missing columns: started_at, completed_at, auto_start
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExistingColumns() {
  console.log('🔍 Checking existing columns in automation_campaigns table...');
  
  try {
    // Try using exec_sql first
    let columnInfo;
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'automation_campaigns'
          AND table_schema = 'public'
          AND column_name IN ('started_at', 'completed_at', 'auto_start')
          ORDER BY column_name;
        `
      });
      
      if (error && error.message.includes('exec_sql')) {
        throw new Error('exec_sql function not available');
      }
      
      columnInfo = data;
    } catch (execSqlError) {
      console.log('⚠️ exec_sql not available, using fallback method...');
      
      // Fallback: try to select each column to see if it exists
      const requiredColumns = ['started_at', 'completed_at', 'auto_start'];
      const existingColumns = [];
      
      for (const col of requiredColumns) {
        try {
          const { error } = await supabase
            .from('automation_campaigns')
            .select(col)
            .limit(1);
            
          if (!error) {
            existingColumns.push({
              column_name: col,
              data_type: col === 'auto_start' ? 'boolean' : 'timestamp with time zone',
              is_nullable: 'YES'
            });
          }
        } catch (e) {
          // Column doesn't exist
        }
      }
      
      columnInfo = existingColumns;
    }

    const existingColumnNames = columnInfo ? columnInfo.map(col => col.column_name) : [];
    const requiredColumns = ['started_at', 'completed_at', 'auto_start'];
    const missingColumns = requiredColumns.filter(col => !existingColumnNames.includes(col));

    console.log('📋 Current columns:', existingColumnNames);
    console.log('❌ Missing columns:', missingColumns);

    return { existingColumns: existingColumnNames, missingColumns };
    
  } catch (error) {
    console.error('❌ Error checking columns:', error.message);
    throw error;
  }
}

async function addMissingColumns(missingColumns) {
  if (missingColumns.length === 0) {
    console.log('✅ All required columns already exist');
    return true;
  }

  console.log(`🔧 Adding ${missingColumns.length} missing columns...`);

  const columnDefinitions = {
    'started_at': 'TIMESTAMPTZ NULL',
    'completed_at': 'TIMESTAMPTZ NULL', 
    'auto_start': 'BOOLEAN DEFAULT false NOT NULL'
  };

  try {
    // Try using exec_sql first
    try {
      const alterStatements = missingColumns.map(col => 
        `ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS ${col} ${columnDefinitions[col]};`
      ).join('\n');

      const { error } = await supabase.rpc('exec_sql', {
        query: alterStatements
      });

      if (error && error.message.includes('exec_sql')) {
        throw new Error('exec_sql function not available');
      }

      if (error) {
        throw error;
      }

      console.log('✅ Successfully added columns using exec_sql');
      return true;
      
    } catch (execSqlError) {
      console.log('⚠️ exec_sql not available, trying alternative method...');
      
      // Alternative approach: try using the REST API directly
      // This is a workaround when exec_sql is not available
      
      console.log('🔧 Attempting to add columns through schema operations...');
      
      // For each missing column, try to add it by attempting an update operation
      // that will fail gracefully if the column doesn't exist
      for (const col of missingColumns) {
        try {
          // First try to insert a test record to see current schema
          const testData = {
            name: `test_schema_${Date.now()}`,
            target_url: 'https://test.com',
            engine_type: 'test',
            status: 'draft',
            keywords: ['test'],
            anchor_texts: ['test']
          };

          // Add the new column to test data
          if (col === 'started_at' || col === 'completed_at') {
            testData[col] = null;
          } else if (col === 'auto_start') {
            testData[col] = false;
          }

          const { data: insertData, error: insertError } = await supabase
            .from('automation_campaigns')
            .insert(testData)
            .select()
            .single();

          if (insertError) {
            if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
              console.log(`❌ Column ${col} confirmed missing, but cannot add via REST API`);
            } else {
              console.log(`✅ Column ${col} appears to exist`);
            }
          } else {
            // Clean up test record
            if (insertData) {
              await supabase
                .from('automation_campaigns')
                .delete()
                .eq('id', insertData.id);
            }
            console.log(`✅ Column ${col} exists and working`);
          }
        } catch (e) {
          console.log(`❌ Could not test column ${col}:`, e.message);
        }
      }

      // Return false to indicate manual intervention needed
      console.log('\n⚠️  MANUAL INTERVENTION REQUIRED');
      console.log('The missing columns could not be added automatically.');
      console.log('Please run these SQL commands manually in your Supabase SQL editor:\n');
      
      missingColumns.forEach(col => {
        console.log(`ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS ${col} ${columnDefinitions[col]};`);
      });
      
      console.log('\nOr create the exec_sql function first:');
      console.log(`
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE query;
  GET DIAGNOSTICS result = ROW_COUNT;
  RETURN json_build_object('rows_affected', result);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
END;
$$;
      `);

      return false;
    }
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
    throw error;
  }
}

async function verifyColumns() {
  console.log('🧪 Verifying all columns are working...');
  
  try {
    // Test that we can select all required columns
    const { data, error } = await supabase
      .from('automation_campaigns')
      .select('id, name, status, started_at, completed_at, auto_start')
      .limit(1);

    if (error) {
      console.error('❌ Verification failed:', error.message);
      return false;
    }

    console.log('✅ All columns verified working');
    
    // Test that we can insert with all columns
    const testData = {
      name: `test_verification_${Date.now()}`,
      target_url: 'https://test-verification.com',
      engine_type: 'test',
      status: 'draft',
      keywords: ['test'],
      anchor_texts: ['test'],
      started_at: null,
      completed_at: null,
      auto_start: false
    };

    const { data: insertData, error: insertError } = await supabase
      .from('automation_campaigns')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert verification failed:', insertError.message);
      return false;
    }

    // Clean up test record
    if (insertData) {
      await supabase
        .from('automation_campaigns')
        .delete()
        .eq('id', insertData.id);
    }

    console.log('✅ Insert/delete verification passed');
    return true;

  } catch (error) {
    console.error('❌ Verification error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Fixing Missing Database Columns\n');
  
  try {
    // Step 1: Check what's missing
    const { existingColumns, missingColumns } = await checkExistingColumns();
    
    if (missingColumns.length === 0) {
      console.log('\n🎉 No missing columns found! Database is up to date.');
      return;
    }

    // Step 2: Add missing columns
    const success = await addMissingColumns(missingColumns);
    
    if (!success) {
      console.log('\n❌ Automatic fix failed. Manual intervention required.');
      process.exit(1);
    }

    // Step 3: Verify everything works
    const verified = await verifyColumns();
    
    if (!verified) {
      console.log('\n❌ Verification failed. Columns may not be working correctly.');
      process.exit(1);
    }

    console.log('\n🎉 Successfully fixed all missing columns!');
    console.log('\nColumns added:');
    missingColumns.forEach(col => {
      console.log(`  ✅ ${col}`);
    });
    
    console.log('\n🎯 Your automation system should now work correctly.');
    
  } catch (error) {
    console.error('\n❌ Failed to fix missing columns:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Verify your Supabase credentials are correct');
    console.log('2. Ensure the service role key has admin permissions');
    console.log('3. Check that the automation_campaigns table exists');
    console.log('4. Try running the SQL commands manually in Supabase SQL editor');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkExistingColumns, addMissingColumns, verifyColumns };
