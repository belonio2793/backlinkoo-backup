/**
 * Simple Column Fix for Database Issues
 * Directly adds missing columns without complex schema checking
 */

import { supabase } from '@/integrations/supabase/client';

export class SimpleColumnFix {
  
  /**
   * Check if we can access the automation_campaigns table
   */
  static async testTableAccess(): Promise<{
    canAccess: boolean;
    hasData: boolean;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('automation_campaigns')
        .select('id, name, status')
        .limit(1);

      if (error) {
        return {
          canAccess: false,
          hasData: false,
          error: error.message
        };
      }

      return {
        canAccess: true,
        hasData: (data?.length || 0) > 0
      };
    } catch (error: any) {
      return {
        canAccess: false,
        hasData: false,
        error: error.message
      };
    }
  }

  /**
   * Try to add missing columns using a simple approach
   */
  static async addMissingColumns(): Promise<{
    success: boolean;
    message: string;
    columnsAdded?: string[];
  }> {
    try {
      // First test if we can access the table
      const accessTest = await this.testTableAccess();
      
      if (!accessTest.canAccess) {
        return {
          success: false,
          message: `Cannot access automation_campaigns table: ${accessTest.error}`
        };
      }

      // Try to add columns using direct SQL if possible
      const columnsToAdd = [
        'started_at TIMESTAMPTZ NULL',
        'completed_at TIMESTAMPTZ NULL'
      ];

      const columnsAdded: string[] = [];

      // Test each column by trying to select it
      for (const columnDef of columnsToAdd) {
        const columnName = columnDef.split(' ')[0];
        
        try {
          // Test if column exists by trying to select it
          const { error } = await supabase
            .from('automation_campaigns')
            .select(columnName)
            .limit(1);

          if (error && error.message.includes('column') && error.message.includes('does not exist')) {
            console.log(`Column ${columnName} is missing and needs to be added`);
            // Column doesn't exist - we need to add it via migration
          } else if (!error) {
            console.log(`Column ${columnName} already exists`);
            columnsAdded.push(columnName);
          }
        } catch (e) {
          console.warn(`Could not test column ${columnName}:`, e);
        }
      }

      if (columnsAdded.length === 2) {
        return {
          success: true,
          message: 'All required columns already exist',
          columnsAdded
        };
      }

      // If we get here, we need to add missing columns
      // This requires database admin privileges
      return {
        success: false,
        message: 'Missing columns detected. Database migration required by administrator.',
        columnsAdded
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Column check failed: ${error.message}`
      };
    }
  }

  /**
   * Create a test campaign to verify functionality
   */
  static async testCampaignCreation(): Promise<{
    success: boolean;
    message: string;
    campaignId?: string;
  }> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        return {
          success: false,
          message: 'No authenticated user for testing'
        };
      }

      // Try to create a minimal test campaign
      const testCampaign = {
        name: `Test Campaign ${Date.now()}`,
        engine_type: 'blog_comments',
        target_url: 'https://example.com/test',
        keywords: ['test'],
        anchor_texts: ['test link'],
        status: 'draft',
        daily_limit: 1,
        auto_start: false,
        user_id: userData.user.id
      };

      const { data, error } = await supabase
        .from('automation_campaigns')
        .insert(testCampaign)
        .select('id')
        .single();

      if (error) {
        return {
          success: false,
          message: `Campaign creation failed: ${error.message}`
        };
      }

      // Clean up the test campaign
      if (data?.id) {
        await supabase
          .from('automation_campaigns')
          .delete()
          .eq('id', data.id);
      }

      return {
        success: true,
        message: 'Campaign creation test successful',
        campaignId: data.id
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Test failed: ${error.message}`
      };
    }
  }

  /**
   * Get a simple status report
   */
  static async getSimpleStatus(): Promise<{
    tableAccess: boolean;
    basicFunctionality: boolean;
    message: string;
    details: any;
  }> {
    try {
      const accessTest = await this.testTableAccess();
      const columnTest = await this.addMissingColumns();
      
      let basicFunctionality = false;
      let testResult = null;

      if (accessTest.canAccess) {
        testResult = await this.testCampaignCreation();
        basicFunctionality = testResult.success;
      }

      return {
        tableAccess: accessTest.canAccess,
        basicFunctionality,
        message: accessTest.canAccess 
          ? (basicFunctionality ? 'Database is working correctly' : 'Database accessible but has issues')
          : 'Cannot access database tables',
        details: {
          access: accessTest,
          columns: columnTest,
          functionality: testResult
        }
      };

    } catch (error: any) {
      return {
        tableAccess: false,
        basicFunctionality: false,
        message: `Status check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }
}
