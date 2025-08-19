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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_domain_blog_themes_domain_id ON public.domain_blog_themes(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_blog_themes_active ON public.domain_blog_themes(domain_id, is_active) WHERE is_active = true;

-- Create unique constraint for active themes (non-deferrable)
-- Note: This ensures only one active theme per domain
CREATE UNIQUE INDEX IF NOT EXISTS idx_domain_blog_themes_unique_active 
ON public.domain_blog_themes(domain_id) 
WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.domain_blog_themes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own domain themes" ON public.domain_blog_themes;
DROP POLICY IF EXISTS "Users can insert themes for their domains" ON public.domain_blog_themes;
DROP POLICY IF EXISTS "Users can update their own domain themes" ON public.domain_blog_themes;
DROP POLICY IF EXISTS "Users can delete their own domain themes" ON public.domain_blog_themes;

-- Create RLS policies
CREATE POLICY "Users can view their own domain themes" ON public.domain_blog_themes
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

CREATE POLICY "Users can update their own domain themes" ON public.domain_blog_themes
    FOR UPDATE USING (
        domain_id IN (
            SELECT id FROM public.domains WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own domain themes" ON public.domain_blog_themes
    FOR DELETE USING (
        domain_id IN (
            SELECT id FROM public.domains WHERE user_id = auth.uid()
        )
    );

-- Create function to update domain theme (handles the unique constraint properly)
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
    -- Deactivate current active theme
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

-- Insert default themes for existing blog-enabled domains
-- Use the function to ensure proper constraint handling
DO $$
DECLARE
    domain_record RECORD;
BEGIN
    FOR domain_record IN 
        SELECT id FROM public.domains WHERE blog_enabled = true
    LOOP
        -- Check if theme already exists
        IF NOT EXISTS (
            SELECT 1 FROM public.domain_blog_themes 
            WHERE domain_id = domain_record.id AND is_active = true
        ) THEN
            -- Insert default theme using the function
            PERFORM public.update_domain_blog_theme(
                domain_record.id, 
                'minimal', 
                'Minimal Clean', 
                '{}'::jsonb, 
                '{}'::jsonb
            );
        END IF;
    END LOOP;
END $$;
