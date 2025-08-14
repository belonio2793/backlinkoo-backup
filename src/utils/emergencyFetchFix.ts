/**
 * Emergency Fetch Fix
 * Disables all fetch protection layers that are causing issues
 */

export function emergencyDisableFetchProtection(): void {
  console.log('🚨 EMERGENCY: Disabling all fetch protection layers');
  
  // Disable Vite protection
  if (typeof window !== 'undefined') {
    (window as any).DISABLE_VITE_PROTECTION = true;
  }
  
  // Try to restore original fetch if available
  try {
    const { restoreOriginalFetch } = require('./viteClientProtection');
    restoreOriginalFetch();
  } catch (e) {
    console.warn('Could not restore original fetch from viteClientProtection');
  }
  
  // Force restore native fetch
  if (typeof window !== 'undefined' && (window as any).__ORIGINAL_FETCH__) {
    window.fetch = (window as any).__ORIGINAL_FETCH__;
    console.log('✅ Restored original fetch from backup');
  }
  
  console.log('✅ Emergency fetch protection disabled');
}

// Auto-run if there are fetch errors
if (typeof window !== 'undefined') {
  // Listen for unhandled fetch errors
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    if (error && error.message && error.message.includes('Failed to fetch') && 
        error.stack && error.stack.includes('protectedFetch')) {
      
      console.warn('🚨 Detected fetch protection causing errors, auto-disabling...');
      emergencyDisableFetchProtection();
      
      // Prevent the error from showing in console
      event.preventDefault();
    }
  });
}

export default emergencyDisableFetchProtection;
