-- ========================================
-- SUPABASE DIAGNOSTIC SCRIPT
-- Run this first to check permissions and existing state
-- ========================================

-- Check current user and role
SELECT current_user, current_role, session_user;

-- Check if we can access auth schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.schemata 
    WHERE schema_name = 'auth'
  ) THEN
    RAISE NOTICE '✅ auth schema accessible';
  ELSE
    RAISE NOTICE '❌ auth schema not accessible';
  END IF;
END $$;

-- List existing automation tables
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'automation_%'
ORDER BY table_name;

-- List existing campaign-related tables
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%campaign%' OR table_name LIKE '%published%')
ORDER BY table_name;

-- Check if there are any existing tables that might conflict
DO $$
DECLARE
  existing_tables TEXT[];
BEGIN
  SELECT array_agg(table_name) INTO existing_tables
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('automation_campaigns', 'automation_published_links', 'automation_logs');
  
  IF array_length(existing_tables, 1) > 0 THEN
    RAISE NOTICE 'Existing automation tables found: %', existing_tables;
  ELSE
    RAISE NOTICE 'No existing automation tables found';
  END IF;
END $$;

-- Check RLS status on existing tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'automation_%';

-- Check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename LIKE 'automation_%';

-- Test basic table creation permissions
DO $$
BEGIN
  -- Try to create a test table
  CREATE TEMP TABLE test_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_column TEXT
  );
  
  RAISE NOTICE '✅ Basic table creation permissions working';
  
  DROP TABLE test_permissions;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Table creation permission issue: %', SQLERRM;
END $$;

-- Test UUID generation
DO $$
BEGIN
  IF gen_random_uuid() IS NOT NULL THEN
    RAISE NOTICE '✅ UUID generation working';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ UUID generation issue: %', SQLERRM;
END $$;

-- Final diagnostic summary
RAISE NOTICE '';
RAISE NOTICE '🔍 DIAGNOSTIC COMPLETE';
RAISE NOTICE 'Check the output above for any permission or existing table issues';
RAISE NOTICE 'If all checks pass, proceed with the minimal automation schema';
