// Enhanced Supabase client with comprehensive error handling and retry logic
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SupabaseConnectionFixer } from '@/utils/supabaseConnectionFixer';

// Get Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging for environment variables
console.log('🔍 Environment variable debugging:', {
  allEnvKeys: Object.keys(import.meta.env),
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  hasViteSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
  hasViteSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
});

console.log('🔧 Enhanced Supabase client configuration:', {
  hasUrl: !!SUPABASE_URL,
  hasKey: !!SUPABASE_ANON_KEY,
  url: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'missing',
  keyPrefix: SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 10) + '...' : 'missing',
  environment: import.meta.env.MODE
});

// Use fallback credentials if environment variables aren't loaded
const finalUrl = SUPABASE_URL || 'https://dfhanacsmsvvkpunurnp.supabase.co';
const finalKey = SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2NDcsImV4cCI6MjA2ODUzMjY0N30.MZcB4P_TAOOTktXSG7bNK5BsIMAf1bKXVgT87Zqa5RY';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Environment variables not loaded properly, using fallback credentials');
  console.log('💡 This suggests a Vite environment variable loading issue');
}

// Validate final credentials
if (!finalUrl || !finalKey) {
  const config = SupabaseConnectionFixer.checkConfiguration();
  console.error('❌ Supabase configuration issues:', config.issues);
  console.log('💡 Recommendations:', config.recommendations);
  throw new Error(`Missing Supabase environment variables: ${config.issues.join(', ')}`);
}

if (!SUPABASE_URL.startsWith('https://') || !SUPABASE_URL.includes('.supabase.co')) {
  throw new Error('Invalid Supabase URL format. Must be https://*.supabase.co');
}

if (!SUPABASE_ANON_KEY.startsWith('eyJ') || SUPABASE_ANON_KEY.length < 100) {
  throw new Error('Invalid Supabase API key format. Must be a valid JWT token.');
}

// Enhanced Supabase client with error resilience
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
      'Cache-Control': 'no-cache',
    },
    fetch: async (url, options = {}) => {
      // Use the connection fixer's retry mechanism for all Supabase requests
      return SupabaseConnectionFixer.wrapSupabaseOperation(async () => {
        const response = await fetch(url, {
          ...options,
          // Add timeout and cache control
          signal: options.signal || AbortSignal.timeout(30000), // 30 second timeout
          cache: 'no-cache',
          headers: {
            ...options.headers,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });

        // Handle non-200 responses
        if (!response.ok && response.status >= 500) {
          throw new Error(`Supabase server error: ${response.status} ${response.statusText}`);
        }

        return response;
      }, `Supabase request to ${url}`);
    },
  },
});

// Enhanced network error handler
const handleNetworkError = (error: any, context: string): boolean => {
  return SupabaseConnectionFixer.isSupabaseNetworkError(error);
};

// Create resilient auth helpers
export const resilientAuthOperations = {
  /**
   * Get user with retry and error recovery
   */
  async getUser() {
    return SupabaseConnectionFixer.wrapSupabaseOperation(
      () => supabase.auth.getUser(),
      'Get user'
    );
  },

  /**
   * Sign in with retry
   */
  async signIn(email: string, password: string) {
    return SupabaseConnectionFixer.wrapSupabaseOperation(
      () => supabase.auth.signInWithPassword({ email, password }),
      'Sign in'
    );
  },

  /**
   * Sign out with retry
   */
  async signOut() {
    return SupabaseConnectionFixer.wrapSupabaseOperation(
      () => supabase.auth.signOut(),
      'Sign out'
    );
  },

  /**
   * Reset password with retry
   */
  async resetPassword(email: string) {
    return SupabaseConnectionFixer.wrapSupabaseOperation(
      () => supabase.auth.resetPasswordForEmail(email),
      'Reset password'
    );
  }
};

// Enhanced database operations
export const resilientDbOperations = {
  /**
   * Query with automatic retry
   */
  async query<T>(tableName: string, query: any, context: string = `Query ${tableName}`) {
    return SupabaseConnectionFixer.wrapSupabaseOperation(
      () => query,
      context
    );
  }
};

// Connection health monitoring
export const connectionHealth = {
  isOnline: () => navigator.onLine,

  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  },

  async getConnectionStatus() {
    const connectivity = await SupabaseConnectionFixer.testConnectivity();
    return {
      online: navigator.onLine,
      internet: connectivity.internet,
      supabase: connectivity.supabase,
      overall: connectivity.internet && connectivity.supabase
    };
  }
};

// Test connection with enhanced error handling
if (import.meta.env.DEV) {
  setTimeout(async () => {
    try {
      console.log('🔍 Testing enhanced Supabase connection...');

      const connectionStatus = await connectionHealth.getConnectionStatus();
      console.log('📊 Connection status:', connectionStatus);

      if (connectionStatus.overall) {
        console.log('✅ Supabase connection test successful');
      } else {
        console.warn('⚠️ Supabase connection issues detected');

        // Attempt emergency fix
        const fixResult = await SupabaseConnectionFixer.emergencyFix();
        console.log('🚨 Emergency fix result:', fixResult);
      }
    } catch (testError: any) {
      console.error('❌ Enhanced connection test failed:', testError);

      // Log detailed error information
      if (SupabaseConnectionFixer.isSupabaseNetworkError(testError)) {
        console.error('🔍 This appears to be a network connectivity issue');
        console.log('💡 Try running: fixSupabaseConnection() in the console');
      }
    }
  }, 2000);
}

// Export everything for use throughout the app
export { handleNetworkError, SupabaseConnectionFixer };

console.log('✅ Enhanced Supabase client initialized with error resilience');
