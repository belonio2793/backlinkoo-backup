-- ============================================================================
-- SIMPLE DOMAINS TABLE FIX - HANDLES EXISTING OBJECTS
-- ============================================================================
-- This script safely fixes the domains table without conflicts
-- ============================================================================

-- Check current state
DO $$
DECLARE
    table_exists BOOLEAN;
    user_id_type TEXT;
    row_count INTEGER;
BEGIN
    RAISE NOTICE '=== CHECKING CURRENT STATE ===';
    
    -- Check if domains table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'domains' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Get user_id column type
        SELECT data_type INTO user_id_type
        FROM information_schema.columns 
        WHERE table_name = 'domains' AND column_name = 'user_id' AND table_schema = 'public';
        
        -- Get row count
        SELECT COUNT(*) INTO row_count FROM public.domains;
        
        RAISE NOTICE 'Domains table exists: user_id type = %, rows = %', user_id_type, row_count;
    ELSE
        RAISE NOTICE 'Domains table does not exist';
    END IF;
END $$;

-- ============================================================================
-- 1. HANDLE CORRUPTED USER_ID COLUMN
-- ============================================================================

DO $$
DECLARE
    user_id_type TEXT;
    row_count INTEGER;
BEGIN
    -- Check if domains table exists and get user_id type
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'domains' AND table_schema = 'public') THEN
        
        SELECT data_type INTO user_id_type
        FROM information_schema.columns 
        WHERE table_name = 'domains' AND column_name = 'user_id' AND table_schema = 'public';
        
        SELECT COUNT(*) INTO row_count FROM public.domains;
        
        -- If user_id is boolean (corrupted), we need to recreate the table
        IF user_id_type = 'boolean' THEN
            RAISE NOTICE 'CORRUPTION DETECTED: user_id is boolean type, recreating table...';
            
            -- Backup any existing data
            CREATE TABLE IF NOT EXISTS public.domains_backup AS 
            SELECT * FROM public.domains;
            
            -- Drop the corrupted table
            DROP TABLE public.domains CASCADE;
            
            RAISE NOTICE 'Backed up % rows and dropped corrupted table', row_count;
        ELSE
            RAISE NOTICE 'user_id type is %, table seems OK', user_id_type;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 2. CREATE DOMAINS TABLE WITH PROPER SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'validated', 'error', 'dns_ready', 'theme_selection', 'active')),
  user_id uuid NOT NULL,
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

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'domains_user_id_fkey' AND table_name = 'domains'
    ) THEN
        ALTER TABLE public.domains 
        ADD CONSTRAINT domains_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint';
    END IF;
END $$;

-- ============================================================================
-- 3. CREATE SUPPORTING TABLES
-- ============================================================================

-- Domain themes table
CREATE TABLE IF NOT EXISTS public.domain_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  css_file_path TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Sync logs table  
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

-- Insert default themes
INSERT INTO public.domain_themes (id, name, description, is_premium) VALUES
  ('minimal', 'Minimal Clean', 'Clean and simple design', false),
  ('modern', 'Modern Business', 'Professional business layout', false), 
  ('elegant', 'Elegant Editorial', 'Magazine-style layout', false),
  ('tech', 'Tech Focus', 'Technology-focused design', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. CREATE INDEXES SAFELY
-- ============================================================================

-- Drop existing indexes that might conflict, then recreate
DROP INDEX IF EXISTS public.idx_domains_user_id;
DROP INDEX IF EXISTS public.idx_domains_status;
DROP INDEX IF EXISTS public.idx_domains_domain;
DROP INDEX IF EXISTS public.idx_domains_netlify_verified;
DROP INDEX IF EXISTS public.idx_domains_updated_at;
DROP INDEX IF EXISTS public.idx_domains_netlify_site;
DROP INDEX IF EXISTS public.idx_domains_user_domain_unique;
DROP INDEX IF EXISTS public.idx_sync_logs_created_at;
DROP INDEX IF EXISTS public.idx_sync_logs_table_record;

-- Create indexes
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

-- Enable RLS
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DO $$
DECLARE
    policy_name TEXT;
    table_list TEXT[] := ARRAY['domains', 'domain_themes', 'sync_logs'];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY table_list
    LOOP
        FOR policy_name IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = tbl AND schemaname = 'public'
        LOOP
            EXECUTE format('DROP POLICY %I ON public.%I', policy_name, tbl);
        END LOOP;
    END LOOP;
END $$;

-- Create simple, clean policies
CREATE POLICY "users_select_own_domains" ON public.domains
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_domains" ON public.domains
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_domains" ON public.domains
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_domains" ON public.domains
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "authenticated_users_read_themes" ON public.domain_themes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "users_read_sync_logs" ON public.sync_logs
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "users_insert_sync_logs" ON public.sync_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 6. CREATE FUNCTIONS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_domains_updated_at ON public.domains;
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON public.domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Domain sync function
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
  
  UPDATE domains SET last_sync = now() WHERE id = domain_id;
  
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
-- 8. FINAL VERIFICATION
-- ============================================================================

DO $$
DECLARE
    domains_count INTEGER;
    themes_count INTEGER;
    user_id_type TEXT;
    policies_count INTEGER;
BEGIN
    -- Get final state
    SELECT data_type INTO user_id_type
    FROM information_schema.columns 
    WHERE table_name = 'domains' AND column_name = 'user_id' AND table_schema = 'public';
    
    SELECT COUNT(*) INTO domains_count FROM public.domains;
    SELECT COUNT(*) INTO themes_count FROM public.domain_themes;
    SELECT COUNT(*) INTO policies_count FROM pg_policies WHERE tablename = 'domains';
    
    RAISE NOTICE '✅ SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '✅ user_id column type: %', user_id_type;
    RAISE NOTICE '✅ Domains in table: %', domains_count;
    RAISE NOTICE '✅ Available themes: %', themes_count;
    RAISE NOTICE '✅ RLS policies created: %', policies_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Ready to use! You can now:';
    RAISE NOTICE '1. Add domains through the UI';
    RAISE NOTICE '2. Sync with Netlify';
    RAISE NOTICE '3. View domain management at /domains';
END $$;
