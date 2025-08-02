import { supabase } from '@/integrations/supabase/client';

// Simple test to identify the authentication issue
export async function testAuth() {
  console.log('Testing authentication with real credentials...');
  
  try {
    const result = await supabase.auth.signInWithPassword({
      email: 'labrdanielvermarjose@gmail.com',
      password: 'testpassword123'
    });
    
    console.log('Auth result:', {
      success: !result.error,
      error: result.error?.message,
      user: result.data.user?.email,
      session: !!result.data.session
    });
    
    return result;
  } catch (error) {
    console.error('Auth test error:', error);
    return { error };
  }
}

// Make available in console for testing
if (typeof window !== 'undefined') {
  (window as any).testAuth = testAuth;
  console.log('🔧 Simple auth test available: testAuth()');
}
