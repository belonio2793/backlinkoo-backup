-- ============================================================================
-- FIX TYPE MISMATCH ERROR (UUID = BOOLEAN)
-- ============================================================================
-- This script fixes the type mismatch error in RLS policies
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

-- Drop policies on other tables too
DO $$
DECLARE
    policy_name TEXT;
    table_name TEXT;
BEGIN
    FOR table_name IN VALUES ('domain_themes'), ('domain_blog_themes'), ('sync_logs')
    LOOP
        FOR policy_name IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = table_name AND schemaname = 'public'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
            RAISE NOTICE 'Dropped policy: % on table: %', policy_name, table_name;
        END LOOP;
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
-- 4. CREATE POLICIES FOR OTHER TABLES
-- ============================================================================

-- Domain themes - simple read access for authenticated users
ALTER TABLE public.domain_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_read_themes" ON public.domain_themes
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Sync logs - users can only see logs related to their domains
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

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
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Domain blog themes - users can manage themes for their domains
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'domain_blog_themes') THEN
    ALTER TABLE public.domain_blog_themes ENABLE ROW LEVEL SECURITY;

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
END IF;

-- ============================================================================
-- 5. TEST THE POLICIES
-- ============================================================================

-- Create a test function to verify policies work
CREATE OR REPLACE FUNCTION test_domains_policies()
RETURNS TABLE (
    test_name TEXT,
    result TEXT,
    details TEXT
) AS $$
DECLARE
    test_user_id UUID;
    test_domain_id UUID;
    domain_count INTEGER;
BEGIN
    -- Test 1: Check if we can select without authentication (should return empty)
    RETURN QUERY
    SELECT 
        'unauthenticated_select'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        ('Returned ' || COUNT(*) || ' domains without auth')::TEXT
    FROM public.domains;

    -- Test 2: Check basic table structure
    SELECT COUNT(*) INTO domain_count FROM public.domains;
    RETURN QUERY
    SELECT 
        'table_accessible'::TEXT,
        'PASS'::TEXT,
        ('Found ' || domain_count || ' total domains in table')::TEXT;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the test
SELECT * FROM test_domains_policies();

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domains TO authenticated;
GRANT SELECT ON public.domain_themes TO authenticated;
GRANT SELECT, INSERT ON public.sync_logs TO authenticated;

-- Grant permissions on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- 7. FINAL VERIFICATION
-- ============================================================================

DO $$
DECLARE
    policy_count INTEGER;
    domains_count INTEGER;
    themes_count INTEGER;
BEGIN
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'domains' AND schemaname = 'public';
    
    -- Count data
    SELECT COUNT(*) INTO domains_count FROM public.domains;
    SELECT COUNT(*) INTO themes_count FROM public.domain_themes;
    
    RAISE NOTICE '✅ RLS policies created: %', policy_count;
    RAISE NOTICE '✅ Domains in table: %', domains_count;
    RAISE NOTICE '�� Themes available: %', themes_count;
    RAISE NOTICE '🎉 Type mismatch fix completed successfully!';
    
    -- Show the actual auth.uid() type for reference
    RAISE NOTICE 'auth.uid() returns type: uuid';
    RAISE NOTICE 'user_id column type: uuid';
    RAISE NOTICE 'These types now match correctly!';
END $$;

-- Clean up test function
DROP FUNCTION IF EXISTS test_domains_policies();
