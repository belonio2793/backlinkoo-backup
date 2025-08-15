/**
 * Test Working Content Generator Function
 * Verifies that the working-content-generator Netlify function is accessible and working
 */

export interface ContentGeneratorTest {
  success: boolean;
  status: number;
  message: string;
  data?: any;
  error?: string;
  timing?: number;
}

export async function testWorkingContentGenerator(): Promise<ContentGeneratorTest> {
  const startTime = Date.now();
  
  try {
    console.log('🧪 Testing working-content-generator function...');
    
    const testPayload = {
      keyword: 'test automation',
      anchorText: 'automation platform',
      targetUrl: 'https://example.com',
      userId: 'test-user',
      campaignId: 'test-campaign'
    };

    const response = await fetch('/.netlify/functions/working-content-generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const timing = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        status: response.status,
        message: `Function returned ${response.status}: ${response.statusText}`,
        error: errorText,
        timing
      };
    }

    const data = await response.json();

    if (data.success) {
      console.log('✅ working-content-generator test successful:', {
        title: data.data?.title,
        wordCount: data.data?.wordCount,
        timing: `${timing}ms`
      });

      return {
        success: true,
        status: response.status,
        message: `Content generated successfully (${data.data?.wordCount || 'unknown'} words)`,
        data: data.data,
        timing
      };
    } else {
      console.error('❌ working-content-generator returned error:', data.error);
      return {
        success: false,
        status: response.status,
        message: 'Function returned error',
        error: data.error,
        timing
      };
    }

  } catch (error) {
    const timing = Date.now() - startTime;
    console.error('❌ working-content-generator test failed:', error);
    
    return {
      success: false,
      status: 0,
      message: 'Network or parsing error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timing
    };
  }
}

/**
 * Test function accessibility (just check if it responds)
 */
export async function testFunctionAvailability(): Promise<ContentGeneratorTest> {
  try {
    console.log('🔍 Checking working-content-generator availability...');
    
    const response = await fetch('/.netlify/functions/working-content-generator', {
      method: 'OPTIONS'
    });

    return {
      success: response.ok,
      status: response.status,
      message: response.ok ? 'Function is accessible' : `Function not accessible: ${response.status}`,
      error: response.ok ? undefined : `HTTP ${response.status} - ${response.statusText}`
    };

  } catch (error) {
    console.error('❌ Function availability test failed:', error);
    
    return {
      success: false,
      status: 0,
      message: 'Function not accessible',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Run comprehensive test of content generator
 */
export async function runContentGeneratorDiagnostics(): Promise<{
  availability: ContentGeneratorTest;
  functionality: ContentGeneratorTest;
  recommendations: string[];
}> {
  console.log('🚀 Running working-content-generator diagnostics...');
  
  const availability = await testFunctionAvailability();
  const functionality = await testWorkingContentGenerator();
  
  const recommendations: string[] = [];
  
  if (!availability.success) {
    recommendations.push('❌ Function is not accessible - check deployment');
    recommendations.push('🔧 Try redeploying Netlify functions');
  }
  
  if (!functionality.success) {
    if (functionality.status === 404) {
      recommendations.push('❌ Function not found (404) - check function name and deployment');
    } else if (functionality.status === 500) {
      recommendations.push('❌ Server error (500) - check function logs');
      recommendations.push('🔧 Verify environment variables (OPENAI_API_KEY)');
    } else if (functionality.status === 0) {
      recommendations.push('❌ Network error - check internet connection');
    } else {
      recommendations.push(`❌ HTTP ${functionality.status} error - check function configuration`);
    }
  }
  
  if (availability.success && functionality.success) {
    recommendations.push('✅ working-content-generator is working correctly');
  }
  
  console.log('📊 Diagnostics completed:', {
    availability: availability.success ? '✅' : '❌',
    functionality: functionality.success ? '✅' : '❌',
    recommendations: recommendations.length
  });
  
  return {
    availability,
    functionality,
    recommendations
  };
}

// Make available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testWorkingContentGenerator = testWorkingContentGenerator;
  (window as any).testContentGeneratorAvailability = testFunctionAvailability;
  (window as any).runContentGeneratorDiagnostics = runContentGeneratorDiagnostics;
  
  console.log('🔧 Content generator test utilities available:');
  console.log('  - window.testWorkingContentGenerator() - Test content generation');
  console.log('  - window.testContentGeneratorAvailability() - Check function accessibility');
  console.log('  - window.runContentGeneratorDiagnostics() - Full diagnostic test');
}

export default testWorkingContentGenerator;
