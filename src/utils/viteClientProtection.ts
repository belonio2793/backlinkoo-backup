/**
 * Vite Client Protection from FullStory Interference
 * 
 * This module specifically protects Vite's development client from 
 * third-party script interference (like FullStory) during HMR and 
 * WebSocket operations.
 */

import { createBypassFetch, isFullStoryPresent } from './fullstoryWorkaround';

let originalFetch: typeof fetch;
let isViteProtected = false;

/**
 * Protect Vite client from FullStory interference
 */
export function protectViteClient(): void {
  if (isViteProtected || import.meta.env.PROD) {
    return; // Only protect in development mode
  }

  // Allow disabling via window flag for debugging
  if (typeof window !== 'undefined' && (window as any).DISABLE_VITE_PROTECTION) {
    console.log('🔧 Vite protection disabled via window.DISABLE_VITE_PROTECTION');
    return;
  }

  // Emergency disable if FullStory is not even present
  if (!isFullStoryPresent()) {
    console.log('🔧 Vite protection disabled - FullStory not detected');
    return;
  }

  try {
    // Store original fetch before any modifications
    originalFetch = window.fetch.bind(window);

    // Override window.fetch with FullStory-aware version for Vite client
    const protectedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = input.toString();

      // Check if this is a Vite client request that needs protection
      if (isViteClientRequest(url, init)) {
        console.log('🔧 Protecting Vite client request from FullStory:', url);

        // Try original fetch first
        try {
          return await originalFetch(input, init);
        } catch (error: any) {
          // Only use bypass if we're very sure it's a FullStory issue
          if (isViteClientError(error) && isFullStoryPresent()) {
            console.log('🔄 Vite client fetch failed due to FullStory, retrying with bypass:', error.message);
            const bypassFetch = createBypassFetch();
            return await bypassFetch(input, init);
          }
          throw error;
        }
      }

      // For non-Vite requests, use original fetch directly
      return originalFetch(input, init);
    };

    // Replace window.fetch
    window.fetch = protectedFetch;
    isViteProtected = true;
    
    console.log('✅ Vite client protection enabled');
  } catch (error) {
    console.warn('⚠️ Failed to enable Vite client protection:', error);
  }
}

/**
 * Check if a request is from Vite client
 */
function isViteClientRequest(url: string, init?: RequestInit): boolean {
  // NEVER interfere with Supabase, Netlify, or any external API requests
  if (url.includes('supabase.co') ||
      url.includes('supabase.in') ||
      url.includes('netlify') ||
      url.includes('.fly.dev') ||
      url.startsWith('https://') ||
      url.startsWith('http://') && !url.includes('localhost')) {
    return false;
  }

  // Only very specific Vite HMR patterns
  const strictVitePatterns = [
    '/@vite/client',
    '/__vite_ping'
  ];

  // Only match extremely specific Vite requests
  const isStrictViteRequest = strictVitePatterns.some(pattern => url.includes(pattern));

  // Additional check: must be from Vite client stack trace
  const stack = new Error().stack || '';
  const isFromViteClient = stack.includes('@vite/client') && stack.includes('connectWebSocket');

  return isStrictViteRequest && isFromViteClient;
}

/**
 * Check if an error is from Vite client being blocked by FullStory
 */
function isViteClientError(error: any): boolean {
  if (!error) return false;

  const message = error.message || '';
  const stack = error.stack || '';

  // EXTREMELY conservative - only consider it a Vite client error if:
  // 1. The stack explicitly shows Vite WebSocket connection code
  // 2. AND it's NOT from any external service
  return message.includes('Failed to fetch') &&
         stack.includes('@vite/client') &&
         stack.includes('connectWebSocket') &&
         // Absolutely exclude any external services
         !stack.includes('supabase') &&
         !stack.includes('netlify') &&
         !stack.includes('.fly.dev') &&
         !stack.includes('https://') &&
         !stack.includes('messageHandler');
}

/**
 * Restore original fetch (for cleanup)
 */
export function restoreOriginalFetch(): void {
  if (originalFetch && isViteProtected) {
    window.fetch = originalFetch;
    isViteProtected = false;
    console.log('🔄 Original fetch restored');
  }
}

// Auto-enable protection in development mode
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Wait for DOM to be ready before protecting
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', protectViteClient);
  } else {
    protectViteClient();
  }
}
