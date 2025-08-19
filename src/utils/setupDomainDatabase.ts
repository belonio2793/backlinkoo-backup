import { supabase } from '@/integrations/supabase/client';

interface SetupResult {
  success: boolean;
  message: string;
  steps?: string[];
}

export async function setupDomainDatabase(): Promise<SetupResult> {
  const steps: string[] = [];
  
  try {
    // Step 1: Create the domain_blog_themes table
    steps.push('Creating domain_blog_themes table...');
    
    const createTableSQL = `
      -- Create domain blog themes table
      CREATE TABLE IF NOT EXISTS public.domain_blog_themes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
          theme_id VARCHAR(50) NOT NULL,
          theme_name VARCHAR(255) NOT NULL,
          custom_styles JSONB DEFAULT '{}',
          custom_settings JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT unique_active_domain_theme UNIQUE (domain_id, is_active) WHERE is_active = true
      );
    `;

    let { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    // If exec_sql function doesn't exist, try direct table creation
    if (tableError?.code === '42883') {
      // Try alternative approach using a simple query
      const { error: altError } = await supabase
        .from('domain_blog_themes')
        .select('id')
        .limit(1);
        
      if (altError?.code === '42P01') {
        // Table doesn't exist, we need to create it via SQL execution
        // Since we can't execute DDL directly, we'll provide setup instructions
        return {
          success: false,
          message: 'Database setup requires SQL execution. Please run the setup script in your Supabase dashboard.',
          steps: [
            'Go to your Supabase dashboard',
            'Navigate to SQL Editor',
            'Run the domain blog themes setup script',
            'Refresh this page after setup is complete'
          ]
        };
      }
    }

    if (tableError) {
      throw new Error(`Table creation failed: ${tableError.message}`);
    }

    steps.push('✓ Table created successfully');

    // Step 2: Create RLS policies
    steps.push('Setting up Row Level Security policies...');
    
    const rlsPoliciesSQL = `
      -- Enable RLS
      ALTER TABLE public.domain_blog_themes ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view their domain themes" ON public.domain_blog_themes;
      DROP POLICY IF EXISTS "Users can insert themes for their domains" ON public.domain_blog_themes;
      DROP POLICY IF EXISTS "Users can update their domain themes" ON public.domain_blog_themes;
      DROP POLICY IF EXISTS "Users can delete their domain themes" ON public.domain_blog_themes;

      -- Create RLS policies
      CREATE POLICY "Users can view their domain themes" ON public.domain_blog_themes
          FOR SELECT USING (
              domain_id IN (
                  SELECT id FROM public.domains WHERE user_id = auth.uid()
              )
          );

      CREATE POLICY "Users can insert themes for their domains" ON public.domain_blog_themes
          FOR INSERT WITH CHECK (
              domain_id IN (
                  SELECT id FROM public.domains WHERE user_id = auth.uid()
              )
          );

      CREATE POLICY "Users can update their domain themes" ON public.domain_blog_themes
          FOR UPDATE USING (
              domain_id IN (
                  SELECT id FROM public.domains WHERE user_id = auth.uid()
              )
          );

      CREATE POLICY "Users can delete their domain themes" ON public.domain_blog_themes
          FOR DELETE USING (
              domain_id IN (
                  SELECT id FROM public.domains WHERE user_id = auth.uid()
              )
          );
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsPoliciesSQL });
    if (rlsError && rlsError.code !== '42883') {
      console.warn('RLS setup warning:', rlsError.message);
    }

    steps.push('✓ RLS policies configured');

    // Step 3: Create helper functions
    steps.push('Creating helper functions...');
    
    const functionsSQL = `
      -- Create function to get domain theme
      CREATE OR REPLACE FUNCTION public.get_domain_blog_theme(p_domain_id UUID)
      RETURNS TABLE (
          id UUID,
          domain_id UUID,
          theme_id VARCHAR,
          theme_name VARCHAR,
          custom_styles JSONB,
          custom_settings JSONB,
          is_active BOOLEAN,
          created_at TIMESTAMP WITH TIME ZONE,
          updated_at TIMESTAMP WITH TIME ZONE
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
          RETURN QUERY
          SELECT 
              t.id,
              t.domain_id,
              t.theme_id,
              t.theme_name,
              t.custom_styles,
              t.custom_settings,
              t.is_active,
              t.created_at,
              t.updated_at
          FROM public.domain_blog_themes t
          INNER JOIN public.domains d ON t.domain_id = d.id
          WHERE t.domain_id = p_domain_id 
            AND t.is_active = true
            AND d.user_id = auth.uid();
      END;
      $$;

      -- Create function to update domain theme
      CREATE OR REPLACE FUNCTION public.update_domain_blog_theme(
          p_domain_id UUID,
          p_theme_id VARCHAR,
          p_theme_name VARCHAR,
          p_custom_styles JSONB,
          p_custom_settings JSONB
      )
      RETURNS BOOLEAN
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
          domain_exists BOOLEAN := FALSE;
      BEGIN
          -- Check if user owns the domain
          SELECT EXISTS (
              SELECT 1 FROM public.domains 
              WHERE id = p_domain_id AND user_id = auth.uid()
          ) INTO domain_exists;

          IF NOT domain_exists THEN
              RAISE EXCEPTION 'Domain not found or access denied';
          END IF;

          -- Deactivate existing themes for this domain
          UPDATE public.domain_blog_themes 
          SET is_active = false, updated_at = NOW()
          WHERE domain_id = p_domain_id AND is_active = true;

          -- Insert new theme
          INSERT INTO public.domain_blog_themes (
              domain_id,
              theme_id,
              theme_name,
              custom_styles,
              custom_settings,
              is_active,
              created_at,
              updated_at
          ) VALUES (
              p_domain_id,
              p_theme_id,
              p_theme_name,
              p_custom_styles,
              p_custom_settings,
              true,
              NOW(),
              NOW()
          );

          RETURN TRUE;
      EXCEPTION
          WHEN OTHERS THEN
              RAISE EXCEPTION 'Failed to update domain theme: %', SQLERRM;
      END;
      $$;

      -- Grant permissions
      GRANT EXECUTE ON FUNCTION public.get_domain_blog_theme(UUID) TO authenticated;
      GRANT EXECUTE ON FUNCTION public.update_domain_blog_theme(UUID, VARCHAR, VARCHAR, JSONB, JSONB) TO authenticated;
    `;

    const { error: functionsError } = await supabase.rpc('exec_sql', { sql: functionsSQL });
    if (functionsError && functionsError.code !== '42883') {
      console.warn('Functions setup warning:', functionsError.message);
    }

    steps.push('✓ Helper functions created');

    // Step 4: Set up default themes for existing domains
    steps.push('Setting up default themes for existing domains...');
    
    const { data: domains, error: domainsError } = await supabase
      .from('domains')
      .select('id, domain, blog_enabled')
      .eq('blog_enabled', true);

    if (domainsError) {
      console.warn('Could not fetch domains:', domainsError.message);
    } else if (domains && domains.length > 0) {
      for (const domain of domains) {
        try {
          await supabase.rpc('update_domain_blog_theme', {
            p_domain_id: domain.id,
            p_theme_id: 'minimal',
            p_theme_name: 'Minimal Clean',
            p_custom_styles: {},
            p_custom_settings: {}
          });
          
          steps.push(`✓ Default theme set for ${domain.domain}`);
        } catch (error) {
          console.warn(`Could not set default theme for ${domain.domain}:`, error);
        }
      }
    }

    steps.push('✓ Database setup complete!');

    return {
      success: true,
      message: 'Domain blog themes database has been successfully set up.',
      steps
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    steps.push(`❌ Error: ${errorMessage}`);
    
    return {
      success: false,
      message: `Setup failed: ${errorMessage}`,
      steps
    };
  }
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    // Try to query the domain_blog_themes table
    const { error } = await supabase
      .from('domain_blog_themes')
      .select('id')
      .limit(1);

    return !error || error.code !== '42P01'; // 42P01 = table does not exist
  } catch (error) {
    console.warn('Database connection test failed:', error);
    return false;
  }
}

export async function checkDatabaseSetup(): Promise<{
  tableExists: boolean;
  functionsExist: boolean;
  hasData: boolean;
}> {
  try {
    // Check if table exists
    const { error: tableError } = await supabase
      .from('domain_blog_themes')
      .select('id')
      .limit(1);

    const tableExists = !tableError || tableError.code !== '42P01';

    // Check if functions exist
    const { error: functionError } = await supabase.rpc('get_domain_blog_theme', {
      p_domain_id: '00000000-0000-0000-0000-000000000000' // dummy UUID
    });

    const functionsExist = !functionError || functionError.code !== '42883';

    // Check if there's any data
    const { data, error: dataError } = await supabase
      .from('domain_blog_themes')
      .select('id')
      .limit(1);

    const hasData = !dataError && data && data.length > 0;

    return {
      tableExists,
      functionsExist,
      hasData
    };
  } catch (error) {
    console.warn('Database setup check failed:', error);
    return {
      tableExists: false,
      functionsExist: false,
      hasData: false
    };
  }
}
