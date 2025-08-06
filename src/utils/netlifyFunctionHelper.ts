/**
 * Utility for handling Netlify function calls gracefully in development
 */

export interface NetlifyFunctionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  isLocal?: boolean;
}

import { safeFetch, isFullStoryError, getFullStoryErrorMessage } from './fullstoryWorkaround';

/**
 * Safe fetch wrapper for Netlify functions that handles development mode gracefully
 */
export async function safeNetlifyFetch<T = any>(
  functionPath: string,
  options?: RequestInit
): Promise<NetlifyFunctionResponse<T>> {
  try {
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if this is FullStory interference
    if (isFullStoryError(error)) {
      return {
        success: false,
        error: getFullStoryErrorMessage('Netlify function call blocked by third-party script'),
        isLocal: true
      };
    }

    return {
      success: false,
      error: errorMessage,
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
