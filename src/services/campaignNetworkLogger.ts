import { responseBodyManager } from '@/utils/responseBodyFix';

export interface NetworkRequest {
  id: string;
  campaignId: string;
  timestamp: Date;
  type: 'fetch' | 'supabase' | 'function' | 'api';
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  response?: {
    status: number;
    statusText: string;
    headers?: Record<string, string>;
    data?: any;
    error?: string;
  };
  duration: number;
  step: string; // Which campaign step this request belongs to
}

export interface DatabaseQuery {
  id: string;
  campaignId: string;
  timestamp: Date;
  operation: 'select' | 'insert' | 'update' | 'delete';
  table: string;
  query: string;
  params?: any;
  result?: any;
  error?: string;
  duration: number;
  step: string;
}

export class CampaignNetworkLogger {
  private static instance: CampaignNetworkLogger;
  private networkRequests: Map<string, NetworkRequest[]> = new Map();
  private databaseQueries: Map<string, DatabaseQuery[]> = new Map();
  private originalFetch: typeof fetch;
  private isMonitoring: boolean = false;

  constructor() {
    this.originalFetch = window.fetch;
  }

  static getInstance(): CampaignNetworkLogger {
    if (!CampaignNetworkLogger.instance) {
      CampaignNetworkLogger.instance = new CampaignNetworkLogger();
    }
    return CampaignNetworkLogger.instance;
  }

  /**
   * Start monitoring network requests for a campaign
   */
  startMonitoring(campaignId: string): void {
    console.log(`🔍 Starting network monitoring for campaign: ${campaignId}`);
    
    if (!this.networkRequests.has(campaignId)) {
      this.networkRequests.set(campaignId, []);
    }
    if (!this.databaseQueries.has(campaignId)) {
      this.databaseQueries.set(campaignId, []);
    }

    if (!this.isMonitoring) {
      this.setupFetchInterceptor();
      this.setupSupabaseInterceptor();
      this.isMonitoring = true;
    }
  }

  /**
   * Stop monitoring for a campaign
   */
  stopMonitoring(campaignId: string): void {
    console.log(`🔍 Stopping network monitoring for campaign: ${campaignId}`);
    // Keep the data but mark as stopped
  }

