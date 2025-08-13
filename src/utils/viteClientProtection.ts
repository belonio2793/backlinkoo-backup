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

  try {
    // Store original fetch before any modifications
    originalFetch = window.fetch.bind(window);

    // Override window.fetch with FullStory-aware version for Vite client
    const protectedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = input.toString();
      
      // Check if this is a Vite client request that needs protection
      if (isViteClientRequest(url, init)) {
        console.log('🔧 Protecting Vite client request from FullStory:', url);
        
        // If FullStory is detected, use bypass immediately
        if (isFullStoryPresent()) {
          const bypassFetch = createBypassFetch();
          return await bypassFetch(input, init);
        }
        
        // Try original fetch with error handling
        try {
          return await originalFetch(input, init);
        } catch (error: any) {
          // If it fails with FullStory patterns, retry with bypass
          if (isViteClientError(error)) {
            console.log('🔄 Vite client fetch failed, retrying with bypass:', error.message);
            const bypassFetch = createBypassFetch();
            return await bypassFetch(input, init);
          }
          throw error;
        }
      }
      
      // For non-Vite requests, use original fetch
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
  // Vite client typically makes requests to:
  // - WebSocket endpoint for HMR
  // - Ping endpoints for connection health
  // - Module requests during development
  
  const vitePatterns = [
    '/@vite/client',
    '/__vite_ping',
    '/src/',
    '.tsx',
    '.ts',
    '.jsx',
    '.js'
  ];
  
  return vitePatterns.some(pattern => url.includes(pattern)) ||
         // Check if request is made from Vite client code
         (new Error().stack?.includes('@vite/client') || false);
}

/**
 * Check if an error is from Vite client being blocked by FullStory
 */
function isViteClientError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message || '';
  const stack = error.stack || '';
  
  return (message.includes('Failed to fetch') || 
          message.includes('TypeError')) &&
         (stack.includes('@vite/client') ||
          stack.includes('ping') ||
          stack.includes('waitForSuccessfulPing') ||
          stack.includes('messageHandler'));
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
