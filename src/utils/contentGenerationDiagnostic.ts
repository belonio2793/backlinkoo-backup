/**
 * Content Generation Diagnostic Utility
 * Tests and fixes content generation function availability
 */

export interface ContentFunctionDiagnostic {
  function: string;
  available: boolean;
  status: number;
  response?: any;
  error?: string;
  latency?: number;
}

export class ContentGenerationDiagnostic {
  
  private static readonly CONTENT_FUNCTIONS = [
    'generate-content',
    'ai-content-generator', 
    'generate-openai',
    'generate-fallback',
    'simple-ai-generator'
  ];

  /**
   * Test all content generation functions to find working ones
   */
  static async testAllContentFunctions(): Promise<ContentFunctionDiagnostic[]> {
    console.log('🔍 Testing all content generation functions...');
    
    const results: ContentFunctionDiagnostic[] = [];
    
    for (const functionName of this.CONTENT_FUNCTIONS) {
      const result = await this.testContentFunction(functionName);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Test a specific content generation function
   */
  static async testContentFunction(functionName: string): Promise<ContentFunctionDiagnostic> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Testing /.netlify/functions/${functionName}`);
      
      const response = await fetch(`/.netlify/functions/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: 'test keyword',
          anchor_text: 'test link',
          target_url: 'https://example.com',
          word_count: 300,
          tone: 'professional',
          user_id: 'diagnostic-test'
        }),
      });

      const latency = Date.now() - startTime;
      
      if (response.status === 404) {
        return {
          function: functionName,
          available: false,
          status: 404,
          error: 'Function not found (404)',
          latency
        };
      }

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = { error: 'Invalid JSON response' };
      }

      return {
        function: functionName,
        available: response.ok,
        status: response.status,
        response: responseData,
        error: response.ok ? undefined : (responseData.error || `HTTP ${response.status}`),
        latency
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        function: functionName,
        available: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Network error',
        latency
      };
    }
  }

  /**
   * Find the best working content generation function
   */
  static async findWorkingContentFunction(): Promise<string | null> {
    const results = await this.testAllContentFunctions();
    
    // Find first working function
    const working = results.find(r => r.available && r.status === 200);
    
    if (working) {
      console.log(`✅ Found working content function: ${working.function}`);
      return working.function;
    }

    console.log('❌ No working content generation functions found');
    return null;
  }

  /**
   * Create a comprehensive diagnostic report
   */
  static async generateDiagnosticReport(): Promise<string> {
    const results = await this.testAllContentFunctions();
    
    let report = '📋 Content Generation Function Diagnostic Report\n\n';
    
    const working = results.filter(r => r.available);
    const failing = results.filter(r => !r.available);
    
    report += `✅ Working Functions: ${working.length}\n`;
    report += `❌ Failing Functions: ${failing.length}\n\n`;
    
    if (working.length > 0) {
      report += '🟢 WORKING FUNCTIONS:\n';
      working.forEach(r => {
        report += `  • ${r.function} (${r.latency}ms) - Status: ${r.status}\n`;
      });
      report += '\n';
    }
    
    if (failing.length > 0) {
      report += '🔴 FAILING FUNCTIONS:\n';
      failing.forEach(r => {
        report += `  • ${r.function} - ${r.error} (Status: ${r.status})\n`;
      });
      report += '\n';
    }
    
    if (working.length === 0) {
      report += '💡 SOLUTIONS:\n';
      report += '  1. Check Netlify function deployment status\n';
      report += '  2. Verify OPENAI_API_KEY is set in Netlify environment\n';
      report += '  3. Check function logs in Netlify dashboard\n';
      report += '  4. Try fallback to mock content generation\n';
    } else {
      report += `🎯 RECOMMENDATION: Use "${working[0].function}" as primary content generator\n`;
    }
    
    return report;
  }

  /**
   * Attempt to fix content generation by switching to working function
   */
  static async fixContentGeneration(): Promise<{
    success: boolean;
    workingFunction?: string;
    message: string;
  }> {
    console.log('🔧 Attempting to fix content generation...');
    
    const workingFunction = await this.findWorkingContentFunction();
    
    if (workingFunction) {
      // Store the working function for use by the automation system
      localStorage.setItem('working_content_function', workingFunction);
      
      return {
        success: true,
        workingFunction,
        message: `Fixed: Using ${workingFunction} for content generation`
      };
    }

    return {
      success: false,
      message: 'No working content generation functions found. Check Netlify deployment.'
    };
  }

  /**
   * Get the stored working function or default
   */
  static getWorkingFunction(): string {
    const stored = localStorage.getItem('working_content_function');
    return stored || 'generate-content'; // Default fallback
  }
}

export default ContentGenerationDiagnostic;
