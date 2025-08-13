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

  private createContentPrompt({
    keywords,
    anchorText,
    targetUrl,
    targetSite,
    wordCount,
    tone
  }: {
    keywords: string[];
    anchorText: string;
    targetUrl: string;
    targetSite: string;
    wordCount: number;
    tone: string;
  }): string {
    const keywordsList = keywords.slice(0, 5).join(', ');
    
    return `Write a comprehensive ${tone} blog post about ${keywords[0]} for publication on ${targetSite}.

REQUIREMENTS:
- Length: approximately ${wordCount} words
- Tone: ${tone} and engaging
- Keywords to naturally incorporate: ${keywordsList}
- Include ONE anchor text link: "${anchorText}" linking to ${targetUrl}
- Format: Use markdown formatting with headers (##), bold text (**text**), and lists
- Structure: Introduction, 3-4 main sections with subheadings, conclusion
- SEO optimized: Natural keyword integration, engaging meta-worthy title

ANCHOR LINK REQUIREMENT:
- Include exactly one link in this format: [${anchorText}](${targetUrl})
- Make the anchor text placement natural and contextual
- The link should provide value to readers

OUTPUT FORMAT:
Please structure your response exactly like this:

TITLE: [Your engaging title here]

CONTENT:
[Your full blog post content in markdown format with the anchor link integrated naturally]

Focus on providing genuine value while naturally incorporating the keywords and required anchor link.`;
  }

  private parseGeneratedContent(content: string, expectedAnchor: string, targetUrl: string): Omit<GeneratedContent, 'targetUrl'> {
    // Extract title and content
    const titleMatch = content.match(/TITLE:\s*(.+?)(?:\n|$)/i);
    const contentMatch = content.match(/CONTENT:\s*([\s\S]+)/i);
    
    const title = titleMatch?.[1]?.trim() || 'Generated Article';
    const articleContent = contentMatch?.[1]?.trim() || content;
    
    // Check for anchor link
    const anchorLinkRegex = new RegExp(`\\[([^\\]]+)\\]\\(${escapeRegExp(targetUrl)}\\)`, 'i');
    const hasAnchorLink = anchorLinkRegex.test(articleContent);
    
    // Extract the actual anchor text used
    const anchorMatch = articleContent.match(anchorLinkRegex);
    const actualAnchorText = anchorMatch?.[1] || expectedAnchor;
    
    // Count words (approximate)
    const wordCount = articleContent.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      title,
      content: articleContent,
      hasAnchorLink,
      anchorText: hasAnchorLink ? actualAnchorText : undefined,
      wordCount
    };
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
