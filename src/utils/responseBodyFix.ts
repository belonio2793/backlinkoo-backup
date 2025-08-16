/**
 * Simplified Response Body Helper
 * Provides safe response handling without complex tracking that causes false positives
 */

class ResponseBodyManager {
  private static instance: ResponseBodyManager;

  static getInstance(): ResponseBodyManager {
    if (!ResponseBodyManager.instance) {
      ResponseBodyManager.instance = new ResponseBodyManager();
    }
    return ResponseBodyManager.instance;
  }

  /**
   * Initialize simplified response handling (kept for compatibility)
   */
  initializeTracking(): void {
    // Simplified - no more complex tracking
    if ((window as any)._responseBodyManagerInitialized) {
      return;
    }
    (window as any)._responseBodyManagerInitialized = true;
    console.log('🔧 Simplified response helper initialized');
  }

  /**
   * Safe clone method - simply use native clone with fallback
   */
  public safeClone(response: Response): Response {
    try {
      return response.clone();
    } catch (error) {
      console.warn('Response clone failed:', error);
      // Return a simple error response
      return new Response('{"error": "Response body was already consumed"}', {
        status: response.status || 200,
        statusText: response.statusText || 'OK'
      });
    }
  }

  /**
   * Check if response body can be read
   */
  public canReadBody(response: Response): boolean {
    return !response.bodyUsed;
  }

  /**
   * Safe response reading with automatic retry
   */
  public async safeRead(response: Response, method: 'json' | 'text' = 'json'): Promise<any> {
    try {
      if (response.bodyUsed) {
        console.warn('Response body already used, cannot read');
        return method === 'json' ? { error: 'Response body already consumed' } : 'Response body already consumed';
      }
      
      if (method === 'json') {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.warn(`Failed to read response as ${method}:`, error);
      return method === 'json' ? { error: 'Failed to parse response' } : 'Failed to read response';
    }
  }
}

// Export singleton
export const responseBodyManager = ResponseBodyManager.getInstance();

// Auto-initialize when imported
responseBodyManager.initializeTracking();
