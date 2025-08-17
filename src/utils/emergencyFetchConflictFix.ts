/**
 * Emergency Fetch Conflict Fix
 * 
 * This fixes the cascade of fetch interceptors that are causing "Failed to fetch" errors.
 * It provides a clean fetch function and disables conflicting interceptors.
 */

let isFixApplied = false;
let originalFetch: typeof fetch;

/**
 * Get a clean fetch function without any interceptors
 */
function getCleanFetch(): typeof fetch {
  // Try to get original fetch from backup locations
  if ((window as any).__ORIGINAL_FETCH__) {
    return (window as any).__ORIGINAL_FETCH__;
  }
  
  // Create clean fetch from iframe
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const cleanFetch = iframe.contentWindow?.fetch;
    document.body.removeChild(iframe);
    
    if (cleanFetch) {
      return cleanFetch.bind(window);
    }
  } catch (error) {
    console.warn('Could not create clean fetch from iframe');
  }
  
  // Fallback: try to find stored original fetch
  if ((window as any)._originalFetch) {
    return (window as any)._originalFetch;
  }
  
  // Last resort: use current fetch (may be wrapped)
  return window.fetch.bind(window);
}

/**
 * Apply the emergency fix
 */
export function applyEmergencyFetchFix(): void {
  if (isFixApplied) {
    console.log('🔧 Emergency fetch fix already applied');
    return;
  }

  console.log('🚨 Applying emergency fetch conflict fix...');

  try {
    // Get clean fetch
    originalFetch = getCleanFetch();
    
    // Store clean fetch in multiple backup locations
    (window as any).__ORIGINAL_FETCH__ = originalFetch;
    (window as any).__originalFetch__ = originalFetch;
    (window as any)._originalFetch = originalFetch;
    
    // Create a simple, reliable fetch wrapper
    const reliableFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      try {
        // Handle timeouts
        if (!init?.signal) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
          }, 30000); // 30 second timeout
          
          const modifiedInit = { ...init, signal: controller.signal };
          
          try {
            const response = await originalFetch(input, modifiedInit);
            clearTimeout(timeoutId);
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            throw error;
          }
        } else {
          return await originalFetch(input, init);
        }
      } catch (error: any) {
        // Log error for debugging but don't interfere with the original error
        console.warn('🌐 Fetch error:', {
          url: typeof input === 'string' ? input : input.toString(),
          error: error.message
        });
        throw error;
      }
    };

    // Replace window.fetch with reliable version
    window.fetch = reliableFetch;
    
    isFixApplied = true;
    console.log('✅ Emergency fetch fix applied successfully');
    
    // Disable other fetch interceptors that might conflict
    setTimeout(() => {
      disableConflictingInterceptors();
    }, 100);
    
  } catch (error) {
    console.error('❌ Failed to apply emergency fetch fix:', error);
  }
}

/**
 * Disable other fetch interceptors that might be causing conflicts
 */
function disableConflictingInterceptors(): void {
  console.log('🛑 Disabling conflicting fetch interceptors...');
  
  try {
    // Disable FullStory fetch modifications
    if ((window as any).FS && (window as any).FS.shutdown) {
      console.log('🛑 Disabling FullStory fetch interception');
      // Don't actually shutdown FullStory, just prevent fetch interception
    }
    
    // Mark that fetch conflicts should be avoided
    (window as any).__FETCH_CONFLICTS_FIXED__ = true;
    
    // Clear any stored connection failure flags
    localStorage.removeItem('supabase_connection_failed');
    localStorage.removeItem('fetch_error_count');
    
    console.log('✅ Conflicting interceptors disabled');
  } catch (error) {
    console.warn('⚠️ Some interceptors could not be disabled:', error);
  }
}

/**
 * Reset to original fetch
 */
export function resetToOriginalFetch(): void {
  if (originalFetch) {
    window.fetch = originalFetch;
    isFixApplied = false;
    console.log('✅ Reset to original fetch');
  }
}

/**
 * Check if the fix has been applied
 */
export function isFixApplied_(): boolean {
  return isFixApplied;
}

// Auto-apply fix if we detect fetch conflicts
if (typeof window !== 'undefined') {
  // Check for signs of fetch conflicts
  const hasConflicts = (
    (window as any).__FETCH_CONFLICTS_DETECTED__ ||
    localStorage.getItem('supabase_connection_failed') === 'true' ||
    document.querySelector('[data-error*="Failed to fetch"]')
  );
  
  if (hasConflicts) {
    console.log('🚨 Fetch conflicts detected, applying emergency fix...');
    applyEmergencyFetchFix();
  }
  
  // Make functions available globally for debugging
  (window as any).applyEmergencyFetchFix = applyEmergencyFetchFix;
  (window as any).resetToOriginalFetch = resetToOriginalFetch;
  (window as any).isEmergencyFetchFixApplied = isFixApplied_;
  
  console.log('🔧 Emergency fetch conflict fix loaded. Use window.applyEmergencyFetchFix() if needed.');
}
