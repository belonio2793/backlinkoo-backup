/**
 * Test Netlify Function Directly
 * Helps debug what's actually happening with the add-domain-to-netlify function
 */

import { safeJsonParse, formatErrorSafely } from './safeJsonParse';

export async function testNetlifyDomainFunction(domain: string = 'test.example.com') {
  console.log('🧪 Testing Netlify domain function directly...');
  
  try {
    console.log(`📞 Calling function with domain: ${domain}`);
    
    const response = await fetch('/.netlify/functions/add-domain-to-netlify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: domain,
        domainId: 'test-domain-id'
      })
    });

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    // Try to get response as text first
    let responseText;
    try {
      responseText = await response.text();
      console.log(`📋 Raw response text (${responseText?.length || 0} chars):`, responseText?.substring(0, 200) + (responseText?.length > 200 ? '...' : ''));
    } catch (textError) {
      console.error('❌ Could not read response as text:', textError);
      return {
        error: 'Could not read response',
        status: response.status,
        statusText: response.statusText
      };
    }

    // Validate response text before parsing
    if (!responseText || responseText.trim() === '') {
      console.error('❌ Empty response received');
      return {
        error: 'Empty response received',
        status: response.status,
        statusText: response.statusText
      };
    }

    // Try to parse as JSON with better error handling
    let jsonResult;
    try {
      // Check if response looks like JSON
      const trimmedResponse = responseText.trim();
      if (!trimmedResponse.startsWith('{') && !trimmedResponse.startsWith('[')) {
        console.error('❌ Response does not appear to be JSON:', trimmedResponse.substring(0, 100));
        return {
          error: 'Response is not JSON format',
          rawResponse: responseText,
          status: response.status,
          statusText: response.statusText
        };
      }

      jsonResult = JSON.parse(responseText);
      console.log(`📋 Parsed JSON result:`, jsonResult);
    } catch (jsonError) {
      console.error('❌ Could not parse response as JSON:', jsonError);
      console.error('❌ Response content type:', response.headers.get('content-type'));
      return {
        error: 'Invalid JSON response',
        rawResponse: responseText,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        parseError: jsonError instanceof Error ? jsonError.message : String(jsonError)
      };
    }

    // Check if response is successful
    if (!response.ok) {
      console.error('❌ HTTP error response');
      return {
        error: 'HTTP error',
        status: response.status,
        statusText: response.statusText,
        details: jsonResult,
        rawResponse: responseText
      };
    }

    // Check function result
    if (jsonResult.success) {
      console.log('✅ Function returned success');
      return {
        success: true,
        result: jsonResult
      };
    } else {
      console.error('❌ Function returned error:', jsonResult);
      return {
        error: 'Function error',
        details: jsonResult,
        specificError: jsonResult.error || jsonResult.message || 'Unknown function error'
      };
    }

  } catch (error: any) {
    console.error('❌ Test function error:', error);
    return {
      error: 'Network or execution error',
      message: error.message,
      stack: error.stack
    };
  }
}

// Auto-run test in development (disabled to prevent initialization errors)
if (import.meta.env.DEV && false) { // Disabled to prevent errors during page load
  // Run test after a short delay to avoid blocking initial load
  setTimeout(() => {
    console.log('🚀 Auto-running Netlify function test...');
    testNetlifyDomainFunction('test-diagnostic.example.com')
      .then(result => {
        console.log('🧪 Test result:', result);
        if (result.error) {
          console.error('🚨 Netlify function test failed:', result.error);
        } else {
          console.log('✅ Netlify function test passed');
        }
      })
      .catch(error => {
        console.error('💥 Test execution failed:', error);
      });
  }, 3000);
}

export default testNetlifyDomainFunction;
