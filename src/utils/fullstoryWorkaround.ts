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
    window.fetch.toString().length < 50 // Native fetch is usually longer
  );
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
         (message.includes('TypeError') && stack.includes('messageHandler'));
}

/**
 * Create a fetch function that bypasses FullStory interference
 */
export function createBypassFetch(): typeof fetch {
  // Try to get the original fetch before FullStory modified it
  const originalFetch = (globalThis as any).__originalFetch__ || 
                       (window as any).__originalFetch__ ||
                       window.fetch;
  
  if (!isFullStoryPresent()) {
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
        
        // Set headers
        if (init?.headers) {
          const headers = new Headers(init.headers);
          headers.forEach((value, key) => {
            xhr.setRequestHeader(key, value);
          });
        }
        
        // Handle response
        xhr.onload = () => {
          try {
            // Parse response headers
            const headers = new Headers();
            xhr.getAllResponseHeaders()
              .split('\r\n')
              .forEach(line => {
                const [key, value] = line.split(': ');
                if (key && value) {
                  headers.set(key, value);
                }
              });
            
            // Create Response object
            const response = new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers
            });
            
            resolve(response);
          } catch (responseError) {
            reject(new Error(`Failed to create response: ${responseError}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network request failed'));
        };
        
        xhr.ontimeout = () => {
          reject(new Error('Request timeout'));
        };
        
        xhr.onabort = () => {
          reject(new Error('Request aborted'));
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
  if (typeof window !== 'undefined' && !(globalThis as any).__originalFetch__) {
    (globalThis as any).__originalFetch__ = window.fetch.bind(window);
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
      console.log('🔄 Fetch failed with FullStory error - retrying with bypass');
      const bypassFetch = createBypassFetch();
      return await bypassFetch(url, init);
    }
    throw error;
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  preserveOriginalFetch();
}
