import { supabase } from '@/integrations/supabase/client';

export async function quickAuthTest() {
  console.log('🔍 Quick Auth Test Started');
  
  // Test 1: Check Supabase client configuration
  console.log('Test 1: Supabase Client Configuration');
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log({
    hasEnvUrl: !!envUrl,
    hasEnvKey: !!envKey,
    urlPreview: envUrl ? envUrl.substring(0, 30) + '...' : 'Not set',
    keyPreview: envKey ? envKey.substring(0, 20) + '...' : 'Not set'
  });
  
  // Test 2: Test basic database connectivity
  console.log('Test 2: Database Connectivity');
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    console.log('Database test result:', { success: !error, error: error?.message });
  } catch (err: any) {
    console.log('Database test exception:', err.message);
  }
  
  // Test 3: Test auth service availability
  console.log('Test 3: Auth Service Availability');
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('Auth service test:', { success: !error, error: error?.message, hasSession: !!data.session });
  } catch (err: any) {
    console.log('Auth service exception:', err.message);
  }
  
  // Test 4: Try to sign in with test credentials
  console.log('Test 4: Test Sign In');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    console.log('Sign in test result:', {
      success: !error,
      error: error?.message,
      hasUser: !!data.user,
      hasSession: !!data.session,
      userEmail: data.user?.email,
      emailConfirmed: data.user?.email_confirmed_at
    });
    
    // Sign out after test
    if (data.session) {
      await supabase.auth.signOut();
      console.log('Signed out test user');
    }
  } catch (err: any) {
    console.log('Sign in test exception:', err.message);
  }
  
  console.log('🔍 Quick Auth Test Completed');
}

// Auto-run in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  setTimeout(() => {
    quickAuthTest();
  }, 2000);
}
