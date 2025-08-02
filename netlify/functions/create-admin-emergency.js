const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🚨 Emergency admin creation started...');

    // Get Supabase credentials from environment
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error - missing Supabase credentials',
          debug: {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!supabaseServiceKey
          }
        })
      };
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('📧 Creating admin user...');

    // First, try to delete any existing problematic user
    try {
      await supabase.auth.admin.deleteUser('support@backlinkoo.com');
      console.log('🗑️ Deleted existing user (if any)');
    } catch (deleteError) {
      console.log('ℹ️ No existing user to delete or delete failed:', deleteError.message);
    }

    // Create the admin user using admin API
    const { data: adminUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'support@backlinkoo.com',
      password: 'Admin123!@#',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Support Admin',
        display_name: 'Support Team'
      }
    });

    if (createError) {
      console.error('❌ Failed to create admin user:', createError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to create admin user',
          details: createError.message,
          code: createError.code
        })
      };
    }

    console.log('✅ Admin user created:', adminUser.user.email);

    // Create or update profile with admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: adminUser.user.id,
        email: 'support@backlinkoo.com',
        full_name: 'Support Admin',
        display_name: 'Support Team',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (profileError) {
      console.warn('⚠️ Profile creation warning:', profileError);
      // Don't fail the request if profile creation fails due to RLS
    } else {
      console.log('✅ Admin profile created');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Admin user created successfully',
        user: {
          id: adminUser.user.id,
          email: adminUser.user.email,
          confirmed: adminUser.user.email_confirmed_at !== null
        }
      })
    };

  } catch (error) {
    console.error('💥 Emergency admin creation failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Emergency admin creation failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
