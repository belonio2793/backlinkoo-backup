/**
 * Check if SQL commands were executed successfully
 * Can be run in browser console or called from components
 */

import { supabase } from '@/integrations/supabase/client';

export async function checkSchemaExecution(): Promise<boolean> {
  console.log('🔍 Checking if SQL commands were executed...');
  
  try {
    // First check which columns exist to avoid selection errors
    const { data: columnInfo, error: columnError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'automation_campaigns'
          AND table_schema = 'public'
          AND column_name IN ('started_at', 'completed_at', 'auto_start');
        `
      });

    // Handle the exec_sql response properly - it might be wrapped in an array or object
    let existingColumns: string[] = [];

    if (columnInfo) {
      if (Array.isArray(columnInfo)) {
        existingColumns = columnInfo.map(col => col.column_name);
      } else if (columnInfo.length !== undefined) {
        // Handle case where data is returned as array-like object
        existingColumns = Array.from(columnInfo as any).map((col: any) => col.column_name);
      } else {
        console.warn('Unexpected columnInfo format:', typeof columnInfo, columnInfo);
      }
    }

    console.log('📋 Existing columns:', existingColumns);

    // Build select query with only existing columns
    const baseColumns = ['id', 'name', 'status', 'created_at'];
    const optionalColumns = ['started_at', 'completed_at', 'auto_start'].filter(col =>
      existingColumns.includes(col)
    );
    const selectColumns = [...baseColumns, ...optionalColumns].join(', ');

    const { data: testData, error: testError } = await supabase
      .from('automation_campaigns')
      .select(selectColumns)
      .limit(1);

    if (testError) {
      console.error('❌ Database error:', testError.message);
      return false;
    }

    // Check for missing required columns
    const requiredColumns = ['started_at', 'completed_at', 'auto_start'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.error(`❌ Missing columns: ${missingColumns.join(', ')}`);
      console.log('🔧 Run these SQL commands to fix:');
      missingColumns.forEach(col => {
        const dataType = col === 'auto_start' ? 'BOOLEAN DEFAULT false' : 'TIMESTAMPTZ NULL';
        console.log(`ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS ${col} ${dataType};`);
      });
      return false;
    }

    console.log('✅ Schema check passed - started_at column exists');
    
    // Get detailed schema information
    const { data: schemaInfo, error: schemaError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'automation_campaigns' 
          AND table_schema = 'public'
          AND column_name IN ('started_at', 'completed_at', 'auto_start')
          ORDER BY column_name;
        `
      });

    if (!schemaError && schemaInfo) {
      console.log('📊 Found columns:');
      console.table(schemaInfo);
    }

    // Test actual campaign functionality
    if (testData && testData.length > 0) {
      const campaign = testData[0];
      console.log('📋 Sample campaign data:');
      console.log({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        started_at: campaign.started_at,
        completed_at: campaign.completed_at,
        auto_start: campaign.auto_start
      });
    }

    console.log('🎉 SQL commands appear to have been executed successfully');
    return true;

  } catch (error) {
    console.error('❌ Schema check failed:', error);
    return false;
  }
}

export async function testCampaignUpdate() {
  console.log('🧪 Testing campaign update functionality...');
  
  try {
    // Get the first campaign
    const { data: campaigns, error } = await supabase
      .from('automation_campaigns')
      .select('id, name, status, started_at')
      .limit(1);

    if (error) {
      console.error('❌ Failed to get campaigns:', error.message);
      return false;
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('⚠️ No campaigns found to test');
      return true;
    }

    const campaign = campaigns[0];
    console.log(`🎯 Testing with campaign: ${campaign.name}`);

    // Try to update with started_at field
    const { error: updateError } = await supabase
      .from('automation_campaigns')
      .update({ 
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign.id);

    if (updateError) {
      if (updateError.message.includes('started_at')) {
        console.error('❌ Update failed - started_at column missing');
        return false;
      } else {
        console.error('❌ Update failed:', updateError.message);
        return false;
      }
    }

    console.log('✅ Campaign update test passed');
    return true;

  } catch (error) {
    console.error('❌ Campaign update test failed:', error);
    return false;
  }
}

// Add to window for easy browser console access
if (typeof window !== 'undefined') {
  (window as any).checkSchemaExecution = checkSchemaExecution;
  (window as any).testCampaignUpdate = testCampaignUpdate;
  
  // Auto-run check in development
  if (import.meta.env.DEV) {
    setTimeout(() => {
      console.log('🔍 Auto-running schema execution check...');
      checkSchemaExecution();
    }, 2000);
  }
}

export default { checkSchemaExecution, testCampaignUpdate };
