import { PremiumService } from '@/services/premiumService';
import { supabase } from '@/integrations/supabase/client';

export async function testPremiumDashboard(userId?: string) {
  console.log('🧪 Testing Premium Dashboard Functionality...');
  
  const testResults = {
    premiumServiceAvailable: false,
    premiumCheckWorking: false,
    userProgressWorking: false,
    premiumStatusResult: null,
    userProgressResult: null,
    errors: []
  };

  try {
    // Test 1: Check if PremiumService is available
    console.log('1. Testing PremiumService availability...');
    if (typeof PremiumService.checkPremiumStatus === 'function') {
      testResults.premiumServiceAvailable = true;
      console.log('✅ PremiumService is available');
    } else {
      testResults.errors.push('PremiumService.checkPremiumStatus is not a function');
      console.log('❌ PremiumService is not available');
    }

    // Test 2: Check current user
    const { data: { user } } = await supabase.auth.getUser();
    const testUserId = userId || user?.id;
    
    if (!testUserId) {
      testResults.errors.push('No user ID available for testing');
      console.log('❌ No user ID available');
      return testResults;
    }

    console.log('2. Testing premium status check for user:', user?.email);
    
    // Test 3: Premium status check
    try {
      const premiumStatus = await PremiumService.checkPremiumStatus(testUserId);
      testResults.premiumCheckWorking = true;
      testResults.premiumStatusResult = premiumStatus;
      console.log('✅ Premium status check working:', premiumStatus);
    } catch (error: any) {
      testResults.errors.push(`Premium check failed: ${error.message}`);
      console.log('❌ Premium status check failed:', error.message);
    }

    // Test 4: User progress check
    console.log('3. Testing user progress fetch...');
    try {
      const userProgress = await PremiumService.getUserProgress(testUserId);
      testResults.userProgressWorking = true;
      testResults.userProgressResult = userProgress;
      console.log('✅ User progress check working:', Object.keys(userProgress || {}).length, 'progress items');
    } catch (error: any) {
      testResults.errors.push(`User progress failed: ${error.message}`);
      console.log('❌ User progress check failed:', error.message);
    }

    // Test 5: Check database tables
    console.log('4. Testing premium-related database tables...');
    
    try {
      const { data: subscriptions, error: subsError } = await supabase
        .from('premium_subscriptions')
        .select('count', { count: 'exact', head: true });
      
      if (subsError) {
        testResults.errors.push(`Premium subscriptions table: ${subsError.message}`);
        console.log('⚠️ Premium subscriptions table issue:', subsError.message);
      } else {
        console.log('✅ Premium subscriptions table accessible');
      }
    } catch (error: any) {
      testResults.errors.push(`Premium subscriptions table error: ${error.message}`);
    }

    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .limit(1);
      
      if (profilesError) {
        testResults.errors.push(`Profiles table: ${profilesError.message}`);
        console.log('⚠️ Profiles table issue:', profilesError.message);
      } else {
        console.log('✅ Profiles table accessible');
      }
    } catch (error: any) {
      testResults.errors.push(`Profiles table error: ${error.message}`);
    }

    console.log('🎉 Premium dashboard test completed!');
    console.log('Results:', testResults);

    return testResults;

  } catch (error: any) {
    console.error('❌ Premium dashboard test failed:', error);
    testResults.errors.push(`Test failed: ${error.message}`);
    return testResults;
  }
}

// Helper function to simulate premium user for testing
export async function simulatePremiumUser(userId: string) {
  console.log('🎭 Simulating premium user for testing...');
  
  try {
    // Try to update user to premium in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ subscription_tier: 'premium' })
      .eq('user_id', userId);

    if (profileError && !profileError.message.includes('permission denied')) {
      console.warn('❌ Could not update profile to premium:', profileError.message);
      return false;
    }

    // Try to create premium subscription record
    const { error: subscriptionError } = await supabase
      .from('premium_subscriptions')
      .upsert({
        user_id: userId,
        plan_type: 'premium',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      });

    if (subscriptionError && !subscriptionError.message.includes('permission denied')) {
      console.warn('❌ Could not create premium subscription:', subscriptionError.message);
      return false;
    }

    console.log('✅ User simulated as premium (where permissions allow)');
    return true;

  } catch (error: any) {
    console.warn('❌ Could not simulate premium user:', error.message);
    return false;
  }
}
