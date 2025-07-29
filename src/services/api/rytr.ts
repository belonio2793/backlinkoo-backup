/**
 * DEPRECATED: Rytr API service removed as part of OpenAI-only simplification
 * 
 * This system now uses only OpenAI for content generation.
 * Configure your OpenAI API key and use openAIContentGenerator.ts instead.
 */

export class RytrService {
  isConfigured() { return false; }
  async generateContent() { throw new Error('Rytr service deprecated - use OpenAI only'); }
  async testConnection() { return false; }
}

export const rytrService = new RytrService();
