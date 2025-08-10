/**
 * Service Error Handler
 * Provides consistent error handling and fallback mechanisms for all services
 */

import { safeErrorMessage } from './errorDisplayFix';

export interface ServiceError {
  success: false;
  error: string;
  code?: string;
  details?: any;
  retryable?: boolean;
}

export interface ServiceSuccess<T = any> {
  success: true;
  data: T;
}

export type ServiceResult<T = any> = ServiceSuccess<T> | ServiceError;

/**
 * Environment detection for service routing
 */
export function detectServiceEnvironment() {
  if (typeof window === 'undefined') {
    return { isServer: true, isLocalhost: false, isProduction: true };
  }
  
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isNetlify = hostname.includes('netlify.app') || hostname.includes('netlify.com');
  const isFlyDev = hostname.includes('fly.dev');
  const isDevelopment = isLocalhost;
  const isProduction = !isLocalhost;
  
  return {
    isServer: false,
    isLocalhost,
    isNetlify,
    isFlyDev,
    isDevelopment,
    isProduction,
    hostname,
    hasNetlifyFunctions: isNetlify || isLocalhost,
    hasSupabaseFunctions: isProduction,
    hasEdgeFunctions: isProduction
  };
}

/**
 * Try multiple endpoints with fallbacks
 */
export async function tryMultipleEndpoints<T>(
  endpoints: string[],
  options: RequestInit,
  transform?: (response: Response) => Promise<T>
): Promise<ServiceResult<T>> {
  let lastError: any;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔄 Trying endpoint: ${endpoint}`);
      const response = await fetch(endpoint, options);
      
      if (response.ok) {
        console.log(`✅ Endpoint succeeded: ${endpoint}`);
        const data = transform ? await transform(response) : await response.json();
        return { success: true, data };
      } else {
        const errorText = await response.text().catch(() => `HTTP ${response.status}`);
        lastError = new Error(`${response.status}: ${errorText}`);
        console.warn(`⚠️ Endpoint ${endpoint} failed: ${response.status}`);
      }
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Endpoint ${endpoint} error:`, error);
      continue;
    }
  }
  
  return {
    success: false,
    error: safeErrorMessage(lastError),
    retryable: true
  };
}

/**
 * Wrapper for Supabase function calls with error handling
 */
export async function callSupabaseFunction<T>(
  functionName: string,
  body: any,
  fallbackEndpoints: string[] = []
): Promise<ServiceResult<T>> {
  const env = detectServiceEnvironment();
  
  // Try Supabase Edge Functions first if likely to work
  if (env.hasEdgeFunctions) {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke(functionName, { body });
      
      if (!error && data) {
        return { success: true, data };
      } else if (error) {
        console.warn(`⚠️ Supabase function ${functionName} error:`, error);
      }
    } catch (error) {
      console.warn(`⚠️ Supabase function ${functionName} failed:`, error);
    }
  }
  
  // Try alternative endpoints
  if (fallbackEndpoints.length > 0) {
    return tryMultipleEndpoints(
      fallbackEndpoints,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );
  }
  
  return {
    success: false,
    error: `Function ${functionName} not available in current environment`,
    retryable: false
  };
}

/**
 * Enhanced error formatter for services
 */
export function formatServiceError(error: any, context?: string): ServiceError {
  const message = safeErrorMessage(error);
  
  // Determine if error is retryable
  const retryable = !message.toLowerCase().includes('not found') &&
                   !message.toLowerCase().includes('unauthorized') &&
                   !message.toLowerCase().includes('forbidden') &&
                   !message.toLowerCase().includes('invalid') &&
                   !message.includes('404');
  
  return {
    success: false,
    error: context ? `${context}: ${message}` : message,
    details: error,
    retryable
  };
}

/**
 * Service wrapper that provides consistent error handling
 */
export function createServiceWrapper<T extends any[], R>(
  serviceName: string,
  serviceFunction: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<ServiceResult<R>> => {
    try {
      console.log(`🚀 Calling service: ${serviceName}`);
      const result = await serviceFunction(...args);
      console.log(`✅ Service succeeded: ${serviceName}`);
      return { success: true, data: result };
    } catch (error) {
      console.error(`❌ Service failed: ${serviceName}`, error);
      return formatServiceError(error, serviceName);
    }
  };
}

/**
 * Retry mechanism for failed services
 */
export async function retryService<T>(
  serviceCall: () => Promise<ServiceResult<T>>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<ServiceResult<T>> {
  let lastResult: ServiceResult<T>;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 Service attempt ${attempt}/${maxRetries}`);
    lastResult = await serviceCall();
    
    if (lastResult.success) {
      return lastResult;
    }
    
    if (!lastResult.retryable || attempt === maxRetries) {
      break;
    }
    
    // Exponential backoff
    const delay = delayMs * Math.pow(2, attempt - 1);
    console.log(`⏳ Retrying in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  return lastResult!;
}

/**
 * Create fallback service that uses mock data when all else fails
 */
export function createFallbackService<T>(
  primaryService: () => Promise<ServiceResult<T>>,
  fallbackData: T,
  fallbackMessage?: string
) {
  return async (): Promise<ServiceResult<T>> => {
    const result = await primaryService();
    
    if (result.success) {
      return result;
    }
    
    console.warn('🔄 Using fallback service data');
    return {
      success: true,
      data: fallbackData
    };
  };
}

/**
 * Service health checker
 */
export async function checkServiceHealth(serviceName: string, endpoint: string): Promise<boolean> {
  try {
    const response = await fetch(endpoint, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    const isHealthy = response.ok;
    console.log(`🏥 Service ${serviceName} health: ${isHealthy ? 'healthy' : 'unhealthy'}`);
    return isHealthy;
  } catch (error) {
    console.log(`🏥 Service ${serviceName} health: unreachable`);
    return false;
  }
}

/**
 * Global service error reporter
 */
export function reportServiceError(serviceName: string, error: any, userFriendly: boolean = true) {
  const formattedError = formatServiceError(error, serviceName);
  
  // Log for developers
  console.error(`🚨 Service Error [${serviceName}]:`, {
    error: formattedError.error,
    details: formattedError.details,
    retryable: formattedError.retryable,
    timestamp: new Date().toISOString()
  });
  
  // For user-friendly reporting (e.g., toast notifications)
  if (userFriendly) {
    return formattedError.error;
  }
  
  return formattedError;
}

// Make utilities available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).serviceErrorHandler = {
    detectServiceEnvironment,
    tryMultipleEndpoints,
    callSupabaseFunction,
    formatServiceError,
    createServiceWrapper,
    retryService,
    createFallbackService,
    checkServiceHealth,
    reportServiceError
  };
  
  console.log('🛠️ Service error handler utilities loaded');
}
