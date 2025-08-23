/**
 * Netlify Function Diagnostic Utility
 * 
 * Helps debug function deployment and availability issues
 */

export interface FunctionDiagnosticResult {
  functionName: string;
  path: string;
  isAvailable: boolean;
  status: number;
  error?: string;
  responseTime?: number;
}

export class NetlifyFunctionDiagnostic {
  
  /**
   * Test if a specific Netlify function is available
   */
  static async testFunction(functionName: string, testPayload: any = {}): Promise<FunctionDiagnosticResult> {
    const path = `/.netlify/functions/${functionName}`;
    const startTime = Date.now();
    
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        functionName,
        path,
        isAvailable: response.status !== 404,
        status: response.status,
        responseTime
      };
    } catch (error) {
      return {
        functionName,
        path,
        isAvailable: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Test multiple functions and return a comprehensive report
   */
  static async testMultipleFunctions(functions: string[]): Promise<FunctionDiagnosticResult[]> {
    const testPromises = functions.map(functionName => 
      this.testFunction(functionName, { test: true })
    );
    
    return Promise.all(testPromises);
  }

  /**
   * Run comprehensive diagnostic for domain management functions
   */
  static async runDomainManagementDiagnostic(): Promise<{
    summary: {
      totalFunctions: number;
      availableFunctions: number;
      unavailableFunctions: number;
      recommendedAction: string;
    };
    results: FunctionDiagnosticResult[];
  }> {
    console.log('🔍 Running Netlify function diagnostic...');
    
    const domainFunctions = [
      'netlify-domain-validation',
      'add-domain-to-netlify', 
      'verify-netlify-domain',
      'validate-domain',
      'set-domain-theme'
    ];
    
    const results = await this.testMultipleFunctions(domainFunctions);
    
    const availableFunctions = results.filter(r => r.isAvailable).length;
    const unavailableFunctions = results.length - availableFunctions;
    
    let recommendedAction = '';
    if (unavailableFunctions === 0) {
      recommendedAction = 'All functions are available and working correctly.';
    } else if (availableFunctions > 0) {
      recommendedAction = 'Some functions are missing. Using available functions as fallbacks.';
    } else {
      recommendedAction = 'No domain management functions are available. Please deploy Netlify functions.';
    }
    
    const summary = {
      totalFunctions: results.length,
      availableFunctions,
      unavailableFunctions,
      recommendedAction
    };
    
    console.log('📊 Diagnostic summary:', summary);
    console.log('📋 Function details:', results);
    
    return { summary, results };
  }

  /**
   * Get deployment status and recommendations
   */
  static async getDeploymentStatus(): Promise<{
    status: 'healthy' | 'partial' | 'critical';
    message: string;
    availableFunctions: string[];
    missingFunctions: string[];
    recommendations: string[];
  }> {
    const diagnostic = await this.runDomainManagementDiagnostic();
    
    const availableFunctions = diagnostic.results
      .filter(r => r.isAvailable)
      .map(r => r.functionName);
      
    const missingFunctions = diagnostic.results
      .filter(r => !r.isAvailable)
      .map(r => r.functionName);
    
    let status: 'healthy' | 'partial' | 'critical';
    let message: string;
    const recommendations: string[] = [];
    
    if (diagnostic.summary.unavailableFunctions === 0) {
      status = 'healthy';
      message = 'All Netlify functions are deployed and working correctly.';
    } else if (diagnostic.summary.availableFunctions > 0) {
      status = 'partial';
      message = `${diagnostic.summary.availableFunctions} of ${diagnostic.summary.totalFunctions} functions are available.`;
      recommendations.push('Deploy missing functions to enable full functionality');
      recommendations.push('Check Netlify deployment logs for errors');
    } else {
      status = 'critical';
      message = 'No domain management functions are available.';
      recommendations.push('Deploy all Netlify functions immediately');
      recommendations.push('Check Netlify build and deployment settings');
      recommendations.push('Verify netlify.toml configuration');
    }
    
    return {
      status,
      message,
      availableFunctions,
      missingFunctions,
      recommendations
    };
  }

  /**
   * Log diagnostic information to console
   */
  static async logDiagnostic(): Promise<void> {
    const deploymentStatus = await this.getDeploymentStatus();
    
    console.log('🏥 Netlify Function Health Check');
    console.log('================================');
    console.log(`Status: ${deploymentStatus.status.toUpperCase()}`);
    console.log(`Message: ${deploymentStatus.message}`);
    
    if (deploymentStatus.availableFunctions.length > 0) {
      console.log('✅ Available Functions:');
      deploymentStatus.availableFunctions.forEach(fn => {
        console.log(`  - ${fn}`);
      });
    }
    
    if (deploymentStatus.missingFunctions.length > 0) {
      console.log('❌ Missing Functions:');
      deploymentStatus.missingFunctions.forEach(fn => {
        console.log(`  - ${fn}`);
      });
    }
    
    if (deploymentStatus.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      deploymentStatus.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }
  }
}

export default NetlifyFunctionDiagnostic;
