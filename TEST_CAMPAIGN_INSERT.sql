-- ===================================================================
-- TEST CAMPAIGN INSERTION - Debug "expected JSON array" error
-- ===================================================================
-- 
-- This script tests the exact data insertion that's failing
-- Run this in Supabase SQL Editor to see if there are any constraints
-- or data type issues causing the "expected JSON array" error
-- 
-- ===================================================================

-- First, check the current table structure
SELECT 
    'Current automation_campaigns columns:' as info,
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
ORDER BY ordinal_position;

-- Check if there are any constraints on the JSONB columns
SELECT 
    'Table constraints:' as info,
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'automation_campaigns';

-- Test the exact data structure that's failing
-- Replace 'your-user-id-here' with your actual user ID from auth.users
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get the first user ID for testing (replace with your user ID)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE '❌ No users found - you need to be signed in for this test';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing with user ID: %', test_user_id;
    
    -- Test the exact data structure from the code
    INSERT INTO automation_campaigns (
        name,
        keywords,
        anchor_texts,
        target_url,
        user_id,
        status,
        auto_start,
        links_built,
        available_sites,
        target_sites_used,
        published_articles
    ) VALUES (
        'Test Campaign - Debug Insert',
        ARRAY['test', 'debug', 'campaign'],
        ARRAY['test link', 'debug link', 'click here'],
        'https://example.com/test',
        test_user_id,
        'draft',
        false,
        0,
        4,
        ARRAY[]::TEXT[],  -- Empty text array
        '[]'::jsonb       -- Empty JSON array
    );
    
    RAISE NOTICE '✅ Test insertion successful!';
    
    -- Clean up the test record
    DELETE FROM automation_campaigns 
    WHERE name = 'Test Campaign - Debug Insert' 
      AND user_id = test_user_id;
    
    RAISE NOTICE '✅ Test cleanup completed';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Test insertion failed: %', SQLERRM;
        
        -- More specific error analysis
        IF SQLERRM LIKE '%expected JSON array%' THEN
            RAISE NOTICE '🔍 JSON Array Error - Check column types and constraints';
        ELSIF SQLERRM LIKE '%permission%' OR SQLERRM LIKE '%policy%' THEN
            RAISE NOTICE '🔍 RLS Permission Error - Check authentication and policies';
        ELSIF SQLERRM LIKE '%constraint%' THEN
            RAISE NOTICE '🔍 Constraint Violation - Check column constraints';
        ELSE
            RAISE NOTICE '🔍 Other Error Type - See message above';
        END IF;
END $$;

-- Test individual column types
DO $$
BEGIN
    -- Test JSONB array syntax
    PERFORM '[]'::jsonb;
    PERFORM '[{"test": "value"}]'::jsonb;
    RAISE NOTICE '✅ JSONB array syntax is valid';
    
    -- Test TEXT array syntax  
    PERFORM ARRAY[]::TEXT[];
    PERFORM ARRAY['test1', 'test2']::TEXT[];
    RAISE NOTICE '✅ TEXT array syntax is valid';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Data type test failed: %', SQLERRM;
END $$;

-- Check for any triggers that might be interfering
SELECT 
    'Table triggers:' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'automation_campaigns';

-- Show current records count
SELECT 
    'Current records count:' as info,
    COUNT(*) as total_campaigns
FROM automation_campaigns;

-- Final verification query
SELECT 
    '🎯 DEBUGGING COMPLETE' as status,
    'Check the RAISE NOTICE messages above for test results' as instructions;
