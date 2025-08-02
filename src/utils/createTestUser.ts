import { supabase } from '@/integrations/supabase/client';

export async function createTestUser() {
  console.log('🧪 Creating test user for authentication testing...');
  
  const testEmail = 'admin@backlinkoo.com';
  const testPassword = 'testpass123';
  
  try {
    // First, try to sign up the user
    console.log('Step 1: Creating auth user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: window.location.origin + '/auth/confirm',
        data: {
          first_name: 'Test',
          display_name: 'Test Admin',
          role: 'admin'
        }
      }
    });
    
    if (signUpError) {
      console.error('Sign up error:', signUpError);
      
      // If user already exists, try to sign in instead
      if (signUpError.message.includes('already registered')) {
        console.log('User already exists, trying to sign in...');
        return await testSignIn(testEmail, testPassword);
      }
      
      return { success: false, error: signUpError.message };
    }
    
    console.log('✅ Auth user created:', signUpData.user?.id);
    
    // For testing purposes, manually confirm the email
    if (signUpData.user && !signUpData.user.email_confirmed_at) {
      console.log('Step 2: Manually confirming email for testing...');
      
      // Sign out first
      await supabase.auth.signOut();
      
      // In a real scenario, user would click email link
      // For testing, we'll try to sign in and see what happens
      return await testSignIn(testEmail, testPassword);
    }
    
    return {
      success: true,
      user: signUpData.user,
      session: signUpData.session,
      requiresConfirmation: !signUpData.user?.email_confirmed_at
    };
    
  } catch (error: any) {
    console.error('Test user creation error:', error);
    return { success: false, error: error.message };
  }
}

async function testSignIn(email: string, password: string) {
  console.log('🔐 Testing sign in...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Sign in successful:', {
      userId: data.user?.id,
      email: data.user?.email,
      emailConfirmed: !!data.user?.email_confirmed_at
    });
    
    return {
      success: true,
      user: data.user,
      session: data.session,
      emailConfirmed: !!data.user?.email_confirmed_at
    };
    
  } catch (error: any) {
    console.error('Sign in exception:', error);
    return { success: false, error: error.message };
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).createTestUser = createTestUser;
  
  // Instructions for manual testing
  console.log(`
  🧪 Test User Creation Available
  
  To manually test authentication:
  1. Open browser console
  2. Run: createTestUser()
  3. Check the results
  
  Test credentials:
  Email: admin@backlinkoo.com
  Password: testpass123
  `);
}
