import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/globalErrorHandler'

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
    import('./utils/quickAuthTest');
    import('./utils/authErrorChecker');
    import('./utils/createTestUser');
    import('./utils/emergencyAuthFix');
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
    if (event.error?.message?.includes('Cannot redefine property: ethereum') ||
        event.error?.message?.includes('evmAsk') ||
        event.error?.message?.includes('defineProperty')) {
      console.warn('Prevented ethereum conflict error:', event.error.message);
      event.preventDefault();
      return false;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('Cannot redefine property: ethereum') ||
        event.reason?.message?.includes('evmAsk') ||
        event.reason?.message?.includes('defineProperty')) {
      console.warn('Prevented ethereum promise rejection:', event.reason.message);
      event.preventDefault();
    }
  });

  // Additional protection against extension injection conflicts
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj: any, prop: string | symbol, descriptor: PropertyDescriptor) {
    if (obj === window && prop === 'ethereum') {
      try {
        const existing = Object.getOwnPropertyDescriptor(window, 'ethereum');
        if (existing && !existing.configurable) {
          console.warn('Prevented attempt to redefine non-configurable ethereum property');
          return obj;
        }
      } catch (e) {
        console.warn('Error checking ethereum property:', e);
      }
    }
    return originalDefineProperty.call(this, obj, prop, descriptor);
  };
}
