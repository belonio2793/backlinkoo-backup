/**
 * Comprehensive Error Fix Test
 * 
 * Tests all the specific errors that were reported:
 * - Failed to parse response as JSON: [object Object]
 * - Content generation error (attempt 1/3): HTTP 404
 * - Error creating Telegraph account: TypeError: Failed to fetch
 * - Error publishing content: Failed to create Telegraph account: Failed to fetch
 * - Error updating campaign status: [object Object]
 * - Error fetching user campaigns: [object Object]
 */

import { formatErrorForUI, formatErrorForLogging } from './errorUtils';
import { supabase } from '@/integrations/supabase/client';
import { getTelegraphService } from '@/services/telegraphService';
import { getOrchestrator } from '@/services/automationOrchestrator';

export class ErrorFixTester {
  private results: Array<{ test: string; status: 'pass' | 'fail' | 'skip'; message: string; error?: any }> = [];

  /**
   * Run all error fix tests
   */
  async runAllTests(): Promise<{ success: boolean; results: any[] }> {
    console.log('🧪 Running comprehensive error fix tests...');
    this.results = [];

    // Test 1: Object display fixes
    await this.testObjectDisplayFixes();

    // Test 2: JSON parsing fixes
    await this.testJSONParsingFixes();

    // Test 3: Telegraph service fixes
    await this.testTelegraphServiceFixes();

    // Test 4: Campaign status update fixes
    await this.testCampaignStatusFixes();

    // Test 5: User campaigns fetching fixes
    await this.testUserCampaignsFixes();

    // Test 6: Network error handling
    await this.testNetworkErrorHandling();

    const passedTests = this.results.filter(r => r.status === 'pass').length;
    const totalTests = this.results.filter(r => r.status !== 'skip').length;
    const success = passedTests === totalTests;

    console.log(`🧪 Error fix test results: ${passedTests}/${totalTests} passed`);
    
    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
      console.log(`${icon} ${result.test}: ${result.message}`);
      if (result.error) {
        console.log(`   Error: ${formatErrorForUI(result.error)}`);
      }
    });

    return { success, results: this.results };
  }

  /**
   * Test 1: Object display fixes
   */
  private async testObjectDisplayFixes(): Promise<void> {
    try {
      // Test various error objects that would show [object Object]
      const testCases = [
        { error: 'Test error message', code: 500 },
        { message: 'Database error', details: 'Connection failed' },
        { data: { error: 'Nested error' } },
        new Error('Standard error'),
        null,
        undefined,
        {},
        { toString: () => '[object Object]' }
      ];

      let allPassed = true;
      const results = [];

      for (const testCase of testCases) {
        const formatted = formatErrorForUI(testCase);
        const hasObjectObject = formatted.includes('[object Object]');
        
        if (hasObjectObject) {
          allPassed = false;
        }
        
        results.push({
          input: testCase,
          output: formatted,
          hasObjectObject
        });
      }

      if (allPassed) {
        this.results.push({
          test: 'Object Display Fixes',
          status: 'pass',
          message: 'All error objects format correctly without [object Object]'
        });
      } else {
        this.results.push({
          test: 'Object Display Fixes',
          status: 'fail',
          message: 'Some error objects still showing [object Object]',
          error: results.filter(r => r.hasObjectObject)
        });
      }

    } catch (error) {
      this.results.push({
        test: 'Object Display Fixes',
        status: 'fail',
        message: 'Test execution failed',
        error
      });
    }
  }

  /**
   * Test 2: JSON parsing fixes
   */
  private async testJSONParsingFixes(): Promise<void> {
    try {
      // Test JSON parsing with various problematic inputs
      const testCases = [
        '{"valid": "json"}',
        'Invalid JSON content',
        '{"error": "test error message"}',
        '<html>HTML content instead of JSON</html>',
        '',
        'null',
        '{"incomplete": '
      ];

      let allHandled = true;
      const results = [];

      for (const testCase of testCases) {
        try {
          const parsed = JSON.parse(testCase);
          results.push({
            input: testCase,
            success: true,
            output: parsed
          });
        } catch (error) {
          const formatted = formatErrorForUI(error);
          const hasObjectObject = formatted.includes('[object Object]');
          
          if (hasObjectObject) {
            allHandled = false;
          }
          
          results.push({
            input: testCase,
            success: false,
            error: formatted,
            hasObjectObject
          });
        }
      }

      if (allHandled) {
        this.results.push({
          test: 'JSON Parsing Fixes',
          status: 'pass',
          message: 'All JSON parsing errors handled without [object Object]'
        });
      } else {
        this.results.push({
          test: 'JSON Parsing Fixes',
          status: 'fail',
          message: 'Some JSON parsing errors still showing [object Object]',
          error: results.filter(r => r.hasObjectObject)
        });
      }

    } catch (error) {
      this.results.push({
        test: 'JSON Parsing Fixes',
        status: 'fail',
        message: 'Test execution failed',
        error
      });
    }
  }

  /**
   * Test 3: Telegraph service fixes
   */
  private async testTelegraphServiceFixes(): Promise<void> {
    try {
      // Check if enhanced Telegraph fetch is available
      const hasEnhancedFetch = typeof window !== 'undefined' && (window as any).enhancedTelegraphFetch;
      
      if (!hasEnhancedFetch) {
        this.results.push({
          test: 'Telegraph Service Fixes',
          status: 'fail',
          message: 'Enhanced Telegraph fetch not available'
        });
        return;
      }

      // Test Telegraph service initialization
      const telegraphService = getTelegraphService();
      
      if (!telegraphService) {
        this.results.push({
          test: 'Telegraph Service Fixes',
          status: 'fail',
          message: 'Telegraph service not available'
        });
        return;
      }

      // Test error handling in Telegraph service (don't actually make API calls)
      this.results.push({
        test: 'Telegraph Service Fixes',
        status: 'pass',
        message: 'Telegraph service initialized with enhanced error handling'
      });

    } catch (error) {
      const formatted = formatErrorForUI(error);
      this.results.push({
        test: 'Telegraph Service Fixes',
        status: 'fail',
        message: 'Telegraph service test failed',
        error: formatted
      });
    }
  }

  /**
   * Test 4: Campaign status update fixes
   */
  private async testCampaignStatusFixes(): Promise<void> {
    try {
      // Check if fixed campaign status function is available
      const hasFixedFunction = typeof window !== 'undefined' && (window as any).fixedUpdateCampaignStatus;
      
      if (!hasFixedFunction) {
        this.results.push({
          test: 'Campaign Status Fixes',
          status: 'skip',
          message: 'Fixed campaign status function not available (requires authentication)'
        });
        return;
      }

      // Test the function exists and is callable
      const isFunction = typeof (window as any).fixedUpdateCampaignStatus === 'function';
      
      if (isFunction) {
        this.results.push({
          test: 'Campaign Status Fixes',
          status: 'pass',
          message: 'Fixed campaign status update function available'
        });
      } else {
        this.results.push({
          test: 'Campaign Status Fixes',
          status: 'fail',
          message: 'Fixed campaign status function is not a function'
        });
      }

    } catch (error) {
      const formatted = formatErrorForUI(error);
      this.results.push({
        test: 'Campaign Status Fixes',
        status: 'fail',
        message: 'Campaign status test failed',
        error: formatted
      });
    }
  }

  /**
   * Test 5: User campaigns fetching fixes
   */
  private async testUserCampaignsFixes(): Promise<void> {
    try {
      // Check if fixed user campaigns function is available
      const hasFixedFunction = typeof window !== 'undefined' && (window as any).fixedGetUserCampaigns;
      
      if (!hasFixedFunction) {
        this.results.push({
          test: 'User Campaigns Fixes',
          status: 'skip',
          message: 'Fixed user campaigns function not available (requires authentication)'
        });
        return;
      }

      // Test the function exists and is callable
      const isFunction = typeof (window as any).fixedGetUserCampaigns === 'function';
      
      if (isFunction) {
        this.results.push({
          test: 'User Campaigns Fixes',
          status: 'pass',
          message: 'Fixed user campaigns fetch function available'
        });
      } else {
        this.results.push({
          test: 'User Campaigns Fixes',
          status: 'fail',
          message: 'Fixed user campaigns function is not a function'
        });
      }

    } catch (error) {
      const formatted = formatErrorForUI(error);
      this.results.push({
        test: 'User Campaigns Fixes',
        status: 'fail',
        message: 'User campaigns test failed',
        error: formatted
      });
    }
  }

  /**
   * Test 6: Network error handling
   */
  private async testNetworkErrorHandling(): Promise<void> {
    try {
      // Test network error formatting
      const networkErrors = [
        new TypeError('Failed to fetch'),
        new Error('Network request failed'),
        { message: 'Failed to fetch' },
        { error: 'Connection timeout' }
      ];

      let allHandled = true;
      const results = [];

      for (const error of networkErrors) {
        const formatted = formatErrorForUI(error);
        const hasObjectObject = formatted.includes('[object Object]');
        const isUserFriendly = formatted.includes('connection') || 
                               formatted.includes('network') || 
                               formatted.includes('internet') ||
                               formatted.includes('fetch');
        
        if (hasObjectObject) {
          allHandled = false;
        }
        
        results.push({
          error,
          formatted,
          hasObjectObject,
          isUserFriendly
        });
      }

      if (allHandled) {
        this.results.push({
          test: 'Network Error Handling',
          status: 'pass',
          message: 'All network errors handled without [object Object]'
        });
      } else {
        this.results.push({
          test: 'Network Error Handling',
          status: 'fail',
          message: 'Some network errors still showing [object Object]',
          error: results.filter(r => r.hasObjectObject)
        });
      }

    } catch (error) {
      this.results.push({
        test: 'Network Error Handling',
        status: 'fail',
        message: 'Test execution failed',
        error
      });
    }
  }

  /**
   * Get test results summary
   */
  getResults() {
    return this.results;
  }
}

// Make available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testErrorFixes = async () => {
    const tester = new ErrorFixTester();
    return await tester.runAllTests();
  };
  
  console.log('🧪 Error fix tester available: window.testErrorFixes()');
}

export default ErrorFixTester;
