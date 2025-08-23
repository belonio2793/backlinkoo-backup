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
        -- Domains table for DNS management and validation (DomainsPage.tsx compatible)
        CREATE TABLE IF NOT EXISTS public.domains (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          domain TEXT NOT NULL,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'validated', 'error', 'dns_ready', 'theme_selection', 'active')),

          -- DomainsPage.tsx expected fields
          netlify_verified BOOLEAN DEFAULT false NOT NULL,
          dns_verified BOOLEAN DEFAULT false NOT NULL,
          error_message TEXT,
          dns_records JSONB DEFAULT '[]'::jsonb,
          selected_theme TEXT,
          theme_name TEXT,
          blog_enabled BOOLEAN DEFAULT false NOT NULL,

          -- Additional Netlify integration fields
          netlify_site_id TEXT,
          netlify_domain_id TEXT,
          ssl_enabled BOOLEAN DEFAULT false,
          custom_dns_configured BOOLEAN DEFAULT false,
          last_validation_at TIMESTAMP WITH TIME ZONE,

          -- Standard timestamps
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

          UNIQUE(user_id, domain)
        );

        -- Enable RLS
        ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

        -- Proper RLS policies for authenticated users
        DROP POLICY IF EXISTS "Users can view their own domains" ON public.domains;
        CREATE POLICY "Users can view their own domains" ON public.domains
          FOR SELECT USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can insert their own domains" ON public.domains;
        CREATE POLICY "Users can insert their own domains" ON public.domains
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can update their own domains" ON public.domains;
        CREATE POLICY "Users can update their own domains" ON public.domains
          FOR UPDATE USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can delete their own domains" ON public.domains;
        CREATE POLICY "Users can delete their own domains" ON public.domains
          FOR DELETE USING (auth.uid() = user_id);

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_domains_user_id ON public.domains(user_id);
        CREATE INDEX IF NOT EXISTS idx_domains_status ON public.domains(status);
        CREATE INDEX IF NOT EXISTS idx_domains_domain ON public.domains(domain);
        CREATE INDEX IF NOT EXISTS idx_domains_user_status ON public.domains(user_id, status);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_user_domain_unique ON public.domains(user_id, domain);

        -- Function to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = TIMEZONE('utc'::text, NOW());
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Trigger for updated_at
        DROP TRIGGER IF EXISTS update_domains_updated_at ON public.domains;
        CREATE TRIGGER update_domains_updated_at
          BEFORE UPDATE ON public.domains
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        -- Create domain themes table
        CREATE TABLE IF NOT EXISTS public.domain_themes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          preview_image_url TEXT,
          css_file_path TEXT,
          is_premium BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Insert default themes
        INSERT INTO public.domain_themes (id, name, description, is_premium) VALUES
          ('minimal', 'Minimal Clean', 'Clean and simple design', false),
          ('modern', 'Modern Business', 'Professional business layout', false),
          ('elegant', 'Elegant Editorial', 'Magazine-style layout', false),
          ('tech', 'Tech Focus', 'Technology-focused design', false)
        ON CONFLICT (id) DO NOTHING;

        -- Enable RLS on domain_themes
        ALTER TABLE public.domain_themes ENABLE ROW LEVEL SECURITY;

        -- Domain themes readable by authenticated users
        DROP POLICY IF EXISTS "Anyone can view domain themes" ON public.domain_themes;
        CREATE POLICY "Anyone can view domain themes" ON public.domain_themes
          FOR SELECT USING (auth.role() = 'authenticated');

        -- Grant permissions
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.domains TO authenticated;
        GRANT SELECT ON public.domain_themes TO authenticated;
        GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
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
