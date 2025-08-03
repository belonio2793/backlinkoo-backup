-- FIX FOR "Database error granting user" ISSUE
-- This specific error occurs when Supabase Auth cannot create user profiles
-- Run this script in your Supabase SQL Editor

-- 1. Check if the issue is with the trigger function
DO $$
BEGIN
    RAISE NOTICE 'Starting fix for "Database error granting user" issue...';
END $$;

-- 2. Drop problematic trigger functions that might be causing the error
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_simple() CASCADE;

-- 3. Temporarily disable RLS on profiles table
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- 4. Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Grant necessary permissions to avoid permission errors
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

-- 6. Create a new, safe trigger function that won't cause "granting user" errors
CREATE OR REPLACE FUNCTION public.handle_new_user_safe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Use a more defensive approach to avoid errors
    INSERT INTO public.profiles (user_id, email, display_name, role, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            NEW.raw_user_meta_data->>'first_name',
            NEW.raw_user_meta_data->>'full_name',
            split_part(NEW.email, '@', 1)
        ),
        'user',
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE NOTICE 'Profile creation failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- 7. Remove any existing triggers and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_safe();

-- 8. Re-enable RLS with simple, non-conflicting policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create minimal RLS policies that won't interfere with auth
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 9. Test the fix by trying to create a test profile
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
    -- Test if profile creation works
    INSERT INTO public.profiles (user_id, email, display_name, role)
    VALUES (test_user_id, 'test@example.com', 'Test User', 'user');
    
    -- Clean up test data
    DELETE FROM public.profiles WHERE user_id = test_user_id;
    
    RAISE NOTICE '✅ Profile creation test passed - "Database error granting user" should be fixed!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Profile creation test failed: %', SQLERRM;
        RAISE NOTICE 'Additional troubleshooting may be required.';
END $$;

-- 10. Final verification
SELECT 
    'Database Fix Status' AS check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'profiles' AND table_schema = 'public'
        ) THEN '✅ Profiles table exists'
        ELSE '❌ Profiles table missing'
    END AS result
UNION ALL
SELECT 
    'Trigger Status',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'on_auth_user_created'
        ) THEN '✅ Trigger created'
        ELSE '❌ Trigger missing'
    END
UNION ALL
SELECT 
    'RLS Status',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'profiles' AND schemaname = 'public'
        ) THEN '✅ RLS policies active'
        ELSE '❌ RLS policies missing'
    END;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Fix completed! Try signing in again.';
    RAISE NOTICE 'If the issue persists, check the Supabase logs for additional error details.';
END $$;
