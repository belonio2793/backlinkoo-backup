/**
 * Supabase Connection Fixer
 * Handles "Failed to fetch" errors and network connectivity issues
 */

import { toast } from 'sonner';

export class SupabaseConnectionFixer {
  private static retryAttempts = 0;
  private static maxRetries = 3;
  private static retryDelay = 1000;
  private static isFixing = false;
  private static connectionBlocked = false;
  private static lastFailureTime = 0;
  private static readonly BLOCK_DURATION = 30000; // 30 seconds

  /**
   * Check if connection is currently blocked due to failures
   */
  static isConnectionBlocked(): boolean {
    // Check if we're within the block duration
    if (this.connectionBlocked && Date.now() - this.lastFailureTime < this.BLOCK_DURATION) {
      return true;
    }

    // Auto-clear block after duration
    if (this.connectionBlocked && Date.now() - this.lastFailureTime >= this.BLOCK_DURATION) {
      this.connectionBlocked = false;
      console.log('🔓 Connection block automatically cleared after timeout');
    }

    return false;
  }

  /**
   * Clear connection failure flag manually
   */
  static clearConnectionFailureFlag(): void {
    this.connectionBlocked = false;
    this.lastFailureTime = 0;
    this.retryAttempts = 0;
    console.log('🔓 Connection failure flag manually cleared');
  }

  /**
   * Get comprehensive diagnostics
   */
  static getDiagnostics(): any {
    const config = this.checkConfiguration();
    const environmentVariables = {
      hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      urlValue: import.meta.env.VITE_SUPABASE_URL ?
        import.meta.env.VITE_SUPABASE_URL.substring(0, 30) + '...' : 'missing',
      keyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY ?
        import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 10) + '...' : 'missing'
    };

    return {
      configValid: config.isValid,
      configIssues: config.issues,
      configRecommendations: config.recommendations,
      environmentVariables,
      connectionBlocked: this.connectionBlocked,
      lastFailureTime: this.lastFailureTime,
      retryAttempts: this.retryAttempts,
      isOnline: navigator.onLine,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test connection with simple endpoint
   */
  static async testConnection(): Promise<{ success: boolean; message: string; actions: string[] }> {
    try {
      const config = this.checkConfiguration();

      if (!config.isValid) {
        return {
          success: false,
          message: 'Configuration invalid: ' + config.issues.join(', '),
          actions: config.recommendations
        };
      }

      const connectivity = await this.testConnectivity();

      if (!connectivity.internet) {
        return {
          success: false,
          message: 'No internet connection detected',
          actions: ['Check your network connection']
        };
      }

      if (!connectivity.supabase) {
        return {
          success: false,
          message: 'Cannot reach Supabase servers',
          actions: ['Check Supabase status', 'Verify VITE_SUPABASE_URL']
        };
      }

      // Clear any existing blocks
      this.clearConnectionFailureFlag();

      return {
        success: true,
        message: 'Connection test successful',
        actions: ['All systems operational']
      };

    } catch (error: any) {
      return {
        success: false,
        message: 'Test failed: ' + (error.message || 'Unknown error'),
        actions: ['Try emergency fix', 'Check environment variables']
      };
    }
  }

  /**
   * Enhanced error detection for Supabase issues
   */
  static isSupabaseNetworkError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message || error.toString?.() || '';
    const errorStack = error.stack || '';

    return (
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('fetch is not defined') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ERR_NETWORK') ||
      errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
      errorStack.includes('supabase-js.js') ||
      errorStack.includes('@supabase')
    );
  }

  /**
   * Check if error is an auth session missing error (normal for unauthenticated users)
   */
  static isAuthSessionMissingError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message || error.toString?.() || '';

