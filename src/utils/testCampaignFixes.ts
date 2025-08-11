/**
 * Test Campaign Error Fixes
 * 
 * Test the fixes for campaign errors and live monitoring
 */

import { formatErrorForUI } from './errorUtils';

export function testCampaignErrorFixes() {
  console.log('🧪 Testing campaign error fixes...');

  // Test various error objects that might cause "[object Object]" displays
  const testErrors = [
    // Database error object
    {
      code: 'PGRST116',
      details: 'Row not found',
      hint: 'Check your query parameters',
      message: 'The result contains 0 rows'
    },
    // Network error
    {
      error: 'Network request failed',
      status: 500,
      statusText: 'Internal Server Error'
    },
    // Campaign-specific error
    {
      campaign_id: 'test-123',
      operation: 'toggle',
      error: 'Campaign toggle failed'
    },
    // Nested error object
    {
      response: {
        data: {
          error: 'API error occurred',
          code: 'CAMPAIGN_ERROR'
        }
      }
    },
    // Undefined/null errors
    null,
    undefined,
    // Object with no useful properties
    {},
    // Object with non-string properties
    {
      someProperty: 123,
      anotherProperty: { nested: 'value' }
    }
  ];

  console.group('🔍 Error Formatting Test Results:');
  
  testErrors.forEach((error, index) => {
    const formatted = formatErrorForUI(error);
    const isValid = formatted && formatted !== '[object Object]' && formatted.length > 0;
    
    console.log(`Test ${index + 1}:`, {
      input: error,
      output: formatted,
      result: isValid ? '✅ PASS' : '❌ FAIL'
    });
  });
  
  console.groupEnd();
  
  console.log('✅ Campaign error formatting test completed');
}

// Test LiveAutomationEngine method availability
export function testLiveAutomationEngine() {
  console.log('🧪 Testing LiveAutomationEngine methods...');
  
  try {
    // Import and check if methods exist
    import('@/services/liveAutomationEngine').then(({ LiveAutomationEngine }) => {
      const methods = [
        'startLiveMonitoring',
        'logActivity',
        'startBlogCommentEngine',
        'startWeb2Engine',
        'startForumEngine',
        'startSocialEngine'
      ];
      
      console.group('🔍 LiveAutomationEngine Method Check:');
      
      methods.forEach(methodName => {
        const exists = typeof LiveAutomationEngine[methodName] === 'function';
        console.log(`${methodName}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
      });
      
      console.groupEnd();
      console.log('✅ LiveAutomationEngine method check completed');
    }).catch(error => {
      console.error('❌ Failed to import LiveAutomationEngine:', formatErrorForUI(error));
    });
  } catch (error) {
    console.error('❌ LiveAutomationEngine test failed:', formatErrorForUI(error));
  }
}

// Add to window for manual testing
if (typeof window !== 'undefined') {
  (window as any).testCampaignErrorFixes = testCampaignErrorFixes;
  (window as any).testLiveAutomationEngine = testLiveAutomationEngine;
  
  // Auto-run tests in development
  if (import.meta.env.DEV) {
    setTimeout(() => {
      testCampaignErrorFixes();
      testLiveAutomationEngine();
    }, 1000);
  }
}

export default { testCampaignErrorFixes, testLiveAutomationEngine };
