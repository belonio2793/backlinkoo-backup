/**
 * Netlify Functions Content Generator
 * Integrates with server-side functions for secure API calls
 */

export interface NetlifyGenerationRequest {
  keyword: string;
  url: string;
  anchorText?: string;
  wordCount?: number;
  contentType?: 'how-to' | 'listicle' | 'review' | 'comparison' | 'news' | 'opinion';
  tone?: 'professional' | 'casual' | 'technical' | 'friendly' | 'convincing';
}

export interface NetlifyGenerationResult {
  success: boolean;
  content?: string;
  provider?: string;
  source?: string;
  usage?: {
    tokens: number;
    cost: number;
  };
  attemptNumber?: number;
  fallbacksUsed?: string[];
  totalAttempts?: number;
  attemptLog?: Array<{
    provider: string;
    success: boolean;
    error?: string;
    timestamp: string;
  }>;
  processingTime?: number;
  timestamp?: string;
  error?: string;
}

export class NetlifyContentGenerator {
  private baseUrl: string;

  constructor() {
    // Determine base URL based on environment
    this.baseUrl = import.meta.env.PROD 
      ? window.location.origin 
      : 'http://localhost:8888';
  }

  /**
   * Generate content using intelligent fallback system
   */
  async generateContent(request: NetlifyGenerationRequest): Promise<NetlifyGenerationResult> {
    console.log('🌐 Starting Netlify function generation with fallback...');

    try {
      const response = await fetch(`${this.baseUrl}/.netlify/functions/generate-fallback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;

    } catch (error) {
      console.error('❌ Netlify function generation failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate content using specific provider
   */
  async generateWithProvider(
    provider: 'openai' | 'cohere', 
    request: NetlifyGenerationRequest
  ): Promise<NetlifyGenerationResult> {
    console.log(`🎯 Starting ${provider} generation via Netlify function...`);

    try {
      const response = await fetch(`${this.baseUrl}/.netlify/functions/generate-${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;

    } catch (error) {
      console.error(`❌ ${provider} Netlify function failed:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test if Netlify functions are available
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/.netlify/functions/generate-openai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keyword: 'test',
          url: 'https://example.com',
          wordCount: 100
        })
      });

      // Even if the generation fails due to missing API keys,
      // a 500 response means the function is available
      return response.status !== 404;

    } catch (error) {
      console.error('Netlify functions connection test failed:', error);
      return false;
    }
  }

  /**
   * Check if we're in an environment where Netlify functions are available
   */
  isAvailable(): boolean {
    // Netlify functions are available in production or when running netlify dev
    return import.meta.env.PROD || window.location.hostname === 'localhost';
  }
}

export const netlifyContentGenerator = new NetlifyContentGenerator();
