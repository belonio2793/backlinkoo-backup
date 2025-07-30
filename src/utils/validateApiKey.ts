/**
 * API Key Validator and Debugger
 * Checks the provided API key for common issues
 */

const PROVIDED_KEY = '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';

export function validateProvidedApiKey() {
  console.log('🔍 Validating provided OpenAI API key...');
  console.log('🔑 Key preview:', PROVIDED_KEY.substring(0, 30) + '...');
  console.log('📏 Key length:', PROVIDED_KEY.length);
  
  // Check format
  const validations = {
    startsCorrectly: PROVIDED_KEY.startsWith('sk-proj-'),
    hasCorrectLength: PROVIDED_KEY.length >= 100 && PROVIDED_KEY.length <= 200,
    noWhitespace: !PROVIDED_KEY.includes(' ') && !PROVIDED_KEY.includes('\n') && !PROVIDED_KEY.includes('\t'),
    validCharacters: /^[A-Za-z0-9_-]+$/.test(PROVIDED_KEY),
    noLineBreaks: !PROVIDED_KEY.includes('\r') && !PROVIDED_KEY.includes('\n'),
    notEmpty: PROVIDED_KEY.trim().length > 0
  };
  
  console.log('🔍 Validation Results:');
  Object.entries(validations).forEach(([check, passed]) => {
    console.log(`  ${check}: ${passed ? '✅' : '❌'}`);
  });
  
  // Check for common issues
  const issues = [];
  if (!validations.startsCorrectly) issues.push('❌ Must start with "sk-proj-"');
  if (!validations.hasCorrectLength) issues.push('❌ Length should be between 100-200 characters');
  if (!validations.noWhitespace) issues.push('❌ Contains whitespace characters');
  if (!validations.validCharacters) issues.push('❌ Contains invalid characters (only A-Z, a-z, 0-9, _, - allowed)');
  if (!validations.noLineBreaks) issues.push('❌ Contains line breaks');
  if (!validations.notEmpty) issues.push('❌ Key is empty');
  
  if (issues.length > 0) {
    console.log('🚨 Issues found:');
    issues.forEach(issue => console.log(issue));
    return false;
  } else {
    console.log('✅ API key format appears valid');
    return true;
  }
}

export async function testProvidedApiKey() {
  console.log('🧪 Testing provided API key with OpenAI...');

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PROVIDED_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    // Clone the response so we can read it multiple times if needed
    const responseClone = response.clone();

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API key is valid!');
      console.log('📊 Models available:', data.data?.length || 0);
      return { success: true, models: data.data?.length || 0 };
    } else {
      let errorData;
      try {
        // Try to parse as JSON first
        errorData = await response.json();
      } catch (e) {
        // If JSON parsing fails, get text from the cloned response
        try {
          const errorText = await responseClone.text();
          errorData = { message: errorText };
        } catch (textError) {
          errorData = { message: 'Failed to read error response' };
        }
      }

      console.error('❌ API key test failed:');
      console.error('   Status:', response.status);
      console.error('   Error:', errorData.error?.message || errorData.message || 'Unknown error');

      return {
        success: false,
        status: response.status,
        error: errorData.error?.message || errorData.message || 'Unknown error'
      };
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

export async function debugApiKeyIssue() {
  console.log('🔧 Starting API key debug session...');
  
  // 1. Validate format
  const formatValid = validateProvidedApiKey();
  
  // 2. Test with OpenAI
  const testResult = await testProvidedApiKey();
  
  // 3. Check common issues
  if (!testResult.success) {
    console.log('🔍 Checking common issues...');
    
    if (testResult.status === 401) {
      console.log('💡 401 Unauthorized - This usually means:');
      console.log('   • The API key is incorrect or expired');
      console.log('   • The API key was revoked');
      console.log('   • The API key is for a different OpenAI account');
      console.log('   • The API key has no remaining credits');
    }
    
    if (testResult.status === 429) {
      console.log('💡 429 Rate Limited - This means:');
      console.log('   • Too many requests to OpenAI');
      console.log('   • Account has exceeded usage limits');
    }
    
    if (testResult.status === 403) {
      console.log('💡 403 Forbidden - This means:');
      console.log('   • API key lacks necessary permissions');
      console.log('   • Account may need billing setup');
    }
  }
  
  return { formatValid, testResult };
}

// Auto-run debug when imported
if (typeof window !== 'undefined') {
  setTimeout(() => {
    debugApiKeyIssue().then(({ formatValid, testResult }) => {
      if (formatValid && testResult.success) {
        console.log('🎉 API key is working correctly!');
      } else {
        console.log('⚠️ API key has issues - see debug output above');
      }
    });
  }, 1000);
}
