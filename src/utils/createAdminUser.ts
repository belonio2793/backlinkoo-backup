/**
 * Quick Admin User Creation Utility
 * 
 * This utility can be called from the browser console to create an admin user
 * Run: window.createAdminUser()
 */

import { supabase } from '@/integrations/supabase/client';

export async function createAdminUser(email = 'support@backlinkoo.com', password = 'Admin123!@#') {
  console.log('🔧 Creating admin user...');
  console.log(`   Email: ${email}`);

  try {
    // Step 1: Try to sign up the user
    console.log('📝 Creating authentication user...');
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: 'Support Admin',
          display_name: 'Support Team'
        }
      }
    });

    let userId: string;

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('👤 User already exists, trying to sign in...');
        
        // Try to sign in to get the user ID
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (signInError) {
          console.log('📧 User exists but wrong password, that\'s okay - we\'ll create/update the profile anyway');
          // We'll try to find the user and update their profile
          // For now, let's create a profile with a generated ID
          throw new Error('Please use the correct password or contact an administrator');
        }

        if (!signInData.user) {
          throw new Error('Could not sign in existing user');
        }

        userId = signInData.user.id;
      } else {
        throw new Error(`Failed to create user: ${signUpError.message}`);
      }
    } else {
      if (!signUpData.user) {
        throw new Error('User creation returned no user data');
      }
      userId = signUpData.user.id;
    }

    console.log(`✅ User ID: ${userId}`);

    // Step 2: Create or update the profile with admin role
    console.log('👑 Setting admin role in profile...');
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
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
    console.log('🔍 Verifying admin access...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('role, email, full_name')
      .eq('user_id', userId)
      .single();

    if (verifyError) {
      throw new Error(`Failed to verify admin: ${verifyError.message}`);
    }

    if (verifyData.role !== 'admin') {
      throw new Error('User was created but admin role was not set properly');
    }

    console.log('✅ Admin verification successful:', verifyData);

    console.log('');
    console.log('🎉 Admin user creation completed!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('🔗 Access URLs:');
    console.log('   Local: http://localhost:8080/admin');
    console.log('   Production: https://backlinkoo.com/admin');
    console.log('');
    console.log('⚠️  Important: Change the password after first login!');

    return {
      success: true,
      user: {
        id: userId,
        email: email,
        role: 'admin'
      },
      credentials: {
        email: email,
        password: password
      }
    };

  } catch (error: any) {
    console.error('❌ Admin user creation failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Make it available globally for console use
if (typeof window !== 'undefined') {
  (window as any).createAdminUser = createAdminUser;
  console.log('🔧 Admin user creation utility loaded. Run: createAdminUser()');
}

export default createAdminUser;
