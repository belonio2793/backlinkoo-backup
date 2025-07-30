/**
 * OpenAI Only Content Generator - Simplified Implementation
 * Uses only OpenAI API for content generation without fallbacks
 */

import { openAIContentGenerator, ContentGenerationRequest, GeneratedContentResult } from './openAIContentGenerator';

export { ContentGenerationRequest, GeneratedContentResult } from './openAIContentGenerator';

/**
 * Simplified OpenAI-only content generator
 * This is a thin wrapper around the main OpenAI content generator
 */
class OpenAIOnlyContentGenerator {
  /**
   * Generate content using only OpenAI
   */
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContentResult> {
    return await openAIContentGenerator.generateContent(request);
  }

  /**
   * Test OpenAI connection
   */
  async testConnection(): Promise<boolean> {
    return await openAIContentGenerator.testConnection();
  }

  /**
   * Get provider status
   */
  async getProviderStatus(): Promise<Record<string, any>> {
    return await openAIContentGenerator.getProviderStatus();
  }

  /**
   * Check if OpenAI is configured
   */
  isConfigured(): boolean {
    return openAIContentGenerator.isConfigured();
  }
}

export const openAIOnlyContentGenerator = new OpenAIOnlyContentGenerator();
