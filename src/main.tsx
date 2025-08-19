import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/mobile-payment-fix.css'
// Enhanced FullStory fix - must load FIRST
import './utils/fullstoryFix'
// Fetch error diagnostics - helps debug network issues
import './utils/fetchErrorDiagnostic'
// Unified error handler - fixes all [object Object] displays
import './utils/unifiedErrorHandler'
// Immediate fix for Supabase connection blocks
import './utils/clearSupabaseBlock'
// Campaign-specific error handling
import './utils/campaignErrorHandler'
// Comprehensive error debug fix
import './utils/errorDebugFix'
// Real-time feed service
import './services/realTimeFeedService'
// Test error formatting in development (no promise rejections)
import './utils/silentErrorTest'
// Check if database schema is properly configured
// import './utils/checkSchemaExecution' // Disabled - using new blog comment system
// Auto-fix missing columns
// import './utils/fixMissingColumns' // Disabled - using new blog comment system
// Direct database fix
// import './utils/directDatabaseFix' // Disabled - using new blog comment system
// Emergency error fix (load first) - DISABLED due to fetch conflicts
// import './utils/emergencyErrorFix'
// Emergency fetch fix (load first) - DISABLED due to conflicts
// import './utils/emergencyFetchFix'
// Emergency fetch conflict fix - DISABLED, was causing more conflicts
// import './utils/emergencyFetchConflictFix'
// Network error handler for user-friendly solutions - DISABLED due to fetch wrapping
// import './utils/errorHandler'
// Fix response body conflicts early - DISABLED due to fetch conflicts
// import './utils/responseBodyFix'
// Protect fetch from FullStory interference early - DISABLED due to conflicts
// import './utils/fullstoryProtection'
// Protect Vite client from FullStory interference in development - DISABLED
// import './utils/viteClientProtection'
// Fix malformed links at runtime - DISABLED to reduce DOM interference
// import './utils/domLinkFixer'

// Clear previous console errors and conflicts
console.clear();
console.log('🚀 Starting Backlinkoo application...');
console.log('🔧 Fetch interceptors disabled to prevent conflicts');

