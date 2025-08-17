/**
 * Supabase Connection Fixer
 * 
 * This utility helps diagnose and fix common Supabase connection issues,
 * especially the "Supabase connection previously failed" error that blocks requests.
 */

import { supabase } from '@/integrations/supabase/client';

export class SupabaseConnectionFixer {
  /**
   * Clear the connection failure flag that blocks Supabase requests
   */
  static clearConnectionFailureFlag(): void {
    try {
      localStorage.removeItem('supabase_connection_failed');
      console.log('✅ Cleared Supabase connection failure flag');
    } catch (error) {
      console.error('❌ Failed to clear connection failure flag:', error);
    }
  }

  /**
   * Check if connection failure flag is set
   */
  static isConnectionBlocked(): boolean {
    try {
      return localStorage.getItem('supabase_connection_failed') === 'true';
    } catch (error) {
      console.error('❌ Failed to check connection flag:', error);
      return false;
    }
  }

  /**
   * Test basic Supabase connectivity
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔍 Testing Supabase connection...');
      
      // Clear any existing failure flags first
      this.clearConnectionFailureFlag();
      
      // Test with a simple query that should work on any Supabase project
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id')
        .limit(1);

      if (error) {
        console.warn('⚠️ Test query failed:', error.message);
        
        // Check for common error types
        if (error.message?.includes('relation "blog_posts" does not exist')) {
          return {
            success: true,
            message: 'Connection OK - Database tables need to be created'
          };
        } else if (error.message?.includes('JWT')) {
          return {
            success: false,
            message: 'Authentication issue - Check your Supabase keys'
          };
        } else if (error.message?.includes('permission')) {
          return {
            success: true,
            message: 'Connection OK - Permission/RLS policies need setup'
          };
        } else {
          return {
            success: false,
            message: `Connection test failed: ${error.message}`
          };
        }
      }

      console.log('✅ Supabase connection test successful');
      return {
        success: true,
        message: 'Connection test successful'
      };

    } catch (error: any) {
      console.error('❌ Connection test error:', error);
      
      if (error.message?.includes('Failed to fetch')) {
        return {
          success: false,
          message: 'Network error - Check internet connection'
        };
      } else if (error.message?.includes('timeout')) {
        return {
          success: false,
          message: 'Connection timeout - Supabase may be slow'
        };
      } else {
        return {
          success: false,
          message: `Connection error: ${error.message}`
        };
      }
    }
  }

  /**
   * Validate Supabase configuration
   */
  static validateConfig(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      issues.push('VITE_SUPABASE_URL environment variable is missing');
    } else if (!supabaseUrl.startsWith('https://')) {
      issues.push('VITE_SUPABASE_URL must start with https://');
    } else if (!supabaseUrl.includes('.supabase.co')) {
      issues.push('VITE_SUPABASE_URL must be a valid Supabase URL');
    }

    if (!supabaseKey) {
      issues.push('VITE_SUPABASE_ANON_KEY environment variable is missing');
    } else if (!supabaseKey.startsWith('eyJ')) {
      issues.push('VITE_SUPABASE_ANON_KEY must be a valid JWT token');
    } else if (supabaseKey.length < 100) {
      issues.push('VITE_SUPABASE_ANON_KEY appears to be too short');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Reset all connection state and attempt recovery
   */
  static async resetConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Resetting Supabase connection...');
      
      // Clear all connection-related localStorage entries
      this.clearConnectionFailureFlag();
      
      // Clear any cached auth state that might be causing issues
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-supabase-auth-token');
      } catch (error) {
        console.warn('Could not clear auth tokens:', error);
      }

      // Wait a moment for any pending requests to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Test the connection
      const testResult = await this.testConnection();
      
      if (testResult.success) {
        console.log('✅ Connection reset successful');
        return {
          success: true,
          message: 'Connection reset and tested successfully'
        };
      } else {
        console.warn('⚠️ Connection reset completed but test failed');
        return testResult;
      }

    } catch (error: any) {
      console.error('❌ Connection reset failed:', error);
      return {
        success: false,
        message: `Reset failed: ${error.message}`
      };
    }
  }

  /**
   * Get comprehensive connection diagnostics
   */
  static getDiagnostics(): Record<string, any> {
    const config = this.validateConfig();
    const isBlocked = this.isConnectionBlocked();
    
    return {
      timestamp: new Date().toISOString(),
      connectionBlocked: isBlocked,
      configValid: config.isValid,
      configIssues: config.issues,
      environmentVariables: {
        hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        urlLength: import.meta.env.VITE_SUPABASE_URL?.length || 0,
        keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0
      },
      localStorage: {
        hasFailureFlag: isBlocked,
        authTokenExists: !!localStorage.getItem('supabase.auth.token'),
      }
    };
  }

  /**
   * Emergency fix - applies all common fixes
   */
  static async emergencyFix(): Promise<{ success: boolean; message: string; actions: string[] }> {
    const actions: string[] = [];
    
    try {
      console.log('🚨 Running emergency Supabase connection fix...');
      
      // Step 1: Clear connection failure flag
      if (this.isConnectionBlocked()) {
        this.clearConnectionFailureFlag();
        actions.push('Cleared connection failure flag');
      }
      
      // Step 2: Validate configuration
      const config = this.validateConfig();
      if (!config.isValid) {
        actions.push(`Configuration issues found: ${config.issues.join(', ')}`);
        return {
          success: false,
          message: 'Configuration validation failed',
          actions
        };
      }
      actions.push('Configuration validation passed');
      
      // Step 3: Reset connection state
      const resetResult = await this.resetConnection();
      actions.push('Connection state reset attempted');
      
      // Step 4: Test final connection
      const testResult = await this.testConnection();
      actions.push('Connection test completed');
      
      if (testResult.success) {
        console.log('✅ Emergency fix successful');
        return {
          success: true,
          message: 'Emergency fix completed successfully',
          actions
        };
      } else {
        console.warn('⚠️ Emergency fix completed but connection still failing');
        return {
          success: false,
          message: testResult.message,
          actions
        };
      }
      
    } catch (error: any) {
      console.error('❌ Emergency fix failed:', error);
      actions.push(`Error during fix: ${error.message}`);
      return {
        success: false,
        message: `Emergency fix failed: ${error.message}`,
        actions
      };
    }
  }
}

// Auto-run emergency fix on import if connection is blocked
if (typeof window !== 'undefined') {
  // Run after a short delay to allow other modules to initialize
  setTimeout(() => {
    if (SupabaseConnectionFixer.isConnectionBlocked()) {
      console.log('🚨 Detected blocked Supabase connection, running emergency fix...');
      SupabaseConnectionFixer.emergencyFix().then(result => {
        if (result.success) {
          console.log('✅ Auto-fix successful:', result.message);
        } else {
          console.warn('⚠️ Auto-fix completed with issues:', result.message);
        }
      });
    }
  }, 1000);
}

// Export for manual use
export default SupabaseConnectionFixer;
