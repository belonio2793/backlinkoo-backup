/**
 * Database Schema Fix Utility
 * Fixes missing tables and columns for automation analytics
 */

import { supabase } from '@/integrations/supabase/client';

export interface SchemaFixResult {
  success: boolean;
  message: string;
  details?: string;
}

export class DatabaseSchemaFix {
  
  /**
   * Check if automation_analytics table exists and has correct columns
   */
  static async checkAnalyticsTable(): Promise<{
    tableExists: boolean;
    hasCorrectColumns: boolean;
    missingColumns: string[];
    error?: string;
  }> {
    try {
      // Try to query the table with expected columns
      const { data, error } = await supabase
        .from('automation_analytics')
        .select(`
          id,
          user_id,
          total_links_built,
          referring_domains,
          avg_domain_rating,
          traffic_impact,
          monthly_growth_links,
          monthly_growth_domains,
          monthly_growth_dr,
          created_at,
          updated_at
        `)
        .limit(1);

      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          return {
            tableExists: false,
            hasCorrectColumns: false,
            missingColumns: [],
            error: 'Table does not exist'
          };
        } else if (error.message.includes('column') && error.message.includes('does not exist')) {
          // Parse which columns are missing
          const missingColumns = this.extractMissingColumns(error.message);
          return {
            tableExists: true,
            hasCorrectColumns: false,
            missingColumns,
            error: error.message
          };
        } else {
          return {
            tableExists: true,
            hasCorrectColumns: false,
            missingColumns: [],
            error: error.message
          };
        }
      }

      return {
        tableExists: true,
        hasCorrectColumns: true,
        missingColumns: []
      };
    } catch (error) {
      return {
        tableExists: false,
        hasCorrectColumns: false,
        missingColumns: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract missing column names from error message
   */
  private static extractMissingColumns(errorMessage: string): string[] {
    const matches = errorMessage.match(/column "([^"]+)" does not exist/g);
    if (!matches) return [];
    
    return matches.map(match => {
      const columnMatch = match.match(/column "([^"]+)"/);
      return columnMatch ? columnMatch[1] : '';
    }).filter(Boolean);
  }

  /**
   * Create analytics table with proper structure
   * Note: This requires proper permissions and should ideally be done via migrations
   */
  static async createAnalyticsTable(): Promise<SchemaFixResult> {
    try {
      // Check if user has permission to create tables
      const { data: testData, error: testError } = await supabase
        .from('automation_campaigns')
        .select('id')
        .limit(1);

      if (testError) {
        return {
          success: false,
          message: 'Cannot access database to create table',
          details: testError.message
        };
      }

      // In a real application, this would be done via Supabase migrations
      // For now, we'll return instructions for manual setup
      return {
        success: false,
        message: 'Table creation requires database admin access',
        details: `
Please create the automation_analytics table manually in Supabase with this SQL:

CREATE TABLE automation_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_links_built INTEGER DEFAULT 0,
  referring_domains INTEGER DEFAULT 0,
  avg_domain_rating INTEGER DEFAULT 0,
  traffic_impact INTEGER DEFAULT 0,
  monthly_growth_links INTEGER DEFAULT 0,
  monthly_growth_domains INTEGER DEFAULT 0,
  monthly_growth_dr INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policy
ALTER TABLE automation_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics" ON automation_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" ON automation_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics" ON automation_analytics
  FOR UPDATE USING (auth.uid() = user_id);
`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create analytics table',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Initialize analytics data for a user with default values
   */
  static async initializeUserAnalytics(userId: string): Promise<SchemaFixResult> {
    try {
      const { data, error } = await supabase
        .from('automation_analytics')
        .upsert({
          user_id: userId,
          total_links_built: 0,
          referring_domains: 0,
          avg_domain_rating: 0,
          traffic_impact: 0,
          monthly_growth_links: 0,
          monthly_growth_domains: 0,
          monthly_growth_dr: 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        return {
          success: false,
          message: 'Failed to initialize user analytics',
          details: error.message
        };
      }

      return {
        success: true,
        message: 'User analytics initialized successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to initialize user analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get comprehensive schema status
   */
  static async getSchemaStatus(): Promise<{
    automation_campaigns: boolean;
    automation_analytics: boolean;
    automation_activity: boolean;
    outreach_campaigns: boolean;
    error_logs: boolean;
    issues: string[];
  }> {
    const status = {
      automation_campaigns: false,
      automation_analytics: false,
      automation_activity: false,
      outreach_campaigns: false,
      error_logs: false,
      issues: [] as string[]
    };

    const tables = [
      'automation_campaigns',
      'automation_analytics', 
      'automation_activity',
      'outreach_campaigns',
      'error_logs'
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('id')
          .limit(1);

        if (error) {
          if (error.message.includes('relation') && error.message.includes('does not exist')) {
            status.issues.push(`Table ${table} does not exist`);
          } else if (error.message.includes('column') && error.message.includes('does not exist')) {
            status[table as keyof typeof status] = true; // Table exists
            status.issues.push(`Table ${table} has column issues: ${error.message}`);
          } else {
            status[table as keyof typeof status] = true; // Assume table exists
            status.issues.push(`Table ${table} has access issues: ${error.message}`);
          }
        } else {
          status[table as keyof typeof status] = true;
        }
      } catch (error) {
        status.issues.push(`Error checking table ${table}: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    return status;
  }
}

// Export for console debugging
if (typeof window !== 'undefined') {
  (window as any).DatabaseSchemaFix = DatabaseSchemaFix;
}

export default DatabaseSchemaFix;
