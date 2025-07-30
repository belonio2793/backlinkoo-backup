import { environmentVariablesService } from '@/services/environmentVariablesService';

export async function debugApiKey() {
  console.log('🔍 Starting comprehensive API key debug...');
  
  try {
    // Get API key from all possible sources
    const sources = {
      supabase: await environmentVariablesService.getVariable('VITE_OPENAI_API_KEY'),
      env: import.meta.env.VITE_OPENAI_API_KEY,
      localStorage: (() => {
        try {
          const stored = localStorage.getItem('admin_env_vars');
          if (stored) {
            const parsed = JSON.parse(stored);
            const found = parsed.find((v: any) => v.key === 'VITE_OPENAI_API_KEY');
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

    // Test API key with detailed error handling
    console.log('🧪 Testing API key with OpenAI...');
    
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'BacklinkooApp/1.0'
        }
      });

      console.log('📡 Response Status:', response.status);
      console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API key is valid!');
        console.log('📊 Available models:', data.data?.length || 0);
        return { 
          success: true, 
          apiKey: apiKey.substring(0, 20) + '...', 
          modelsCount: data.data?.length || 0 
        };
      } else {
        // Get detailed error information
        let errorText;
        try {
          const errorData = await response.json();
          errorText = errorData.error?.message || 'Unknown error';
          console.log('❌ OpenAI Error Response:', errorData);
        } catch (e) {
          errorText = await response.text();
          console.log('❌ OpenAI Error Text:', errorText);
        }

        const errors = {
          401: 'Invalid API key or insufficient permissions',
          403: 'Forbidden - API key may not have required permissions',  
          429: 'Rate limit exceeded',
          500: 'OpenAI server error'
        };

        const errorMessage = errors[response.status as keyof typeof errors] || `HTTP ${response.status}`;
        console.error(`❌ ${errorMessage}: ${errorText}`);
        
        return { 
          success: false, 
          error: `${errorMessage}: ${errorText}`,
          status: response.status
        };
      }
    } catch (networkError) {
      console.error('❌ Network error:', networkError);
      return { 
        success: false, 
        error: `Network error: ${networkError instanceof Error ? networkError.message : 'Unknown error'}`
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
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Specific API key test successful!');
      return { success: true, modelsCount: data.data?.length || 0 };
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Specific API key test failed:', response.status, errorData);
      return { success: false, status: response.status, error: errorData };
    }
  } catch (error) {
    console.error('❌ Network error testing specific key:', error);
    return { success: false, error: 'Network error' };
  }
}
