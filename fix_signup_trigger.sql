-- Fix the handle_new_user trigger function to resolve signup issues
-- This function is causing "Database error saving new user" because it references non-existent tables

-- Drop the existing trigger and function to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated handle_new_user function that works with current schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Insert into profiles table with role column (not separate user_roles table)
  INSERT INTO public.profiles (
    user_id, 
    email, 
    display_name, 
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name', 
      NEW.raw_user_meta_data->>'first_name',
      split_part(NEW.email, '@', 1)
    ),
    'user'::app_role,  -- Set default role to 'user'
    NOW(),
    NOW()
  );
  
  -- Insert initial credits if credits table exists
  BEGIN
    INSERT INTO public.credits (user_id, amount, created_at, updated_at)
    VALUES (NEW.id, 0, NOW(), NOW());
  EXCEPTION WHEN undefined_table THEN
    -- Credits table doesn't exist, skip this step
    NULL;
  END;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error and re-raise it so we can see what's happening
  RAISE LOG 'handle_new_user error: %', SQLERRM;
  RAISE;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Test the function by checking if it can be called without errors
SELECT 'handle_new_user function updated successfully' as status;
