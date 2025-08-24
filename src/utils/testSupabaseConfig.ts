import { supabase } from '@/integrations/supabase/client';

/**
 * Test Supabase client configuration and API key setup
 */
export async function testSupabaseConfig() {
  console.log('🔍 Testing Supabase configuration...');
  
  const results = {
    clientInitialized: false,
    hasUrl: false,
    hasKey: false,
    canConnect: false,
    sessionWorks: false,
    authWorks: false,
    errors: [] as string[]
  };

  try {
    // Test 1: Check if client is initialized
    if (supabase) {
      results.clientInitialized = true;
      console.log('✅ Supabase client is initialized');
    } else {
      results.errors.push('Supabase client not initialized');
      console.error('❌ Supabase client not initialized');
    }

    // Test 2: Check environment variables
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (url) {
      results.hasUrl = true;
      console.log('✅ VITE_SUPABASE_URL is set:', url.substring(0, 30) + '...');
    } else {
      results.errors.push('VITE_SUPABASE_URL not found');
      console.error('❌ VITE_SUPABASE_URL not found');
    }

    if (key) {
      results.hasKey = true;
      console.log('✅ VITE_SUPABASE_ANON_KEY is set:', key.substring(0, 10) + '...');
    } else {
      results.errors.push('VITE_SUPABASE_ANON_KEY not found');
      console.error('❌ VITE_SUPABASE_ANON_KEY not found');
    }

    // Test 3: Test basic connectivity
    try {
      const { data, error } = await supabase.from('domains').select('id').limit(1);
      if (error) {
        results.errors.push(`Database query error: ${error.message}`);
        console.warn('⚠️ Database query error:', error.message);
      } else {
        results.canConnect = true;
        console.log('✅ Can connect to Supabase database');
      }
    } catch (dbError: any) {
      results.errors.push(`Database connection error: ${dbError.message}`);
      console.error('❌ Database connection error:', dbError.message);
    }

    // Test 4: Test session method (should not require auth)
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        results.errors.push(`Session error: ${error.message}`);
        console.warn('⚠️ Session error:', error.message);
      } else {
        results.sessionWorks = true;
        console.log('✅ getSession() works:', session ? 'User logged in' : 'No user session');
      }
    } catch (sessionError: any) {
      results.errors.push(`Session method error: ${sessionError.message}`);
      console.error('❌ Session method error:', sessionError.message);
    }

    // Test 5: Test getUser method (this one causes API key errors)
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        results.errors.push(`getUser error: ${error.message}`);
        console.warn('⚠️ getUser error (expected for unauthenticated):', error.message);
      } else {
        results.authWorks = true;
        console.log('✅ getUser() works:', user ? 'User authenticated' : 'No user');
      }
    } catch (authError: any) {
      results.errors.push(`getUser method error: ${authError.message}`);
      console.error('❌ getUser method error:', authError.message);
    }

  } catch (overallError: any) {
    results.errors.push(`Overall test error: ${overallError.message}`);
    console.error('❌ Overall test error:', overallError.message);
  }

  console.log('🔍 Supabase configuration test results:', results);
  return results;
}

/**
 * Test specifically for API key issues on domains page
 */
export async function testDomainsPageAuth() {
  console.log('🔍 Testing domains page authentication...');
  
  try {
    // This is what domains page components do
    console.log('Testing getSession() (should work)...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ getSession() failed:', sessionError.message);
      return { success: false, error: sessionError.message };
    }
    
    console.log('✅ getSession() works fine');
    
    if (session?.user) {
      console.log('✅ User is authenticated:', session.user.email);
    } else {
      console.log('ℹ️ No user session (normal for unauthenticated users)');
    }
    
    return { success: true, hasUser: !!session?.user, userEmail: session?.user?.email };
    
  } catch (error: any) {
    console.error('❌ Domains page auth test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Auto-run test in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    testSupabaseConfig();
    testDomainsPageAuth();
  }, 2000);
}
