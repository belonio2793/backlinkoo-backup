-- ============================================================================
-- FIX USER_ID COLUMN CORRUPTION (BOOLEAN TO UUID)
-- ============================================================================
-- This script handles the data corruption where user_id became boolean
-- ============================================================================

-- First, let's inspect the current state of the domains table
DO $$
DECLARE
    col_info RECORD;
    user_id_type TEXT;
    sample_values TEXT;
BEGIN
    RAISE NOTICE '=== DOMAINS TABLE ANALYSIS ===';
    
    -- Get column information
    FOR col_info IN 
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'domains' AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: % | Type: % | Nullable: %', col_info.column_name, col_info.data_type, col_info.is_nullable;
        
        IF col_info.column_name = 'user_id' THEN
            user_id_type := col_info.data_type;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Current user_id type: %', user_id_type;
    
    -- Show sample user_id values to understand the corruption
    SELECT string_agg(DISTINCT user_id::text, ', ') INTO sample_values
    FROM public.domains 
    LIMIT 10;
    
    RAISE NOTICE 'Sample user_id values: %', COALESCE(sample_values, 'NO DATA');
    
    -- Count total rows
    DECLARE
        total_rows INTEGER;
    BEGIN
        SELECT COUNT(*) INTO total_rows FROM public.domains;
        RAISE NOTICE 'Total rows in domains table: %', total_rows;
    END;
END $$;

-- ============================================================================
-- 1. BACKUP AND CLEAN CORRUPTED DATA
-- ============================================================================

-- Create a backup table for corrupted data
CREATE TABLE IF NOT EXISTS public.domains_backup_corrupted AS
SELECT * FROM public.domains WHERE 1=0; -- Structure only first

-- If there are any rows, back them up
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO row_count FROM public.domains;
    
    IF row_count > 0 THEN
        -- Back up all existing data
        INSERT INTO public.domains_backup_corrupted 
        SELECT * FROM public.domains;
        
        RAISE NOTICE 'Backed up % rows to domains_backup_corrupted', row_count;
        
        -- Clear the corrupted table
        DELETE FROM public.domains;
        RAISE NOTICE 'Cleared corrupted domains table';
    ELSE
        RAISE NOTICE 'No data to backup - table is empty';
    END IF;
END $$;

-- ============================================================================
-- 2. RECREATE DOMAINS TABLE WITH PROPER SCHEMA
-- ============================================================================

-- Drop the corrupted table completely
DROP TABLE IF EXISTS public.domains CASCADE;

-- Recreate with proper schema
CREATE TABLE public.domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'validated', 'error', 'dns_ready', 'theme_selection', 'active')),
  user_id uuid NOT NULL, -- This will be properly UUID typed
  netlify_verified boolean DEFAULT false,
  dns_verified boolean DEFAULT false,
  txt_record_value text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_sync timestamptz,
  custom_domain boolean DEFAULT false,
  ssl_status text DEFAULT 'none' CHECK (ssl_status IN ('none', 'pending', 'issued', 'error')),
  dns_records jsonb DEFAULT '[]'::jsonb,
  selected_theme text,
  theme_name text,
  blog_enabled boolean DEFAULT false,
  netlify_site_id text,
  netlify_domain_id text,
  ssl_enabled boolean DEFAULT false,
  custom_dns_configured boolean DEFAULT false,
  last_validation_at timestamptz,
  pages_published integer DEFAULT 0
);

-- Add foreign key constraint to auth.users
ALTER TABLE public.domains 
ADD CONSTRAINT domains_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================================
-- 3. CREATE ESSENTIAL SUPPORTING TABLES
-- ============================================================================

-- Create domain_themes table
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

-- Create sync_logs table
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

-- ============================================================================
-- 4. CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_domains_user_id ON public.domains(user_id);
CREATE INDEX idx_domains_status ON public.domains(status);
CREATE INDEX idx_domains_domain ON public.domains(domain);
CREATE INDEX idx_domains_netlify_verified ON public.domains(netlify_verified);
CREATE INDEX idx_domains_updated_at ON public.domains(updated_at);
CREATE INDEX idx_domains_netlify_site ON public.domains(netlify_site_id) WHERE netlify_site_id IS NOT NULL;
CREATE UNIQUE INDEX idx_domains_user_domain_unique ON public.domains(user_id, domain);

