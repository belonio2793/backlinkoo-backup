import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/globalErrorHandler'
import './utils/cryptoWalletHandler'
// Protect fetch from FullStory interference early
import './utils/fullstoryProtection'

// Clear previous console errors in development
if (import.meta.env.DEV) {
  console.clear();
  console.log('🚀 Starting Backlinkoo application...');

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

  console.log('💡 Debug helpers available:');
  console.log('  - fixRLS() - Go to RLS recursion fix page');
  console.log('  - forcePremium() - Force current user to premium status');
  console.log('  - forceSignOut() - Force sign out and redirect to home');
  console.log('  - checkUserSubscription() - Check user subscription status in database');
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
    import('./services/databaseSyncService').then(({ DatabaseSyncService }) => {
      DatabaseSyncService.scheduleCleanup();
      // Run initial sync verification
      DatabaseSyncService.forceSyncVerification().catch(console.error);
    });
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
