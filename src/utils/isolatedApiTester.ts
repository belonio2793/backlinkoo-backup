/**
 * Isolated API Key Tester - Completely separate from other API calls
 * Designed to avoid any race conditions or concurrent response reading
 */

export interface TestResult {
  success: boolean;
  message: string;
  status?: number;
  responseTime?: number;
  details?: any;
}

export async function testOpenAIKeyIsolated(apiKey: string): Promise<TestResult> {
  const startTime = Date.now();
  
  // Basic validation first
  if (!apiKey || typeof apiKey !== 'string') {
    return {
      success: false,
      message: 'API key is required and must be a string'
    };
  }

  if (!apiKey.startsWith('sk-')) {
    return {
      success: false,
      message: 'OpenAI API key must start with "sk-"'
    };
  }

  if (apiKey.length < 40) {
    return {
      success: false,
      message: 'API key appears to be too short'
    };
  }

  console.log('🧪 Testing OpenAI API key (isolated):', apiKey.substring(0, 15) + '...');
  
  try {
    // Create a completely fresh fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TestApp/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    console.log('📡 Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Create a new response reader to ensure clean read
    const responseReader = response.body?.getReader();
    let responseText = '';
    
    if (responseReader) {
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { done: readerDone, value } = await responseReader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }
      
      // Combine chunks into text
      const decoder = new TextDecoder();
      responseText = decoder.decode(new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], [] as number[])));
    } else {
      // Fallback: try to read as text (but this might cause the error)
      try {
        responseText = await response.text();
      } catch (readError) {
        console.error('Error reading response text:', readError);
        responseText = 'Failed to read response body';
      }
    }

    console.log('📝 Response text:', responseText.substring(0, 200) + '...');

    let responseData = null;
    if (responseText) {
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.log('Response is not JSON, using as text');
      }
    }

    if (response.ok) {
      console.log('✅ OpenAI API key test successful!');
      
      return {
        success: true,
        message: `API key is valid! ${responseData?.data?.length || 0} models available.`,
        responseTime,
        details: {
          modelsCount: responseData?.data?.length || 0,
          status: response.status,
          keyPreview: apiKey.substring(0, 15) + '...'
        }
      };
    } else {
      const errorMessage = responseData?.error?.message || 
                          responseData?.message || 
                          responseText || 
                          `HTTP ${response.status}`;

      const errorTypes = {
        401: 'Invalid API key or authentication failed',
        403: 'Forbidden - insufficient permissions',
        429: 'Rate limit exceeded',
        500: 'OpenAI server error',
        502: 'Bad gateway',
        503: 'Service unavailable'
      };

      const errorType = errorTypes[response.status as keyof typeof errorTypes] || 'API error';

      console.error('❌ OpenAI API test failed:', {
        status: response.status,
        statusText: response.statusText,
        errorMessage
      });

      return {
        success: false,
        message: `${errorType}: ${errorMessage}`,
        status: response.status,
        responseTime,
        details: responseData
      };
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('❌ API test timed out');
        return {
          success: false,
          message: 'Test timed out after 10 seconds',
          responseTime
        };
      }
      
      console.error('❌ Network error testing OpenAI API:', error.message);
      return {
        success: false,
        message: `Network error: ${error.message}`,
        responseTime
      };
    }

    console.error('❌ Unknown error testing OpenAI API:', error);
    return {
      success: false,
      message: 'Unknown error occurred during API test',
      responseTime
    };
  }
}

export async function validateAndTestApiKey(apiKey: string): Promise<TestResult> {
  console.log('🔍 Starting isolated API key validation and test...');
  
  // Remove any whitespace
  const cleanApiKey = apiKey.trim();
  
  if (!cleanApiKey) {
    return {
      success: false,
      message: 'API key is empty or contains only whitespace'
    };
  }

  // Run the isolated test
  return await testOpenAIKeyIsolated(cleanApiKey);
}
