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
   * Initialize simplified response handling (deprecated - kept for compatibility)
   */
  initializeTracking(): void {
    // Simplified - no more tracking, just logging
    if ((window as any)._responseBodyManagerInitialized) {
      return;
    }
    (window as any)._responseBodyManagerInitialized = true;
    console.log('🔧 Simplified response helper initialized');
  }

  /**
   * Create a mock response when cloning fails
   */
  public createMockResponse(response: Response): Response {
    try {
      const mockResponse = new Response('{"error": "Response body was already consumed"}', {
        status: response.status || 200,
        statusText: response.statusText || 'OK',
        headers: response.headers
      });

      ResponseBodyManager.getInstance().responseMap.set(mockResponse, { consumed: false, cloneCount: 0 });
      return mockResponse;
    } catch (error) {
      // Fallback: create minimal response
      const fallbackResponse = new Response('{}', {
        status: 200,
        statusText: 'OK'
      });
      return fallbackResponse;
    }
  }

  /**
   * Get empty result for already consumed responses
   */
  public getEmptyResult(method: string): Promise<any> {
    switch (method) {
      case 'json':
        return Promise.resolve({ error: 'Response body already consumed' });
      case 'text':
        return Promise.resolve('Response body already consumed');
      case 'blob':
        return Promise.resolve(new Blob());
      case 'arrayBuffer':
        return Promise.resolve(new ArrayBuffer(0));
      case 'formData':
        return Promise.resolve(new FormData());
      default:
        return Promise.resolve(null);
    }
  }

  /**
   * Safely clone a response
   */
  safeClone(response: Response): Response {
    try {
      // Check if response is already consumed
      if (response.bodyUsed) {
        console.warn('Attempted to clone consumed response, creating mock');
        return this.createMockResponseFromConsumed(response);
      }

      return response.clone();
    } catch (error) {
      console.warn('Failed to clone response, returning mock:', error);
      return this.createMockResponseFromConsumed(response);
    }
  }

  /**
   * Create mock response from consumed response
   */
  private createMockResponseFromConsumed(response: Response): Response {
    try {
      return new Response('{"error": "Response body already consumed", "status": ' + response.status + '}', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch (error) {
      // Ultimate fallback
      return new Response('{"error": "Response unavailable"}', {
        status: 200,
        statusText: 'OK'
      });
    }
  }

  /**
   * Check if response body can be safely read
   */
  canReadBody(response: Response): boolean {
    const tracking = this.responseMap.get(response);
    return !response.bodyUsed && (!tracking || !tracking.consumed);
  }

  /**
   * Mark response as consumed
   */
  markAsConsumed(response: Response): void {
    const tracking = this.responseMap.get(response) || { consumed: false, cloneCount: 0 };
    tracking.consumed = true;
    this.responseMap.set(response, tracking);
  }
}

// Export singleton
export const responseBodyManager = ResponseBodyManager.getInstance();

// Auto-initialize when imported
responseBodyManager.initializeTracking();
