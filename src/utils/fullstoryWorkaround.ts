/**
 * FullStory Interference Workaround Utilities
 * 
 * FullStory can interfere with fetch requests by modifying the window.fetch function.
 * This module provides utilities to detect and work around such interference.
 */

/**
 * Detect if FullStory is present and potentially interfering
 */
export function isFullStoryPresent(): boolean {
  if (typeof window === 'undefined') return false;

  return !!(
    (window as any).FS ||
    (window as any)._fs ||
    document.querySelector('script[src*="fullstory"]') ||
    document.querySelector('script[src*="fs.js"]') ||
    document.querySelector('script[src*="edge.fullstory.com"]') ||
    // Check if fetch has been modified by looking at its string representation
    window.fetch.toString().includes('fullstory') ||
    window.fetch.toString().includes('FS') ||
    window.fetch.toString().length < 50 || // Native fetch is usually longer
    // Additional detection for development environment interference
    (import.meta.env.DEV && isLikelyThirdPartyFetchInterference())
  );
}

/**
 * Detect if fetch has been modified by third-party scripts (development helper)
 */
function isLikelyThirdPartyFetchInterference(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const fetchStr = window.fetch.toString();

    // Native fetch usually contains specific browser signatures
    const nativePatterns = ['[native code]', 'function fetch()'];
    const isNative = nativePatterns.some(pattern => fetchStr.includes(pattern));

    if (isNative) return false;

    // If it's not native and very short, it's likely been wrapped
    if (fetchStr.length < 100) {
      console.warn('🔍 Fetch appears to be wrapped by third-party script (length:', fetchStr.length, ')');
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Check if an error is likely caused by FullStory interference
 */
export function isFullStoryError(error: any): boolean {
  if (!error) return false;

  const message = error.message || '';
  const stack = error.stack || '';

  return message.includes('Failed to fetch') ||
         message.includes('fetch is not defined') ||
         message.includes('NetworkError') ||
         stack.includes('fullstory') ||
         stack.includes('fs.js') ||
         stack.includes('edge.fullstory.com') ||
         // Common FullStory interference patterns
         (message.includes('TypeError') && stack.includes('messageHandler')) ||
         // Vite client specific patterns when FullStory interferes
         (message.includes('TypeError') && stack.includes('@vite/client')) ||
         (message.includes('Failed to fetch') && stack.includes('ping')) ||
         (message.includes('Failed to fetch') && stack.includes('waitForSuccessfulPing'));
}

/**
 * Create a fetch function that bypasses FullStory interference
 */
export function createBypassFetch(): typeof fetch {
  // Try to get the original fetch before FullStory modified it
  const originalFetch = (globalThis as any).__originalFetch__ ||
                       (window as any).__originalFetch__;

  // If we have an unmodified original fetch and FullStory isn't interfering badly, try it first
  if (originalFetch && !isFullStoryPresent()) {
    return originalFetch;
  }

  console.log('🔧 Creating FullStory bypass fetch using XMLHttpRequest');
  
  // Create XMLHttpRequest-based fetch replacement
  return async function bypassFetch(url: string | URL, init?: RequestInit): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const urlString = url.toString();
      const method = init?.method || 'GET';
      
      try {
        xhr.open(method, urlString);

        // Set headers safely
        if (init?.headers) {
          try {
            const headers = new Headers(init.headers);
            headers.forEach((value, key) => {
              // Skip headers that XMLHttpRequest handles automatically
              if (!['host', 'user-agent', 'content-length'].includes(key.toLowerCase())) {
                xhr.setRequestHeader(key, value);
              }
            });
          } catch (headerError) {
            console.warn('Failed to set request headers:', headerError);
          }
        }
        
        // Handle response
        xhr.onload = () => {
          try {
            // Parse response headers safely
            const headers = new Headers();
            try {
              const responseHeaders = xhr.getAllResponseHeaders();
              if (responseHeaders) {
                responseHeaders
                  .split('\r\n')
                  .forEach(line => {
                    const colonIndex = line.indexOf(': ');
                    if (colonIndex > 0) {
                      const key = line.substring(0, colonIndex);
                      const value = line.substring(colonIndex + 2);
                      if (key && value) {
                        headers.set(key, value);
                      }
                    }
                  });
              }
            } catch (headerError) {
              console.warn('Failed to parse response headers:', headerError);
            }

            // Handle different response types
            let responseBody = null;
            if (xhr.status !== 204 && xhr.status !== 205 && xhr.status !== 304) {
              responseBody = xhr.responseText;
            }

            // Create Response object
            const response = new Response(responseBody, {
              status: xhr.status,
              statusText: xhr.statusText || 'OK',
              headers
            });

            resolve(response);
          } catch (responseError) {
            reject(new Error(`Failed to create response: ${responseError}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error(`Network request failed for ${urlString}. This could be due to CORS, connectivity issues, or server problems.`));
        };

        xhr.ontimeout = () => {
          reject(new Error(`Request timeout for ${urlString} (exceeded 30 seconds). Please check your internet connection and try again.`));
        };

        xhr.onabort = () => {
          reject(new Error(`Request aborted for ${urlString}`));
        };
        
        // Set timeout
        xhr.timeout = 30000;
        
        // Send request
        xhr.send(init?.body as any);
        
      } catch (setupError) {
        reject(new Error(`Failed to setup request: ${setupError}`));
      }
    });
  };
}

/**
 * Enhanced error message for FullStory interference
 */
export function getFullStoryErrorMessage(originalError: string): string {
  if (isFullStoryPresent()) {
    return `${originalError} (FullStory interference detected - using fallback method)`;
  }
  return originalError;
}

/**
 * Store original fetch before any third-party modifications
 */
export function preserveOriginalFetch(): void {
  if (typeof window !== 'undefined') {
    // Store original fetch if not already stored
    if (!(globalThis as any).__originalFetch__) {
      (globalThis as any).__originalFetch__ = window.fetch.bind(window);
    }

    // Also store it in window for fallback access
    if (!(window as any).__originalFetch__) {
      (window as any).__originalFetch__ = window.fetch.bind(window);
    }

    // Store the original XMLHttpRequest as well in case we need it
    if (!(globalThis as any).__originalXHR__) {
      (globalThis as any).__originalXHR__ = window.XMLHttpRequest;
    }
  }
}

/**
 * Safe wrapper for any fetch request that automatically handles FullStory interference
 */
export async function safeFetch(url: string | URL, init?: RequestInit): Promise<Response> {
  // If FullStory is detected, use bypass method immediately
  if (isFullStoryPresent()) {
    console.log('🔧 FullStory detected - using XMLHttpRequest bypass for:', url.toString());
    const bypassFetch = createBypassFetch();
    return await bypassFetch(url, init);
  }

  try {
    // Try normal fetch first only if FullStory is not present
    return await window.fetch(url, init);
  } catch (error) {
    // If it fails, check if it could be FullStory interference and retry
    if (isFullStoryError(error)) {
      console.log('🔄 Fetch failed with FullStory error - retrying with bypass for:', url.toString());

      try {
        const bypassFetch = createBypassFetch();
        return await bypassFetch(url, init);
      } catch (bypassError) {
        console.error('❌ Both normal fetch and bypass failed:', {
          originalError: error.message,
          bypassError: bypassError.message
        });

        // Instead of throwing a cryptic error, provide more context
        const contextualError = new Error(
          `Network request failed. This may be due to browser extensions or third-party scripts interfering with requests. ` +
          `Try disabling browser extensions or refreshing the page. Original error: ${error.message}`
        );
        contextualError.name = 'NetworkInterferenceError';
        throw contextualError;
      }
    }

    // Re-throw other types of errors with additional context if helpful
    if (error.message?.includes('Failed to fetch')) {
      const enhancedError = new Error(
        `Network request failed. This could be due to connectivity issues, CORS problems, or browser extension interference. ` +
        `Please check your internet connection and try again. Original error: ${error.message}`
      );
      enhancedError.name = 'NetworkError';
      throw enhancedError;
    }

    throw error;
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  preserveOriginalFetch();
}
