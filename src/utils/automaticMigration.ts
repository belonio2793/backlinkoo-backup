/**
 * Automatic Database Migration
 * 
 * Attempts to fix missing columns automatically when the app loads
 */

import { supabase } from '@/integrations/supabase/client';

export async function runAutomaticMigration(): Promise<boolean> {
  console.log('🚀 Running automatic database migration...');
  
  try {
    // First check what's missing
    const missingColumns = await checkMissingColumns();
    
    if (missingColumns.length === 0) {
      console.log('✅ All columns exist - no migration needed');
      return true;
    }

    console.log(`🔧 Found missing columns: ${missingColumns.join(', ')}`);
    
    // Try to add the missing columns
    const success = await addMissingColumns(missingColumns);
    
    if (success) {
      console.log('✅ Automatic migration completed successfully!');
      return true;
    } else {
      console.log('❌ Automatic migration failed - manual intervention required');
      showManualFixInstructions();
      return false;
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    showManualFixInstructions();
    return false;
  }
}

async function checkMissingColumns(): Promise<string[]> {
  const requiredColumns = ['started_at', 'completed_at', 'auto_start'];
  const missingColumns: string[] = [];
  
  for (const column of requiredColumns) {
    try {
      // Try to select the column to see if it exists
      const { error } = await supabase
        .from('automation_campaigns')
        .select(`id, ${column}`)
        .limit(1);
        
      if (error && error.message.includes('does not exist')) {
        missingColumns.push(column);
      }
    } catch (error) {
      missingColumns.push(column);
    }
  }
  
  return missingColumns;
}

async function addMissingColumns(columns: string[]): Promise<boolean> {
  console.log('🔧 Attempting to add missing columns automatically...');
  
  const sqlCommands = columns.map(column => {
    if (column === 'auto_start') {
      return `ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS ${column} BOOLEAN DEFAULT false;`;
    } else {
      return `ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS ${column} TIMESTAMPTZ NULL;`;
    }
  });

  try {
    // Try using exec_sql function
    for (const sql of sqlCommands) {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: sql
      });
      
      if (error) {
        console.warn(`⚠️ Failed to execute: ${sql}`);
        console.warn('Error:', error.message);
        
        if (error.message.includes('permission denied') || 
            error.message.includes('function exec_sql does not exist')) {
          return false; // Can't auto-fix, need manual intervention
        }
      } else {
        console.log(`✅ Added column: ${sql.match(/ADD COLUMN IF NOT EXISTS (\w+)/)?.[1]}`);
      }
    }
    
    // Verify the columns were added
    const stillMissing = await checkMissingColumns();
    return stillMissing.length === 0;
    
  } catch (error) {
    console.error('Failed to add columns automatically:', error);
    return false;
  }
}

function showManualFixInstructions() {
  console.log('\n🔧 MANUAL FIX REQUIRED');
  console.log('═══════════════════════');
  console.log('');
  console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Go to SQL Editor');
  console.log('3. Copy and paste this SQL:');
  console.log('');
  console.log('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;');
  console.log('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;');
  console.log('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;');
  console.log('');
  console.log('4. Click Run');
  console.log('5. Refresh this page');
  console.log('');
  console.log('🔗 Or open this file for visual guide: fix-database-now.html');
}

// Add to window for manual access
if (typeof window !== 'undefined') {
  (window as any).runAutomaticMigration = runAutomaticMigration;
  (window as any).showManualFixInstructions = showManualFixInstructions;
}

export default runAutomaticMigration;
