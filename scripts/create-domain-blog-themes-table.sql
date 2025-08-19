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

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_domain_blog_themes_domain_id ON public.domain_blog_themes(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_blog_themes_active ON public.domain_blog_themes(domain_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.domain_blog_themes ENABLE ROW LEVEL SECURITY;

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

-- Create function to automatically set default theme when domain blog is enabled
CREATE OR REPLACE FUNCTION public.ensure_default_blog_theme()
RETURNS TRIGGER AS $$
BEGIN
    -- If blog was just enabled and no theme exists, create default
    IF NEW.blog_enabled = true AND (OLD.blog_enabled = false OR OLD.blog_enabled IS NULL) THEN
        INSERT INTO public.domain_blog_themes (domain_id, theme_id, theme_name)
        VALUES (NEW.id, 'minimal', 'Minimal Clean')
        ON CONFLICT (domain_id, is_active) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign default theme
CREATE TRIGGER ensure_default_blog_theme_trigger
    AFTER UPDATE ON public.domains
    FOR EACH ROW
    WHEN (NEW.blog_enabled = true)
    EXECUTE FUNCTION public.ensure_default_blog_theme();

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

-- Insert default themes for existing blog-enabled domains
INSERT INTO public.domain_blog_themes (domain_id, theme_id, theme_name)
SELECT id, 'minimal', 'Minimal Clean'
FROM public.domains 
WHERE blog_enabled = true
ON CONFLICT (domain_id, is_active) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domain_blog_themes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_domain_blog_theme(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_domain_blog_theme(UUID, VARCHAR, VARCHAR, JSONB, JSONB) TO authenticated;
