/**
 * Check if SQL commands were executed successfully
 * Can be run in browser console or called from components
 */

import { supabase } from '@/integrations/supabase/client';

export async function checkSchemaExecution(): Promise<boolean> {
  console.log('🔍 Checking if SQL commands were executed...');
  
  try {
    // Check if started_at column exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('automation_campaigns')
      .select('id, name, status, started_at, completed_at, auto_start, created_at')
      .limit(1);

    if (testError) {
      if (testError.message.includes('started_at')) {
        console.error('❌ started_at column missing - SQL not executed');
        console.log('🔧 Run the SQL commands from add-missing-columns.sql');
        return false;
      } else {
        console.error('❌ Other database error:', testError.message);
        return false;
      }
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