  /**
   * Setup fetch interceptor to capture all HTTP requests
   */
  private setupFetchInterceptor(): void {
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startTime = Date.now();
      const requestId = this.generateId();
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method || 'GET';

      // Create request log
      const request: Partial<NetworkRequest> = {
        id: requestId,
        timestamp: new Date(),
        type: this.getRequestType(url),
        method,
        url,
        headers: init?.headers as Record<string, string>,
        body: init?.body ? this.safeParseBody(init.body) : undefined,
        step: this.getCurrentStep()
      };

      try {
        const response = await this.originalFetch.call(window, input, init);
        const duration = Date.now() - startTime;

        // Safely handle response body reading
        let responseData;
        let responseError;
        let clonedResponse;

        try {
          // Clone response immediately to avoid consumption conflicts
          clonedResponse = response.clone();

          // Always attempt to read as text first to avoid conflicts
          const responseText = await clonedResponse.text();

          // Try to parse as JSON if it looks like JSON
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json') && responseText.trim().startsWith('{')) {
            try {
              responseData = JSON.parse(responseText);
            } catch (parseError) {
              responseData = responseText; // Fall back to text if JSON parsing fails
            }
          } else {
            responseData = responseText;
          }
        } catch (error) {
          responseError = `Failed to read response: ${error}`;
          responseData = `[Read error - status: ${response.status}]`;
          console.warn('Network logger failed to read response:', error);
        }

        // Complete request log
        const completeRequest: NetworkRequest = {
          ...request,
          campaignId: this.getCurrentCampaignId(),
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: this.responseHeadersToObject(response.headers),
            data: responseData,
            error: responseError
          },
          duration
        } as NetworkRequest;

        try {
          this.logNetworkRequest(completeRequest);
        } catch (logError) {
          console.warn('Failed to log network request:', logError);
        }

        // Return the original response (not the clone)
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;

        // Log failed request
        const failedRequest: NetworkRequest = {
          ...request,
          campaignId: this.getCurrentCampaignId(),
          response: {
            status: 0,
            statusText: 'Network Error',
            error: error instanceof Error ? error.message : String(error)
          },
          duration
        } as NetworkRequest;

        try {
          this.logNetworkRequest(failedRequest);
        } catch (logError) {
          console.warn('Failed to log failed request:', logError);
        }

        throw error;
      }
    };
  }

  /**
   * Setup Supabase interceptor to capture database queries
   */
  private setupSupabaseInterceptor(): void {
    // This would require monkey-patching Supabase methods
    // For now, we'll create manual logging methods
    console.log('🔍 Supabase interceptor setup (manual logging required)');
  }

  /**
   * Manually log a database query
   */
  logDatabaseQuery(campaignId: string, query: Omit<DatabaseQuery, 'id' | 'campaignId' | 'timestamp'>): void {
    const dbQuery: DatabaseQuery = {
      id: this.generateId(),
      campaignId,
      timestamp: new Date(),
      ...query
    };

    if (!this.databaseQueries.has(campaignId)) {
      this.databaseQueries.set(campaignId, []);
    }

    this.databaseQueries.get(campaignId)!.push(dbQuery);
    console.log('📊 Database Query Logged:', dbQuery);
  }

  /**
   * Manually log a function call
   */
  logFunctionCall(campaignId: string, functionName: string, params: any, step: string): string {
    const requestId = this.generateId();
    const request: NetworkRequest = {
      id: requestId,
      campaignId,
      timestamp: new Date(),
      type: 'function',
      method: 'CALL',
      url: `function://${functionName}`,
      body: params,
      duration: 0,
      step
    };

    this.logNetworkRequest(request);
    return requestId;
  }

  /**
   * Update function call with result
   */
  updateFunctionCall(requestId: string, result: any, error?: string, duration: number = 0): void {
    // Find and update the request
    for (const [campaignId, requests] of this.networkRequests) {
      const request = requests.find(r => r.id === requestId);
      if (request) {
        request.response = {
          status: error ? 500 : 200,
          statusText: error ? 'Function Error' : 'OK',
          data: result,
          error
        };
        request.duration = duration;
        break;
      }
    }
  }

  /**
   * Log a network request
   */
  private logNetworkRequest(request: NetworkRequest): void {
    if (!request.campaignId) return;

    if (!this.networkRequests.has(request.campaignId)) {
      this.networkRequests.set(request.campaignId, []);
    }

    this.networkRequests.get(request.campaignId)!.push(request);
    
    // Log to console for debugging
    console.log(`🌐 Network Request [${request.campaignId}]:`, {
      method: request.method,
      url: request.url,
      status: request.response?.status,
      duration: request.duration,
      step: request.step
    });

    // Log errors prominently
    if (request.response && request.response.status >= 400) {
      console.error(`❌ Network Error [${request.campaignId}]:`, {
        url: request.url,
        status: request.response.status,
        error: request.response.error || request.response.statusText,
        data: request.response.data
      });
    }
  }

  /**
   * Get all network requests for a campaign
   */
  getNetworkRequests(campaignId: string): NetworkRequest[] {
    return this.networkRequests.get(campaignId) || [];
  }

  /**
   * Get all database queries for a campaign
   */
  getDatabaseQueries(campaignId: string): DatabaseQuery[] {
    return this.databaseQueries.get(campaignId) || [];
  }

  /**
   * Get combined logs for a campaign
   */
  getCombinedLogs(campaignId: string): Array<NetworkRequest | DatabaseQuery> {
    const networkReqs = this.getNetworkRequests(campaignId);
    const dbQueries = this.getDatabaseQueries(campaignId);
    
    return [...networkReqs, ...dbQueries].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  /**
   * Clear logs for a campaign
   */
  clearLogs(campaignId: string): void {
    this.networkRequests.delete(campaignId);
    this.databaseQueries.delete(campaignId);
  }

  /**
   * Helper methods
   */
  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRequestType(url: string): NetworkRequest['type'] {
    if (url.includes('supabase')) return 'supabase';
    if (url.includes('/.netlify/functions/')) return 'function';
    if (url.includes('api.')) return 'api';
    return 'fetch';
  }

  private getCurrentStep(): string {
    // This would ideally be passed as context, for now return a default
    return 'processing';
  }

  private getCurrentCampaignId(): string {
    // This should be set in context when monitoring starts
    // For now, we'll store it as a property
    return this.currentCampaignId || '';
  }

  private currentCampaignId: string = '';

  setCurrentCampaignId(campaignId: string): void {
    this.currentCampaignId = campaignId;
  }

  private safeParseBody(body: any): any {
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    }
    return body;
  }

  private responseHeadersToObject(headers: Headers): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  /**
   * Restore original fetch (cleanup)
   */
  cleanup(): void {
    if (this.isMonitoring) {
      window.fetch = this.originalFetch;
      this.isMonitoring = false;
    }
  }
}

// Export singleton instance
export const campaignNetworkLogger = CampaignNetworkLogger.getInstance();
