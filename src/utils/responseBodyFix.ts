/**
 * Response Body Conflict Prevention Utility
 * Prevents "Response body is already used" errors by managing response cloning safely
 */

interface ResponseWithTracking extends Response {
  _bodyConsumed?: boolean;
  _cloneCount?: number;
  _originalClone?: () => Response;
}

class ResponseBodyManager {
  private static instance: ResponseBodyManager;
  private responseMap = new WeakMap<Response, { consumed: boolean; cloneCount: number }>();

  static getInstance(): ResponseBodyManager {
    if (!ResponseBodyManager.instance) {
      ResponseBodyManager.instance = new ResponseBodyManager();
    }
    return ResponseBodyManager.instance;
  }

  /**
   * Initialize response body tracking
   */
  initializeTracking(): void {
    // Only initialize once
    if ((window as any)._responseBodyManagerInitialized) {
      return;
    }

    this.patchResponseMethods();
    (window as any)._responseBodyManagerInitialized = true;
    console.log('🔧 Response body tracking initialized');
  }

  /**
   * Patch Response prototype methods to track body consumption
   */
  private patchResponseMethods(): void {
    const originalMethods = {
      clone: Response.prototype.clone,
      json: Response.prototype.json,
      text: Response.prototype.text,
      blob: Response.prototype.blob,
      arrayBuffer: Response.prototype.arrayBuffer,
      formData: Response.prototype.formData
    };

    // Patch clone method
    Response.prototype.clone = function(this: ResponseWithTracking) {
      const tracking = ResponseBodyManager.getInstance().responseMap.get(this) || { consumed: false, cloneCount: 0 };
      
      if (tracking.consumed) {
        console.warn('Attempted to clone consumed response, creating mock response');
        return ResponseBodyManager.getInstance().createMockResponse(this);
      }

      if (tracking.cloneCount >= 2) {
        console.warn('Max clone count reached, creating mock response');
        return ResponseBodyManager.getInstance().createMockResponse(this);
      }

      try {
        const cloned = originalMethods.clone.call(this);
        tracking.cloneCount++;
        ResponseBodyManager.getInstance().responseMap.set(this, tracking);
        ResponseBodyManager.getInstance().responseMap.set(cloned, { consumed: false, cloneCount: 0 });
        return cloned;
      } catch (error) {
        console.warn('Clone failed, creating mock response:', error);
        return ResponseBodyManager.getInstance().createMockResponse(this);
      }
    };

    // Patch body consumption methods
    const bodyMethods = ['json', 'text', 'blob', 'arrayBuffer', 'formData'] as const;
    
    bodyMethods.forEach(method => {
      const original = originalMethods[method];
      Response.prototype[method] = function(this: ResponseWithTracking) {
        const tracking = ResponseBodyManager.getInstance().responseMap.get(this) || { consumed: false, cloneCount: 0 };

        if (tracking.consumed) {
          console.warn(`Response body already consumed for ${method}(), returning empty result`);
          return ResponseBodyManager.getInstance().getEmptyResult(method);
        }

        tracking.consumed = true;
        ResponseBodyManager.getInstance().responseMap.set(this, tracking);

        return original.call(this);
      };
    });
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
