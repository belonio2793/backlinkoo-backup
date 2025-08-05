// Simple Edge Function test script
// Run in browser console: testEdgeFunctions()

const testEdgeFunctions = async () => {
  console.log('🔍 Testing Edge Functions');
  console.log('==========================');

  const issues = [];
  const success = [];

  // Test 1: Check environment variables
  console.log('\n1️⃣ Checking Environment Variables...');
  const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta?.env?.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl) {
    console.log('✅ VITE_SUPABASE_URL is configured');
    success.push('Supabase URL configured');
  } else {
    console.log('❌ VITE_SUPABASE_URL is missing');
    issues.push({
      critical: true,
      issue: 'VITE_SUPABASE_URL is missing',
      solution: 'Add VITE_SUPABASE_URL to environment variables'
    });
  }

  if (supabaseAnonKey) {
    console.log('✅ VITE_SUPABASE_ANON_KEY is configured');
    success.push('Supabase anon key configured');
  } else {
    console.log('❌ VITE_SUPABASE_ANON_KEY is missing');
    issues.push({
      critical: true,
      issue: 'VITE_SUPABASE_ANON_KEY is missing',
      solution: 'Add VITE_SUPABASE_ANON_KEY to environment variables'
    });
  }

  // Test 2: Check authentication
  console.log('\n2️⃣ Checking Authentication...');
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: session, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Authentication error:', error.message);
      issues.push({
        critical: true,
        issue: `Authentication error: ${error.message}`,
        solution: 'Check Supabase configuration and try signing in'
      });
    } else if (!session?.session) {
      console.log('⚠️ No active session - user not signed in');
      issues.push({
        critical: false,
        issue: 'No active authentication session',
        solution: 'Sign in to test authenticated functions'
      });
    } else {
      console.log('✅ User is authenticated:', session.session.user?.email);
      success.push('User authentication working');
    }
  } catch (error) {
    console.log('❌ Failed to check authentication:', error.message);
    issues.push({
      critical: true,
      issue: `Authentication check failed: ${error.message}`,
      solution: 'Check Supabase imports and configuration'
    });
  }

  // Test 3: Test Edge Function connectivity
  console.log('\n3️⃣ Testing Edge Function Connectivity...');
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.functions.invoke('create-subscription', {
      body: { test: true }
    });

    if (error) {
      console.log('❌ Edge Function error:', error);
      issues.push({
        critical: true,
        issue: `Edge Function error: ${JSON.stringify(error)}`,
        solution: 'Check Supabase Edge Function deployment and configuration'
      });
    } else {
      console.log('✅ Edge Function test successful:', data);
      success.push('Edge Function connectivity working');
    }
  } catch (error) {
    console.log('❌ Edge Function connectivity error:', error.message);
    issues.push({
      critical: true,
      issue: `Edge Function connectivity error: ${error.message}`,
      solution: 'Ensure Edge Functions are deployed and accessible'
    });
  }

  // Test 4: Test subscription creation (if authenticated)
  console.log('\n4️⃣ Testing Subscription Creation...');
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session) {
      console.log('⚠️ Skipping subscription test - not authenticated');
    } else {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          priceId: 'price_test_monthly',
          tier: 'premium',
          isGuest: false
        }
      });

      if (error) {
        console.log('❌ Subscription creation error:', error);
        issues.push({
          critical: true,
          issue: `Subscription creation failed: ${JSON.stringify(error)}`,
          solution: 'Check Stripe configuration and Edge Function logs'
        });
      } else {
        console.log('✅ Subscription creation test successful:', data);
        success.push('Subscription creation working');
      }
    }
  } catch (error) {
    console.log('❌ Subscription test error:', error.message);
    issues.push({
      critical: true,
      issue: `Subscription test error: ${error.message}`,
      solution: 'Check subscription function implementation'
    });
  }

  // Results Summary
  console.log('\n📊 EDGE FUNCTION DIAGNOSTIC RESULTS');
  console.log('====================================');
  console.log(`✅ Successful checks: ${success.length}`);
  console.log(`❌ Issues found: ${issues.length}`);

  if (success.length > 0) {
    console.log('\n✅ Working Components:');
    success.forEach(item => console.log(`  • ${item}`));
  }

  if (issues.length > 0) {
    console.log('\n❌ Issues Found:');
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue.critical ? '🚨 CRITICAL' : '⚠️  WARNING'}: ${issue.issue}`);
      console.log(`     💡 Solution: ${issue.solution}`);
    });

    console.log('\n🔧 IMMEDIATE ACTION REQUIRED:');
    const criticalIssues = issues.filter(i => i.critical);
    if (criticalIssues.length > 0) {
      console.log('Fix these critical issues first:');
      criticalIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.solution}`);
      });
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('1. Visit the Supabase dashboard and check Edge Function deployment');
    console.log('2. Ensure these environment variables are set:');
    console.log('   - STRIPE_SECRET_KEY (in Supabase dashboard)');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY (in Supabase dashboard)');
    console.log('   - VITE_SUPABASE_URL (in your environment)');
    console.log('   - VITE_SUPABASE_ANON_KEY (in your environment)');
    console.log('3. Check Supabase Edge Function logs: supabase functions logs');
    console.log('4. Redeploy Edge Functions: supabase functions deploy');

  } else {
    console.log('\n🎉 No critical issues found! Edge Functions should be working.');
    console.log('If you\'re still having issues:');
    console.log('1. Check the Edge Function diagnostic page: /edge-function-diagnostic');
    console.log('2. Verify Stripe test price IDs are correct');
    console.log('3. Test with a real subscription flow');
  }

  return { success, issues, summary: { successCount: success.length, issueCount: issues.length } };
};

// Make it available globally
window.testEdgeFunctions = testEdgeFunctions;

console.log('🔍 Edge Function Diagnostic Tool Loaded');
console.log('📋 Run testEdgeFunctions() to diagnose Edge Function issues');
