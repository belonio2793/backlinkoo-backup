const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

exports.handler = async (event, context) => {
  console.log('🔧 RLS Recursion Fix Function called');

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing Supabase configuration'
        })
      };
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🔧 Testing current RLS state...');

    // Test if we can query profiles without recursion
    let hasRecursion = false;
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('profiles')
        .select('user_id, role')
        .limit(1);

      if (testError && testError.message.includes('infinite recursion')) {
        hasRecursion = true;
        console.log('❌ Confirmed: RLS recursion detected');
      } else {
        console.log('✅ No RLS recursion detected');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'No RLS recursion found - no action needed',
            hasRecursion: false
          })
        };
      }
    } catch (testErr) {
      if (testErr.message.includes('infinite recursion')) {
        hasRecursion = true;
        console.log('❌ Confirmed: RLS recursion detected via exception');
      }
    }

    if (!hasRecursion) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'No RLS recursion detected',
          hasRecursion: false
        })
      };
    }

    console.log('🔧 Attempting to fix RLS recursion...');

    // Step 1: Drop all existing policies on profiles table
    const dropPoliciesQueries = [
      "DROP POLICY IF EXISTS profiles_select_own ON profiles;",
      "DROP POLICY IF EXISTS profiles_insert_own ON profiles;", 
      "DROP POLICY IF EXISTS profiles_update_own ON profiles;",
      "DROP POLICY IF EXISTS profiles_delete_own ON profiles;",
      "DROP POLICY IF EXISTS profiles_admin_all ON profiles;",
      "DROP POLICY IF EXISTS profiles_public_read ON profiles;",
      "DROP POLICY IF EXISTS profiles_user_read ON profiles;",
      "DROP POLICY IF EXISTS profiles_user_update ON profiles;",
      // Add more potential policy names that might exist
      "DROP POLICY IF EXISTS enable_select_for_authenticated_users ON profiles;",
      "DROP POLICY IF EXISTS enable_insert_for_authenticated_users ON profiles;",
      "DROP POLICY IF EXISTS enable_update_for_authenticated_users ON profiles;"
    ];

    for (const query of dropPoliciesQueries) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { query });
        if (error) {
          console.warn(`⚠️ Could not drop policy: ${error.message}`);
        } else {
          console.log(`✅ Executed: ${query}`);
        }
      } catch (err) {
        console.warn(`⚠️ Error executing ${query}:`, err.message);
      }
    }

    // Step 2: Temporarily disable RLS
    try {
      const { error: disableError } = await supabaseAdmin.rpc('exec_sql', {
        query: 'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;'
      });
      
      if (disableError) {
        console.warn('⚠️ Could not disable RLS:', disableError.message);
      } else {
        console.log('✅ RLS disabled on profiles table');
      }
    } catch (disableErr) {
      console.warn('⚠️ Error disabling RLS:', disableErr.message);
    }

    // Step 3: Re-enable RLS with simple policies
    try {
      const { error: enableError } = await supabaseAdmin.rpc('exec_sql', {
        query: 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;'
      });
      
      if (enableError) {
        console.warn('⚠️ Could not re-enable RLS:', enableError.message);
      } else {
        console.log('✅ RLS re-enabled on profiles table');
      }
    } catch (enableErr) {
      console.warn('⚠️ Error re-enabling RLS:', enableErr.message);
    }

    // Step 4: Create simple, non-recursive policies
    const simplePolicies = [
      {
        name: 'profiles_select_simple',
        query: `CREATE POLICY profiles_select_simple ON profiles FOR SELECT USING (auth.uid() = user_id);`
      },
      {
        name: 'profiles_insert_simple',
        query: `CREATE POLICY profiles_insert_simple ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);`
      },
      {
        name: 'profiles_update_simple', 
        query: `CREATE POLICY profiles_update_simple ON profiles FOR UPDATE USING (auth.uid() = user_id);`
      }
    ];

    const policyResults = [];
    for (const policy of simplePolicies) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { query: policy.query });
        if (error) {
          console.warn(`⚠️ Failed to create ${policy.name}:`, error.message);
          policyResults.push({ policy: policy.name, success: false, error: error.message });
        } else {
          console.log(`✅ Created policy: ${policy.name}`);
          policyResults.push({ policy: policy.name, success: true });
        }
      } catch (err) {
        console.warn(`⚠️ Error creating ${policy.name}:`, err.message);
        policyResults.push({ policy: policy.name, success: false, error: err.message });
      }
    }

    // Step 5: Test the fix
    console.log('🧪 Testing RLS fix...');
    let fixSuccessful = false;
    let testResult = null;

    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('profiles')
        .select('user_id, role')
        .limit(1);

      if (testError) {
        if (testError.message.includes('infinite recursion')) {
          fixSuccessful = false;
          testResult = { error: 'RLS recursion still present' };
        } else {
          fixSuccessful = true;
          testResult = { error: testError.message, note: 'Different error - recursion fixed' };
        }
      } else {
        fixSuccessful = true;
        testResult = { success: true, message: 'Profiles table accessible' };
      }
    } catch (testErr) {
      if (testErr.message.includes('infinite recursion')) {
        fixSuccessful = false;
        testResult = { error: 'RLS recursion still present' };
      } else {
        fixSuccessful = true;
        testResult = { error: testErr.message, note: 'Different error - recursion fixed' };
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: fixSuccessful,
        message: fixSuccessful ? 'RLS recursion fixed successfully' : 'RLS recursion fix failed',
        details: {
          hadRecursion: true,
          policyResults,
          testResult,
          fixSuccessful
        }
      })
    };

  } catch (error) {
    console.error('❌ RLS fix function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};
