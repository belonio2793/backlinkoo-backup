// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SecureConfig } from '../../lib/secure-config';

// Store original fetch before third-party scripts can modify it
if (typeof window !== 'undefined' && !(globalThis as any).__originalFetch__) {
  (globalThis as any).__originalFetch__ = window.fetch.bind(window);
}

// Get Supabase configuration with proper fallback
const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  console.log('🔧 Environment variables:', {
    hasEnvUrl: !!envUrl,
    hasEnvKey: !!envKey,
    envUrlLength: envUrl?.length || 0,
    envKeyLength: envKey?.length || 0
  });

  const url = envUrl || SecureConfig.SUPABASE_URL;
  const key = envKey || SecureConfig.SUPABASE_ANON_KEY;

  console.log('🔧 Final config:', {
    url: url ? `${url.substring(0, 30)}...` : 'missing',
    keyPrefix: key ? key.substring(0, 10) + '...' : 'missing',
    urlFromEnv: !!envUrl,
    keyFromEnv: !!envKey
  });

  return { url, key };
};

const { url: SUPABASE_URL, key: SUPABASE_PUBLISHABLE_KEY } = getSupabaseConfig();

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Create a mock client for development when Supabase project is not available
const createMockSupabaseClient = () => {
  const mockUser = {
    id: 'mock-user-id',
    email: 'test@example.com',
    user_metadata: { display_name: 'Test User' },
    created_at: new Date().toISOString(),
    aud: 'authenticated'
  };

  const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    user: mockUser
  };

  const mockAuth = {
    getSession: () => {
      console.warn('⚠️ Mock auth getSession called - using fake session');
      return Promise.resolve({ data: { session: null }, error: { message: 'Mock mode: Please configure real Supabase credentials' } });
    },
    getUser: () => {
      console.warn('⚠️ Mock auth getUser called');
      return Promise.resolve({ data: { user: null }, error: { message: 'Mock mode: Please configure real Supabase credentials' } });
    },
    onAuthStateChange: (callback: any) => {
      console.warn('⚠️ Mock auth onAuthStateChange called');
      return { data: { subscription: { unsubscribe: () => console.log('Mock auth listener unsubscribed') } } };
    },
    signInWithPassword: () => {
      console.error('⚠️ Mock auth signInWithPassword called - login will fail');
      return Promise.resolve({
        data: { user: null, session: null },
        error: { message: 'Authentication not available: Please configure real Supabase credentials in environment variables' }
      });
    },
    signUp: () => {
      console.error('⚠️ Mock auth signUp called - signup will fail');
      return Promise.resolve({
        data: { user: null, session: null },
        error: { message: 'Authentication not available: Please configure real Supabase credentials in environment variables' }
      });
    },
    signOut: () => {
      console.log('��️ Mock auth signOut called');
      return Promise.resolve({ error: null });
    },
    resend: () => {
      console.error('⚠️ Mock auth resend called');
      return Promise.resolve({ error: { message: 'Email service not available in mock mode' } });
    },
    resetPasswordForEmail: () => {
      console.error('⚠️ Mock auth resetPasswordForEmail called');
      return Promise.resolve({ error: { message: 'Password reset not available in mock mode' } });
    },
    verifyOtp: () => {
      console.error('⚠️ Mock auth verifyOtp called');
      return Promise.resolve({
        data: { user: null, session: null },
        error: { message: 'OTP verification not available in mock mode' }
      });
    },

  };

  const mockFrom = (table: string) => {
    const mockMethods = {
      select: (columns?: string) => mockMethods,
      insert: (data: any) => mockMethods,
      update: (data: any) => mockMethods,
      delete: () => mockMethods,
      upsert: (data: any) => mockMethods,
      eq: (column: string, value: any) => mockMethods,
      order: (column: string, options?: any) => mockMethods,
      limit: (count: number) => mockMethods,
      filter: (column: string, operator: string, value: any) => mockMethods,
      gte: (column: string, value: any) => mockMethods,
      lte: (column: string, value: any) => mockMethods,
      gt: (column: string, value: any) => mockMethods,
      lt: (column: string, value: any) => mockMethods,
      in: (column: string, values: any[]) => mockMethods,
      is: (column: string, value: any) => mockMethods,
      neq: (column: string, value: any) => mockMethods,
      ilike: (column: string, pattern: string) => mockMethods,
      like: (column: string, pattern: string) => mockMethods,
      range: (from: number, to: number) => mockMethods,
      single: () => {
        console.warn(`⚠️ Mock database query on table '${table}' - no real data available`);
        return Promise.resolve({
          data: null,
          error: { message: `Database not available: Please configure real Supabase credentials. Attempted to query table: ${table}` }
        });
      },
      then: (callback: any) => {
        console.warn(`⚠️ Mock database query on table '${table}' - no real data available`);
        // Return mock error to indicate database is not available
        return callback({
          data: null,
          error: { message: `Database not available: Please configure real Supabase credentials. Attempted to query table: ${table}` }
        });
      }
    };
    return mockMethods;
  };

  const mockFunctions = {
    invoke: () => Promise.resolve({ data: null, error: { message: 'Mock mode - functions disabled' } }),
  };

  const mockChannel = () => ({
    on: () => mockChannel(),
    subscribe: () => {},
  });

  return {
    auth: mockAuth,
    from: mockFrom,
    functions: mockFunctions,
    channel: mockChannel,
    removeChannel: () => {},
    rpc: () => Promise.resolve({ data: null, error: { message: 'Mock mode - RPC disabled' } }),
  };
};

