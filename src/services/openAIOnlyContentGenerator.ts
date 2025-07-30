/**
 * OpenAI-Only Content Generator
 * Simplified content generation using only OpenAI API.
 * Thin wrapper around the main OpenAI content generator.
 * Used to restore homepage functionality with no external fallbacks.
 */

import {
  openAIContentGenerator,
  ContentGenerationRequest,
  GeneratedContentResult
} from './openAIContentGenerator';

export type { ContentGenerationRequest, GeneratedContentResult };

export class OpenAIOnlyContentGenerator {
  /**
   * Generate content using only OpenAI
   */
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContentResult> {
    return openAIContentGenerator.generateContent(request);
  }

  /**
   * Test OpenAI connection
   */
  async testConnection(): Promise<boolean> {
    return openAIContentGenerator.testConnection();
  }

  /**
   * Check if OpenAI is configured
   */
  isConfigured(): boolean {
    return openAIContentGenerator.isConfigured();
  }

  /**
   * Get provider status
   */
  async getProviderStatus(): Promise<Record<string, any>> {
    return openAIContentGenerator.getProviderStatus();
  }
}

export const openAIOnlyContentGenerator = new OpenAIOnlyContentGenerator();
