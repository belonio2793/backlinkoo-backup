/**
 * Connection Testing Utility
 * Helps diagnose network and Supabase connectivity issues
 */

export class ConnectionTester {
  /**
   * Test basic network connectivity
   */
  static async testNetworkConnectivity(): Promise<boolean> {
    try {
      // Test with a simple request to a reliable endpoint
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Test Supabase connectivity
   */
  static async testSupabaseConnectivity(supabaseUrl: string): Promise<{ 
    connected: boolean; 
    error?: string;
    latency?: number;
  }> {
    try {
      const startTime = Date.now();
      
      // Test basic connectivity to Supabase
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
        headers: {
          'apikey': 'test' // This will fail auth but test connectivity
        }
      });
      
      const latency = Date.now() - startTime;
      
      return {
        connected: true,
        latency
      };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message || 'Connection failed'
      };
    }
  }

  /**
   * Run comprehensive connectivity test
   */
  static async runFullConnectivityTest(): Promise<{
    networkConnected: boolean;
    supabaseConnected: boolean;
    supabaseLatency?: number;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];
    
    // Test basic network
    const networkConnected = await this.testNetworkConnectivity();
    if (!networkConnected) {
      recommendations.push('Check your internet connection');
    }

    // Test Supabase (if we have the URL)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    let supabaseConnected = false;
    let supabaseLatency: number | undefined;
    
    if (supabaseUrl) {
      const supabaseTest = await this.testSupabaseConnectivity(supabaseUrl);
      supabaseConnected = supabaseTest.connected;
      supabaseLatency = supabaseTest.latency;
      
      if (!supabaseConnected) {
        recommendations.push('Check Supabase URL and network access');
        recommendations.push('Verify CORS settings in Supabase dashboard');
      } else if (supabaseLatency && supabaseLatency > 5000) {
        recommendations.push('High latency detected - check network quality');
      }
    } else {
      recommendations.push('Supabase URL not configured');
    }

    return {
      networkConnected,
      supabaseConnected,
      supabaseLatency,
      recommendations
    };
  }
}
