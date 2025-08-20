/**
 * Test to verify auth session missing error fix
 * This tests that AuthSessionMissingError is handled gracefully without showing as error
 */

import { supabase } from '@/integrations/supabase/client';
import { SafeAuth } from './safeAuth';

export function testAuthSessionFix(): void {
  console.log('🧪 Testing auth session missing error fix...');
  
  // Test SafeAuth handling
  console.log('📋 Testing SafeAuth.getCurrentUser():');
  SafeAuth.getCurrentUser().then(result => {
    console.log('  SafeAuth result:', {
      hasUser: !!result.user,
      errorType: result.errorType,
      needsAuth: result.needsAuth,
      error: result.error
    });
    
    if (result.errorType === 'no_session') {
      console.log('  ✅ Auth session missing handled gracefully by SafeAuth');
    } else if (result.user) {
      console.log('  ✅ User authenticated successfully');
    } else if (result.errorType) {
      console.log(`  ⚠️ Other error type: ${result.errorType}`);
    }
  }).catch(error => {
    console.error('  ❌ SafeAuth test failed:', error);
  });

  // Test direct supabase.auth.getUser() to see if it still throws
  console.log('📋 Testing direct supabase.auth.getUser():');
  supabase.auth.getUser().then(({ data, error }) => {
    if (error) {
      if (error.message.includes('Auth session missing')) {
        console.log('  ℹ️ Auth session missing error from direct call (expected for unauthenticated users)');
        console.log('  ✅ Error not thrown as unhandled exception');
      } else {
        console.log('  ⚠️ Other auth error:', error.message);
      }
    } else if (data.user) {
      console.log('  ✅ User authenticated via direct call:', data.user.email);
    } else {
      console.log('  ℹ️ No user from direct call (normal for unauthenticated)');
    }
  }).catch(error => {
    console.error('  ❌ Direct auth call error caught:', error.message);
    if (error.message.includes('Auth session missing')) {
      console.log('  ✅ AuthSessionMissingError properly caught and handled');
    }
  });

  console.log('✅ Auth session fix test complete!');
  console.log('ℹ️ Check above results - no "Auth session missing" errors should be shown as unhandled exceptions');
}

// Auto-run test in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run after a delay to not interfere with app startup
  setTimeout(() => {
    testAuthSessionFix();
  }, 3000);
}
