/**
 * Fetch Test Helper - Utility to test and diagnose fetch issues
 */

export const fetchTestHelper = {
  
  /**
   * Test basic fetch functionality
   */
  async testBasicFetch(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🧪 Testing basic fetch functionality...');
      
      // Test 1: Simple fetch to a known endpoint
      const response = await fetch('https://httpbin.org/json', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Basic fetch test successful:', data);
      
      return {
        success: true,
        message: 'Basic fetch is working correctly',
        details: { status: response.status, data }
      };
      
    } catch (error: any) {
      console.error('❌ Basic fetch test failed:', error);
      return {
        success: false,
        message: `Fetch test failed: ${error.message}`,
        details: { error: error.message, stack: error.stack }
      };
    }
  },

  /**
   * Test Supabase connectivity specifically
   */
  async testSupabaseConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🧪 Testing Supabase connection...');
      
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Simple query that doesn't require authentication
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase test failed:', error);
        return {
          success: false,
          message: `Supabase error: ${error.message}`,
          details: error
        };
      }
      
      console.log('✅ Supabase connection test successful');
      return {
        success: true,
        message: 'Supabase connection is working',
        details: { queryResult: data }
      };
      
    } catch (error: any) {
      console.error('❌ Supabase connection test failed:', error);
      return {
        success: false,
        message: `Supabase connection failed: ${error.message}`,
        details: { error: error.message, stack: error.stack }
      };
    }
  },

  /**
   * Check if FullStory is interfering with fetch
   */
  checkFullStoryInterference(): { detected: boolean; message: string; details?: any } {
    try {
      console.log('🔍 Checking for FullStory interference...');
      
      const checks = {
        fsObject: !!(window as any).FS,
        fsProperty: !!(window as any)._fs,
        fsScript: !!document.querySelector('script[src*="fullstory"]'),
        fsJsScript: !!document.querySelector('script[src*="fs.js"]'),
        edgeScript: !!document.querySelector('script[src*="edge.fullstory.com"]'),
        fetchModified: false
      };
      
      // Check if fetch has been modified
      try {
        const fetchStr = window.fetch.toString();
        checks.fetchModified = !fetchStr.includes('[native code]') && fetchStr.length < 200;
      } catch (e) {
        // Can't check fetch modification
      }
      
      const detected = Object.values(checks).some(Boolean);
      
      if (detected) {
        console.warn('⚠️ FullStory interference detected:', checks);
        return {
          detected: true,
          message: 'FullStory interference detected',
          details: checks
        };
      } else {
        console.log('✅ No FullStory interference detected');
        return {
          detected: false,
          message: 'No FullStory interference found',
          details: checks
        };
      }
      
    } catch (error: any) {
      console.error('❌ Error checking FullStory interference:', error);
      return {
        detected: false,
        message: `Could not check FullStory interference: ${error.message}`,
        details: { error: error.message }
      };
    }
  },

  /**
   * Run comprehensive fetch diagnostics
   */
  async runDiagnostics(): Promise<{
    basicFetch: any;
    supabaseConnection: any;
    fullstoryCheck: any;
    summary: string;
  }> {
    console.log('🏥 Running comprehensive fetch diagnostics...');
    
    const basicFetch = await this.testBasicFetch();
    const supabaseConnection = await this.testSupabaseConnection();
    const fullstoryCheck = this.checkFullStoryInterference();
    
    // Generate summary
    let summary = '🏥 Fetch Diagnostics Results:\n';
    summary += `  • Basic Fetch: ${basicFetch.success ? '✅ Working' : '❌ Failed'}\n`;
    summary += `  • Supabase: ${supabaseConnection.success ? '✅ Working' : '❌ Failed'}\n`;
    summary += `  • FullStory: ${fullstoryCheck.detected ? '⚠️ Interference Detected' : '✅ No Interference'}\n`;
    
    if (!basicFetch.success || !supabaseConnection.success) {
      summary += '\n🛠️ Recommendations:\n';
      
      if (fullstoryCheck.detected) {
        summary += '  • Disable FullStory: localStorage.setItem("disable_fullstory", "true")\n';
        summary += '  • Then refresh the page\n';
      }
      
      summary += '  • Check browser extensions (disable ad blockers)\n';
      summary += '  • Try incognito/private browsing mode\n';
      summary += '  • Check internet connection\n';
    } else {
      summary += '\n✅ All systems appear to be working correctly!';
    }
    
    console.log(summary);
    
    return {
      basicFetch,
      supabaseConnection,
      fullstoryCheck,
      summary
    };
  }
};

// Add to window for easy access in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).fetchTest = fetchTestHelper;
  console.log('🧪 Fetch test helper available: window.fetchTest.runDiagnostics()');
}
