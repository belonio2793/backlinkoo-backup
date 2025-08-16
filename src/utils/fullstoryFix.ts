/**
 * Enhanced FullStory Fix
 * Immediate protection against FullStory fetch interference
 */

// Store the original fetch immediately before any script can modify it
const ORIGINAL_FETCH = window.fetch;

/**
 * Detect if FullStory is interfering with fetch
 */
function isFullStoryInterference(): boolean {
  try {
    const fetchString = window.fetch.toString();
    const isModified = (
      fetchString.includes('fullstory') ||
      fetchString.includes('fs.') ||
      fetchString.includes('FS') ||
      fetchString.length > 500 || // Native fetch is usually < 50 chars
      fetchString.includes('edge.fullstory.com')
    );
    
    if (isModified) {
      console.warn('🔍 FullStory fetch interference detected');
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('🔍 Could not check fetch interference:', error);
    return false;
  }
}

/**
 * Create XMLHttpRequest-based fetch replacement
 */
function createXHRFetch(): typeof fetch {
  return async function xhrFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = typeof input === 'string' ? input : input.toString();
      const method = (init.method || 'GET').toUpperCase();
      
      xhr.open(method, url, true);
      
      // Track if Content-Type was set
      let hasContentType = false;

      // Set headers
      if (init.headers) {
        const headers = new Headers(init.headers);
        headers.forEach((value, key) => {
          if (key.toLowerCase() === 'content-type') {
            hasContentType = true;
          }
          xhr.setRequestHeader(key, value);
        });
      }

      // Default headers for JSON
      if (!hasContentType && init.body) {
        xhr.setRequestHeader('Content-Type', 'application/json');
      }
      
      // Set timeout
      xhr.timeout = 30000; // 30 seconds
      
      xhr.onload = () => {
        const response = new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: (() => {
            const headers = new Headers();
            const headerString = xhr.getAllResponseHeaders();
            if (headerString) {
              headerString.split('\r\n').forEach(line => {
                const parts = line.split(': ');
                if (parts.length === 2) {
                  headers.set(parts[0], parts[1]);
                }
              });
            }
            return headers;
          })()
        });
        
        resolve(response);
      };
      
      xhr.onerror = () => {
        reject(new Error(`XHR Network Error for ${url}`));
      };
      
      xhr.ontimeout = () => {
        reject(new Error(`XHR Timeout for ${url}`));
      };
      
      xhr.onabort = () => {
        reject(new Error(`XHR Aborted for ${url}`));
      };
      
      // Handle abort signal
      if (init.signal) {
        const handleAbort = () => {
          xhr.abort();
          reject(new Error('Request aborted'));
        };
        
        if (init.signal.aborted) {
          handleAbort();
          return;
        }
        
        init.signal.addEventListener('abort', handleAbort, { once: true });
      }
      
      // Send request
      try {
        if (init.body) {
          if (typeof init.body === 'string') {
            xhr.send(init.body);
          } else if (init.body instanceof FormData) {
            xhr.send(init.body);
          } else if (init.body instanceof URLSearchParams) {
            xhr.send(init.body.toString());
          } else {
            xhr.send(JSON.stringify(init.body));
          }
        } else {
          xhr.send();
        }
      } catch (error) {
        reject(new Error(`Failed to send XHR request: ${error}`));
      }
    });
  };
}

/**
 * Smart fetch wrapper that detects and bypasses FullStory interference
 */
function createSmartFetch(): typeof fetch {
  const xhrFetch = createXHRFetch();
  
  return async function smartFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    // First try with original fetch if available and not modified
    if (ORIGINAL_FETCH && !isFullStoryInterference()) {
      try {
        return await ORIGINAL_FETCH(input, init);
      } catch (error: any) {
        console.warn('🔄 Original fetch failed, trying XHR fallback:', error.message);
      }
    }
    
    // Try current window.fetch if it looks clean
    if (!isFullStoryInterference()) {
      try {
        return await window.fetch(input, init);
      } catch (error: any) {
        console.warn('🔄 Window fetch failed, trying XHR fallback:', error.message);
      }
    }
    
    // Fall back to XHR-based fetch
    console.log('🛡️ Using XHR-based fetch due to FullStory interference');
    return xhrFetch(input, init);
  };
}

/**
 * Initialize FullStory protection
 */
function initFullStoryProtection() {
  try {
    // Check if FullStory is present
    const hasFullStory = !!(
      (window as any)._fs ||
      document.querySelector('script[src*="fullstory"]') ||
      document.querySelector('script[src*="fs.js"]') ||
      document.querySelector('script[src*="edge.fullstory.com"]')
    );
    
    if (hasFullStory || isFullStoryInterference()) {
      console.log('🛡️ FullStory detected - activating protection');
      
      // Store backup reference
      (window as any).__ORIGINAL_FETCH_BACKUP__ = ORIGINAL_FETCH;
      
      // Replace window.fetch with smart fetch
      const smartFetch = createSmartFetch();
      window.fetch = smartFetch;
      
      // Also protect global fetch
      if (typeof globalThis !== 'undefined') {
        globalThis.fetch = smartFetch;
      }
      
      console.log('✅ FullStory fetch protection activated');
    } else {
      console.log('✅ No FullStory interference detected - no protection needed');
    }
  } catch (error) {
    console.error('❌ Failed to initialize FullStory protection:', error);
  }
}

/**
 * Emergency restore function
 */
(window as any).restoreOriginalFetch = () => {
  try {
    const backup = (window as any).__ORIGINAL_FETCH_BACKUP__ || ORIGINAL_FETCH;
    if (backup) {
      window.fetch = backup;
      console.log('✅ Original fetch restored');
    } else {
      console.warn('⚠️ No original fetch backup available');
    }
  } catch (error) {
    console.error('❌ Failed to restore original fetch:', error);
  }
};

// Initialize protection immediately
initFullStoryProtection();

export { createSmartFetch, isFullStoryInterference, initFullStoryProtection };
