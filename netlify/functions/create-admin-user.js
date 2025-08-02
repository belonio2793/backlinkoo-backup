const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const { email, password, display_name, role = 'user', auto_confirm = true } = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email and password are required' }),
      };
    }

    // Validate password length
    if (password.length < 6) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Password must be at least 6 characters long' }),
      };
    }

    console.log('Creating user with email:', email);

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingUser) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'A user with this email already exists' }),
      };
    }

    // Create the auth user using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: password,
      email_confirm: auto_confirm,
      user_metadata: {
        display_name: display_name || null
      }
    });

    if (authError) {
      console.error('Auth user creation failed:', authError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Failed to create auth user: ${authError.message}` }),
      };
    }

    if (!authData.user) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Auth user creation returned no user data' }),
      };
    }

    console.log('Auth user created:', authData.user.id);

    // Create the profile
    const profileData = {
      user_id: authData.user.id,
      email: email.toLowerCase().trim(),
      display_name: display_name || null,
      role: role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation failed:', profileError);
      
      // Try to clean up the auth user if profile creation failed
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('Cleaned up auth user after profile creation failure');
      } catch (cleanupError) {
        console.warn('Could not clean up auth user:', cleanupError);
      }
      
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Failed to create user profile: ${profileError.message}` }),
      };
    }

    console.log('User profile created successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        user: authData.user,
        profile: profile
      }),
    };

  } catch (error) {
    console.error('User creation failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: `User creation failed: ${error.message}` }),
    };
  }
};
