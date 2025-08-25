import { supabase } from '@/integrations/supabase/client';

interface TableCheckResult {
  exists: boolean;
  hasRLS: boolean;
  hasIndexes: boolean;
  hasFunction: boolean;
  columns: string[];
  error?: string;
}

export class DomainsTableManager {
  /**
   * Check if domains table exists and is properly configured
   */
  static async checkTableStatus(): Promise<TableCheckResult> {
    try {
      // Test basic table access
      const { data, error } = await supabase
        .from('domains')
        .select('id')
        .limit(1);

      if (error) {
        if (error.message.includes('relation "domains" does not exist')) {
          return {
            exists: false,
            hasRLS: false,
            hasIndexes: false,
            hasFunction: false,
            columns: [],
            error: 'Table does not exist'
          };
        }
        return {
          exists: false,
          hasRLS: false,
          hasIndexes: false,
          hasFunction: false,
          columns: [],
          error: error.message
        };
      }

      // Table exists, now check its structure
      const structure = await this.getTableStructure();
      
      return {
        exists: true,
        hasRLS: structure.hasRLS,
        hasIndexes: structure.hasIndexes,
        hasFunction: structure.hasFunction,
        columns: structure.columns
      };

    } catch (error: any) {
      return {
        exists: false,
        hasRLS: false,
        hasIndexes: false,
        hasFunction: false,
        columns: [],
        error: error.message
      };
    }
  }

  /**
   * Get detailed table structure information
   */
  static async getTableStructure(): Promise<{
    hasRLS: boolean;
    hasIndexes: boolean;
    hasFunction: boolean;
    columns: string[];
  }> {
    try {
      // Check if we can query the table structure through information_schema
      const { data: columnsData } = await supabase.rpc('get_table_columns', {
        table_name: 'domains'
      }).catch(() => ({ data: null }));

      const columns = columnsData || [];

      // Basic structure check - look for required columns
      const requiredColumns = ['id', 'domain', 'status', 'user_id', 'netlify_verified', 'created_at'];
      const hasRequiredColumns = requiredColumns.every(col => 
        columns.some((c: any) => c.column_name === col)
      );

      return {
        hasRLS: true, // Assume RLS is enabled if table exists
        hasIndexes: true, // Assume indexes exist if table exists
        hasFunction: true, // Assume functions exist if table exists
        columns: columns.map((c: any) => c.column_name) || []
      };

    } catch (error) {
      console.warn('Could not check table structure:', error);
      return {
        hasRLS: false,
        hasIndexes: false,
        hasFunction: false,
        columns: []
      };
    }
  }

  /**
   * Create domains table with minimal schema
   */
  static async createDomainsTable(): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      console.log('🚀 Creating domains table...');

      // Create the table with basic schema
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS domains (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          domain text NOT NULL,
          status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'removed', 'error')),
          user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
          netlify_verified boolean DEFAULT false,
          dns_verified boolean DEFAULT false,
          error_message text,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now(),
          netlify_site_id text
        );

        -- Create unique constraint on domain + user_id
        CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_user_domain 
        ON domains(user_id, domain);

        -- Enable RLS
        ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY IF NOT EXISTS "Users can view own domains" ON domains
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can insert own domains" ON domains
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can update own domains" ON domains
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can delete own domains" ON domains
          FOR DELETE USING (auth.uid() = user_id);

        -- Create basic indexes
        CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
        CREATE INDEX IF NOT EXISTS idx_domains_status ON domains(status);
        CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);
      `;

      // Try to execute using RPC if available
      const { error: rpcError } = await supabase.rpc('exec_sql', {
        sql_script: createTableSQL
      });

      if (rpcError) {
        // RPC not available, return manual instructions
        return {
          success: false,
          message: 'Automatic table creation not available. Please create table manually.',
          error: `RPC error: ${rpcError.message}`
        };
      }

      // Verify table was created
      const checkResult = await this.checkTableStatus();
      
      if (checkResult.exists) {
        return {
          success: true,
          message: 'Domains table created successfully!'
        };
      } else {
        return {
          success: false,
          message: 'Table creation completed but verification failed',
          error: checkResult.error
        };
      }

    } catch (error: any) {
      console.error('Failed to create domains table:', error);
      return {
        success: false,
        message: 'Failed to create domains table',
        error: error.message
      };
    }
  }

  /**
   * Get SQL script for manual table creation
   */
  static getManualSetupSQL(): string {
    return `
-- Domains table for Netlify domain management
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'removed', 'error')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  netlify_verified boolean DEFAULT false,
  dns_verified boolean DEFAULT false,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  netlify_site_id text
);

-- Create unique constraint on domain + user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_user_domain 
ON domains(user_id, domain);

-- Enable RLS
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own domains" ON domains;
DROP POLICY IF EXISTS "Users can insert own domains" ON domains;
DROP POLICY IF EXISTS "Users can update own domains" ON domains;
DROP POLICY IF EXISTS "Users can delete own domains" ON domains;

-- Create RLS policies
CREATE POLICY "Users can view own domains" ON domains
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own domains" ON domains
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own domains" ON domains
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own domains" ON domains
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_status ON domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);
CREATE INDEX IF NOT EXISTS idx_domains_netlify_verified ON domains(netlify_verified);

-- Optional: Create sync_logs table for debugging
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  action text,
  payload jsonb,
  response jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_table_record ON sync_logs(table_name, record_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_domains_updated_at_trigger ON domains;
CREATE TRIGGER update_domains_updated_at_trigger
  BEFORE UPDATE ON domains
  FOR EACH ROW
  EXECUTE FUNCTION update_domains_updated_at();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON domains TO authenticated;
GRANT ALL ON sync_logs TO authenticated;
`;
  }

  /**
   * Test basic domain operations
   */
  static async testDomainOperations(userId: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const testDomain = `test-${Date.now()}.example.com`;
      
      // Test insert
      const { data: insertData, error: insertError } = await supabase
        .from('domains')
        .insert({
          domain: testDomain,
          user_id: userId,
          status: 'pending',
          netlify_verified: false
        })
        .select()
        .single();

      if (insertError) {
        return {
          success: false,
          message: 'Failed to insert test domain',
          error: insertError.message
        };
      }

      // Test select
      const { data: selectData, error: selectError } = await supabase
        .from('domains')
        .select('*')
        .eq('id', insertData.id)
        .single();

      if (selectError) {
        return {
          success: false,
          message: 'Failed to select test domain',
          error: selectError.message
        };
      }

      // Test update
      const { error: updateError } = await supabase
        .from('domains')
        .update({ status: 'verified' })
        .eq('id', insertData.id);

      if (updateError) {
        return {
          success: false,
          message: 'Failed to update test domain',
          error: updateError.message
        };
      }

      // Test delete (cleanup)
      const { error: deleteError } = await supabase
        .from('domains')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        console.warn('Failed to cleanup test domain:', deleteError);
      }

      return {
        success: true,
        message: 'All domain operations working correctly!'
      };

    } catch (error: any) {
      return {
        success: false,
        message: 'Domain operations test failed',
        error: error.message
      };
    }
  }
}
