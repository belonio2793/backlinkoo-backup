const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dfhanacsmsvvkpunurnp.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          success: false, 
          error: 'No Supabase key found' 
        })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // First test if we can query profiles
    console.log('Testing profiles query...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('user_id, email, role')
      .limit(1);

    if (testError && testError.message.includes('infinite recursion')) {
      // We have the recursion issue - need manual fix
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: false,
          error: 'Infinite recursion detected',
          manual_fix_required: true,
          sql_fix: `
-- Run this SQL in Supabase Dashboard:
-- https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql/new

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop problematic functions
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.check_admin_role();
DROP FUNCTION IF EXISTS public.is_admin();

-- Drop all existing policies
DO $$ 
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- Re-enable RLS with simple policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Simple policy for user own profile
CREATE POLICY "users_own_profile" ON public.profiles
FOR ALL USING (auth.uid() = user_id);

-- Admin policy without recursion
CREATE POLICY "admin_all_profiles" ON public.profiles
FOR ALL USING (
    auth.uid() IN (
        SELECT id FROM auth.users WHERE email = 'support@backlinkoo.com'
    )
);

SELECT 'RLS recursion fixed' as result;
          `
        })
      };
    }

    // If we get here, profiles query worked
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'RLS recursion appears to be resolved',
        profiles_found: testData?.length || 0
      })
    };

  } catch (error) {
    console.error('Error in fix-rls-recursion:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
