/**
 * Emergency Fetch Fix - Comprehensive FullStory and Network Error Protection
 * 
 * This module provides immediate protection against:
 * - FullStory fetch interference 
 * - Supabase authentication failures
 * - Network request failures from third-party scripts
 */

let originalFetch: typeof fetch;
let isProtectionActive = false;

/**
 * Initialize fetch protection immediately
 */
export function initEmergencyFetchProtection(): void {
  if (isProtectionActive) {
    console.log('🛡️ Fetch protection already active');
    return;
  }

  try {
    // Store original fetch before any modifications
    originalFetch = window.fetch;
    
    // Check if FullStory has already modified fetch
    const fetchString = window.fetch.toString();
    const isModified = fetchString.includes('fullstory') || 
                      fetchString.includes('FS') || 
                      fetchString.length > 200; // Native fetch is usually shorter

    if (isModified) {
      console.warn('⚠️ Fetch already modified by third-party script, applying emergency fix');
      
      // Try to restore from stored original
      if ((window as any).__originalFetch__) {
        originalFetch = (window as any).__originalFetch__;
        console.log('🔄 Restored fetch from __originalFetch__');
      } else {
        // Create a clean fetch implementation
        originalFetch = createCleanFetch();
        console.log('🔧 Created clean fetch implementation');
      }
    }

    // Apply protected fetch
    const protectedFetch = createProtectedFetch(originalFetch);
    
    // Replace window.fetch with protection
    Object.defineProperty(window, 'fetch', {
      value: protectedFetch,
      writable: false,
      configurable: true,
      enumerable: true
    });

    // Store original for other scripts that might need it
    (window as any).__emergencyFetch__ = originalFetch;
    (window as any).__protectedFetch__ = protectedFetch;
    
    isProtectionActive = true;
    console.log('✅ Emergency fetch protection activated');
    
  } catch (error) {
    console.error('❌ Failed to initialize fetch protection:', error);
  }
}

/**
 * Create a clean fetch implementation using XMLHttpRequest
 */
function createCleanFetch(): typeof fetch {
  return function cleanFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method || 'GET';
      
      xhr.open(method, url, true);
      
      // Set headers
      if (init?.headers) {
        const headers = init.headers;
        if (headers instanceof Headers) {
          headers.forEach((value, key) => {
            xhr.setRequestHeader(key, value);
          });
        } else if (Array.isArray(headers)) {
          headers.forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });
        } else {
          Object.entries(headers).forEach(([key, value]) => {
            if (typeof value === 'string') {
              xhr.setRequestHeader(key, value);
            }
          });
        }
      }
      
      // Handle response
      xhr.onload = () => {
        const response = new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers(
            xhr.getAllResponseHeaders()
              .split('\r\n')
              .filter(line => line.trim())
              .map(line => {
                const [key, ...values] = line.split(':');
                return [key.trim(), values.join(':').trim()];
              })
              .filter(([key]) => key)
          )
        });
        resolve(response);
      };
      
      xhr.onerror = () => {
        reject(new TypeError('Network request failed'));
      };
      
      xhr.ontimeout = () => {
        reject(new TypeError('Network request timed out'));
      };
      
      // Set timeout
      if (init?.signal) {
        const abortController = init.signal as AbortSignal;
        if (abortController.aborted) {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
          return;
        }
        abortController.addEventListener('abort', () => {
          xhr.abort();
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      }
      
      // Send request
      xhr.send(init?.body as string | undefined);
    });
  };
}

/**
 * Create protected fetch with error handling
 */
