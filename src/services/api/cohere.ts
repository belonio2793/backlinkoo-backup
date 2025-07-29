/**
 * DEPRECATED: Cohere API service removed as part of OpenAI-only simplification
 * 
 * This system now uses only OpenAI for content generation.
 * Configure your OpenAI API key and use openAIContentGenerator.ts instead.
 */

export class CohereService {
  isConfigured() { return false; }
  async generateText() { throw new Error('Cohere service deprecated - use OpenAI only'); }
  async testConnection() { return false; }
}

export const cohereService = new CohereService();
