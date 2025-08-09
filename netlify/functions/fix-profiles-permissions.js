const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Supabase configuration missing' })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fix profiles table RLS policies
    const profilesPolicySQL = `
      -- Enable RLS on profiles table
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
      DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

      -- Create policies for profiles table
      CREATE POLICY "Users can view own profile" ON profiles
        FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY "Users can update own profile" ON profiles
        FOR UPDATE USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert own profile" ON profiles
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      -- Allow public read access to basic profile info (email, display_name)
      CREATE POLICY "Public profiles are viewable by everyone" ON profiles
        FOR SELECT USING (true);
    `;

    const { error: profilesError } = await supabase.rpc('exec', { sql: profilesPolicySQL });

    if (profilesError) {
      console.error('Error fixing profiles policies:', profilesError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to fix profiles permissions',
          details: profilesError.message 
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Profiles table permissions fixed successfully'
      })
    };

  } catch (error) {
    console.error('Error fixing permissions:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
