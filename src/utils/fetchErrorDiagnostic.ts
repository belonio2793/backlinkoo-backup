/**
 * Fetch Error Diagnostic Tool
 * Helps identify the source and cause of "Failed to fetch" errors
 */

export class FetchErrorDiagnostic {
  private static errorLog: Array<{
    timestamp: Date;
    url: string;
    error: string;
    stack?: string;
    userAgent: string;
  }> = [];

  /**
   * Log fetch errors for analysis
   */
  static logError(url: string, error: any) {
    const entry = {
      timestamp: new Date(),
      url: url?.substring(0, 100) || 'unknown',
      error: error?.message || 'Unknown error',
      stack: error?.stack?.substring(0, 200),
      userAgent: navigator.userAgent
    };

    this.errorLog.push(entry);

    // Keep only last 10 errors to prevent memory issues
    if (this.errorLog.length > 10) {
      this.errorLog.shift();
    }

    console.error('🔍 Fetch Error Logged:', entry);
  }

  /**
   * Analyze error patterns and provide solutions
   */
  static analyzeErrors(): {
    totalErrors: number;
    commonPatterns: string[];
    suggestions: string[];
    errorsByType: Record<string, number>;
  } {
    const analysis = {
      totalErrors: this.errorLog.length,
      commonPatterns: [] as string[],
      suggestions: [] as string[],
      errorsByType: {} as Record<string, number>
    };

    if (this.errorLog.length === 0) {
      return analysis;
    }

    // Analyze error patterns
    const urlPatterns: Record<string, number> = {};
    const errorTypes: Record<string, number> = {};

    this.errorLog.forEach(entry => {
      // Track URL patterns
      if (entry.url.includes('supabase')) {
        urlPatterns['supabase'] = (urlPatterns['supabase'] || 0) + 1;
      } else if (entry.url.includes('functions')) {
        urlPatterns['netlify-functions'] = (urlPatterns['netlify-functions'] || 0) + 1;
      } else if (entry.url.includes('api')) {
        urlPatterns['api'] = (urlPatterns['api'] || 0) + 1;
      }

      // Track error types
      if (entry.error.includes('Failed to fetch')) {
        errorTypes['network-failure'] = (errorTypes['network-failure'] || 0) + 1;
      } else if (entry.error.includes('timeout')) {
        errorTypes['timeout'] = (errorTypes['timeout'] || 0) + 1;
      } else if (entry.error.includes('body stream')) {
        errorTypes['stream-error'] = (errorTypes['stream-error'] || 0) + 1;
      }
    });

    analysis.errorsByType = errorTypes;

    // Generate common patterns
    if (urlPatterns['supabase'] > 0) {
      analysis.commonPatterns.push(`${urlPatterns['supabase']} Supabase connection errors`);
    }
    if (urlPatterns['netlify-functions'] > 0) {
      analysis.commonPatterns.push(`${urlPatterns['netlify-functions']} Netlify function errors`);
    }

    // Generate suggestions
    if (errorTypes['network-failure'] > 2) {
      analysis.suggestions.push('Multiple network failures detected - check internet connection');
    }
    if (urlPatterns['supabase'] > 1) {
      analysis.suggestions.push('Supabase connection issues - check environment variables');
    }
    if (errorTypes['stream-error'] > 0) {
      analysis.suggestions.push('Response stream conflicts - browser extension interference likely');
    }
    if (errorTypes['timeout'] > 0) {
      analysis.suggestions.push('Request timeouts - server may be slow or unreachable');
    }

    return analysis;
  }

  /**
   * Run connection tests to identify issues
   */
  static async runDiagnostics(): Promise<{
    internetConnection: boolean;
    supabaseReachable: boolean;
    netlifyFunctionsReachable: boolean;
    recommendations: string[];
  }> {
    const results = {
      internetConnection: false,
      supabaseReachable: false,
      netlifyFunctionsReachable: false,
      recommendations: [] as string[]
    };

    console.log('🔍 Running fetch error diagnostics...');

    // Test 1: Basic internet connectivity
    try {
      await fetch('https://www.google.com/generate_204', { 
        mode: 'no-cors',
        cache: 'no-cache'
      });
      results.internetConnection = true;
      console.log('✅ Internet connection: OK');
    } catch (error) {
      console.error('❌ Internet connection: FAILED');
      results.recommendations.push('Check your internet connection');
    }

    // Test 2: Supabase connectivity (if configured)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl && supabaseUrl.includes('.supabase.co')) {
      try {
        const response = await fetch(supabaseUrl + '/rest/v1/', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        results.supabaseReachable = response.status < 500;
        console.log('✅ Supabase reachable: OK');
      } catch (error) {
        console.error('❌ Supabase reachable: FAILED');
        results.recommendations.push('Supabase servers unreachable - check configuration');
      }
    }

    // Test 3: Netlify Functions (if available)
    try {
      const response = await fetch('/.netlify/functions/api-status', {
        method: 'GET',
        cache: 'no-cache'
      });
      results.netlifyFunctionsReachable = response.status < 500;
      console.log('✅ Netlify functions: OK');
    } catch (error) {
      console.warn('⚠️ Netlify functions: UNAVAILABLE (normal in development)');
    }

    // Generate recommendations
    if (!results.internetConnection) {
      results.recommendations.unshift('Primary issue: No internet connection detected');
    } else if (!results.supabaseReachable && supabaseUrl) {
      results.recommendations.push('Database connection issues - check Supabase status');
    }

    console.log('🔍 Diagnostics complete:', results);
    return results;
  }

  /**
   * Get formatted error report
   */
  static getErrorReport(): string {
    const analysis = this.analyzeErrors();
    
    let report = '🔍 Fetch Error Diagnostic Report\n';
    report += '================================\n\n';
    
    report += `Total Errors: ${analysis.totalErrors}\n\n`;
    
    if (analysis.commonPatterns.length > 0) {
      report += 'Common Patterns:\n';
      analysis.commonPatterns.forEach(pattern => {
        report += `• ${pattern}\n`;
      });
      report += '\n';
    }
    
    if (analysis.suggestions.length > 0) {
      report += 'Suggestions:\n';
      analysis.suggestions.forEach(suggestion => {
        report += `• ${suggestion}\n`;
      });
      report += '\n';
    }
    
    if (Object.keys(analysis.errorsByType).length > 0) {
      report += 'Error Types:\n';
      Object.entries(analysis.errorsByType).forEach(([type, count]) => {
        report += `• ${type}: ${count}\n`;
      });
    }
    
    return report;
  }

  /**
   * Clear error log
   */
  static clearLog() {
    this.errorLog = [];
    console.log('🗑️ Fetch error log cleared');
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).FetchErrorDiagnostic = FetchErrorDiagnostic;
  
  // Auto-run diagnostics if there are recent errors
  setTimeout(() => {
    if (FetchErrorDiagnostic.analyzeErrors().totalErrors > 0) {
      console.log(FetchErrorDiagnostic.getErrorReport());
    }
  }, 5000);
}

// Auto-log fetch errors
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  try {
    return await originalFetch(...args);
  } catch (error) {
    const [url] = args;
    FetchErrorDiagnostic.logError(url as string, error);
    throw error;
  }
};
