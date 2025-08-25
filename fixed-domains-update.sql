-- ============================================================================
-- FIXED DOMAINS DATABASE UPDATE SCRIPT
-- ============================================================================
-- This script safely handles existing data and migrates status values
-- ============================================================================

-- First, let's check what status values currently exist
DO $$
DECLARE
    existing_statuses TEXT;
BEGIN
    -- Get all unique status values from existing domains
    SELECT string_agg(DISTINCT status, ', ') INTO existing_statuses
    FROM public.domains 
    WHERE status IS NOT NULL;
    
    IF existing_statuses IS NOT NULL THEN
        RAISE NOTICE 'Current status values in domains table: %', existing_statuses;
    ELSE
        RAISE NOTICE 'No existing status values found in domains table';
    END IF;
END $$;

-- ============================================================================
-- 1. SAFELY UPDATE EXISTING STATUS VALUES
-- ============================================================================

-- Map old status values to new valid ones
UPDATE public.domains 
SET status = CASE 
    WHEN status = 'removed' THEN 'error'
    WHEN status = 'verified' THEN 'validated'
    WHEN status = 'dns_validated' THEN 'dns_ready'
    WHEN status = 'ready' THEN 'active'
    WHEN status = 'processing' THEN 'validating'
    WHEN status IS NULL THEN 'pending'
    WHEN status NOT IN ('pending', 'validating', 'validated', 'error', 'dns_ready', 'theme_selection', 'active') THEN 'pending'
    ELSE status
END
WHERE status IS NULL 
   OR status NOT IN ('pending', 'validating', 'validated', 'error', 'dns_ready', 'theme_selection', 'active');

-- ============================================================================
-- 2. ADD MISSING COLUMNS SAFELY
-- ============================================================================

-- Add missing columns to existing domains table if they don't exist
ALTER TABLE public.domains 
  ADD COLUMN IF NOT EXISTS netlify_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS dns_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS dns_records JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS selected_theme TEXT,
  ADD COLUMN IF NOT EXISTS theme_name TEXT,
  ADD COLUMN IF NOT EXISTS blog_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS netlify_site_id TEXT,
  ADD COLUMN IF NOT EXISTS netlify_domain_id TEXT,
  ADD COLUMN IF NOT EXISTS ssl_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_dns_configured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_validation_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS pages_published INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS txt_record_value TEXT,
  ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS custom_domain BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ssl_status TEXT DEFAULT 'none';

-- Ensure proper constraints
ALTER TABLE public.domains ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.domains ALTER COLUMN domain SET NOT NULL;

-- ============================================================================
-- 3. NOW SAFELY ADD CONSTRAINTS
-- ============================================================================

-- Drop existing constraint if it exists
ALTER TABLE public.domains DROP CONSTRAINT IF EXISTS status_check;

-- Add the status constraint now that data is clean
ALTER TABLE public.domains ADD CONSTRAINT status_check 
  CHECK (status IN ('pending', 'validating', 'validated', 'error', 'dns_ready', 'theme_selection', 'active'));

-- Add SSL status constraint if not exists
ALTER TABLE public.domains DROP CONSTRAINT IF EXISTS ssl_status_check;
ALTER TABLE public.domains ADD CONSTRAINT ssl_status_check 
  CHECK (ssl_status IN ('none', 'pending', 'issued', 'error'));

-- ============================================================================
-- 4. ENABLE RLS AND POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own domains" ON public.domains;
DROP POLICY IF EXISTS "Users can insert own domains" ON public.domains;
DROP POLICY IF EXISTS "Users can update own domains" ON public.domains;
DROP POLICY IF EXISTS "Users can delete own domains" ON public.domains;

-- Create RLS Policies for user data isolation
CREATE POLICY "Users can view own domains" ON public.domains
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own domains" ON public.domains
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own domains" ON public.domains
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own domains" ON public.domains
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 5. CREATE INDEXES
-- ============================================================================

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON public.domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_status ON public.domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON public.domains(domain);
CREATE INDEX IF NOT EXISTS idx_domains_netlify_verified ON public.domains(netlify_verified);
CREATE INDEX IF NOT EXISTS idx_domains_updated_at ON public.domains(updated_at);
CREATE INDEX IF NOT EXISTS idx_domains_netlify_site ON public.domains(netlify_site_id) WHERE netlify_site_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_user_domain_unique ON public.domains(user_id, domain);

-- ============================================================================
-- 6. CREATE SYNC LOGS TABLE
-- ============================================================================

-- Create sync logs table for debugging
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  action text,
  payload jsonb,
  response jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Index for sync logs
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON public.sync_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_table_record ON public.sync_logs(table_name, record_id);

-- ============================================================================
-- 7. CREATE DOMAIN THEMES TABLE
-- ============================================================================

-- Create domain themes table if it doesn't exist
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
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Enable RLS on domain_themes
ALTER TABLE public.domain_themes ENABLE ROW LEVEL SECURITY;

