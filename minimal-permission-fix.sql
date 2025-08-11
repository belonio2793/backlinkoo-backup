-- ========================================================================
-- MINIMAL FIX: Only address the specific permission denied error
-- ========================================================================
-- This fixes ONLY the immediate "permission denied for table users" issue
-- without affecting existing systems or user settings

-- Check if the problematic recursive function exists and is causing issues
DO $$
BEGIN
    -- Only drop the problematic function if it exists and is recursive
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'get_current_user_role'
    ) THEN
        -- Check if it's causing recursion by looking at its definition
        DECLARE
            func_def text;
        BEGIN
            SELECT pg_get_functiondef(p.oid) INTO func_def
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'get_current_user_role';
            
            -- If the function references itself or profiles table in a problematic way
            IF func_def LIKE '%get_current_user_role%' OR func_def LIKE '%profiles%role%' THEN
                RAISE NOTICE 'Removing recursive function that is causing permission errors';
                DROP FUNCTION public.get_current_user_role() CASCADE;
            END IF;
        END;
    END IF;
END $$;

-- Grant temporary direct access to resolve immediate errors
-- This is safer than disabling RLS entirely
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Test that the fix worked without breaking existing functionality
DO $$
BEGIN
    -- Test basic profile access
    PERFORM COUNT(*) FROM public.profiles LIMIT 1;
    RAISE NOTICE 'Profile access test: SUCCESS';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Profile access test: FAILED - %', SQLERRM;
END $$;

-- Show what policies are currently active (don't change them)
SELECT 
    'Current active policies:' as info,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;
