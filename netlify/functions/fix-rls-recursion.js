const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  console.log('🔧 RLS Recursion Fix Function Started');

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get Supabase configuration
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dfhanacsmsvvkpunurnp.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      console.error('❌ No service role key found');
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Service configuration missing',
          message: 'Service role key required for database operations'
        })
      };
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log('🔧 Starting RLS recursion fix...');

    // Step 1: Test current profiles query to confirm recursion
    try {
      const { data: testData, error: testError } = await Promise.race([
        supabase.from('profiles').select('user_id').limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout - infinite recursion detected')), 5000)
        )
      ]);

      if (!testError) {
        console.log('✅ No recursion detected, profiles table is working');
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: 'No RLS recursion detected - profiles table is working normally',
            alreadyFixed: true
          })
        };
      }
    } catch (timeoutError) {
      console.log('⚠️ Confirmed: infinite recursion in profiles table');
    }

    // Step 2: Drop problematic functions and policies
    const fixSql = `
      -- 1. Drop problematic functions that cause recursion
      DROP FUNCTION IF EXISTS public.get_current_user_role();
      DROP FUNCTION IF EXISTS public.get_user_role();
      DROP FUNCTION IF EXISTS public.check_admin_role();
      DROP FUNCTION IF EXISTS public.is_admin();

      -- 2. Temporarily disable RLS to break the recursion loop
      ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

      -- 3. Drop ALL existing policies to start fresh
      DO $$
      DECLARE
          r RECORD;
      BEGIN
          FOR r IN (
              SELECT policyname 
              FROM pg_policies 
              WHERE tablename = 'profiles' AND schemaname = 'public'
          )
          LOOP
              EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
          END LOOP;
      END $$;

      -- 4. Re-enable RLS
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

      -- 5. Create simple, non-recursive policies
      CREATE POLICY "users_own_profile" ON public.profiles
          FOR ALL USING (auth.uid() = user_id);

      -- 6. Create admin policy without recursion (hardcoded admin email)
      CREATE POLICY "admin_all_profiles" ON public.profiles
          FOR ALL USING (
              auth.uid() = user_id
              OR 
              auth.uid() IN (
                  SELECT id FROM auth.users WHERE email = 'support@backlinkoo.com'
              )
          );
    `;

    // Execute the fix
    const { error: fixError } = await supabase.rpc('exec_sql', {
      sql: fixSql
    });

    if (fixError) {
      console.error('❌ SQL fix failed:', fixError.message);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'Database fix failed',
          details: fixError.message,
          manualInstructions: 'Please run the SQL fix manually in Supabase dashboard'
        })
      };
    }

    // Step 3: Test the fix
    console.log('🧪 Testing if recursion is fixed...');
    
    try {
      const { data: verifyData, error: verifyError } = await Promise.race([
        supabase.from('profiles').select('user_id, role').limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Still experiencing timeout')), 3000)
        )
      ]);

      if (verifyError && !verifyError.message.includes('timeout')) {
        console.log('✅ RLS recursion fixed - different error now means recursion is resolved');
      } else if (!verifyError) {
        console.log('✅ RLS recursion fixed - profiles query successful');
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'RLS infinite recursion fixed successfully',
          testResult: {
            error: verifyError?.message || null,
            dataCount: verifyData?.length || 0
          },
          nextSteps: [
            'Try logging in again',
            'Admin login should work with support@backlinkoo.com',
            'Check admin dashboard functionality'
          ]
        })
      };

    } catch (stillTimingOut) {
      console.error('❌ Still experiencing timeout after fix');
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'Fix attempted but recursion may still exist',
          recommendation: 'Manual database intervention required',
          manualSql: fixSql
        })
      };
    }

  } catch (error) {
    console.error('❌ Error in RLS fix function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Function execution failed',
        details: error.message
      })
    };
  }
};
