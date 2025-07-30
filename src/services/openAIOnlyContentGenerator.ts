/**
 * OpenAI-Only Content Generator with Enhanced SEO
 * Advanced content generation using ChatGPT with SEO auto-formatting.
 * Integrates the enhanced content generator with SEO optimization.
 * Provides intent-based logic and keyword relevance optimization.
 */

import {
  enhancedContentGenerator,
  type ContentGenerationRequest,
  type GeneratedContentResult
} from './enhancedContentGenerator';

export type { ContentGenerationRequest, GeneratedContentResult };

export class OpenAIOnlyContentGenerator {
  /**
   * Generate content using enhanced OpenAI with SEO optimization
   */
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContentResult> {
    console.log('🚀 OpenAI-Only content generation with enhanced SEO optimization...');
    return enhancedContentGenerator.generateContent(request);
  }

  /**
   * Test OpenAI connection
   */
  async testConnection(): Promise<boolean> {
    return enhancedContentGenerator.testConnection();
  }

  /**
   * Check if OpenAI is configured
   */
  isConfigured(): boolean {
    return enhancedContentGenerator.isConfigured();
  }

  /**
   * Get provider status
   */
  async getProviderStatus(): Promise<Record<string, any>> {
    return enhancedContentGenerator.getProviderStatus();
  }
}

export const openAIOnlyContentGenerator = new OpenAIOnlyContentGenerator();
