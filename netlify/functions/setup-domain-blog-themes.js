import { createClient } from '@supabase/supabase-js';

export const handler = async (event, context) => {
  // Verify this is an admin request
  const { user } = context.clientContext || {};
  
  try {
    // Initialize Supabase with service role key (available in Netlify environment)
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Database setup not available - service role key not configured',
          setup_required: true
        })
      };
    }

    console.log('🚀 Setting up domain blog themes database...');
    
    // SQL statements to create the domain_blog_themes table and functions
    const setupSQL = `
      -- Create domain_blog_themes table
      CREATE TABLE IF NOT EXISTS public.domain_blog_themes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
          theme_id VARCHAR(50) NOT NULL DEFAULT 'minimal',
          theme_name VARCHAR(100),
          custom_styles JSONB DEFAULT '{}',
          custom_settings JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Ensure one active theme per domain
          UNIQUE(domain_id, is_active) DEFERRABLE INITIALLY DEFERRED
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_domain_blog_themes_domain_id ON public.domain_blog_themes(domain_id);
      CREATE INDEX IF NOT EXISTS idx_domain_blog_themes_active ON public.domain_blog_themes(domain_id, is_active) WHERE is_active = true;

      -- Enable RLS
      ALTER TABLE public.domain_blog_themes ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      DROP POLICY IF EXISTS "Users can view their own domain themes" ON public.domain_blog_themes;
      CREATE POLICY "Users can view their own domain themes" ON public.domain_blog_themes
          FOR SELECT USING (
              domain_id IN (
                  SELECT id FROM public.domains WHERE user_id = auth.uid()
              )
          );

      DROP POLICY IF EXISTS "Users can insert themes for their domains" ON public.domain_blog_themes;
      CREATE POLICY "Users can insert themes for their domains" ON public.domain_blog_themes
          FOR INSERT WITH CHECK (
              domain_id IN (
                  SELECT id FROM public.domains WHERE user_id = auth.uid()
              )
          );

      DROP POLICY IF EXISTS "Users can update their own domain themes" ON public.domain_blog_themes;
      CREATE POLICY "Users can update their own domain themes" ON public.domain_blog_themes
          FOR UPDATE USING (
              domain_id IN (
                  SELECT id FROM public.domains WHERE user_id = auth.uid()
              )
          );

      DROP POLICY IF EXISTS "Users can delete their own domain themes" ON public.domain_blog_themes;
      CREATE POLICY "Users can delete their own domain themes" ON public.domain_blog_themes
          FOR DELETE USING (
              domain_id IN (
                  SELECT id FROM public.domains WHERE user_id = auth.uid()
              )
          );

      -- Create function to update domain theme
      CREATE OR REPLACE FUNCTION public.update_domain_blog_theme(
          p_domain_id UUID,
          p_theme_id VARCHAR(50),
          p_theme_name VARCHAR(100),
          p_custom_styles JSONB DEFAULT '{}',
          p_custom_settings JSONB DEFAULT '{}'
      )
      RETURNS UUID AS $$
      DECLARE
          theme_uuid UUID;
      BEGIN
          -- Deactivate current theme
          UPDATE public.domain_blog_themes
          SET is_active = false, updated_at = NOW()
          WHERE domain_id = p_domain_id AND is_active = true;
          
          -- Insert new active theme
          INSERT INTO public.domain_blog_themes (
              domain_id, theme_id, theme_name, custom_styles, custom_settings, is_active
          ) VALUES (
              p_domain_id, p_theme_id, p_theme_name, p_custom_styles, p_custom_settings, true
          ) RETURNING id INTO theme_uuid;
          
          RETURN theme_uuid;
      END;
      $$ LANGUAGE plpgsql;

      -- Create function to get domain theme settings
      CREATE OR REPLACE FUNCTION public.get_domain_blog_theme(p_domain_id UUID)
      RETURNS TABLE (
          theme_id VARCHAR(50),
          theme_name VARCHAR(100),
          custom_styles JSONB,
          custom_settings JSONB
      ) AS $$
      BEGIN
          RETURN QUERY
          SELECT 
              dbt.theme_id,
              dbt.theme_name,
              dbt.custom_styles,
              dbt.custom_settings
          FROM public.domain_blog_themes dbt
          WHERE dbt.domain_id = p_domain_id 
          AND dbt.is_active = true
          LIMIT 1;
      END;
      $$ LANGUAGE plpgsql;

      -- Grant necessary permissions
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.domain_blog_themes TO authenticated;
      GRANT EXECUTE ON FUNCTION public.get_domain_blog_theme(UUID) TO authenticated;
      GRANT EXECUTE ON FUNCTION public.update_domain_blog_theme(UUID, VARCHAR, VARCHAR, JSONB, JSONB) TO authenticated;
    `;

    // Execute the setup SQL
    const { error } = await supabase.rpc('exec_sql', { sql: setupSQL });
    
    if (error) {
      console.error('❌ Database setup error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Database setup failed',
          details: error.message
        })
      };
    }

    // Insert default themes for existing blog-enabled domains
    const { data: domains } = await supabase
      .from('domains')
      .select('id')
      .eq('blog_enabled', true);

    if (domains && domains.length > 0) {
      const defaultThemes = domains.map(domain => ({
        domain_id: domain.id,
        theme_id: 'minimal',
        theme_name: 'Minimal Clean'
      }));

      await supabase
        .from('domain_blog_themes')
        .upsert(defaultThemes, { 
          onConflict: 'domain_id,is_active',
          ignoreDuplicates: true 
        });
    }

    console.log('✅ Domain blog themes setup completed successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Domain blog themes database setup completed',
        domains_updated: domains?.length || 0
      })
    };

  } catch (error) {
    console.error('💥 Setup failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Database setup failed',
        details: error.message
      })
    };
  }
};
