import { environmentVariablesService } from '@/services/environmentVariablesService';
import { APIKeyTester } from './apiKeyTester';

export async function debugApiKey() {
  console.log('🔍 Starting comprehensive API key debug...');
  
  try {
    // Get API key from all possible sources
    const sources = {
      supabase: await environmentVariablesService.getVariable('OPENAI_API_KEY'),
      env: import.meta.env.OPENAI_API_KEY,
      localStorage: (() => {
        try {
          const stored = localStorage.getItem('admin_env_vars');
          if (stored) {
            const parsed = JSON.parse(stored);
            const found = parsed.find((v: any) => v.key === 'OPENAI_API_KEY');
            return found?.value;
          }
        } catch (e) {}
        return null;
      })()
    };

    console.log('📋 API Key Sources Found:');
    Object.entries(sources).forEach(([source, key]) => {
      if (key) {
        console.log(`  ${source}: ${key.substring(0, 20)}... (length: ${key.length})`);
      } else {
        console.log(`  ${source}: ❌ Not found`);
      }
    });

    // Use the first available key
    const apiKey = sources.supabase || sources.env || sources.localStorage;
    
    if (!apiKey) {
      console.error('❌ No API key found in any source!');
      return { success: false, error: 'No API key found' };
    }

    console.log('🔑 Using API key:', apiKey.substring(0, 20) + '...');

    // Validate API key format
    const validations = {
      startsWithSk: apiKey.startsWith('sk-'),
      hasProj: apiKey.includes('proj-'),
      correctLength: apiKey.length > 100,
      noSpaces: !apiKey.includes(' '),
      noNewlines: !apiKey.includes('\n'),
      validChars: /^[A-Za-z0-9_-]+$/.test(apiKey)
    };

    console.log('🔍 API Key Validation:');
    Object.entries(validations).forEach(([check, passed]) => {
      console.log(`  ${check}: ${passed ? '✅' : '❌'}`);
    });

    if (!validations.startsWithSk) {
      console.error('❌ API key must start with "sk-"');
      return { success: false, error: 'Invalid API key format' };
    }

    // Validate API key format first
    const formatValidation = APIKeyTester.validateAPIKeyFormat(apiKey, 'openai');
    if (!formatValidation.isValid) {
      console.error('❌ API key format invalid:', formatValidation.message);
      return {
        success: false,
        error: `Invalid API key format: ${formatValidation.message}`
      };
    }

    // Test API key with robust error handling
    console.log('🧪 Testing API key with OpenAI...');
    const testResult = await APIKeyTester.testOpenAI(apiKey);

    if (testResult.success) {
      return {
        success: true,
        apiKey: apiKey.substring(0, 20) + '...',
        modelsCount: testResult.details?.modelsCount || 0,
        responseTime: testResult.responseTime
      };
    } else {
      return {
        success: false,
        error: testResult.message,
        status: testResult.status,
        responseTime: testResult.responseTime
      };
    }
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return { 
      success: false, 
      error: `Debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Test a specific API key directly
export async function testSpecificApiKey(testKey: string) {
  console.log('🧪 Testing specific API key:', testKey.substring(0, 20) + '...');

  // Validate format first
  const formatValidation = APIKeyTester.validateAPIKeyFormat(testKey, 'openai');
  if (!formatValidation.isValid) {
    console.error('❌ API key format invalid:', formatValidation.message);
    return {
      success: false,
      error: `Invalid format: ${formatValidation.message}`
    };
  }

  // Test with robust error handling
  const testResult = await APIKeyTester.testOpenAI(testKey);

  if (testResult.success) {
    console.log('✅ Specific API key test successful!');
    return {
      success: true,
      modelsCount: testResult.details?.modelsCount || 0,
      responseTime: testResult.responseTime
    };
  } else {
    console.error('❌ Specific API key test failed:', testResult.message);
    return {
      success: false,
      status: testResult.status,
      error: testResult.message,
      responseTime: testResult.responseTime
    };
  }
}