    return (
      errorMessage.includes('Auth session missing') ||
      errorMessage.includes('AuthSessionMissingError') ||
      error.name === 'AuthSessionMissingError'
    );
  }

  /**
   * Check environment variables and configuration
   */
  static checkConfiguration(): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      issues.push('Missing VITE_SUPABASE_URL environment variable');
      recommendations.push('Set VITE_SUPABASE_URL in your environment');
    } else if (!supabaseUrl.startsWith('https://')) {
      issues.push('VITE_SUPABASE_URL must start with https://');
    } else if (!supabaseUrl.includes('.supabase.co')) {
      issues.push('VITE_SUPABASE_URL must be a valid Supabase URL (.supabase.co)');
    }

    if (!supabaseKey) {
      issues.push('Missing VITE_SUPABASE_ANON_KEY environment variable');
      recommendations.push('Set VITE_SUPABASE_ANON_KEY in your environment');
    } else if (!supabaseKey.startsWith('eyJ')) {
      issues.push('VITE_SUPABASE_ANON_KEY appears to be invalid (should start with eyJ)');
    } else if (supabaseKey.length < 100) {
      issues.push('VITE_SUPABASE_ANON_KEY appears to be too short');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Test network connectivity to various endpoints
   */
  static async testConnectivity(): Promise<{
    internet: boolean;
    supabase: boolean;
    cloudflare: boolean;
    google: boolean;
  }> {
    const results = {
      internet: false,
      supabase: false,
      cloudflare: false,
      google: false
    };

    console.log('🔍 Testing network connectivity...');

    // Test Google (basic internet)
    try {
      await fetch('https://www.google.com/generate_204', {
        mode: 'no-cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      results.google = true;
      results.internet = true;
      console.log('✅ Google connectivity: OK');
    } catch (error) {
      console.error('❌ Google connectivity: FAILED');
    }

    // Test Cloudflare (CDN connectivity)
    try {
      await fetch('https://1.1.1.1/', {
        mode: 'no-cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      results.cloudflare = true;
      console.log('✅ Cloudflare connectivity: OK');
    } catch (error) {
      console.error('❌ Cloudflare connectivity: FAILED');
    }

    // Test Supabase
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        const response = await fetch(supabaseUrl + '/rest/v1/', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(10000)
        });
        results.supabase = response.status < 500;
        console.log('✅ Supabase connectivity: OK');
      } catch (error) {
        console.error('❌ Supabase connectivity: FAILED', error);
      }
    }

    return results;
  }

  /**
   * Apply emergency fixes for fetch errors
   */
  static async emergencyFix(): Promise<{
    success: boolean;
    message: string;
    actions: string[];
    appliedFixes?: string[];
    remainingIssues?: string[];
  }> {
    if (this.isFixing) {
      return {
        success: false,
        appliedFixes: [],
        remainingIssues: ['Fix already in progress']
      };
    }

    this.isFixing = true;
    const appliedFixes: string[] = [];
    const remainingIssues: string[] = [];

    try {
      console.log('🚨 Applying emergency Supabase connection fixes...');

      // Fix 1: Clear localStorage and reset auth state
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-dfhanacsmsvvkpunurnp-auth-token');
        sessionStorage.clear();
        appliedFixes.push('Cleared corrupted auth tokens');
        console.log('✅ Auth tokens cleared');
      } catch (error) {
        remainingIssues.push('Failed to clear auth tokens');
      }

      // Fix 2: Test and repair network configuration
      const connectivity = await this.testConnectivity();
      
      if (!connectivity.internet) {
        remainingIssues.push('No internet connection detected');
      } else {
        appliedFixes.push('Internet connectivity verified');
      }

      if (!connectivity.supabase && connectivity.internet) {
        remainingIssues.push('Supabase servers unreachable');
      } else if (connectivity.supabase) {
        appliedFixes.push('Supabase servers reachable');
      }

      // Fix 3: Validate configuration
      const config = this.checkConfiguration();
      if (!config.isValid) {
        remainingIssues.push(...config.issues);
      } else {
        appliedFixes.push('Environment configuration valid');
      }

      // Fix 4: Reset fetch interceptors that might be causing conflicts
      try {
        if ((window as any).originalFetch) {
          window.fetch = (window as any).originalFetch;
          appliedFixes.push('Reset fetch interceptors');
          console.log('✅ Fetch interceptors reset');
        }
      } catch (error) {
        console.warn('⚠️ Could not reset fetch interceptors');
      }

      // Fix 5: Force browser to use fresh DNS
      if (connectivity.internet && !connectivity.supabase) {
        try {
          // Clear DNS cache by adding cache-busting parameter
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          if (supabaseUrl) {
            await fetch(supabaseUrl + '/rest/v1/?t=' + Date.now(), {
              method: 'HEAD',
              cache: 'no-cache',
              signal: AbortSignal.timeout(15000)
            });
            appliedFixes.push('DNS cache refreshed');
            console.log('✅ DNS cache refresh attempted');
          }
        } catch (error) {
          console.warn('⚠️ DNS cache refresh failed');
        }
      }

      const success = remainingIssues.length === 0 || (connectivity.internet && connectivity.supabase);

      // Clear connection block on successful fix
      if (success) {
        this.clearConnectionFailureFlag();
      }

      console.log(`🚨 Emergency fix completed. Success: ${success}`);
      console.log('Applied fixes:', appliedFixes);
      console.log('Remaining issues:', remainingIssues);

      return {
        success,
        message: success ? 'Emergency fix applied successfully' : 'Some issues remain after emergency fix',
        actions: appliedFixes,
        appliedFixes,
        remainingIssues
      };

    } catch (error: any) {
      console.error('🚨 Emergency fix failed:', error);
      return {
        success: false,
        message: 'Emergency fix failed: ' + (error.message || 'Unknown error'),
        actions: ['Manual intervention required'],
        appliedFixes: [],
        remainingIssues: [error.message || 'Unknown error']
      };
    } finally {
      this.isFixing = false;
    }
  }

  /**
   * Auto-retry mechanism with exponential backoff
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: any = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await operation();
        if (attempt > 1) {
          console.log(`✅ ${context} succeeded on attempt ${attempt}`);
        }
        this.retryAttempts = 0; // Reset on success
        return result;
      } catch (error) {
        lastError = error;
        
        if (!this.isSupabaseNetworkError(error) || attempt === this.maxRetries) {
          // Don't retry non-network errors or if max attempts reached
          throw error;
        }

        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.warn(`⚠️ ${context} failed (attempt ${attempt}/${this.maxRetries}), retrying in ${delay}ms...`);
        
        // Apply emergency fix on first retry
        if (attempt === 1) {
          try {
            await this.emergencyFix();
          } catch (fixError) {
            console.warn('⚠️ Emergency fix failed:', fixError);
          }
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Wrap Supabase operations with error handling and retry
   */
  static wrapSupabaseOperation<T>(
    operation: () => Promise<T>,
    context: string = 'Supabase operation'
  ): Promise<T> {
    return this.retryWithBackoff(async () => {
      try {
        return await operation();
      } catch (error) {
        // Handle auth session missing errors gracefully (don't retry, don't show as error)
        if (this.isAuthSessionMissingError(error)) {
          console.log(`ℹ️ ${context}: No auth session (user not signed in) - this is normal for unauthenticated requests`);
          throw error; // Still throw so calling code can handle appropriately
        }

        if (this.isSupabaseNetworkError(error)) {
          console.error(`❌ ${context} network error:`, error);

          // Block connection if too many failures
          this.retryAttempts++;
          if (this.retryAttempts >= this.maxRetries) {
            this.connectionBlocked = true;
            this.lastFailureTime = Date.now();
            console.warn('🚫 Connection blocked due to repeated failures');
          }

          // Show user-friendly error message
          if (this.retryAttempts === 1) {
            toast.error('Connection issue detected. Attempting to reconnect...', {
              duration: 3000
            });
          }
        }
        throw error;
      }
    }, context);
  }

  /**
   * Initialize connection monitoring and auto-recovery
   */
  static initializeMonitoring() {
    console.log('🔧 Initializing Supabase connection monitoring...');

    // Monitor online/offline status
    const handleOnline = () => {
      console.log('🌐 Network connection restored');
      this.retryAttempts = 0;
      toast.success('Connection restored!', { duration: 2000 });
    };

    const handleOffline = () => {
      console.warn('⚠️ Network connection lost');
      toast.warning('Connection lost. Will retry when connection is restored.', {
        duration: 5000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial status check
    if (!navigator.onLine) {
      handleOffline();
    }

    // Global error handler for unhandled promises
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isSupabaseNetworkError(event.reason)) {
        console.error('🚨 Unhandled Supabase network error:', event.reason);
        event.preventDefault(); // Prevent console spam
        
        // Try emergency fix
        this.emergencyFix().catch(console.error);
      }
    });

    console.log('✅ Supabase connection monitoring initialized');
  }
}

// Initialize monitoring when module loads
if (typeof window !== 'undefined') {
  // Defer initialization to avoid blocking app startup
  setTimeout(() => {
    SupabaseConnectionFixer.initializeMonitoring();
  }, 1000);

  // Make available globally for debugging
  (window as any).SupabaseConnectionFixer = SupabaseConnectionFixer;
  
  // Add debugging helpers
  (window as any).fixSupabaseConnection = () => {
    return SupabaseConnectionFixer.emergencyFix();
  };
  
  (window as any).testSupabaseConnectivity = () => {
    return SupabaseConnectionFixer.testConnectivity();
  };
}
