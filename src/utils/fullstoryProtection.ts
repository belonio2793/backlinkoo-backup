/**
 * FullStory Protection Utility
 * Prevents FullStory from interfering with critical API requests
 */

let originalFetch: typeof fetch;
let isProtected = false;

/**
 * Store the original fetch before FullStory modifies it
 */
export function protectFetch() {
  if (isProtected) return;
  
  try {
    // Store original fetch immediately on page load
    originalFetch = window.fetch.bind(window);
    
    // Create a clean iframe to get unmodified fetch
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'about:blank';
    document.body.appendChild(iframe);
    
    if (iframe.contentWindow?.fetch) {
      originalFetch = iframe.contentWindow.fetch.bind(iframe.contentWindow);
    }
    
    document.body.removeChild(iframe);
    isProtected = true;
    
    console.log('Fetch protection enabled');
  } catch (error) {
    console.log('Failed to protect fetch:', error);
  }
}

/**
 * Get protected fetch function
 */
export function getProtectedFetch(): typeof fetch {
  if (!isProtected) {
    protectFetch();
  }
  return originalFetch || window.fetch;
}

/**
 * Make a protected request using XMLHttpRequest
 */
export async function protectedRequest(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const method = (options.method || 'GET').toUpperCase();
    
    xhr.open(method, url, true);
    
    // Set headers
    if (options.headers) {
      const headers = options.headers as Record<string, string>;
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }
    
    // Handle timeout
    xhr.timeout = 10000;
    
    xhr.onload = () => {
      // Create a Response-like object
      const response = {
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        statusText: xhr.statusText,
        url: url,
        headers: {
          get: (name: string) => xhr.getResponseHeader(name),
          has: (name: string) => xhr.getResponseHeader(name) !== null,
          entries: function* () {
            // Basic implementation - in real scenarios you'd parse all headers
            yield ['content-type', xhr.getResponseHeader('content-type') || ''];
          }
        },
        json: async () => {
          try {
            return JSON.parse(xhr.responseText);
          } catch (e) {
            throw new Error('Invalid JSON response');
          }
        },
        text: async () => xhr.responseText,
        blob: async () => new Blob([xhr.response]),
        arrayBuffer: async () => {
          if (xhr.response instanceof ArrayBuffer) {
            return xhr.response;
          }
          const encoder = new TextEncoder();
          return encoder.encode(xhr.responseText).buffer;
        },
        clone: () => response
      } as Response;
      
      resolve(response);
    };
    
    xhr.onerror = () => {
      reject(new Error('Network error occurred'));
    };
    
    xhr.ontimeout = () => {
      reject(new Error('Request timeout'));
    };
    
    // Handle abort signal
    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Request aborted'));
      });
    }
    
    // Send request
    if (options.body) {
      if (typeof options.body === 'string') {
        xhr.send(options.body);
      } else if (options.body instanceof FormData) {
        xhr.send(options.body);
      } else {
        xhr.send(JSON.stringify(options.body));
      }
    } else {
      xhr.send();
    }
  });
}

// Auto-protect on import
if (typeof window !== 'undefined') {
  protectFetch();
}
