/**
 * Direct Database Fix
 * 
 * Simple, direct approach to fix missing columns immediately
 */

import { supabase } from '@/integrations/supabase/client';

export async function fixDatabaseNow(): Promise<void> {
  console.log('🔧 DIRECT DATABASE FIX STARTING...');
  
  const sqlCommands = [
    'ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL',
    'ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL', 
    'ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false'
  ];

  // Try each command individually
  for (let i = 0; i < sqlCommands.length; i++) {
    const sql = sqlCommands[i];
    console.log(`Executing: ${sql}`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: sql
      });
      
      if (error) {
        console.error(`❌ Command ${i + 1} failed:`, error.message);
      } else {
        console.log(`✅ Command ${i + 1} succeeded`);
      }
    } catch (error) {
      console.error(`❌ Command ${i + 1} exception:`, error);
    }
  }

  // Test if columns exist now
  try {
    const { data, error } = await supabase
      .from('automation_campaigns')
      .select('id, started_at, completed_at, auto_start')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.error('❌ Columns still missing after fix attempt');
        showManualInstructions();
      } else {
        console.error('❌ Other error:', error.message);
      }
    } else {
      console.log('✅ ALL COLUMNS NOW EXIST! Database fix successful!');
      console.log('🎉 You can now use campaign features normally');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    showManualInstructions();
  }
}

function showManualInstructions(): void {
  console.log('\n🚨 MANUAL FIX REQUIRED - AUTO FIX FAILED');
  console.log('═════════════════════════════════════════');
  console.log('');
  console.log('1. Open: https://supabase.com/dashboard');
  console.log('2. Go to: SQL Editor');
  console.log('3. Paste this SQL:');
  console.log('');
  console.log('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;');
  console.log('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;');
  console.log('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;');
  console.log('');
  console.log('4. Click "Run"');
  console.log('5. Refresh this page');
  console.log('');
  console.log('📋 Copy the SQL above and paste it in Supabase SQL Editor');
}

// Add to window immediately
if (typeof window !== 'undefined') {
  (window as any).fixDatabaseNow = fixDatabaseNow;
  
  // Run immediately when script loads
  setTimeout(() => {
    console.log('🚀 Running direct database fix...');
    fixDatabaseNow();
  }, 500);
}

export default fixDatabaseNow;
