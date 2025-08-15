export interface ContentGenerationParams {
  keyword: string;
  anchorText: string;
  targetUrl: string;
}

export interface GeneratedContent {
  type: 'article' | 'blog_post' | 'reader_friendly';
  content: string;
  wordCount: number;
}

export class AutomationContentService {
  
  /**
   * Generate all three types of content for a campaign
   */
  async generateAllContent(params: ContentGenerationParams): Promise<GeneratedContent[]> {
    const { keyword, anchorText, targetUrl } = params;

    // Retry logic
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Generating content for keyword: ${keyword} (attempt ${attempt}/${maxRetries})`);

        // Determine which endpoint to use based on environment and configuration
    const isDevelopment = import.meta.env.DEV;
    const isTestMode = import.meta.env.MODE === 'test';
    const mockMode = localStorage.getItem('automation-mock-mode') === 'true';

    let endpoint: string;
    if (isDevelopment || isTestMode || mockMode) {
      // Use enhanced mock for development, testing, or when explicitly enabled
      endpoint = '/.netlify/functions/enhanced-mock-automation';
    } else {
      // Use real content generation for production
      endpoint = '/.netlify/functions/generate-automation-content';
    }

    console.log(`Using endpoint: ${endpoint} (development: ${isDevelopment}, test: ${isTestMode}, mock: ${mockMode})`);

        // Call Netlify function for secure content generation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        let response: Response;
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              keyword,
              anchorText,
              targetUrl
            }),
            signal: controller.signal
          });
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError instanceof Error) {
            if (fetchError.name === 'AbortError') {
              throw new Error('Request timeout: Content generation service took too long to respond');
            }
            throw new Error(`Network error: ${fetchError.message}`);
          }
          throw new Error('Network error: Failed to connect to content generation service');
        }

        clearTimeout(timeoutId);

        // Read response body once, regardless of success or failure
        let responseText: string;
        try {
          responseText = await response.text();
        } catch (readError) {
          console.error('Failed to read response body:', readError);
          throw new Error(`Failed to read response from server: ${readError instanceof Error ? readError.message : 'Unknown read error'}`);
        }

        // Parse JSON from text
        let data: any;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', { responseText, parseError });
          // If response isn't JSON, use text as error message
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${responseText || response.statusText}`);
          }
          throw new Error(`Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
        }

        // Handle error responses
        if (!response.ok) {
          const errorMessage = data?.error || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        if (!data.success) {
          throw new Error(data.error || 'Content generation failed');
        }

        if (!data.content || !Array.isArray(data.content)) {
          throw new Error('Invalid response format from content generation service');
        }

        console.log(`Successfully generated ${data.content.length} pieces of content`);
        return data.content;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Content generation error (attempt ${attempt}/${maxRetries}):`, lastError.message);

        // Don't retry for certain types of errors
        if (lastError.message.includes('OPENAI_API_KEY') ||
            lastError.message.includes('Missing required parameters') ||
            lastError.message.includes('HTTP 4')) {
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed, try fallback mock content as last resort
    if (lastError) {
      console.warn('All content generation attempts failed, falling back to mock content');

      try {
        const mockContent = this.generateFallbackContent(keyword, anchorText, targetUrl);
        console.log('Successfully generated fallback content');
        return [mockContent];
      } catch (mockError) {
        console.error('Fallback content generation also failed:', mockError);
      }

      // Provide more specific error messages
      if (lastError.message.includes('OPENAI_API_KEY')) {
        throw new Error('OpenAI API key not configured. Please contact administrator.');
      }
      if (lastError.message.includes('Network error') ||
          lastError.message.includes('timeout') ||
          lastError.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to content generation service after multiple attempts.');
      }
      throw new Error(`Content generation failed after ${maxRetries} attempts: ${lastError.message}`);
    }

    throw new Error('Failed to generate content: Unknown error occurred');
  }

  /**
   * Validate content generation service availability
   */
  async validateConnection(): Promise<boolean> {
    try {
      // Test with minimal parameters to check if service is available
      const response = await fetch('/.netlify/functions/generate-automation-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: 'test',
          anchorText: 'test link',
          targetUrl: 'https://example.com'
        })
      });

      // We expect this to work or give a specific error about missing API key
      let data = null;
      try {
        data = await response.json();
      } catch (parseError) {
        console.warn('Failed to parse validation response:', parseError);
        return false;
      }

      // If we get a proper response structure, the service is available
      if (data && (data.success || data.error)) {
        console.log('Content generation service is available');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Content generation service validation failed:', error);
      return false;
    }
  }

  /**
   * Get service status and configuration info
   */
  async getServiceStatus(): Promise<{
    available: boolean;
    configured: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch('/.netlify/functions/generate-automation-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: 'test',
          anchorText: 'test',
          targetUrl: 'https://example.com'
        })
      });

      let data = null;
      try {
        data = await response.json();
      } catch (parseError) {
        console.warn('Failed to parse status response:', parseError);
        return {
          available: false,
          configured: false,
          error: 'Service not responding or invalid response format'
        };
      }

      if (!data) {
        return {
          available: false,
          configured: false,
          error: 'Service not responding'
        };
      }

      // Check if API key is configured
      if (data.error && data.error.includes('OPENAI_API_KEY')) {
        return {
          available: true,
          configured: false,
          error: 'OpenAI API key not configured'
        };
      }

      // If we get success or any other error, service is configured
      return {
        available: true,
        configured: true
      };

    } catch (error) {
      return {
        available: false,
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Singleton instance
let contentService: AutomationContentService | null = null;

export const getContentService = (): AutomationContentService => {
  if (!contentService) {
    contentService = new AutomationContentService();
  }
  return contentService;
};
