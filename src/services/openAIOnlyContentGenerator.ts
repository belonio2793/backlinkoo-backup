/**
 * OpenAI-Only Content Generator
 * Simplified content generation using only OpenAI API
 * Created to restore missing service and fix homepage functionality
 */

import { openAIContentGenerator, ContentGenerationRequest, GeneratedContentResult } from './openAIContentGenerator';

export type { ContentGenerationRequest, GeneratedContentResult };

/**
 * OpenAI-Only Content Generator Service
 * This is a simplified wrapper around the main OpenAI content generator
 */
export class OpenAIOnlyContentGenerator {
  /**
   * Generate content using OpenAI
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
   * Get detailed provider status
   */
  async getProviderStatus(): Promise<Record<string, any>> {
    return openAIContentGenerator.getProviderStatus();
  }
}

export const openAIOnlyContentGenerator = new OpenAIOnlyContentGenerator();
