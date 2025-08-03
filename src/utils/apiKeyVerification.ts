/**
 * API Key Verification Utility
 * Ensures proper environment variable configuration for Netlify functions
 */

interface ApiKeyStatus {
  configured: boolean;
  source: string;
  masked?: string;
  error?: string;
}

export class ApiKeyVerification {
  /**
   * Verify OpenAI API key configuration via Netlify function
   */
  static async verifyOpenAIKey(): Promise<ApiKeyStatus> {
    try {
      console.log('🔑 Verifying OpenAI API key configuration...');
      
      // Test API key configuration by calling the status endpoint
      const response = await fetch('/.netlify/functions/openai-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.configured) {
          return {
            configured: true,
            source: 'Netlify Environment Variables',
            masked: data.keyMask || 'sk-***...***'
          };
        } else {
          return {
            configured: false,
            source: 'Netlify Environment Variables',
            error: data.error || 'API key not found in environment'
          };
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error('❌ API key verification failed:', error);
      
      return {
        configured: false,
        source: 'Verification Failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test content generation to verify API functionality
   */
  static async testContentGeneration(): Promise<{
    success: boolean;
    contentLength?: number;
    generationTime?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      console.log('🧪 Testing content generation...');
      
      const response = await fetch('/.netlify/functions/generate-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keyword: 'API testing',
          url: 'https://example.com',
          anchorText: 'test link',
          wordCount: 100,
          contentType: 'how-to',
          tone: 'professional'
        })
      });

      const generationTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.content) {
          return {
            success: true,
            contentLength: data.content.length,
            generationTime
          };
        } else {
          return {
            success: false,
            error: data.error || 'No content generated',
            generationTime
          };
        }
      } else {
        const errorData = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorData}`,
          generationTime
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        generationTime: Date.now() - startTime
      };
    }
  }

  /**
   * Comprehensive system health check
   */
  static async performHealthCheck(): Promise<{
    apiKey: ApiKeyStatus;
    contentGeneration: any;
    overall: 'healthy' | 'degraded' | 'failed';
  }> {
    console.log('🏥 Performing comprehensive system health check...');
    
    const [apiKeyStatus, generationTest] = await Promise.all([
      this.verifyOpenAIKey(),
      this.testContentGeneration()
    ]);

    let overall: 'healthy' | 'degraded' | 'failed' = 'failed';
    
    if (apiKeyStatus.configured && generationTest.success) {
      overall = 'healthy';
    } else if (apiKeyStatus.configured || generationTest.success) {
      overall = 'degraded';
    }

    console.log(`📊 System health: ${overall.toUpperCase()}`);
    console.log(`🔑 API Key: ${apiKeyStatus.configured ? 'CONFIGURED' : 'MISSING'}`);
    console.log(`🤖 Content Generation: ${generationTest.success ? 'WORKING' : 'FAILED'}`);

    return {
      apiKey: apiKeyStatus,
      contentGeneration: generationTest,
      overall
    };
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).ApiKeyVerification = ApiKeyVerification;
}