// Check if we have valid Supabase credentials - improved validation
const validateCredentials = () => {
  console.log('🔍 Validating Supabase credentials...');

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.error('❌ Missing URL or key');
    return false;
  }

  if (SUPABASE_URL.trim() === "" || SUPABASE_PUBLISHABLE_KEY.trim() === "") {
    console.error('❌ Empty URL or key');
    return false;
  }

  if (SUPABASE_URL.includes('your-project-url') || SUPABASE_PUBLISHABLE_KEY.includes('your-anon-key')) {
    console.error('❌ Placeholder values detected');
    return false;
  }

  if (!SUPABASE_URL.startsWith('https://')) {
    console.error('❌ URL must start with https://');
    return false;
  }

  if (!SUPABASE_URL.includes('.supabase.co')) {
    console.error('❌ URL must be a supabase.co domain');
    return false;
  }

  if (!SUPABASE_PUBLISHABLE_KEY.startsWith('eyJ')) {
    console.error('❌ Key must be a valid JWT token');
    return false;
  }

  if (SUPABASE_PUBLISHABLE_KEY.length < 50) {
    console.error('❌ Key too short');
    return false;
  }

  console.log('✅ Credentials validation passed');
  return true;
};

const hasValidCredentials = validateCredentials();

console.log('🔧 Supabase client configuration:', {
  hasUrl: !!SUPABASE_URL,
  hasKey: !!SUPABASE_PUBLISHABLE_KEY,
  urlLength: SUPABASE_URL?.length,
  keyLength: SUPABASE_PUBLISHABLE_KEY?.length,
  urlValid: SUPABASE_URL?.startsWith('https://') && SUPABASE_URL?.includes('.supabase.co'),
  keyValid: SUPABASE_PUBLISHABLE_KEY?.startsWith('eyJ') && SUPABASE_PUBLISHABLE_KEY?.length > 100,
  hasValidCredentials,
  willUseMock: !hasValidCredentials,
  url: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'missing',
  keyPrefix: SUPABASE_PUBLISHABLE_KEY ? SUPABASE_PUBLISHABLE_KEY.substring(0, 10) + '...' : 'missing'
});

// Test basic connectivity if using real client
if (hasValidCredentials) {
  console.log('🔗 Testing Supabase connectivity...');
}

