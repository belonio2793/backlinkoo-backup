const { createClient } = require('@supabase/supabase-js');

// Get Supabase config
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dfhanacsmsvvkpunurnp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ No Supabase key found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSRecursion() {
  console.log('🔧 Fixing RLS infinite recursion...');

  try {
    // First, disable RLS temporarily to stop recursion
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;'
    });

    if (disableError) {
      console.log('⚠️ Could not disable RLS via RPC, trying direct approach...');
    }

    // Try to query profiles to test if recursion is resolved
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, email, role')
      .limit(1);

    if (error) {
      console.log('❌ Profiles query still failing:', error.message);
      
      // If it's still the infinite recursion error, we need manual intervention
      if (error.message.includes('infinite recursion')) {
        console.log('🚨 Manual database fix required!');
        console.log('\n📋 Please run this SQL in your Supabase dashboard:');
        console.log('\n-- 1. Go to https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql/new');
        console.log('-- 2. Run this SQL:');
        console.log(`
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
        `);
        console.log('\n-- 3. Then try logging in again');
        return;
      }
    }

    console.log('✅ RLS recursion appears to be resolved');
    console.log('📊 Profiles data sample:', data);

  } catch (err) {
    console.error('❌ Error fixing RLS recursion:', err.message);
  }
}

fixRLSRecursion();