function createProtectedFetch(baseFetch: typeof fetch): typeof fetch {
  return async function protectedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input.toString();
    
    try {
      // Use base fetch first
      const response = await baseFetch(input, init);
      
      // Check for successful response
      if (response.ok || response.status < 500) {
        return response;
      }
      
      // If server error, fall back to clean fetch
      console.warn(`⚠️ Server error ${response.status}, retrying with clean fetch for:`, url);
      return await createCleanFetch()(input, init);
      
    } catch (error: any) {
      // Check if this is a FullStory interference
      const errorMessage = error.message || '';
      const isFullStoryError = errorMessage.includes('Failed to fetch') ||
                              error.stack?.includes('fullstory') ||
                              error.stack?.includes('fs.js') ||
                              error.stack?.includes('edge.fullstory.com');
      
      if (isFullStoryError) {
        console.warn('⚠️ FullStory interference detected, using clean fetch for:', url);
        return await createCleanFetch()(input, init);
      }
      
      // For Supabase auth requests, always use clean fetch as fallback
      if (url.includes('supabase') && url.includes('auth')) {
        console.warn('⚠️ Supabase auth request failed, retrying with clean fetch:', url);
        try {
          return await createCleanFetch()(input, init);
        } catch (fallbackError) {
          console.error('❌ Clean fetch also failed for Supabase auth:', fallbackError);
          throw error; // Throw original error
        }
      }
      
      // Re-throw other errors
      throw error;
    }
  };
}

/**
 * Disable FullStory if it's causing issues
 */
export function disableFullStory(): void {
  try {
    // Method 1: Shutdown FullStory if loaded
    if ((window as any).FS && typeof (window as any).FS.shutdown === 'function') {
      (window as any).FS.shutdown();
      console.log('✅ FullStory shutdown complete');
    }
    
    // Method 2: Remove FullStory scripts
    const fullStoryScripts = document.querySelectorAll('script[src*="fullstory"], script[src*="fs.js"]');
    fullStoryScripts.forEach(script => {
      script.remove();
      console.log('🗑️ Removed FullStory script');
    });
    
    // Method 3: Block FullStory object
    Object.defineProperty(window, 'FS', {
      value: undefined,
      writable: false,
      configurable: false
    });
    
    // Method 4: Set emergency flag
    localStorage.setItem('disable_fullstory', 'true');
    
    console.log('✅ FullStory disabled');
    
  } catch (error) {
    console.error('❌ Error disabling FullStory:', error);
  }
}

/**
 * Fix Supabase connection issues
 */
export async function fixSupabaseConnection(): Promise<void> {
  try {
    console.log('🔧 Fixing Supabase connection...');
    
    // Clear any cached auth data that might be corrupted
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
    
    // Re-import Supabase client
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Test connection with clean fetch
    const { data, error } = await supabase.from('domains').select('id').limit(1);
    
    if (error) {
      throw new Error(`Supabase test failed: ${error.message}`);
    }
    
    console.log('✅ Supabase connection restored');
    
  } catch (error) {
    console.error('❌ Failed to fix Supabase connection:', error);
    throw error;
  }
}

/**
 * Emergency recovery function - call this to fix all network issues
 */
export async function emergencyNetworkRecovery(): Promise<void> {
  console.log('🚨 Starting emergency network recovery...');
  
  try {
    // Step 1: Disable FullStory
    disableFullStory();
    
    // Step 2: Re-initialize fetch protection
    initEmergencyFetchProtection();
    
    // Step 3: Fix Supabase connection
    await fixSupabaseConnection();
    
    // Step 4: Reload page if necessary
    const shouldReload = localStorage.getItem('emergency_recovery_reload') !== 'true';
    if (shouldReload) {
      localStorage.setItem('emergency_recovery_reload', 'true');
      setTimeout(() => {
        localStorage.removeItem('emergency_recovery_reload');
        window.location.reload();
      }, 1000);
    }
    
    console.log('✅ Emergency network recovery complete');
    
  } catch (error) {
    console.error('❌ Emergency recovery failed:', error);
  }
}

// Initialize protection immediately when module loads
initEmergencyFetchProtection();

// Expose emergency functions globally for debugging
(window as any).emergencyNetworkRecovery = emergencyNetworkRecovery;
(window as any).disableFullStory = disableFullStory;
(window as any).fixSupabaseConnection = fixSupabaseConnection;

export default {
  initEmergencyFetchProtection,
  disableFullStory,
  fixSupabaseConnection,
  emergencyNetworkRecovery
};