// Use mock client if credentials are missing or invalid
export const supabase = hasValidCredentials ?
  createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'supabase.auth.token',
    },
    global: {
      headers: {
        'X-Client-Info': 'backlink-infinity@1.0.0',
      },
      fetch: (url, options = {}) => {
        // Store original fetch before any third-party scripts modify it
        const originalFetch = (globalThis as any).__originalFetch__ || window.fetch;

        // If we detect FullStory interference, use a workaround
        const isFullStoryPresent = !!(window as any).FS || document.querySelector('script[src*="fullstory"]');

        let fetchFunction = originalFetch;

        if (isFullStoryPresent) {
          console.log('🔍 FullStory detected - using workaround fetch');
          // Create a new fetch function that bypasses FullStory
          fetchFunction = async (url: string, init?: RequestInit) => {
            try {
              // Use XMLHttpRequest as fallback when FullStory interferes
              return await new Promise<Response>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.open(init?.method || 'GET', url);

                // Set headers
                if (init?.headers) {
                  const headers = new Headers(init.headers);
                  headers.forEach((value, key) => {
                    xhr.setRequestHeader(key, value);
                  });
                }

                xhr.onload = () => {
                  // Status codes that cannot have a body according to HTTP spec
                  const statusCodesWithoutBody = [204, 205, 304];
                  const canHaveBody = !statusCodesWithoutBody.includes(xhr.status);

                  // Create Response object with appropriate body handling
                  const response = new Response(
                    canHaveBody ? xhr.responseText : null,
                    {
                      status: xhr.status,
                      statusText: xhr.statusText,
                      headers: new Headers(xhr.getAllResponseHeaders().split('\r\n').reduce((acc, line) => {
                        const [key, value] = line.split(': ');
                        if (key && value) acc[key] = value;
                        return acc;
                      }, {} as Record<string, string>))
                    }
                  );
                  resolve(response);
                };

                xhr.onerror = () => reject(new Error('Network request failed'));
                xhr.ontimeout = () => reject(new Error('Request timeout'));

                // Set timeout
                xhr.timeout = 30000;

                // Send request
                xhr.send(init?.body as any);
              });
            } catch (error) {
              // Fallback to original fetch if XMLHttpRequest fails
              return originalFetch(url, init);
            }
          };
        }

        // Create a timeout that won't interfere with existing signals
        const timeoutMs = 30000;
        const timeoutController = new AbortController();

        let timeoutId;
        if (!options.signal) {
          timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
        }

        const finalSignal = options.signal || timeoutController.signal;

        return fetchFunction(url, {
          ...options,
          signal: finalSignal,
        }).then(response => {
          if (timeoutId) clearTimeout(timeoutId);
          return response;
        }).catch(error => {
          if (timeoutId) clearTimeout(timeoutId);

          // Handle specific error types
          if (error.name === 'AbortError') {
            console.warn('🔍 Request aborted (likely timeout):', url);
            throw new Error('Request timeout - please try again');
          }

          // Check if this is likely third-party interference
          const isThirdPartyIssue = error?.stack?.includes('fullstory') ||
                                   error?.stack?.includes('fs.js') ||
                                   error?.message?.includes('Failed to fetch');

          if (isThirdPartyIssue) {
            console.warn('🔍 Network request blocked by FullStory/Analytics - using workaround');
            // Return a more specific error for third-party interference
            throw new Error('Third-party script interference detected - request blocked');
          }

          console.warn('Supabase fetch error:', error);
          throw new Error(`Network request failed: ${error.message || 'Unknown network error'}`);
        });
      },
    },
  }) :
  createMockSupabaseClient() as any;

// Log the final client type
if (hasValidCredentials) {
  console.log('✅ Using real Supabase client');

  // Test connection in development
  if (import.meta.env.DEV) {
    setTimeout(async () => {
      try {
        console.log('🔍 Testing Supabase connection...');
        const { data, error } = await supabase.from('blog_posts').select('id').limit(1);
        if (error) {
          console.warn('⚠️ Supabase connection test failed:', error.message);
        } else {
          console.log('✅ Supabase connection test successful');
        }
      } catch (testError: any) {
        console.warn('⚠️ Supabase connection test error:', testError.message);
      }
    }, 1000);
  }
} else {
  console.warn('⚠️ Using mock Supabase client - authentication will not work!');
  console.log('Fix: Set proper VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
}
