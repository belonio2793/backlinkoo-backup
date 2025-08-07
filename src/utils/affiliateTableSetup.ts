import { supabase } from '../integrations/supabase/client';

/**
 * Utility to create affiliate_programs table if it doesn't exist
 * This should be run by administrators when setting up the affiliate system
 */
export class AffiliateTableSetup {
  
  /**
   * Check if affiliate_programs table exists
   */
  static async checkTableExists(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('affiliate_programs')
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          return false;
        }
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking table existence:', error);
      return false;
    }
  }
  
  /**
   * Create affiliate tables using Supabase SQL
   * Note: This requires database administrator privileges
   */
  static async createAffiliateTables(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Creating affiliate tables...');
      
      // Check if tables already exist
      const exists = await this.checkTableExists();
      if (exists) {
        return { success: true, message: 'Affiliate tables already exist' };
      }
      
      // Use a Netlify function to create the tables (safer than direct SQL)
      const response = await fetch('/.netlify/functions/create-affiliate-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_tables' })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create tables: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Affiliate tables created successfully');
        return { success: true, message: 'Affiliate tables created successfully' };
      } else {
        throw new Error(result.message || 'Unknown error creating tables');
      }
      
    } catch (error: any) {
      console.error('❌ Error creating affiliate tables:', error);
      return { 
        success: false, 
        message: `Failed to create tables: ${error.message}. Please contact an administrator.` 
      };
    }
  }
  
  /**
   * Test affiliate system functionality
   */
  static async testAffiliateSystem(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Test table access
      const tableExists = await this.checkTableExists();
      if (!tableExists) {
        return { 
          success: false, 
          message: 'Affiliate tables do not exist. Contact administrator to set up the affiliate system.' 
        };
      }
      
      // Test permissions - try to select with current user
      const { data, error } = await supabase
        .from('affiliate_programs')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      if (error) {
        if (error.code === '42501') {
          return { 
            success: false, 
            message: 'Permission denied. RLS policies may need adjustment.' 
          };
        }
        throw error;
      }
      
      return { 
        success: true, 
        message: 'Affiliate system is ready for use' 
      };
      
    } catch (error: any) {
      console.error('Error testing affiliate system:', error);
      return { 
        success: false, 
        message: `System test failed: ${error.message}` 
      };
    }
  }
  
  /**
   * Get diagnostic information about the affiliate system
   */
  static async getDiagnosticInfo(): Promise<{
    tableExists: boolean;
    hasPermissions: boolean;
    recordCount: number;
    errors: string[];
  }> {
    const info = {
      tableExists: false,
      hasPermissions: false,
      recordCount: 0,
      errors: [] as string[]
    };
    
    try {
      // Check table existence
      info.tableExists = await this.checkTableExists();
      
      if (info.tableExists) {
        try {
          // Test permissions and count records
          const { data, error } = await supabase
            .from('affiliate_programs')
            .select('id', { count: 'exact' });
          
          if (error) {
            info.errors.push(`Permission error: ${error.message}`);
          } else {
            info.hasPermissions = true;
            info.recordCount = data?.length || 0;
          }
        } catch (permError: any) {
          info.errors.push(`Permission test failed: ${permError.message}`);
        }
      } else {
        info.errors.push('affiliate_programs table does not exist');
      }
      
    } catch (error: any) {
      info.errors.push(`Diagnostic failed: ${error.message}`);
    }
    
    return info;
  }
}
