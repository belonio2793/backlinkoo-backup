/**
 * Robust API Key Testing Utility
 * Handles response reading properly to avoid "body stream already read" errors
 */

export interface APITestResult {
  success: boolean;
  message: string;
  status?: number;
  responseTime?: number;
  details?: any;
}

export class APIKeyTester {
  /**
   * Test OpenAI API key
   */
  static async testOpenAI(apiKey: string): Promise<APITestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🧪 Testing OpenAI API key:', apiKey.substring(0, 15) + '...');
      
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const responseTime = Date.now() - startTime;

      // Read response body immediately to avoid "body stream already read" errors
      let responseText = '';
      let responseData = null;

      try {
        responseText = await response.text();
        if (responseText) {
          try {
            responseData = JSON.parse(responseText);
          } catch (parseError) {
            // Response is not JSON, keep as text
          }
        }
      } catch (readError) {
        console.error('Error reading response:', readError);
        responseText = 'Failed to read response';
      }

      if (response.ok) {
        console.log('✅ OpenAI API key is valid!');

        return {
          success: true,
          message: `API key is valid! ${responseData?.data?.length || 0} models available.`,
          responseTime,
          details: {
            modelsCount: responseData?.data?.length || 0,
            keyPreview: apiKey.substring(0, 15) + '...'
          }
        };
      } else {
        // Handle error with already-read response data
        const errorMessage = responseData?.error?.message ||
                            responseData?.message ||
                            responseText ||
                            'API request failed';

        const errorCategories = {
          401: 'Invalid API key or authentication failed',
          403: 'Access forbidden - insufficient permissions',
          429: 'Rate limit exceeded - too many requests',
          500: 'Server error - try again later',
          502: 'Bad gateway - service temporarily unavailable',
          503: 'Service unavailable - try again later'
        };

        const categorizedError = errorCategories[response.status as keyof typeof errorCategories] || 'API request failed';

        console.error('❌ OpenAI API test failed:', response.status, errorMessage);

        return {
          success: false,
          message: `${categorizedError}: ${errorMessage}`,
          status: response.status,
          responseTime,
          details: responseData
        };
      }
    } catch (error) {
      console.error('❌ Network error testing OpenAI API:', error);
      return {
        success: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Test any API endpoint with bearer token
   */
  static async testAPIEndpoint(
    url: string, 
    apiKey: string, 
    serviceName: string = 'API'
  ): Promise<APITestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Testing ${serviceName} endpoint:`, url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        // Try to read as JSON, fallback to text
        let data;
        try {
          data = await response.json();
        } catch (e) {
          data = await response.text();
        }
        
        console.log(`✅ ${serviceName} API key is valid!`);
        
        return {
          success: true,
          message: `${serviceName} API key is valid and responding correctly.`,
          responseTime,
          details: data
        };
      } else {
        return await this.handleErrorResponse(response, responseTime, `${serviceName} API key`);
      }
    } catch (error) {
      console.error(`❌ Network error testing ${serviceName} API:`, error);
      return {
        success: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Handle error responses properly without reading body multiple times
   */
  private static async handleErrorResponse(
    response: Response, 
    responseTime: number, 
    serviceName: string
  ): Promise<APITestResult> {
    let errorMessage = 'Unknown error';
    let errorDetails = null;

    try {
      // Read response body only once
      const responseText = await response.text();
      console.log(`📝 ${serviceName} error response:`, responseText);

      if (responseText) {
        try {
          // Try to parse as JSON
          errorDetails = JSON.parse(responseText);
          errorMessage = errorDetails.error?.message || 
                        errorDetails.message || 
                        errorDetails.detail || 
                        'API request failed';
        } catch (parseError) {
          // If not JSON, use the raw text
          errorMessage = responseText || 'API request failed';
        }
      }
    } catch (readError) {
      console.error('Error reading response:', readError);
      errorMessage = `Failed to read error response: ${response.status}`;
    }

    // Categorize common errors
    const errorCategories = {
      401: 'Invalid API key or authentication failed',
      403: 'Access forbidden - insufficient permissions',
      429: 'Rate limit exceeded - too many requests',
      500: 'Server error - try again later',
      502: 'Bad gateway - service temporarily unavailable',
      503: 'Service unavailable - try again later'
    };

    const categorizedError = errorCategories[response.status as keyof typeof errorCategories] || errorMessage;

    console.error(`❌ ${serviceName} test failed:`, response.status, errorMessage);

    return {
      success: false,
      message: `${categorizedError}: ${errorMessage}`,
      status: response.status,
      responseTime,
      details: errorDetails
    };
  }

  /**
   * Validate API key format
   */
  static validateAPIKeyFormat(apiKey: string, service: 'openai' | 'anthropic' | 'google' | 'stripe' | 'resend'): {
    isValid: boolean;
    message: string;
  } {
    if (!apiKey || typeof apiKey !== 'string') {
      return { isValid: false, message: 'API key is required' };
    }

    const validations = {
      openai: {
        prefix: 'sk-',
        minLength: 40,
        pattern: /^sk-[A-Za-z0-9_-]+$/
      },
      anthropic: {
        prefix: 'sk-ant-',
        minLength: 50,
        pattern: /^sk-ant-[A-Za-z0-9_-]+$/
      },
      google: {
        prefix: 'AIza',
        minLength: 30,
        pattern: /^AIza[A-Za-z0-9_-]+$/
      },
      stripe: {
        prefix: ['pk_', 'sk_'],
        minLength: 20,
        pattern: /^(pk|sk)_(test_|live_)?[A-Za-z0-9]+$/
      },
      resend: {
        prefix: 're_',
        minLength: 20,
        pattern: /^re_[A-Za-z0-9_-]+$/
      }
    };

    const config = validations[service];
    const prefixes = Array.isArray(config.prefix) ? config.prefix : [config.prefix];

    // Check prefix
    const hasValidPrefix = prefixes.some(prefix => apiKey.startsWith(prefix));
    if (!hasValidPrefix) {
      return { 
        isValid: false, 
        message: `API key must start with: ${prefixes.join(' or ')}` 
      };
    }

    // Check length
    if (apiKey.length < config.minLength) {
      return { 
        isValid: false, 
        message: `API key is too short (minimum ${config.minLength} characters)` 
      };
    }

    // Check pattern
    if (!config.pattern.test(apiKey)) {
      return { 
        isValid: false, 
        message: 'API key contains invalid characters' 
      };
    }

    // Check for common issues
    if (apiKey.includes(' ') || apiKey.includes('\n') || apiKey.includes('\t')) {
      return { 
        isValid: false, 
        message: 'API key contains whitespace characters' 
      };
    }

    return { isValid: true, message: 'API key format is valid' };
  }
}
