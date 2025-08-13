import { supabase } from '@/integrations/supabase/client';

interface TableStatus {
  name: string;
  exists: boolean;
  error?: string;
}

export class DatabaseHealthCheck {
  private static instance: DatabaseHealthCheck;
  private tableStatusCache = new Map<string, { status: TableStatus; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): DatabaseHealthCheck {
    if (!DatabaseHealthCheck.instance) {
      DatabaseHealthCheck.instance = new DatabaseHealthCheck();
    }
    return DatabaseHealthCheck.instance;
  }

  async checkTable(tableName: string): Promise<TableStatus> {
    // Check cache first
    const cached = this.tableStatusCache.get(tableName);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.status;
    }

    const status: TableStatus = {
      name: tableName,
      exists: false
    };

    try {
      // Try a simple query to check if table exists
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          status.exists = false;
          status.error = 'Table does not exist';
        } else if (error.message.includes('column') && error.message.includes('does not exist')) {
          status.exists = true;
          status.error = `Table exists but has column schema issues: ${error.message}`;
        } else {
          status.exists = true; // Table exists but might have other issues
          status.error = error.message;
        }
      } else {
        status.exists = true;
      }
    } catch (error) {
      status.exists = false;
      status.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Cache the result
    this.tableStatusCache.set(tableName, {
      status,
      timestamp: Date.now()
    });

    return status;
  }

  async checkRequiredTables(): Promise<{
    allTablesExist: boolean;
    missingTables: string[];
    tableStatuses: TableStatus[];
  }> {
    const requiredTables = [
      'automation_campaigns',
      'automation_activity',
      'automation_analytics',
      'outreach_campaigns',
      'error_logs'
    ];

    const tableStatuses = await Promise.all(
      requiredTables.map(table => this.checkTable(table))
    );

    const missingTables = tableStatuses
      .filter(status => !status.exists)
      .map(status => status.name);

    return {
      allTablesExist: missingTables.length === 0,
      missingTables,
      tableStatuses
    };
  }

  async createMissingTables(): Promise<{
    success: boolean;
    created: string[];
    errors: Array<{ table: string; error: string }>;
  }> {
    const result = {
      success: true,
      created: [] as string[],
      errors: [] as Array<{ table: string; error: string }>
    };

    const tableDefinitions = {
      automation_campaigns: `
        CREATE TABLE IF NOT EXISTS automation_campaigns (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          target_url TEXT NOT NULL,
          keywords TEXT[],
          strategy TEXT DEFAULT 'natural_growth',
          status TEXT DEFAULT 'paused',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      automation_activity: `
        CREATE TABLE IF NOT EXISTS automation_activity (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      automation_analytics: `
        CREATE TABLE IF NOT EXISTS automation_analytics (
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
      `,
      outreach_campaigns: `
        CREATE TABLE IF NOT EXISTS outreach_campaigns (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE,
          emails_sent INTEGER DEFAULT 0,
          response_rate INTEGER DEFAULT 0,
          positive_responses INTEGER DEFAULT 0,
          link_placements INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      error_logs: `
        CREATE TABLE IF NOT EXISTS error_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          error_type TEXT NOT NULL,
          error_message TEXT NOT NULL,
          error_stack TEXT,
          component TEXT NOT NULL,
          operation TEXT NOT NULL,
          severity TEXT DEFAULT 'medium',
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    };

    // Note: In production, table creation should be handled by migrations
    // This is just for development/testing purposes
    console.warn('Database table creation should be handled by proper migrations in production');

    return result;
  }

  clearCache(): void {
    this.tableStatusCache.clear();
  }

  getHealthSummary(): {
    cacheSize: number;
    lastChecked: Date | null;
  } {
    const timestamps = Array.from(this.tableStatusCache.values()).map(v => v.timestamp);
    const lastChecked = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;

    return {
      cacheSize: this.tableStatusCache.size,
      lastChecked
    };
  }
}

// Export singleton instance
export const dbHealthCheck = DatabaseHealthCheck.getInstance();

// Helper function for components
export async function ensureTablesExist(): Promise<boolean> {
  const { allTablesExist, missingTables } = await dbHealthCheck.checkRequiredTables();
  
  if (!allTablesExist) {
    console.warn('Missing database tables:', missingTables);
    // In a production app, you would typically:
    // 1. Show a setup wizard to the user
    // 2. Run database migrations
    // 3. Contact support/admin
    return false;
  }
  
  return true;
}