-- Create policy for domain themes
DROP POLICY IF EXISTS "Anyone can view domain themes" ON public.domain_themes;
CREATE POLICY "Anyone can view domain themes" ON public.domain_themes
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- 8. CREATE DOMAIN BLOG THEMES TABLE
-- ============================================================================

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

-- Add unique constraint that allows only one active theme per domain
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'domain_blog_themes_unique_active') THEN
        -- First, ensure no duplicates exist
        UPDATE public.domain_blog_themes 
        SET is_active = false 
        WHERE id NOT IN (
            SELECT DISTINCT ON (domain_id) id 
            FROM public.domain_blog_themes 
            WHERE is_active = true 
            ORDER BY domain_id, created_at DESC
        ) AND is_active = true;
        
        -- Now add the constraint
        ALTER TABLE public.domain_blog_themes 
        ADD CONSTRAINT domain_blog_themes_unique_active 
        UNIQUE(domain_id, is_active) DEFERRABLE INITIALLY DEFERRED;
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_domain_blog_themes_domain_id ON public.domain_blog_themes(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_blog_themes_active ON public.domain_blog_themes(domain_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.domain_blog_themes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own domain themes" ON public.domain_blog_themes;
DROP POLICY IF EXISTS "Users can insert themes for their domains" ON public.domain_blog_themes;
DROP POLICY IF EXISTS "Users can update their own domain themes" ON public.domain_blog_themes;
DROP POLICY IF EXISTS "Users can delete their own domain themes" ON public.domain_blog_themes;

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

-- ============================================================================
-- 9. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_domains_updated_at ON public.domains;
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON public.domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to manually trigger domain sync
CREATE OR REPLACE FUNCTION public.trigger_domain_sync(domain_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  domain_record domains%ROWTYPE;
  result jsonb;
BEGIN
  -- Get the domain record
  SELECT * INTO domain_record FROM domains WHERE id = domain_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Domain not found');
  END IF;
  
  -- Update the record to trigger sync
  UPDATE domains 
  SET last_sync = now() 
  WHERE id = domain_id;
  
  RETURN jsonb_build_object('success', true, 'domain', domain_record.domain);
END;
$$;

-- Function to get domain theme settings
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

-- Function to update domain theme
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

-- Function to increment published pages counter
CREATE OR REPLACE FUNCTION public.increment_published_pages(domain_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.domains 
    SET pages_published = COALESCE(pages_published, 0) + 1,
        updated_at = NOW()
    WHERE id = domain_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.domains TO authenticated;
GRANT ALL ON public.sync_logs TO authenticated;
GRANT SELECT ON public.domain_themes TO authenticated;
GRANT ALL ON public.domain_blog_themes TO authenticated;

GRANT EXECUTE ON FUNCTION public.trigger_domain_sync(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_domain_blog_theme(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_domain_blog_theme(UUID, VARCHAR, VARCHAR, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_published_pages(UUID) TO authenticated;

-- ============================================================================
-- 11. FINAL VERIFICATION
-- ============================================================================

DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
  col_name TEXT;
  required_columns TEXT[] := ARRAY[
    'id', 'user_id', 'domain', 'status', 'netlify_verified', 
    'dns_verified', 'error_message', 'dns_records', 'selected_theme', 
    'theme_name', 'blog_enabled', 'created_at', 'updated_at', 'netlify_site_id'
  ];
  domains_count INTEGER;
  invalid_status_count INTEGER;
BEGIN
  -- Check if all required columns exist
  FOREACH col_name IN ARRAY required_columns
  LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'domains' AND column_name = col_name) THEN
      missing_columns := array_append(missing_columns, col_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Missing required columns: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ All required columns present in domains table';
  END IF;
  
  -- Check if any invalid status values remain
  SELECT COUNT(*) INTO invalid_status_count
  FROM public.domains 
  WHERE status NOT IN ('pending', 'validating', 'validated', 'error', 'dns_ready', 'theme_selection', 'active');
  
  IF invalid_status_count > 0 THEN
    RAISE EXCEPTION 'Still have % rows with invalid status values', invalid_status_count;
  ELSE
    RAISE NOTICE '✅ All domain status values are valid';
  END IF;
  
  -- Show final count
  SELECT COUNT(*) INTO domains_count FROM public.domains;
  RAISE NOTICE '✅ Total domains in table: %', domains_count;
  
  RAISE NOTICE '🎉 Fixed domains database setup completed successfully!';
  RAISE NOTICE 'Tables created/updated:';
  RAISE NOTICE '- domains (main table with fixed constraints)';
  RAISE NOTICE '- sync_logs (debugging and monitoring)';
  RAISE NOTICE '- domain_themes (available themes)';
  RAISE NOTICE '- domain_blog_themes (per-domain theme settings)';
END $$;
