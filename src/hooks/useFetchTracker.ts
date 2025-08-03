import { useState, useEffect, useCallback } from 'react';

interface FetchRequest {
  id: string;
  url: string;
  method: string;
  status: 'pending' | 'completed' | 'error';
  timestamp: Date;
  duration?: number;
  statusCode?: number;
  error?: string;
}

interface FetchTrackerState {
  requests: FetchRequest[];
  activeRequests: number;
  totalRequests: number;
  lastRequest?: FetchRequest;
}

export function useFetchTracker(enabled: boolean = false) {
  const [state, setState] = useState<FetchTrackerState>({
    requests: [],
    activeRequests: 0,
    totalRequests: 0
  });

  const clearRequests = useCallback(() => {
    setState({
      requests: [],
      activeRequests: 0,
      totalRequests: 0
    });
  }, []);

  const trackRequest = useCallback((url: string, method: string = 'GET') => {
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newRequest: FetchRequest = {
      id: requestId,
      url,
      method,
      status: 'pending',
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      requests: [...prev.requests, newRequest],
      activeRequests: prev.activeRequests + 1,
      totalRequests: prev.totalRequests + 1,
      lastRequest: newRequest
    }));

    return requestId;
  }, []);

  const completeRequest = useCallback((requestId: string, statusCode?: number, error?: string) => {
    setState(prev => {
      const requests = prev.requests.map(req => {
        if (req.id === requestId) {
          const duration = Date.now() - req.timestamp.getTime();
          return {
            ...req,
            status: error ? 'error' as const : 'completed' as const,
            duration,
            statusCode,
            error
          };
        }
        return req;
      });

      const updatedRequest = requests.find(req => req.id === requestId);
      
      return {
        ...prev,
        requests,
        activeRequests: Math.max(0, prev.activeRequests - 1),
        lastRequest: updatedRequest
      };
    });
  }, []);

  // Intercept fetch when tracking is enabled
  useEffect(() => {
    if (!enabled) return;

    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method || 'GET';
      
      // Only track our API calls
      if (url.includes('netlify/functions') || url.includes('/api/') || url.includes('supabase')) {
        const requestId = trackRequest(url, method);
        
        try {
          const response = await originalFetch(input, init);
          completeRequest(requestId, response.status);
          return response;
        } catch (error) {
          completeRequest(requestId, undefined, error instanceof Error ? error.message : 'Network error');
          throw error;
        }
      } else {
        // Don't track external requests
        return originalFetch(input, init);
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [enabled, trackRequest, completeRequest]);

  return {
    ...state,
    clearRequests,
    trackRequest,
    completeRequest
  };
}
