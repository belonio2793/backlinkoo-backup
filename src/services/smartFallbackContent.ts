/**
 * DEPRECATED: This file has been removed as part of OpenAI-only simplification
 * 
 * This service used to provide smart fallback content when AI providers were unavailable.
 * The new system requires OpenAI configuration and does not provide fallback templates.
 * 
 * Use openAIContentGenerator.ts instead.
 */

export class SmartFallbackContent {
  static generateContent() {
    throw new Error('SmartFallbackContent has been deprecated. Please configure OpenAI API key and use openAIContentGenerator instead.');
  }
}
