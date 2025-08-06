/**
 * Utility for handling Netlify function calls gracefully in development
 */

export interface NetlifyFunctionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  isLocal?: boolean;
}

/**
 * FullStory-safe fetch function to avoid third-party interference
 */
function createSafeFetch(): typeof fetch {
  // Store original fetch before any third-party scripts modify it
  const originalFetch = (globalThis as any).__originalFetch__ || window.fetch;

  // Check if FullStory is interfering
  const isFullStoryPresent = !!(window as any).FS ||
                            document.querySelector('script[src*="fullstory"]') ||
                            document.querySelector('script[src*="fs.js"]');

  if (isFullStoryPresent) {
    console.log('🔍 FullStory detected - using XMLHttpRequest fallback for Netlify functions');

    // Use XMLHttpRequest as fallback
    return async (url: string, init?: RequestInit): Promise<Response> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const method = init?.method || 'GET';

        xhr.open(method, url);

        // Set headers
        if (init?.headers) {
          const headers = new Headers(init.headers);
          headers.forEach((value, key) => {
            xhr.setRequestHeader(key, value);
          });
        }

        xhr.onload = () => {
          const response = new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers(
              xhr.getAllResponseHeaders()
                .split('\r\n')
                .reduce((acc, line) => {
                  const [key, value] = line.split(': ');
                  if (key && value) acc[key] = value;
                  return acc;
                }, {} as Record<string, string>)
            )
          });
          resolve(response);
        };

        xhr.onerror = () => reject(new Error('Network request failed'));
        xhr.ontimeout = () => reject(new Error('Request timeout'));

        xhr.timeout = 30000;
        xhr.send(init?.body as any);
      });
    };
  }

  return originalFetch;
}

/**
 * Safe fetch wrapper for Netlify functions that handles development mode gracefully
 */
export async function safeNetlifyFetch<T = any>(
  functionPath: string,
  options?: RequestInit
): Promise<NetlifyFunctionResponse<T>> {
  try {
    const safeFetch = createSafeFetch();
    const response = await safeFetch(`/.netlify/functions/${functionPath}`, options);
    
    // Check if response is HTML (likely a 404 page in dev mode)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/html')) {
      return {
        success: false,
        error: 'Function not available in development mode',
        isLocal: true
      };
    }
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      isLocal: true
    };
  }
}

/**
 * Check if we're running in a Netlify environment
 */
export function isNetlifyEnvironment(): boolean {
  return typeof window !== 'undefined' && 
         (window.location.hostname.includes('netlify.app') ||
          window.location.hostname.includes('netlify.com') ||
          // Check for Netlify dev mode
          window.location.port === '8888');
}

/**
 * Get appropriate error message for development vs production
 */
export function getEnvironmentErrorMessage(error: string, isLocal?: boolean): string {
  if (isLocal || !isNetlifyEnvironment()) {
    return `Development mode: ${error}. This function requires Netlify deployment or 'npm run dev:netlify'.`;
  }
  return error;
}
