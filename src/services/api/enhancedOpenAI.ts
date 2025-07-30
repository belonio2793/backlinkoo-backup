/**
 * Enhanced OpenAI Service
 * Extended version with additional reliability features
 */

import { openAIService } from './openai';

export interface EnhancedGenerationResult {
  content: string;
  success: boolean;
  error?: string;
  usage: { tokens: number; cost: number };
  provider: string;
  apiKeyUsed: boolean;
  retryCount: number;
  responseTime: number;
}

export interface EnhancedTestResult {
  success: boolean;
  error?: string;
  responseTime: number;
}

export class EnhancedOpenAIService {
  
  /**
   * Generate content with enhanced monitoring and reporting
   */
  async generateContent(prompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  } = {}): Promise<EnhancedGenerationResult> {
    const startTime = Date.now();
    
    try {
      const result = await openAIService.generateContent(prompt, options);
      
      return {
        ...result,
        provider: 'openai',
        apiKeyUsed: openAIService.isConfigured(),
        retryCount: 0, // OpenAI service handles retries internally
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        usage: { tokens: 0, cost: 0 },
        provider: 'openai',
        apiKeyUsed: openAIService.isConfigured(),
        retryCount: 0,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Test connection with enhanced reporting
   */
  async testConnection(): Promise<EnhancedTestResult> {
    const startTime = Date.now();
    
    try {
      const success = await openAIService.testConnection();
      return {
        success,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return openAIService.isConfigured();
  }

  /**
   * Get service health information
   */
  getServiceHealth(): {
    status: 'healthy' | 'unhealthy' | 'unknown';
    details: {
      configured: boolean;
      lastCheck?: Date;
    };
  } {
    const configured = this.isConfigured();
    
    return {
      status: configured ? 'healthy' : 'unhealthy',
      details: {
        configured,
        lastCheck: new Date()
      }
    };
  }
}

// Export singleton instance
export const enhancedOpenAIService = new EnhancedOpenAIService();
