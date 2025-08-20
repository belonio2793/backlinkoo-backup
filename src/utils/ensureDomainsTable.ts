/**
 * Utility to ensure domains table exists in Supabase
 */

import { supabase } from '@/integrations/supabase/client';

export async function ensureDomainsTable(): Promise<{ success: boolean; error?: string; created?: boolean }> {
  try {
    console.log('🔧 Checking if domains table exists...');

    // First, try to select from domains table to see if it exists
    const { data, error: selectError } = await supabase
      .from('domains')
      .select('id')
      .limit(1);

    if (!selectError) {
      console.log('✅ Domains table exists and is accessible');
      return { success: true, created: false };
    }

    // If table doesn't exist, create it
    if (selectError.message.includes('relation "domains" does not exist') || 
        selectError.message.includes('table "domains" does not exist')) {
      console.log('📝 Domains table does not exist, creating it...');
      
      const createTableSQL = `
        -- Domains table for DNS management and validation
        CREATE TABLE IF NOT EXISTS domains (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid,
          domain text NOT NULL,
          status text DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'active', 'failed', 'expired')),
          
          -- DNS Configuration
          verification_token text NOT NULL DEFAULT 'blo-' || substr(gen_random_uuid()::text, 1, 12),
          required_a_record inet,
          required_cname text,
          hosting_provider text DEFAULT 'backlinkoo',
          
          -- Validation tracking
          dns_validated boolean DEFAULT false,
          txt_record_validated boolean DEFAULT false,
          a_record_validated boolean DEFAULT false,
          cname_validated boolean DEFAULT false,
          ssl_enabled boolean DEFAULT false,
          
          -- Metadata
          last_validation_attempt timestamptz,
          validation_error text,
          auto_retry_count integer DEFAULT 0,
          max_retries integer DEFAULT 10,
          
          -- Blog integration
          blog_enabled boolean DEFAULT false,
          blog_subdirectory text DEFAULT 'blog',
          pages_published integer DEFAULT 0,
          
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now(),
          
          UNIQUE(user_id, domain)
        );

        -- Enable RLS (but allow public read for now)
        ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

        -- Permissive policies for development
        DROP POLICY IF EXISTS "Allow public read access" ON domains;
        CREATE POLICY "Allow public read access" ON domains
          FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Allow authenticated insert" ON domains;
        CREATE POLICY "Allow authenticated insert" ON domains
          FOR INSERT WITH CHECK (true);

        DROP POLICY IF EXISTS "Allow authenticated update" ON domains;
        CREATE POLICY "Allow authenticated update" ON domains
          FOR UPDATE USING (true);

        DROP POLICY IF EXISTS "Allow authenticated delete" ON domains;
        CREATE POLICY "Allow authenticated delete" ON domains
          FOR DELETE USING (true);

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
        CREATE INDEX IF NOT EXISTS idx_domains_status ON domains(status);
        CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);
        CREATE INDEX IF NOT EXISTS idx_domains_validation ON domains(dns_validated, status);

        -- Function to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_domains_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = now();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Trigger for updated_at
        DROP TRIGGER IF EXISTS update_domains_updated_at ON domains;
        CREATE TRIGGER update_domains_updated_at
          BEFORE UPDATE ON domains
          FOR EACH ROW EXECUTE FUNCTION update_domains_updated_at();
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });

      if (createError) {
        console.error('❌ Failed to create domains table:', createError);
        return { success: false, error: createError.message };
      }

      console.log('✅ Domains table created successfully');
      return { success: true, created: true };
    }

    // Other error (permissions, network, etc.)
    console.error('❌ Error accessing domains table:', selectError);
    return { success: false, error: selectError.message };

  } catch (error: any) {
    console.error('❌ Failed to ensure domains table:', error);
    return { success: false, error: error.message };
  }
}

export async function testDomainsTableAccess(): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const { data, error } = await supabase
      .from('domains')
      .select('id, domain, status, created_at')
      .limit(10);

    if (error) {
      return { success: false, message: `Database error: ${error.message}` };
    }

    return { 
      success: true, 
      message: `Domains table accessible. Found ${data?.length || 0} domains.`,
      count: data?.length || 0
    };
  } catch (error: any) {
    return { success: false, message: `Connection error: ${error.message}` };
  }
}
