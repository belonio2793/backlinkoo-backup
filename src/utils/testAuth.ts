/**
 * Simple authentication test utility for debugging
 */
import { supabase } from '@/integrations/supabase/client';

export const testAuthFlow = async () => {
  console.log('🧪 Running authentication test...');
  
  try {
    // Test 1: Check current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('🧪 Test 1 - Current Session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      emailConfirmed: session?.user?.email_confirmed_at,
      error: error?.message
    });
    
    // Test 2: Check authentication status
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('🧪 Test 2 - Current User:', {
      hasUser: !!user,
      userEmail: user?.email,
      emailConfirmed: user?.email_confirmed_at,
      error: userError?.message
    });
    
    // Test 3: Check if user is valid for dashboard access
    const isValidForDashboard = !!(session?.user && session.user.email_confirmed_at);
    
    console.log('🧪 Test 3 - Dashboard Access:', {
      canAccessDashboard: isValidForDashboard,
      reason: !isValidForDashboard ? 
        (!session?.user ? 'No user session' : 'Email not confirmed') : 
        'Valid authenticated user'
    });
    
    return {
      hasValidSession: isValidForDashboard,
      user: session?.user || null,
      error: error?.message || userError?.message
    };
    
  } catch (err: any) {
    console.error('🧪 Auth test failed:', err);
    return {
      hasValidSession: false,
      user: null,
      error: err.message
    };
  }
};

// Function to be called from browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).testAuth = testAuthFlow;
}