if (import.meta.env.DEV) {

  // Add helper functions to window for debugging
  (window as any).fixRLS = async () => {
    console.log('🔧 Applying RLS fix directly...');
    try {
      const response = await fetch('/.netlify/functions/fix-rls-recursion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      console.log('🔧 RLS fix result:', result);
      if (result.success) {
        console.log('✅ RLS fix successful - refreshing page...');
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('❌ RLS fix failed:', error);
      console.log('🔧 Redirecting to RLS fix page...');
      window.location.href = '/emergency/rls-fix';
    }
  };

  (window as any).forcePremium = async () => {
    console.log('👑 Forcing user to premium status...');
    const { supabase } = await import('@/integrations/supabase/client');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No authenticated user found');
      return;
    }

    console.log('👤 User:', user.email);

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ subscription_tier: 'premium' })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('❌ Profile update error:', profileError);
      return;
    }

    // Create subscription
    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    const { error: subError } = await supabase
      .from('premium_subscriptions')
      .upsert({
        user_id: user.id,
        plan_type: 'premium',
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString()
      });

    if (subError) {
      console.warn('⚠️ Subscription error:', subError);
    }

    console.log('✅ User forced to premium - refresh page');
    window.location.reload();
  };

  (window as any).forceSignOut = async () => {
    console.log('🚪 Force signing out user...');
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.auth.signOut({ scope: 'global' });
      console.log('✅ Force sign out successful');
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Force sign out failed:', error);
      // Clear local storage and redirect anyway
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  // Import subscription check utility
  import('./utils/checkUserSubscription').then(({ checkUserSubscription }) => {
    (window as any).checkUserSubscription = checkUserSubscription;
  });

  // Import blog post fix utility
  import('./utils/fixEmptyBlogPost');

  // Import blog sync utility
  import('./utils/syncBlogPostTables');

  // Import Product Hunt post fixer
  import('./utils/fixProductHuntPost');

  // Import beautiful content structure utility
  import('./utils/forceBeautifulContentStructure');

  // Import and run one-time beautiful content migration
  import('./utils/oneTimeBeautifulContentMigration');

  // Import response body fix test
  import('./utils/testResponseBodyFix');

  console.log('💡 Debug helpers available:');
  console.log('  - fixRLS() - Go to RLS recursion fix page');
  console.log('  - forcePremium() - Force current user to premium status');
  console.log('  - forceSignOut() - Force sign out and redirect to home');
  console.log('  - checkUserSubscription() - Check user subscription status in database');
  console.log('  - syncBlogPostTables() - Sync blog posts between tables');
  console.log('  - fixProductHuntPost() - Fix malformed Product Hunt blog post');
  console.log('  - forceBeautifulContentStructure() - Apply beautiful styling to all blog posts');
  console.log('  - applyBeautifulContentStructure(content, title) - Format specific content');
  console.log('  - retryBeautifulContentMigration() - Retry the one-time beautiful content migration');
  console.log('  - testResponseBodyFix() - Test the response body fix methods');
  console.log('  - RobustContentProcessor - Content validation and repair utilities');
  console.log('  - DISABLE_VITE_PROTECTION=true - Disable Vite fetch protection');

  // Add helper to disable fetch protection
  (window as any).disableViteProtection = () => {
    (window as any).DISABLE_VITE_PROTECTION = true;
    console.log('🔧 Vite protection disabled. Refresh page to apply.');
  };

  // Add content generation test helper
  (window as any).testContentGeneration = async () => {
    console.log('🧪 Testing content generation functions...');
    const functions = ['working-content-generator', 'ai-content-generator', 'generate-content'];

    for (const func of functions) {
      try {
        const response = await fetch(`/.netlify/functions/${func}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: 'test keyword',
            anchor_text: 'test link',
            target_url: 'https://example.com'
          }),
        });

        console.log(`${func}: Status ${response.status} ${response.status === 200 ? '✅' : '❌'}`);

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            console.log(`  ✅ ${func} WORKING - Generated ${data.data?.word_count || 0} words`);
            return;
          }
        }
      } catch (error) {
        console.log(`  ❌ ${func} failed:`, error.message);
      }
    }
    console.log('❌ No working content functions found');
  };

  // Add emergency fetch fix helper
  (window as any).fixFetchErrors = async () => {
    console.log('🚨 Applying emergency fetch conflict fix...');
    try {
      // Apply the new emergency fetch conflict fix
      if ((window as any).applyEmergencyFetchFix) {
        (window as any).applyEmergencyFetchFix();
        console.log('✅ Emergency fetch conflict fix applied');
      } else {
        // Fallback to original fix
        if ((window as any).restoreOriginalFetch) {
          (window as any).restoreOriginalFetch();
          console.log('✅ Original fetch restored via FullStory fix');
        }

        const { emergencyDisableFetchProtection } = await import('./utils/emergencyFetchFix');
        emergencyDisableFetchProtection();
        console.log('✅ Fetch protection disabled');
      }

      console.log('🔄 Please refresh the page to complete the fix');
    } catch (error) {
      console.error('❌ Failed to apply fetch fix:', error);
    }
  };

  // Add FullStory-specific fix helper
  (window as any).fixFullStoryErrors = () => {
    console.log('🛡️ Applying FullStory-specific fix...');
    try {
      if ((window as any).restoreOriginalFetch) {
        (window as any).restoreOriginalFetch();
        console.log('✅ Original fetch restored');
      } else {
        console.warn('⚠️ restoreOriginalFetch not available - loading fix...');
        import('./utils/fullstoryFix').then(() => {
          if ((window as any).restoreOriginalFetch) {
            (window as any).restoreOriginalFetch();
            console.log('✅ Original fetch restored after import');
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to apply FullStory fix:', error);
    }
  };

  // Add Supabase connection fix helper
  (window as any).fixSupabaseConnection = async () => {
    console.log('🔧 Fixing Supabase connection...');
    try {
      const { clearSupabaseConnectionBlock } = await import('./utils/clearSupabaseBlock');
      clearSupabaseConnectionBlock();
      console.log('✅ Supabase connection block cleared - page will refresh');
    } catch (error) {
      console.error('❌ Failed to fix Supabase connection:', error);
    }
  };

  // Add emergency Supabase connection fixer
  (window as any).emergencyFixSupabase = async () => {
    console.log('🚨 Running emergency Supabase fix...');
    try {
      const { SupabaseConnectionFixer } = await import('./utils/supabaseConnectionFixer');
      const result = await SupabaseConnectionFixer.emergencyFix();
      console.log('🚨 Emergency fix result:', result);
      return result;
    } catch (error) {
      console.error('❌ Emergency Supabase fix failed:', error);
    }
  };

  // Add client content generator test
  (window as any).testClientContent = async () => {
    try {
      const { testClientContentGenerator } = await import('./utils/testClientContentGenerator');
      await testClientContentGenerator();
    } catch (error) {
      console.error('❌ Client content test failed:', error);
    }
  };

  // Add client Telegraph publisher test
  (window as any).testClientTelegraph = async () => {
    try {
      const { testClientTelegraphPublisher } = await import('./utils/testClientTelegraphPublisher');
      await testClientTelegraphPublisher();
    } catch (error) {
      console.error('❌ Client Telegraph test failed:', error);
    }
  };

  // Add full automation pipeline test
  (window as any).testFullPipeline = async () => {
    try {
      const { testFullAutomationPipeline } = await import('./utils/testFullAutomationPipeline');
      await testFullAutomationPipeline();
    } catch (error) {
      console.error('❌ Full pipeline test failed:', error);
    }
  };

  // Add error fix testing
  (window as any).testErrorFixes = async () => {
    try {
      const { ErrorFixTester } = await import('./utils/testErrorFixes');
      const tester = new ErrorFixTester();
      return await tester.runAllTests();
    } catch (error) {
      console.error('❌ Error fix test failed:', error);
    }
  };

  // Add real-time feed testing
  (window as any).testRealTimeFeed = async () => {
    try {
      const { testRealTimeFeedIntegration } = await import('./utils/testRealTimeFeed');
      return await testRealTimeFeedIntegration();
    } catch (error) {
      console.error('❌ Real-time feed test failed:', error);
    }
  };

  // Add campaign manager tabs testing
  (window as any).testCampaignTabs = async () => {
    try {
      const { testCampaignManagerTabs } = await import('./utils/testCampaignManagerTabs');
      return await testCampaignManagerTabs();
    } catch (error) {
      console.error('❌ Campaign tabs test failed:', error);
    }
  };

  // Add response body fix testing
  (window as any).testResponseBodyFix = async () => {
    try {
      const { testResponseBodyFix } = await import('./utils/testResponseBodyFix');
      return await testResponseBodyFix();
    } catch (error) {
      console.error('❌ Response body fix test failed:', error);
    }
  };

  // Add development processor testing
  (window as any).testDevelopmentProcessor = async () => {
    try {
      const { DevelopmentCampaignProcessor } = await import('./services/developmentCampaignProcessor');
      return await DevelopmentCampaignProcessor.runTest();
    } catch (error) {
      console.error('❌ Development processor test failed:', error);
    }
  };

  // Import fetch test helper
  import('./utils/fetchTestHelper');
  import('./utils/automationPipelineTest');
  import('./utils/testResponseBodyFix');
  import('./utils/testBacklinkNotification');
  import('./utils/testRealTimeFeedFix');
  import('./utils/databaseSchemaFixer');
  import('./utils/testWorkingContentGenerator');

  console.log('  - disableViteProtection() - Disable fetch protection and refresh');
  console.log('  - testContentGeneration() - Test content generation functions');
  console.log('  - fixFetchErrors() - Emergency fix for fetch protection issues');
  console.log('  - fixFullStoryErrors() - Fix FullStory fetch interference specifically');
  console.log('  - fixSupabaseConnection() - Clear Supabase connection block and refresh');
  console.log('  - emergencyFixSupabase() - Full emergency Supabase connection diagnosis and fix');
  console.log('  - testClientContent() - Test client-side content generation');
  console.log('  - testClientTelegraph() - Test client-side Telegraph publishing');
  console.log('  - testFullPipeline() - Test complete automation pipeline');
  console.log('  - testAutomationPipeline() - Test complete automation: Content → Telegraph → DB');
  console.log('  - testApiKey() - Test OpenAI API key configuration');
  console.log('  - testErrorFixes() - Test all error fixes and formatting');
  console.log('  - testRealTimeFeed() - Test real-time feed integration');
  console.log('  - testCampaignTabs() - Test campaign manager tabs and live links');
  console.log('  - testResponseBodyFix() - Test response body conflict prevention');
  console.log('  - testDevelopmentProcessor() - Test mock content + Telegraph publishing');
  console.log('  - testBacklinkNotification() - Test single backlink notification');
  console.log('  - testMultipleNotifications() - Test multiple backlink notifications');
  console.log('  - testRealTimeFeedSubscription() - Test real-time feed subscription fix');
  console.log('  - fetchTest.runDiagnostics() - Test fetch and network connectivity');
  console.log('  - testDatabaseSchema() - Test database connection and published_blog_posts table');
  console.log('  - checkDatabaseSchema() - Check if published_blog_posts table exists');
  console.log('  - fixDatabaseSchema() - Auto-fix missing published_blog_posts table');
  console.log('  - testWorkingContentGenerator() - Test working-content-generator function');
  console.log('  - testContentGeneratorAvailability() - Check function accessibility');
  console.log('  - runContentGeneratorDiagnostics() - Full content generator diagnostic');
}

// Priority: Get React app rendering ASAP
createRoot(document.getElementById("root")!).render(<App />);

// Defer heavy initialization to after app mount
requestIdleCallback(() => {
  // Initialize trial post cleanup service after app loads
  import('./services/trialPostCleanupService').then(({ trialPostCleanupService }) => {
    trialPostCleanupService.scheduleCleanup().catch(console.error);
  });

  // Import test utilities for development
  if (import.meta.env.DEV) {
    import('./utils/testBlogGeneration');
    import('./utils/setupDomainDatabase');

    // Quick content generation status check
    setTimeout(async () => {
      try {
        const response = await fetch('/.netlify/functions/working-content-generator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: 'startup test',
            anchor_text: 'test',
            target_url: 'https://example.com'
          }),
        });

        if (response.status === 404) {
          console.warn('⚠️ Content generation functions not available (404)');
          console.warn('�� Run window.testContentGeneration() to check all functions');
        } else if (response.ok) {
          console.log('✅ Content generation functions are working');
        } else {
          console.warn(`⚠️ Content generation status: ${response.status}`);
        }
      } catch (error) {
        console.warn('⚠️ Could not check content generation status');
      }
    }, 3000);

    // Disabled database sync service - using new blog comment system
    // import('./services/databaseSyncService').then(({ DatabaseSyncService }) => {
    //   DatabaseSyncService.scheduleCleanup();
    //   // Run initial sync verification
    //   DatabaseSyncService.forceSyncVerification().catch(console.error);
    // });
  }
}, { timeout: 5000 });

// Enhanced crypto wallet extension conflict handling
if (typeof window !== 'undefined') {
  // Import and use the dedicated crypto wallet handler
  import('./utils/cryptoWalletHandler').then(({ CryptoWalletHandler }) => {
    // Force re-initialization with enhanced protection
    CryptoWalletHandler.initialize();
  });

  // Immediate protection with safer approach
  const protectProperty = (propertyName: string) => {
    try {
      const existing = (window as any)[propertyName];
      const descriptor = Object.getOwnPropertyDescriptor(window, propertyName);

      // Only protect if configurable or doesn't exist
      if (!descriptor || descriptor.configurable) {
        // Use a proxy to handle redefinition attempts gracefully
        let currentValue = existing;

        Object.defineProperty(window, propertyName, {
          get() {
            return currentValue;
          },
          set(newValue) {
            // Allow updates but log them
            console.log(`🔧 ${propertyName} property updated by extension`);
            currentValue = newValue;
          },
          configurable: true, // Keep configurable to allow extensions to work
          enumerable: true
        });

        console.log(`🔧 Protected ${propertyName} with proxy getter/setter`);
      }
    } catch (error: any) {
      console.warn(`⚠️ Could not protect ${propertyName}:`, error.message);
    }
  };

  // Protect common wallet properties
  protectProperty('ethereum');
  protectProperty('web3');
  protectProperty('solana');

  // Enhanced Object.defineProperty override with better error handling
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj: any, prop: string | symbol, descriptor: PropertyDescriptor) {
    // Special handling for wallet-related properties on window
    if (obj === window && typeof prop === 'string' && ['ethereum', 'web3', 'solana'].includes(prop)) {
      try {
        const existing = Object.getOwnPropertyDescriptor(window, prop);

        // If property already exists and is protected, merge the values instead of throwing
        if (existing && !existing.configurable) {
          console.log(`🔧 Merging ${prop} property instead of redefining`);

          // If the existing property has a value and the new one does too, try to merge
          if (existing.value && descriptor.value && typeof existing.value === 'object' && typeof descriptor.value === 'object') {
            Object.assign(existing.value, descriptor.value);
          }

          return obj; // Return successfully without throwing
        }
      } catch (e) {
        console.warn(`⚠️ Error checking ${prop} property during redefinition:`, e);
      }
    }

    try {
      return originalDefineProperty.call(this, obj, prop, descriptor);
    } catch (error: any) {
      // Handle the specific "Cannot redefine property" error gracefully
      if (error.message?.includes('Cannot redefine property')) {
        const propName = String(prop);
        console.warn(`🔒 Gracefully handled property redefinition for ${propName}:`, error.message);

        // For crypto wallet properties, this is expected behavior
        if (['ethereum', 'web3', 'solana'].includes(propName)) {
          return obj; // Return successfully for wallet properties
        }
      }

      // Re-throw other errors
      throw error;
    }
  };
}
