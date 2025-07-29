/**
 * DEPRECATED: Grok API service removed as part of OpenAI-only simplification
 * 
 * This system now uses only OpenAI for content generation.
 * Configure your OpenAI API key and use openAIContentGenerator.ts instead.
 */

export class GrokService {
  isConfigured() { return false; }
  async generateContent() { throw new Error('Grok service deprecated - use OpenAI only'); }
  async testConnection() { return false; }
}

export const grokService = new GrokService();
