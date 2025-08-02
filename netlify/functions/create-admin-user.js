/**
 * Netlify Function: Create Admin User
 * 
 * Creates an admin user with the specified email and sets up admin privileges
 * This runs with elevated privileges and can create users in Supabase
 */

import { createClient } from '@supabase/supabase-js';

export default async (req, context) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get environment variables
    const supabaseUrl = Netlify.env.get('SUPABASE_URL');
    const supabaseServiceKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        error: 'Missing Supabase configuration'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Parse request body
    const { email = 'support@backlinkoo.com', password = 'Admin123!@#' } = await req.json();

    console.log('🔧 Creating admin user:', email);

    // Step 1: Create the auth user with admin client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Support Admin',
        display_name: 'Support Team'
      }
    });

    let user = authData?.user;

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('👤 User already exists, finding existing user...');
        
        // Get the existing user
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          throw new Error(`Failed to list users: ${listError.message}`);
        }
        
        const existingUser = users.users.find(u => u.email === email);
        if (!existingUser) {
          throw new Error('User exists but could not be found');
        }

        user = existingUser;
      } else {
        throw new Error(`Failed to create user: ${authError.message}`);
      }
    }

    if (!user) {
      throw new Error('No user was created or found');
    }

    console.log(`✅ User created/found: ${user.id}`);

    // Step 2: Create or update the profile with admin role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        email: email,
        full_name: 'Support Admin',
        display_name: 'Support Team',
        role: 'admin',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    console.log('✅ Profile created/updated:', profileData);

    // Step 3: Verify admin access
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('role, email, full_name')
      .eq('user_id', user.id)
      .single();

    if (verifyError) {
      throw new Error(`Failed to verify admin: ${verifyError.message}`);
    }

    if (verifyData.role !== 'admin') {
      throw new Error('User was created but admin role was not set properly');
    }

    console.log('✅ Admin verification successful:', verifyData);

    return new Response(JSON.stringify({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: user.id,
        email: email,
        role: 'admin'
      },
      credentials: {
        email: email,
        password: password
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Admin user creation failed:', error.message);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: "/api/create-admin-user"
};
