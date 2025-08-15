/**
 * Supabase Error Handler
 * 
 * Handles network failures, timeouts, and other connectivity issues
 * when communicating with Supabase services.
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface SupabaseErrorContext {
  operation: string;
  table?: string;
  userId?: string;
  timestamp: Date;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

export class SupabaseErrorHandler {
  private static instance: SupabaseErrorHandler;
  
  static getInstance(): SupabaseErrorHandler {
    if (!SupabaseErrorHandler.instance) {
      SupabaseErrorHandler.instance = new SupabaseErrorHandler();
    }
    return SupabaseErrorHandler.instance;
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false;

    // Network connectivity errors
    if (error.message?.includes('Failed to fetch')) return true;
    if (error.message?.includes('NetworkError')) return true;
    if (error.message?.includes('timeout')) return true;
    if (error.message?.includes('ECONNRESET')) return true;
    if (error.message?.includes('ENOTFOUND')) return true;

    // HTTP status codes that are retryable
    if (error.status === 408) return true; // Request Timeout
    if (error.status === 429) return true; // Too Many Requests
    if (error.status >= 500 && error.status < 600) return true; // Server errors

    // Supabase-specific errors
    if (error.code === 'NETWORK_ERROR') return true;
    if (error.code === 'TIMEOUT') return true;

    return false;
  }

  /**
   * Calculate delay for retry with exponential backoff
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
      config.baseDelay * Math.pow(config.backoffFactor, attempt),
      config.maxDelay
    );
    
    // Add jitter to prevent thundering herd
    const jitter = delay * 0.1 * Math.random();
    return delay + jitter;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry a Supabase operation with exponential backoff
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    context: SupabaseErrorContext,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateDelay(attempt - 1, config);
          console.log(`🔄 Retrying ${context.operation} (attempt ${attempt}/${config.maxRetries}) in ${Math.round(delay)}ms`);
          await this.sleep(delay);
        }

        const result = await operation();
        
        if (attempt > 0) {
          console.log(`✅ ${context.operation} succeeded after ${attempt} retries`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        console.warn(`❌ ${context.operation} failed (attempt ${attempt + 1}/${config.maxRetries + 1}):`, error);

        if (!this.isRetryableError(error)) {
          console.log(`🚫 Error not retryable for ${context.operation}`);
          break;
        }

        if (attempt === config.maxRetries) {
          console.error(`💥 ${context.operation} failed after ${config.maxRetries} retries`);
          break;
        }
      }
    }

    throw this.wrapError(lastError, context);
  }

  /**
   * Wrap error with additional context
   */
  private wrapError(error: any, context: SupabaseErrorContext): Error {
    const wrappedError = new Error(
      `Supabase ${context.operation} failed: ${error.message || error}`
    );
    
    (wrappedError as any).originalError = error;
    (wrappedError as any).context = context;
    (wrappedError as any).timestamp = context.timestamp;
    
    return wrappedError;
  }

  /**
   * Enhanced auth wrapper with retry logic
   */
  async retryAuth<T>(
    authOperation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    return this.retryOperation(
      authOperation,
      {
        operation: `auth.${operationName}`,
        timestamp: new Date()
      },
      {
        maxRetries: 2, // Lower retries for auth
        baseDelay: 500,
        maxDelay: 5000,
        backoffFactor: 2
      }
    );
  }

  /**
   * Enhanced database wrapper with retry logic
   */
  async retryDatabase<T>(
    dbOperation: () => Promise<T>,
    table: string,
    operation: string,
    userId?: string
  ): Promise<T> {
    return this.retryOperation(
      dbOperation,
      {
        operation: `db.${table}.${operation}`,
        table,
        userId,
        timestamp: new Date()
      }
    );
  }

  /**
   * Check if we can reach Supabase
   */
  async checkConnectivity(supabaseUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok || response.status === 401; // 401 is expected without auth
    } catch (error) {
      console.warn('🌐 Supabase connectivity check failed:', error);
      return false;
    }
  }

  /**
   * Create a safer database client that handles network errors
   */
  wrapDatabaseClient(client: any) {
    const handler = this;

    return {
      ...client,

      from(table: string) {
        const query = client.from(table);

        // Wrap query methods with error handling
        const wrapQueryMethod = (method: string) => {
          const originalMethod = query[method];
          if (typeof originalMethod === 'function') {
            return function(...args: any[]) {
              const result = originalMethod.apply(query, args);

              // If it returns a promise, wrap it with error handling
              if (result && typeof result.then === 'function') {
                return handler.retryDatabase(
                  () => result,
                  table,
                  method
                );
              }

              // If it returns a query builder, wrap its methods too
              if (result && typeof result === 'object') {
                return new Proxy(result, {
                  get(target, prop) {
                    const value = target[prop];
                    if (typeof value === 'function' && prop !== 'then') {
                      return wrapQueryMethod(prop as string);
                    }
                    return value;
                  }
                });
              }

              return result;
            };
          }
          return originalMethod;
        };

        return new Proxy(query, {
          get(target, prop) {
            const value = target[prop];
            if (typeof value === 'function') {
              return wrapQueryMethod(prop as string);
            }
            return value;
          }
        });
      },

      rpc(fn: string, args?: any) {
        return handler.retryDatabase(
          () => client.rpc(fn, args),
          'rpc',
          fn
        );
      }
    };
  }

  /**
   * Create a safer auth client that handles network errors
   */
  wrapAuthClient(authClient: any) {
    const handler = this;
    
    return {
      ...authClient,
      
      async getSession() {
        return handler.retryAuth(
          () => authClient.getSession(),
          'getSession'
        );
      },
      
      async getUser() {
        return handler.retryAuth(
          () => authClient.getUser(),
          'getUser'
        );
      },
      
      async signInWithPassword(credentials: any) {
        return handler.retryAuth(
          () => authClient.signInWithPassword(credentials),
          'signInWithPassword'
        );
      },
      
      async signUp(credentials: any) {
        return handler.retryAuth(
          () => authClient.signUp(credentials),
          'signUp'
        );
      },
      
      async signOut() {
        return handler.retryAuth(
          () => authClient.signOut(),
          'signOut'
        );
      },
      
      async resetPasswordForEmail(email: string) {
        return handler.retryAuth(
          () => authClient.resetPasswordForEmail(email),
          'resetPasswordForEmail'
        );
      },
      
      async verifyOtp(params: any) {
        return handler.retryAuth(
          () => authClient.verifyOtp(params),
          'verifyOtp'
        );
      },
      
      // Pass through other methods
      onAuthStateChange: authClient.onAuthStateChange.bind(authClient),
      resend: authClient.resend?.bind(authClient)
    };
  }
}

export const supabaseErrorHandler = SupabaseErrorHandler.getInstance();
