-- Fix infinite recursion in RLS policies for profiles table
-- This occurs when get_current_user_role() function queries profiles table
-- while profiles table RLS policies call get_current_user_role()

-- Step 1: Drop all existing problematic policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Step 2: Create a safe function that doesn't cause recursion
-- Use auth.jwt() to check for admin role instead of querying profiles table
CREATE OR REPLACE FUNCTION public.get_current_user_role_safe()
RETURNS app_role AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Check if user has admin role from JWT claims first
  IF auth.jwt() ->> 'user_role' = 'admin' THEN
    RETURN 'admin';
  END IF;
  
  -- For non-admin users, temporarily disable RLS to avoid recursion
  SET row_security = off;
  
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  SET row_security = on;
  
  RETURN COALESCE(user_role, 'user');
EXCEPTION
  WHEN OTHERS THEN
    SET row_security = on;
    RETURN 'user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 3: Create simple, non-recursive RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Step 4: Create admin policy using JWT check instead of function call
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (
  auth.jwt() ->> 'user_role' = 'admin' 
  OR auth.uid() = user_id
);

-- Step 5: Update the old function to use the safe version
DROP FUNCTION IF EXISTS public.get_current_user_role();

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role AS $$
BEGIN
  RETURN public.get_current_user_role_safe();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role_safe() TO authenticated;

-- Step 7: Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
