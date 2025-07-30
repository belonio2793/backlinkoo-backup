/**
 * Netlify Function Diagnostic Utility
 * Helps debug 404 and other issues with Netlify functions
 */

export interface FunctionTestResult {
  functionName: string;
  available: boolean;
  status: number;
  error?: string;
  response?: any;
}

export class NetlifyFunctionDiagnostic {
  /**
   * Test if a specific Netlify function is available
   */
  static async testFunction(functionName: string, testPayload?: any): Promise<FunctionTestResult> {
    try {
      console.log(`🧪 Testing Netlify function: ${functionName}`);
      
      const response = await fetch(`/.netlify/functions/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload || { test: true })
      });
      
      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }
      
      return {
        functionName,
        available: response.status !== 404,
        status: response.status,
        response: responseData
      };
    } catch (error: any) {
      return {
        functionName,
        available: false,
        status: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Test all OpenAI-related Netlify functions
   */
  static async testOpenAIFunctions(): Promise<FunctionTestResult[]> {
    const functions = [
      'generate-openai',
      'generate-ai-content', 
      'generate-post',
      'api-status'
    ];
    
    console.log('🔍 Testing OpenAI-related Netlify functions...');
    
    const results = await Promise.all(
      functions.map(functionName => this.testFunction(functionName, {
        keyword: 'test',
        url: 'https://example.com',
        anchorText: 'test link'
      }))
    );
    
    const summary = {
      total: results.length,
      available: results.filter(r => r.available).length,
      unavailable: results.filter(r => !r.available).length
    };
    
    console.log('📊 Function availability summary:', summary);
    
    return results;
  }
  
  /**
   * Check if we're in a development environment where functions might not be available
   */
  static isDevelopmentEnvironment(): boolean {
    return window.location.hostname === 'localhost' || 
           window.location.hostname.includes('127.0.0.1') ||
           window.location.hostname.includes('.dev') ||
           window.location.hostname.includes('.local');
  }
  
  /**
   * Get function deployment status and recommendations
   */
  static async getDiagnosticReport(): Promise<{
    environment: string;
    recommendations: string[];
    functionTests: FunctionTestResult[];
  }> {
    const isDev = this.isDevelopmentEnvironment();
    const functionTests = await this.testOpenAIFunctions();
    const availableFunctions = functionTests.filter(f => f.available);
    
    const recommendations: string[] = [];
    
    if (isDev) {
      recommendations.push('Development environment detected - Netlify functions may not be available locally');
      recommendations.push('Consider using direct API fallbacks or testing in production environment');
    }
    
    if (availableFunctions.length === 0) {
      recommendations.push('No Netlify functions are responding - check deployment status');
      recommendations.push('Verify functions are properly deployed and environment variables are set');
      recommendations.push('Using fallback content generation for now');
    } else if (availableFunctions.length < functionTests.length) {
      recommendations.push(`Only ${availableFunctions.length}/${functionTests.length} functions available`);
      recommendations.push('Some functions may need redeployment or configuration');
    } else {
      recommendations.push('All functions appear to be working correctly');
    }
    
    return {
      environment: isDev ? 'development' : 'production',
      recommendations,
      functionTests
    };
  }
}

// Make available in browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).netlifyDiagnostic = NetlifyFunctionDiagnostic;
  console.log('🧪 Netlify function diagnostic available via window.netlifyDiagnostic');
}
