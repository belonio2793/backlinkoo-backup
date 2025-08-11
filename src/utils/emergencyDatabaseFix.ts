/**
 * Emergency Database Fix Utility
 * Fixes critical database schema issues preventing application functionality
 */

import { supabase } from '@/integrations/supabase/client';

export class EmergencyDatabaseFix {
  
  /**
   * Check if the database needs fixing
   */
  static async checkDatabaseHealth(): Promise<{
    needsFix: boolean;
    issues: string[];
    hasExecSql: boolean;
    hasColumns: boolean;
  }> {
    const issues: string[] = [];
    let hasExecSql = false;
    let hasColumns = false;

    try {
      // Test 1: Check if exec_sql function exists
      const { data, error } = await supabase.rpc('exec_sql', { 
        query: "SELECT 'function_works' as test" 
      });
      
      if (!error && data) {
        hasExecSql = true;
      } else {
        issues.push('exec_sql function is missing');
      }
    } catch (error) {
      issues.push('exec_sql function is missing');
    }

    try {
      // Test 2: Check if required columns exist
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'automation_campaigns')
        .in('column_name', ['started_at', 'completed_at', 'auto_start']);

      if (!tableError && tableInfo) {
        const columnNames = tableInfo.map(col => col.column_name);
        const requiredColumns = ['started_at', 'completed_at', 'auto_start'];
        const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
        
        if (missingColumns.length === 0) {
          hasColumns = true;
        } else {
          issues.push(`Missing columns: ${missingColumns.join(', ')}`);
        }
      } else {
        issues.push('Cannot check table columns');
      }
    } catch (error) {
      issues.push('Cannot access table schema');
    }

    return {
      needsFix: issues.length > 0,
      issues,
      hasExecSql,
      hasColumns
    };
  }

  /**
   * Attempt to fix the database schema using available methods
   */
  static async attemptDatabaseFix(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log('🔧 Starting emergency database fix...');
      
      const health = await this.checkDatabaseHealth();
      console.log('Database health check:', health);

      if (!health.needsFix) {
        return {
          success: true,
          message: 'Database is already healthy - no fixes needed'
        };
      }

      // If exec_sql doesn't exist, we need to use alternative approaches
      if (!health.hasExecSql) {
        console.log('⚠️ exec_sql function missing - attempting alternative fix...');
        
        // Try to add missing columns using direct table operations
        if (!health.hasColumns) {
          try {
            // Test if we can access the table structure
            const { data: sampleData, error: accessError } = await supabase
              .from('automation_campaigns')
              .select('*')
              .limit(1);

            if (!accessError) {
              // We can access the table, but we can't add columns without SQL DDL
              return {
                success: false,
                message: 'Database needs schema migration - exec_sql function and columns are missing. Please contact admin to run database migration.'
              };
            }
          } catch (error) {
            return {
              success: false,
              message: 'Cannot access automation_campaigns table. Database setup required.'
            };
          }
        }
      }

      // If exec_sql exists but columns are missing, try to add them
      if (health.hasExecSql && !health.hasColumns) {
        console.log('🔧 Adding missing columns...');
        
        const addColumnsSql = `
          ALTER TABLE automation_campaigns 
          ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;
          
          ALTER TABLE automation_campaigns 
          ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;
        `;

        const { data, error } = await supabase.rpc('exec_sql', { 
          query: addColumnsSql 
        });

        if (error) {
          return {
            success: false,
            message: `Failed to add missing columns: ${error.message}`
          };
        }

        // Verify the fix worked
        const verifyHealth = await this.checkDatabaseHealth();
        if (!verifyHealth.needsFix) {
          return {
            success: true,
            message: 'Database columns added successfully',
            details: verifyHealth
          };
        }
      }

      // If exec_sql is missing, create a minimal version
      if (!health.hasExecSql) {
        console.log('🔧 Attempting to create exec_sql function via edge function...');
        
        // This would require a database admin or service role to execute
        return {
          success: false,
          message: 'Database requires admin-level schema migration. exec_sql function needs to be created by database administrator.'
        };
      }

      return {
        success: false,
        message: 'Unable to automatically fix database issues. Manual intervention required.'
      };

    } catch (error: any) {
      console.error('Emergency database fix failed:', error);
      return {
        success: false,
        message: `Database fix failed: ${error.message}`
      };
    }
  }

  /**
   * Create a fallback mechanism for when database functions are missing
   */
  static async createFallbackSupport(): Promise<boolean> {
    try {
      // Store in localStorage that database needs fixing
      localStorage.setItem('database_needs_fix', 'true');
      localStorage.setItem('database_fix_time', new Date().toISOString());
      
      // Create a minimal in-memory campaign store for basic functionality
      if (!localStorage.getItem('fallback_campaigns')) {
        localStorage.setItem('fallback_campaigns', JSON.stringify([]));
      }

      console.log('✅ Fallback support created');
      return true;
    } catch (error) {
      console.error('Failed to create fallback support:', error);
      return false;
    }
  }

  /**
   * Get fallback campaign data
   */
  static getFallbackCampaigns(): any[] {
    try {
      const stored = localStorage.getItem('fallback_campaigns');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting fallback campaigns:', error);
      return [];
    }
  }

  /**
   * Add campaign to fallback storage
   */
  static addFallbackCampaign(campaign: any): boolean {
    try {
      const campaigns = this.getFallbackCampaigns();
      campaigns.push({
        ...campaign,
        id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        isFallback: true
      });
      localStorage.setItem('fallback_campaigns', JSON.stringify(campaigns));
      return true;
    } catch (error) {
      console.error('Error adding fallback campaign:', error);
      return false;
    }
  }
}