CREATE INDEX idx_sync_logs_created_at ON public.sync_logs(created_at);
CREATE INDEX idx_sync_logs_table_record ON public.sync_logs(table_name, record_id);

-- ============================================================================
-- 5. ENABLE RLS AND CREATE POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Domains table policies
CREATE POLICY "users_select_own_domains" ON public.domains
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_domains" ON public.domains
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_domains" ON public.domains
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_domains" ON public.domains
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Domain themes policies
CREATE POLICY "authenticated_users_read_themes" ON public.domain_themes
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Sync logs policies
CREATE POLICY "users_read_own_sync_logs" ON public.sync_logs
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL 
        AND (
            record_id IS NULL 
            OR record_id IN (
                SELECT id FROM public.domains WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "users_insert_sync_logs" ON public.sync_logs
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 6. CREATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
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
BEGIN
  SELECT * INTO domain_record FROM domains WHERE id = domain_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Domain not found');
  END IF;
  
  UPDATE domains 
  SET last_sync = now() 
  WHERE id = domain_id;
  
  RETURN jsonb_build_object('success', true, 'domain', domain_record.domain);
END;
$$;

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domains TO authenticated;
GRANT SELECT ON public.domain_themes TO authenticated;
GRANT SELECT, INSERT ON public.sync_logs TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_domain_sync(uuid) TO authenticated;

-- ============================================================================
-- 8. CREATE HELPER FUNCTION TO RESTORE VALID DATA
-- ============================================================================

-- Function to help restore valid domain data if needed
CREATE OR REPLACE FUNCTION public.restore_domain_for_user(
    p_domain text,
    p_user_id uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    domain_id uuid;
BEGIN
    -- Validate input
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;
    
    IF p_domain IS NULL OR trim(p_domain) = '' THEN
        RAISE EXCEPTION 'Domain is required';
    END IF;
    
    -- Insert the domain
    INSERT INTO public.domains (domain, user_id, status)
    VALUES (trim(p_domain), p_user_id, 'pending')
    RETURNING id INTO domain_id;
    
    RETURN domain_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_domain_for_user(text, uuid) TO authenticated;

-- ============================================================================
-- 9. FINAL VERIFICATION AND INSTRUCTIONS
-- ============================================================================

DO $$
DECLARE
    domains_count INTEGER;
    themes_count INTEGER;
    backup_count INTEGER;
    user_id_type TEXT;
BEGIN
    -- Verify the fix
    SELECT data_type INTO user_id_type
    FROM information_schema.columns 
    WHERE table_name = 'domains' AND column_name = 'user_id' AND table_schema = 'public';
    
    SELECT COUNT(*) INTO domains_count FROM public.domains;
    SELECT COUNT(*) INTO themes_count FROM public.domain_themes;
    SELECT COUNT(*) INTO backup_count FROM public.domains_backup_corrupted;
    
    RAISE NOTICE '✅ CORRUPTION FIX COMPLETED!';
    RAISE NOTICE '✅ user_id column type is now: %', user_id_type;
    RAISE NOTICE '✅ Current domains count: %', domains_count;
    RAISE NOTICE '✅ Available themes: %', themes_count;
    RAISE NOTICE '✅ Backed up corrupted rows: %', backup_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔧 NEXT STEPS:';
    RAISE NOTICE '1. The domains table has been recreated with proper UUID typing';
    RAISE NOTICE '2. Any corrupted data has been backed up to domains_backup_corrupted';
    RAISE NOTICE '3. You can now add domains normally through the UI';
    RAISE NOTICE '4. Use restore_domain_for_user(''example.com'') function if you need to restore specific domains';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  NOTE: All existing domain data was cleared due to corruption.';
    RAISE NOTICE '   Users will need to re-add their domains through the interface.';
END $$;
