import { supabase } from '@/integrations/supabase/client';

export interface SupabaseTestResult {
  success: boolean;
  error?: string;
  details: {
    connectionTest: boolean;
    databaseTest: boolean;
    authTest: boolean;
    userAgent: string;
    timestamp: string;
  };
}

/**
 * Quick test to check if Supabase is properly configured and accessible
 */
export async function testSupabaseConnection(): Promise<SupabaseTestResult> {
  const result: SupabaseTestResult = {
    success: false,
    details: {
      connectionTest: false,
      databaseTest: false,
      authTest: false,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }
  };

  try {
    console.log('🔍 Testing Supabase connection...');

    // Test 1: Basic connection and auth
    try {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      result.details.authTest = !sessionError;
      if (sessionError) {
        console.warn('Auth test warning:', sessionError);
      }
    } catch (authError) {
      console.error('Auth test failed:', authError);
      result.details.authTest = false;
    }

    // Test 2: Database access
    try {
      const { data: profiles, error: dbError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      result.details.databaseTest = !dbError;
      if (dbError) {
        console.warn('Database test warning:', dbError);
      }
    } catch (dbTestError) {
      console.error('Database test failed:', dbTestError);
      result.details.databaseTest = false;
    }

    // Test 3: Connection test
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(0);
      result.details.connectionTest = !error;
      if (error) {
        console.warn('Connection test warning:', error);
      }
    } catch (connError) {
      console.error('Connection test failed:', connError);
      result.details.connectionTest = false;
    }

    // Overall success
    result.success = result.details.authTest && result.details.databaseTest && result.details.connectionTest;

    if (result.success) {
      console.log('✅ Supabase connection test passed');
    } else {
      console.log('❌ Supabase connection test failed:', result.details);
    }

    return result;

  } catch (error: any) {
    console.error('🚨 Supabase test exception:', error);
    result.error = error.message;
    return result;
  }
}

/**
 * Quick sign-in test with diagnostic information
 */
export async function testSignIn(email: string, password: string): Promise<any> {
  console.log('🔍 Testing sign-in for:', email);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    const result = {
      success: !error,
      error: error?.message,
      hasUser: !!data.user,
      hasSession: !!data.session,
      userDetails: data.user ? {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: !!data.user.email_confirmed_at,
        createdAt: data.user.created_at
      } : null,
      fullError: error ? JSON.stringify(error, null, 2) : null,
      timestamp: new Date().toISOString()
    };

    console.log('🔍 Sign-in test result:', result);
    return result;

  } catch (exception: any) {
    console.error('🚨 Sign-in test exception:', exception);
    return {
      success: false,
      exception: true,
      error: exception.message,
      fullException: JSON.stringify(exception, null, 2),
      timestamp: new Date().toISOString()
    };
  }
}
