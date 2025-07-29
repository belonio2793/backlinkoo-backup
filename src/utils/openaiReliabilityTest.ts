/**
 * OpenAI Reliability Test Utility
 * Tests the enhanced OpenAI service to ensure 100% reliability
 */

import { enhancedOpenAIService } from '../services/api/enhancedOpenAI';

export interface ReliabilityTestResult {
  overallSuccess: boolean;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  successRate: number;
  averageResponseTime: number;
  serviceHealth: any;
  details: Array<{
    testName: string;
    success: boolean;
    responseTime: number;
    error?: string;
    details?: any;
  }>;
}

export class OpenAIReliabilityTester {
  
  async runCompleteTest(): Promise<ReliabilityTestResult> {
    console.log('🧪 Starting comprehensive OpenAI reliability test...');
    
    const tests = [
      { name: 'Service Configuration', test: () => this.testServiceConfiguration() },
      { name: 'Connection Test', test: () => this.testConnection() },
      { name: 'Content Generation', test: () => this.testContentGeneration() },
      { name: 'Error Recovery', test: () => this.testErrorRecovery() },
      { name: 'Service Health', test: () => this.testServiceHealth() }
    ];

    const results: ReliabilityTestResult['details'] = [];
    let totalResponseTime = 0;

    for (const { name, test } of tests) {
      const startTime = Date.now();
      try {
        console.log(`\n🔍 Running test: ${name}`);
        const result = await test();
        const responseTime = Date.now() - startTime;
        totalResponseTime += responseTime;

        results.push({
          testName: name,
          success: true,
          responseTime,
          details: result
        });

        console.log(`✅ ${name}: PASSED (${responseTime}ms)`);
      } catch (error) {
        const responseTime = Date.now() - startTime;
        totalResponseTime += responseTime;

        results.push({
          testName: name,
          success: false,
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        console.log(`❌ ${name}: FAILED (${responseTime}ms) - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const testsPassed = results.filter(r => r.success).length;
    const testsFailed = results.filter(r => !r.success).length;
    const successRate = (testsPassed / results.length) * 100;
    const averageResponseTime = totalResponseTime / results.length;

    const serviceHealth = enhancedOpenAIService.getServiceHealth();

    const finalResult: ReliabilityTestResult = {
      overallSuccess: testsPassed === results.length,
      testsRun: results.length,
      testsPassed,
      testsFailed,
      successRate,
      averageResponseTime,
      serviceHealth,
      details: results
    };

    console.log('\n📊 Reliability Test Summary:');
    console.log(`Tests Run: ${finalResult.testsRun}`);
    console.log(`Tests Passed: ${finalResult.testsPassed}`);
    console.log(`Tests Failed: ${finalResult.testsFailed}`);
    console.log(`Success Rate: ${finalResult.successRate.toFixed(1)}%`);
    console.log(`Average Response Time: ${finalResult.averageResponseTime.toFixed(0)}ms`);
    console.log(`Service Health: ${serviceHealth.status}`);

    if (finalResult.overallSuccess) {
      console.log('🎉 All tests passed! OpenAI service is fully reliable.');
    } else {
      console.log('⚠️ Some tests failed. Check the details for issues.');
    }

    return finalResult;
  }

  private async testServiceConfiguration(): Promise<any> {
    const isConfigured = enhancedOpenAIService.isConfigured();
    
    if (!isConfigured) {
      throw new Error('Enhanced OpenAI service is not properly configured');
    }

    return {
      configured: true,
      message: 'Service is properly configured with API keys'
    };
  }

  private async testConnection(): Promise<any> {
    const connectionTest = await enhancedOpenAIService.testConnection();
    
    if (!connectionTest.success) {
      throw new Error(`Connection test failed: ${JSON.stringify(connectionTest.details)}`);
    }

    return {
      connected: true,
      details: connectionTest.details
    };
  }

  private async testContentGeneration(): Promise<any> {
    const testPrompt = "Write a brief 100-word explanation of machine learning for beginners.";
    
    const result = await enhancedOpenAIService.generateContent(testPrompt, {
      model: 'gpt-3.5-turbo',
      maxTokens: 200,
      temperature: 0.7
    });

    if (!result.success) {
      throw new Error(`Content generation failed: ${result.error}`);
    }

    if (!result.content || result.content.length < 50) {
      throw new Error('Generated content is too short or empty');
    }

    return {
      contentGenerated: true,
      contentLength: result.content.length,
      tokens: result.usage.tokens,
      cost: result.usage.cost,
      responseTime: result.responseTime,
      provider: result.provider
    };
  }

  private async testErrorRecovery(): Promise<any> {
    // Test with an invalid model to see if error handling works
    const result = await enhancedOpenAIService.generateContent("Test prompt", {
      model: 'gpt-nonexistent-model',
      maxTokens: 100
    });

    // Should fail gracefully with proper error message
    if (result.success) {
      throw new Error('Error recovery test failed - should have failed with invalid model');
    }

    if (!result.error || result.error.length === 0) {
      throw new Error('Error recovery test failed - no error message provided');
    }

    return {
      errorHandled: true,
      errorMessage: result.error,
      gracefulFailure: true
    };
  }

  private async testServiceHealth(): Promise<any> {
    const health = enhancedOpenAIService.getServiceHealth();
    
    if (!health || !health.status) {
      throw new Error('Service health check failed - no health status available');
    }

    return {
      healthStatus: health.status,
      healthDetails: health.details,
      healthy: health.status === 'healthy' || health.status === 'degraded'
    };
  }

  /**
   * Run a quick connection test
   */
  static async quickTest(): Promise<boolean> {
    try {
      const tester = new OpenAIReliabilityTester();
      const connectionResult = await tester.testConnection();
      return connectionResult.connected;
    } catch (error) {
      console.error('Quick test failed:', error);
      return false;
    }
  }

  /**
   * Display service status in a user-friendly format
   */
  static async getServiceStatus(): Promise<{
    status: 'operational' | 'degraded' | 'down';
    message: string;
    details: any;
  }> {
    try {
      const health = enhancedOpenAIService.getServiceHealth();
      const isConfigured = enhancedOpenAIService.isConfigured();

      if (!isConfigured) {
        return {
          status: 'down',
          message: 'OpenAI service is not configured',
          details: { configured: false }
        };
      }

      const connectionTest = await enhancedOpenAIService.testConnection();
      
      if (!connectionTest.success) {
        return {
          status: 'down',
          message: 'OpenAI service is not responding',
          details: connectionTest.details
        };
      }

      let status: 'operational' | 'degraded' | 'down' = 'operational';
      let message = 'OpenAI service is fully operational';

      if (health.status === 'degraded') {
        status = 'degraded';
        message = 'OpenAI service is operational but with reduced performance';
      } else if (health.status === 'unhealthy') {
        status = 'down';
        message = 'OpenAI service is experiencing issues';
      }

      return {
        status,
        message,
        details: {
          health: health.details,
          connection: connectionTest.details
        }
      };

    } catch (error) {
      return {
        status: 'down',
        message: 'Failed to check OpenAI service status',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
}

export const openAIReliabilityTester = new OpenAIReliabilityTester();
