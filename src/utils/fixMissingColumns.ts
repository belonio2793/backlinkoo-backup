/**
 * Fix Missing Columns - Browser-based Database Fix
 * 
 * Attempts to add missing columns to automation_campaigns table
 * Can be run from browser console when SQL Editor isn't accessible
 */

import { supabase } from '@/integrations/supabase/client';

export async function fixMissingColumns(): Promise<boolean> {
  console.log('🔧 Attempting to fix missing columns...');
  
  const sqlCommands = [
    'ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;',
    'ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;',
    'ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;'
  ];

  try {
    // Try using RPC function to execute SQL
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`Executing: ${command}`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        query: command
      });

      if (error) {
        console.error(`❌ Failed to execute command ${i + 1}:`, error.message);
        if (error.message.includes('permission denied') || error.message.includes('not found')) {
          console.log('💡 RPC method failed. You need to run SQL manually in Supabase SQL Editor.');
          return false;
        }
      } else {
        console.log(`✅ Command ${i + 1} executed successfully`);
      }
    }

    // Verify the columns were added
    const verification = await verifyColumnsExist();
    if (verification) {
      console.log('🎉 All missing columns have been added successfully!');
      return true;
    } else {
      console.log('❌ Columns were not added properly');
      return false;
    }

  } catch (error) {
    console.error('❌ Error fixing columns:', error);
    console.log('💡 Auto-fix failed. Please run SQL manually.');
    return false;
  }
}

export async function verifyColumnsExist(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('automation_campaigns')
      .select('id, started_at, completed_at, auto_start')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ Columns still missing');
        return false;
      }
      console.error('❌ Verification error:', error.message);
      return false;
    }

    console.log('✅ All required columns exist');
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

export function showManualInstructions() {
  console.log('📋 MANUAL FIX INSTRUCTIONS:');
  console.log('');
  console.log('1. Open Supabase Dashboard');
  console.log('2. Go to SQL Editor');
  console.log('3. Copy and paste this SQL:');
  console.log('');
  console.log('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;');
  console.log('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;');
  console.log('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;');
  console.log('');
  console.log('4. Click "Run" button');
  console.log('5. Refresh this page');
  console.log('');
  console.log('🔗 Supabase Dashboard: https://supabase.com/dashboard');
}

// Add to window for easy browser console access
if (typeof window !== 'undefined') {
  (window as any).fixMissingColumns = fixMissingColumns;
  (window as any).verifyColumnsExist = verifyColumnsExist;
  (window as any).showManualInstructions = showManualInstructions;
  
  // Auto-attempt fix in development
  if (import.meta.env.DEV) {
    setTimeout(async () => {
      const columnsExist = await verifyColumnsExist();
      if (!columnsExist) {
        console.log('🔧 Missing columns detected. Attempting auto-fix...');
        const fixed = await fixMissingColumns();
        if (!fixed) {
          showManualInstructions();
        }
      }
    }, 3000);
  }
}

export default { fixMissingColumns, verifyColumnsExist, showManualInstructions };
