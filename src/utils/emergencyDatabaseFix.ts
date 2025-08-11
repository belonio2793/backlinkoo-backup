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

      // Try the dedicated schema fix function first
      try {
        console.log('🔧 Attempting database schema fix via Netlify function...');

        const response = await fetch('/.netlify/functions/fix-database-schema', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'fix_schema' })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Schema fix result:', result);

          if (result.success) {
            // Verify the fix worked
            const verifyHealth = await this.checkDatabaseHealth();
            if (!verifyHealth.needsFix) {
              return {
                success: true,
                message: 'Database schema fixed successfully via automated migration',
                details: result
              };
            } else {
              return {
                success: false,
                message: 'Schema fix partially successful but issues remain',
                details: result
              };
            }
          } else {
            console.warn('Schema fix function returned error:', result);
          }
        } else {
          console.warn('Schema fix function request failed:', response.status);
        }
      } catch (fetchError) {
        console.warn('Failed to call schema fix function:', fetchError);
      }

      // Fallback: Try direct fixes if exec_sql exists
      if (health.hasExecSql && !health.hasColumns) {
        console.log('🔧 Adding missing columns using exec_sql...');

        const addColumnsSql = `
          ALTER TABLE automation_campaigns
          ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;

          ALTER TABLE automation_campaigns
          ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

          CREATE INDEX IF NOT EXISTS idx_automation_campaigns_started_at
          ON automation_campaigns(started_at);

          CREATE INDEX IF NOT EXISTS idx_automation_campaigns_completed_at
          ON automation_campaigns(completed_at);
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

      // If we get here, we couldn't fix the issues automatically
      return {
        success: false,
        message: 'Unable to automatically fix database issues. Manual database migration required.',
        details: {
          issues: health.issues,
          suggestions: [
            'Run the SQL migration manually through your database admin panel',
            'Contact your database administrator',
            'Use the fallback functionality for basic operations'
          ]
        }
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
