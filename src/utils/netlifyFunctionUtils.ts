/**
 * Utility functions for handling Netlify function calls and errors
 */

export interface NetlifyFunctionResponse {
  success: boolean;
  data?: any;
  error?: string;
  isDevelopment?: boolean;
}

/**
 * Check if we're in a development environment where Netlify functions might not be available
 */
export function isDevelopmentEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.location.hostname === 'localhost' || 
         window.location.hostname.includes('127.0.0.1') ||
         window.location.hostname.includes('.dev') ||
         window.location.hostname.includes('.local') ||
         window.location.port !== '';
}

/**
 * Safely call a Netlify function with proper error handling
 */
export async function callNetlifyFunction(
  functionName: string, 
  payload?: any, 
  method: 'GET' | 'POST' = 'POST'
): Promise<NetlifyFunctionResponse> {
  const isDev = isDevelopmentEnvironment();
  
  try {
    console.log(`🔧 Calling Netlify function: ${functionName}`);
    
    const response = await fetch(`/.netlify/functions/${functionName}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(method === 'POST' && { body: JSON.stringify(payload || {}) })
    });

    if (response.status === 404) {
      const message = isDev 
        ? `Function ${functionName} not available in development - this is normal`
        : `Function ${functionName} not found`;
      
      console.warn(`⚠️ ${message}`);
      return {
        success: false,
        error: message,
        isDevelopment: isDev
      };
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`❌ Function ${functionName} returned ${response.status}:`, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();
    console.log(`✅ Function ${functionName} succeeded`);
    
    return {
      success: true,
      data
    };

  } catch (error: any) {
    const message = isDev 
      ? `Function ${functionName} failed (development mode - this is expected)`
      : `Function ${functionName} failed: ${error.message}`;
    
    console.warn(`⚠️ ${message}`);
    
    return {
      success: false,
      error: message,
      isDevelopment: isDev
    };
  }
}

/**
 * Check if an error is due to Netlify function unavailability
 */
export function isNetlifyFunctionError(error: Error | string): boolean {
  const message = typeof error === 'string' ? error : error.message;
  
  return message.includes('404') ||
         message.includes('function') ||
         message.includes('Failed to fetch') ||
         message.includes('not found') ||
         message.includes('Netlify function error');
}

/**
 * Get user-friendly error message for function failures
 */
export function getNetlifyFunctionErrorMessage(error: Error | string, functionName?: string): string {
  const isDev = isDevelopmentEnvironment();
  
  if (isDev) {
    return `${functionName ? `${functionName} ` : ''}function not available in development environment - using fallback`;
  }
  
  return `${functionName ? `${functionName} ` : ''}service temporarily unavailable - using fallback`;
}

/**
 * Global error handler to suppress console errors for expected Netlify function failures in dev
 */
export function setupNetlifyFunctionErrorSuppression(): void {
  if (!isDevelopmentEnvironment()) return;
  
  // Only suppress expected development errors
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Don't suppress non-function errors
    if (!message.includes('/.netlify/functions/') && !message.includes('function')) {
      originalError.apply(console, args);
      return;
    }
    
    // Convert to warning for function errors in dev
    if (message.includes('404') || message.includes('Failed to fetch')) {
      console.warn('🔧 [DEV] Expected function unavailability:', ...args);
    } else {
      originalError.apply(console, args);
    }
  };
  
  console.log('🔧 Development mode: Netlify function error suppression enabled');
}
