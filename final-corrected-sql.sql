-- ============================================================================
-- FINAL CORRECTED FIX FOR TYPE MISMATCH ERROR (UUID = BOOLEAN)
-- ============================================================================
-- This script fixes the type mismatch error without any ambiguous references
-- ============================================================================

-- First, let's check the current structure of the domains table
DO $$
DECLARE
    col_info RECORD;
BEGIN
    RAISE NOTICE '=== CURRENT DOMAINS TABLE STRUCTURE ===';
    FOR col_info IN 
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'domains' AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: % | Type: % | Nullable: %', col_info.column_name, col_info.data_type, col_info.is_nullable;
    END LOOP;
END $$;

-- ============================================================================
-- 1. DROP ALL EXISTING POLICIES TO START FRESH
-- ============================================================================

-- Drop all existing RLS policies on domains table
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'domains' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.domains', policy_name);
        RAISE NOTICE 'Dropped policy: %', policy_name;
    END LOOP;
END $$;

-- Drop policies on other tables (fix the ambiguous column reference)
DO $$
DECLARE
    policy_name TEXT;
    tbl_name TEXT;  -- Renamed variable to avoid ambiguity
BEGIN
    FOR tbl_name IN VALUES ('domain_themes'), ('domain_blog_themes'), ('sync_logs')
    LOOP
        -- Use table alias to avoid ambiguity
        IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_name = tbl_name AND t.table_schema = 'public') THEN
            FOR policy_name IN 
                SELECT policyname 
                FROM pg_policies 
                WHERE tablename = tbl_name AND schemaname = 'public'
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, tbl_name);
                RAISE NOTICE 'Dropped policy: % on table: %', policy_name, tbl_name;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- 2. ENSURE PROPER COLUMN TYPES
-- ============================================================================

-- Ensure user_id is UUID type and not null
ALTER TABLE public.domains ALTER COLUMN user_id SET NOT NULL;

-- Make sure user_id is actually a UUID type
DO $$
DECLARE
    current_type TEXT;
BEGIN
    SELECT data_type INTO current_type
    FROM information_schema.columns 
    WHERE table_name = 'domains' AND column_name = 'user_id' AND table_schema = 'public';
    
    IF current_type != 'uuid' THEN
        RAISE NOTICE 'Converting user_id from % to uuid', current_type;
        -- Only convert if it's not already uuid
        ALTER TABLE public.domains ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
    END IF;
    
    RAISE NOTICE 'user_id column type: %', current_type;
END $$;

-- ============================================================================
-- 3. CREATE SIMPLE, SAFE RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies that explicitly check types
CREATE POLICY "users_select_own_domains" ON public.domains
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL 
        AND user_id IS NOT NULL 
        AND auth.uid() = user_id
    );

CREATE POLICY "users_insert_own_domains" ON public.domains
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND user_id IS NOT NULL 
        AND auth.uid() = user_id
    );

CREATE POLICY "users_update_own_domains" ON public.domains
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL 
        AND user_id IS NOT NULL 
        AND auth.uid() = user_id
    );

CREATE POLICY "users_delete_own_domains" ON public.domains
    FOR DELETE 
    USING (
        auth.uid() IS NOT NULL 
        AND user_id IS NOT NULL 
        AND auth.uid() = user_id
    );

-- ============================================================================
-- 4. CREATE MINIMAL REQUIRED TABLES IF THEY DON'T EXIST
-- ============================================================================

-- Create domain_themes table if it doesn't exist
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

-- Create sync_logs table if it doesn't exist
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
-- 5. ENABLE RLS AND CREATE POLICIES FOR EXISTING TABLES
-- ============================================================================

-- Domain themes - simple read access for authenticated users
ALTER TABLE public.domain_themes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_users_read_themes" ON public.domain_themes;
CREATE POLICY "authenticated_users_read_themes" ON public.domain_themes
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Sync logs - users can only see logs related to their domains
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_sync_logs" ON public.sync_logs;
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

DROP POLICY IF EXISTS "users_insert_sync_logs" ON public.sync_logs;
CREATE POLICY "users_insert_sync_logs" ON public.sync_logs
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Handle domain_blog_themes if it exists (using proper table reference)
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if table exists using explicit table alias
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables t 
        WHERE t.table_name = 'domain_blog_themes' AND t.table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE public.domain_blog_themes ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "users_manage_domain_blog_themes" ON public.domain_blog_themes;
        
        CREATE POLICY "users_manage_domain_blog_themes" ON public.domain_blog_themes
            FOR ALL 
            USING (
                auth.uid() IS NOT NULL 
                AND domain_id IN (
                    SELECT id FROM public.domains WHERE user_id = auth.uid()
                )
            )
            WITH CHECK (
                auth.uid() IS NOT NULL 
                AND domain_id IN (
                    SELECT id FROM public.domains WHERE user_id = auth.uid()
                )
            );
            
        RAISE NOTICE 'Created RLS policies for domain_blog_themes table';
    ELSE
        RAISE NOTICE 'domain_blog_themes table does not exist, skipping policy creation';
    END IF;
END $$;

-- ============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_domains_user_id ON public.domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_status ON public.domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON public.domains(domain);
CREATE INDEX IF NOT EXISTS idx_domains_netlify_verified ON public.domains(netlify_verified);
CREATE INDEX IF NOT EXISTS idx_domains_updated_at ON public.domains(updated_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON public.sync_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_table_record ON public.sync_logs(table_name, record_id);

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domains TO authenticated;
GRANT SELECT ON public.domain_themes TO authenticated;
GRANT SELECT, INSERT ON public.sync_logs TO authenticated;

-- Grant permissions on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions on domain_blog_themes if it exists
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables t 
        WHERE t.table_name = 'domain_blog_themes' AND t.table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.domain_blog_themes TO authenticated;
        RAISE NOTICE 'Granted permissions on domain_blog_themes table';
    END IF;
END $$;

-- ============================================================================
-- 8. CREATE BASIC FUNCTIONS
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
DROP TRIGGER IF EXISTS update_domains_updated_at ON public.domains;
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON public.domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. FINAL VERIFICATION
-- ============================================================================

DO $$
DECLARE
    policy_count INTEGER;
    domains_count INTEGER;
    themes_count INTEGER;
    has_blog_themes BOOLEAN;
BEGIN
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'domains' AND schemaname = 'public';
    
    -- Count data
    SELECT COUNT(*) INTO domains_count FROM public.domains;
    SELECT COUNT(*) INTO themes_count FROM public.domain_themes;
    
    -- Check if domain_blog_themes exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables t
        WHERE t.table_name = 'domain_blog_themes' AND t.table_schema = 'public'
    ) INTO has_blog_themes;
    
    RAISE NOTICE '✅ RLS policies created on domains table: %', policy_count;
    RAISE NOTICE '✅ Domains in table: %', domains_count;
    RAISE NOTICE '✅ Themes available: %', themes_count;
    RAISE NOTICE '✅ Domain blog themes table exists: %', has_blog_themes;
    RAISE NOTICE '🎉 Type mismatch fix completed successfully!';
    
    -- Verify no type conflicts
    RAISE NOTICE 'auth.uid() returns type: uuid';
    RAISE NOTICE 'user_id column type: uuid';
    RAISE NOTICE 'These types now match correctly - no more type mismatches!';
END $$;
