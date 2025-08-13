/**
 * Content Generation Service using OpenAI GPT-3.5 Turbo
 * Generates blog posts with proper anchor text integration
 */

import { automationLogger } from './automationLogger';

export interface ContentGenerationRequest {
  keywords: string[];
  anchorTexts: string[];
  targetUrl: string;
  campaignId: string;
  targetSite?: string;
  wordCount?: number;
  tone?: 'professional' | 'casual' | 'technical' | 'friendly';
}

export interface GeneratedContent {
  title: string;
  content: string;
  hasAnchorLink: boolean;
  anchorText?: string;
  wordCount: number;
  targetUrl: string;
}

class ContentGenerationService {
  private netlifyFunctionUrl = '/.netlify/functions/generate-content';

  constructor() {
    automationLogger.info('api', 'Content generation service initialized (using Netlify functions)');
  }

  async generateBlogPost(request: ContentGenerationRequest): Promise<GeneratedContent> {
    const { keywords, anchorTexts, targetUrl, campaignId, targetSite = 'Telegraph', wordCount = 800, tone = 'professional' } = request;

    automationLogger.info('article_submission', 'Starting content generation via Netlify function', {
      keywords: keywords.slice(0, 3),
      targetSite,
      wordCount
    }, campaignId);

    try {
      // Select random anchor text and primary keyword
      const primaryKeyword = keywords[0] || 'technology';
      const selectedAnchor = anchorTexts[Math.floor(Math.random() * anchorTexts.length)] || 'learn more';

      automationLogger.debug('api', 'Calling Netlify function for content generation', {
        keyword: primaryKeyword,
        anchorText: selectedAnchor,
        wordCount
      }, campaignId);

      // Call Netlify function instead of OpenAI directly
      const response = await fetch(this.netlifyFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: primaryKeyword,
          anchor_text: selectedAnchor,
          url: targetUrl,
          campaign_id: campaignId,
          word_count: wordCount,
          tone: tone,
          user_id: this.getCurrentUserId() // Helper to get current user ID
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Netlify function error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Content generation failed');
      }

      const result = data.data;

      automationLogger.info('article_submission', 'Content generated successfully via Netlify', {
        title: result.title.substring(0, 50),
        wordCount: result.wordCount,
        hasAnchorLink: result.hasAnchorLink,
        promptTemplate: result.promptIndex
      }, campaignId);

      return {
        title: result.title,
        content: result.content,
        hasAnchorLink: result.hasAnchorLink,
        anchorText: result.anchorText,
        wordCount: result.wordCount,
        targetUrl: result.targetUrl
      };

    } catch (error) {
      automationLogger.error('api', 'Content generation failed via Netlify function', {
        keywords: keywords.slice(0, 3),
        targetSite
      }, campaignId, error as Error);

      throw error;
    }
  }

  private getCurrentUserId(): string | undefined {
    // Helper to get current user ID from auth context
    // This will be passed from the calling component
    return undefined;
  }


  // Test method for development
  async testGeneration(campaignId: string): Promise<GeneratedContent> {
    automationLogger.info('api', 'Running test content generation', {}, campaignId);
    
    return this.generateBlogPost({
      keywords: ['SEO tools', 'digital marketing', 'link building'],
      anchorTexts: ['best SEO tools', 'powerful marketing platform', 'learn more'],
      targetUrl: 'https://example.com',
      campaignId,
      targetSite: 'Telegraph',
      wordCount: 600,
      tone: 'professional'
    });
  }

  // Check if service is properly configured
  isConfigured(): boolean {
    return this.apiKey !== null;
  }

  // Get configuration status
  getStatus(): { configured: boolean; message: string } {
    if (this.apiKey) {
      return {
        configured: true,
        message: 'OpenAI API key configured and ready'
      };
    } else {
      return {
        configured: false,
        message: 'OpenAI API key not found. Please set VITE_OPENAI_API_KEY environment variable.'
      };
    }
  }
}

// Helper function to escape regex special characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const contentGenerationService = new ContentGenerationService();

// Export for window debugging in development
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  (window as any).contentGenerationService = contentGenerationService;
  console.log('🔧 Content generation service available at window.contentGenerationService');
}

export default contentGenerationService;
