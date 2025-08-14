/**
 * Emergency Disable Utilities
 * Provides ways to disable fetch protection when it's causing issues
 */

import { restoreOriginalFetch } from './viteClientProtection';

/**
 * Emergency disable function accessible from browser console
 */
(window as any).disableFetchProtection = () => {
  console.log('🚨 EMERGENCY: Disabling all fetch protection');
  
  // Set disable flags
  (window as any).DISABLE_VITE_PROTECTION = true;
  (window as any).DISABLE_FULLSTORY_PROTECTION = true;
  
  // Restore original fetch if possible
  try {
    restoreOriginalFetch();
    console.log('✅ Original fetch restored');
  } catch (error) {
    console.warn('⚠️ Could not restore original fetch:', error);
  }
  
  // Try to get a clean fetch function
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  
  try {
    const cleanFetch = iframe.contentWindow?.fetch;
    if (cleanFetch) {
      window.fetch = cleanFetch.bind(window);
      console.log('✅ Clean fetch obtained from iframe');
    }
  } catch (error) {
    console.warn('⚠️ Could not get clean fetch from iframe:', error);
  } finally {
    document.body.removeChild(iframe);
  }
  
  console.log('🎯 Fetch protection disabled. Try your request again.');
  console.log('💡 If issues persist, try refreshing the page.');
};

/**
 * Check current protection status
 */
(window as any).checkFetchProtection = () => {
  const status = {
    viteProtectionDisabled: !!(window as any).DISABLE_VITE_PROTECTION,
    fullstoryProtectionDisabled: !!(window as any).DISABLE_FULLSTORY_PROTECTION,
    fetchModified: window.fetch.toString().length < 100,
    fetchSource: window.fetch.toString().substring(0, 200) + '...'
  };
  
  console.log('🔍 Fetch Protection Status:', status);
  return status;
};

/**
 * Auto-disable on repeated errors
 */
let errorCount = 0;
const maxErrors = 3;

window.addEventListener('error', (event) => {
  if (event.error?.message?.includes('Failed to fetch') || 
      event.error?.message?.includes('NetworkInterferenceError')) {
    errorCount++;
    console.warn(`⚠️ Network error ${errorCount}/${maxErrors}:`, event.error?.message);
    
    if (errorCount >= maxErrors) {
      console.log('🚨 Too many network errors, auto-disabling fetch protection');
      (window as any).disableFetchProtection();
      errorCount = 0; // Reset counter
    }
  }
});

console.log('🔧 Emergency utilities loaded:');
console.log('  - window.disableFetchProtection() - Emergency disable all protection');
console.log('  - window.checkFetchProtection() - Check protection status');
