import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/globalErrorHandler'
import './utils/cryptoWalletHandler'

// Clear previous console errors in development
if (import.meta.env.DEV) {
  console.clear();
  console.log('🚀 Starting Backlinkoo application...');

  // Add helper functions to window for debugging
  (window as any).fixRLS = () => {
    console.log('🔧 Redirecting to RLS fix page...');
    window.location.href = '/emergency/rls-fix';
  };

  (window as any).forcePremium = async () => {
    console.log('👑 Forcing user to premium status...');
    const { createClient } = await import('@/integrations/supabase/client');
    const { supabase } = createClient;

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

  console.log('💡 Debug helpers available:');
  console.log('  - fixRLS() - Go to RLS recursion fix page');
  console.log('  - forcePremium() - Force current user to premium status');
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

// Only setup browser extension conflicts in production or when detected
if (typeof window !== 'undefined' && (window.ethereum || import.meta.env.PROD)) {
  // Prevent ethereum property conflicts from browser extensions
  try {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');

    if (!descriptor || descriptor.configurable) {
      const originalEthereum = window.ethereum;

      if (originalEthereum) {
        delete window.ethereum;
      }

      Object.defineProperty(window, 'ethereum', {
        value: originalEthereum || null,
        writable: false,
        configurable: false,
        enumerable: true
      });
    }
  } catch (error) {
    // Silently handle any ethereum property conflicts
    console.warn('Ethereum property conflict handled:', error);
  }

  // Global error handler for uncaught ethereum conflicts
  window.addEventListener('error', (event) => {
    const message = event.error?.message || '';
    if (message.includes('Cannot redefine property: ethereum') ||
        message.includes('evmAsk') ||
        message.includes('defineProperty') ||
        message.includes('chrome-extension://') ||
        event.filename?.includes('chrome-extension://')) {
      console.warn('🔒 Crypto wallet extension conflict handled:', message);
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || '';
    if (message.includes('Cannot redefine property: ethereum') ||
        message.includes('evmAsk') ||
        message.includes('defineProperty') ||
        message.includes('chrome-extension://')) {
      console.warn('🔒 Crypto wallet promise rejection handled:', message);
      event.preventDefault();
    }
  });

  // Additional protection against extension injection conflicts
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj: any, prop: string | symbol, descriptor: PropertyDescriptor) {
    if (obj === window && (prop === 'ethereum' || prop === 'web3')) {
      try {
        const existing = Object.getOwnPropertyDescriptor(window, prop);
        if (existing && !existing.configurable) {
          console.warn(`🔒 Prevented attempt to redefine non-configurable ${String(prop)} property`);
          return obj;
        }

        // Log the successful redefinition for debugging
        console.log(`🔧 Allowing ${String(prop)} property redefinition`);
      } catch (e) {
        console.warn(`⚠️ Error checking ${String(prop)} property:`, e);
        // Continue with original function if check fails
      }
    }

    try {
      return originalDefineProperty.call(this, obj, prop, descriptor);
    } catch (error: any) {
      if (error.message?.includes('Cannot redefine property')) {
        console.warn(`🔒 Silently handled property redefinition error for ${String(prop)}:`, error.message);
        return obj;
      }
      throw error;
    }
  };
}
