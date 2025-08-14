/**
 * Emergency Database Fix Utility
 * Adds missing columns to automation_campaigns table
 */

import { supabase } from '@/integrations/supabase/client';

export class EmergencyDatabaseFix {
  /**
   * Add missing columns to automation_campaigns table
   */
  static async fixMissingColumns(): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      console.log('🚨 Starting emergency database fix for missing columns...');
      
      // Check if columns exist first
      const { data: existingColumns, error: checkError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'automation_campaigns')
        .in('column_name', ['started_at', 'completed_at', 'auto_start']);

      if (checkError) {
        console.error('Failed to check existing columns:', checkError);
      } else {
        console.log('Existing columns:', existingColumns);
      }

      // Use SQL to add missing columns
      const addColumnsSql = `
        -- Add missing columns if they don't exist
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;
        
        -- Add other potentially missing columns
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS links_built INTEGER DEFAULT 0;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS available_sites INTEGER DEFAULT 0;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS target_sites_used TEXT[] DEFAULT '{}';
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS current_platform TEXT NULL;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS execution_progress JSONB NULL;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS published_articles JSONB DEFAULT '[]';
      `;

      // Try using rpc to execute SQL
      const { data: rpcResult, error: rpcError } = await supabase.rpc('exec_sql', {
        sql: addColumnsSql
      });

      if (rpcError) {
        console.warn('RPC method failed, trying alternative approach:', rpcError.message);
        
        // Alternative: Try direct insert/update to trigger column creation through ORM
        try {
          const testData = {
            name: 'TEMP_TEST_CAMPAIGN_FOR_COLUMN_FIX',
            keywords: ['test'],
            anchor_texts: ['test'],
            target_url: 'https://example.com',
            user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
            status: 'draft',
            started_at: null,
            completed_at: null,
            auto_start: false,
            links_built: 0,
            available_sites: 0,
            target_sites_used: [],
            current_platform: null,
            execution_progress: null,
            published_articles: []
          };

          const { data: insertResult, error: insertError } = await supabase
            .from('automation_campaigns')
            .insert(testData)
            .select();

          if (insertError) {
            throw new Error(`Insert test failed: ${insertError.message}`);
          }

          // Clean up test record
          if (insertResult && insertResult[0]) {
            await supabase
              .from('automation_campaigns')
              .delete()
              .eq('id', insertResult[0].id);
          }

          console.log('✅ Alternative fix approach successful - columns appear to be working');
          
          return {
            success: true,
            details: {
              method: 'insert_test',
              message: 'Columns fixed via insert test method'
            }
          };

        } catch (insertError) {
          console.error('Insert test also failed:', insertError);
          throw insertError;
        }
      } else {
        console.log('✅ SQL execution successful:', rpcResult);
        return {
          success: true,
          details: {
            method: 'rpc_sql',
            result: rpcResult
          }
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Emergency database fix failed:', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        details: error
      };
    }
  }

  /**
   * Verify that all required columns exist
   */
  static async verifyColumns(): Promise<{ success: boolean; missing: string[]; existing: string[] }> {
    try {
      const requiredColumns = [
        'started_at', 'completed_at', 'auto_start', 'links_built', 
        'available_sites', 'target_sites_used', 'current_platform', 
        'execution_progress', 'published_articles'
      ];

      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'automation_campaigns')
        .in('column_name', requiredColumns);

      if (error) {
        console.error('Failed to verify columns:', error);
        return { success: false, missing: requiredColumns, existing: [] };
      }

      const existingColumns = data?.map(col => col.column_name) || [];
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      console.log('Column verification:', {
        existing: existingColumns,
        missing: missingColumns
      });

      return {
        success: missingColumns.length === 0,
        missing: missingColumns,
        existing: existingColumns
      };

    } catch (error) {
      console.error('Column verification failed:', error);
      return { success: false, missing: [], existing: [] };
    }
  }

  /**
   * Run complete fix and verification
   */
  static async runCompleteFix(): Promise<{ success: boolean; message: string; details?: any }> {
    console.log('🔧 Running complete database fix...');

    // Step 1: Verify current state
    const verification = await this.verifyColumns();
    
    if (verification.success) {
      return {
        success: true,
        message: 'All required columns already exist',
        details: verification
      };
    }

    console.log(`Missing columns: ${verification.missing.join(', ')}`);

    // Step 2: Apply fix
    const fixResult = await this.fixMissingColumns();

    if (!fixResult.success) {
      return {
        success: false,
        message: `Database fix failed: ${fixResult.error}`,
        details: fixResult.details
      };
    }

    // Step 3: Verify fix worked
    const postFixVerification = await this.verifyColumns();

    return {
      success: postFixVerification.success,
      message: postFixVerification.success 
        ? 'Database fix completed successfully' 
        : `Fix partially successful, still missing: ${postFixVerification.missing.join(', ')}`,
      details: {
        fix_result: fixResult,
        verification: postFixVerification
      }
    };
  }
}

// Export for global access in development
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  (window as any).EmergencyDatabaseFix = EmergencyDatabaseFix;
  console.log('🔧 EmergencyDatabaseFix available at window.EmergencyDatabaseFix');
}
