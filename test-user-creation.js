const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually for testing
require('dotenv').config();

console.log('🔍 Debugging User Creation Issues\n');

// Test environment variables
console.log('Environment Variables:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Set' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');

if (!process.env.VITE_SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL is missing');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing');
  process.exit(1);
}

// Initialize both regular and admin clients
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUserCreation() {
  console.log('\n🧪 Testing User Creation Process...\n');

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'password123';

  try {
    // Test 1: Check if we can connect to Supabase
    console.log('1. Testing database connection...');
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('count(*)')
      .limit(1);

    if (profilesError) {
      console.error('❌ Database connection failed:', profilesError.message);
      return;
    }
    console.log('✅ Database connection successful');

    // Test 2: Check if email already exists
    console.log('\n2. Checking if test email exists...');
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', testEmail)
      .single();

    if (existingUser) {
      console.log('ℹ️ Test email already exists, skipping creation test');
      return;
    }
    console.log('✅ Test email is available');

    // Test 3: Try creating auth user
    console.log('\n3. Creating auth user...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        display_name: 'Test User'
      }
    });

    if (authError) {
      console.error('❌ Auth user creation failed:', authError.message);
      return;
    }

    if (!authData.user) {
      console.error('❌ Auth user creation returned no user data');
      return;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Test 4: Try creating profile
    console.log('\n4. Creating user profile...');
    const profileData = {
      user_id: authData.user.id,
      email: testEmail,
      display_name: 'Test User',
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message);
      
      // Try to clean up the auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('🧹 Cleaned up auth user');
      } catch (cleanupError) {
        console.warn('⚠️ Could not clean up auth user:', cleanupError);
      }
      return;
    }

    console.log('✅ User profile created successfully');
    console.log('Profile data:', profile);

    // Test 5: Clean up test user
    console.log('\n5. Cleaning up test user...');
    await supabaseAdmin.from('profiles').delete().eq('user_id', authData.user.id);
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    console.log('✅ Test user cleaned up');

    console.log('\n🎉 User creation test completed successfully!');
    console.log('✅ All systems are working properly');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

async function testNetlifyFunction() {
  console.log('\n🧪 Testing Netlify Function...\n');

  const testPayload = {
    email: `netlify-test-${Date.now()}@example.com`,
    password: 'password123',
    display_name: 'Netlify Test User',
    role: 'user',
    auto_confirm: true
  };

  try {
    // Simulate the Netlify function logic
    console.log('Simulating Netlify function execution...');
    
    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', testPayload.email.toLowerCase().trim())
      .single();

    if (existingUser) {
      console.log('ℹ️ Test email already exists, skipping function test');
      return;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testPayload.email.toLowerCase().trim(),
      password: testPayload.password,
      email_confirm: testPayload.auto_confirm,
      user_metadata: {
        display_name: testPayload.display_name || null
      }
    });

    if (authError) {
      console.error('❌ Function simulation - Auth creation failed:', authError.message);
      return;
    }

    // Create profile
    const profileData = {
      user_id: authData.user.id,
      email: testPayload.email.toLowerCase().trim(),
      display_name: testPayload.display_name || null,
      role: testPayload.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('❌ Function simulation - Profile creation failed:', profileError.message);
      
      // Clean up
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.warn('⚠️ Could not clean up auth user:', cleanupError);
      }
      return;
    }

    console.log('✅ Netlify function simulation successful');
    
    // Clean up
    await supabaseAdmin.from('profiles').delete().eq('user_id', authData.user.id);
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    console.log('✅ Function test cleanup completed');

  } catch (error) {
    console.error('❌ Function simulation failed:', error.message);
  }
}

async function main() {
  await testUserCreation();
  await testNetlifyFunction();
}

main().catch(console.error);
