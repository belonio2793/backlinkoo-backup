import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { trialPostCleanupService } from './services/trialPostCleanupService'
// Auto-run debug disabled to prevent concurrent API calls
// Use the admin interface to test API keys manually
// import { debugApiKey } from './utils/debugApiKey';

// Prevent ethereum property conflicts from browser extensions
try {
  if (typeof window !== 'undefined') {
    // Check if ethereum property exists and is configurable
    const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');

    if (!descriptor || descriptor.configurable) {
      // Property doesn't exist or is configurable, we can safely define it
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
    } else {
      // Property already exists and is not configurable, leave it alone
      console.info('Ethereum property already protected by extension');
    }
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

createRoot(document.getElementById("root")!).render(<App />);

// Initialize trial post cleanup service
trialPostCleanupService.scheduleCleanup().catch(console.error);
