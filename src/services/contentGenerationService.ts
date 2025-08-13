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
  private apiKey: string | null = null;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    // Get API key from environment variables
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
    
    if (!this.apiKey) {
      automationLogger.warn('api', 'OpenAI API key not found in environment variables');
    } else {
      automationLogger.info('api', 'OpenAI content generation service initialized');
    }
  }

  async generateBlogPost(request: ContentGenerationRequest): Promise<GeneratedContent> {
    const { keywords, anchorTexts, targetUrl, campaignId, targetSite = 'Telegraph', wordCount = 800, tone = 'professional' } = request;

    automationLogger.info('article_submission', 'Starting content generation', {
      keywords: keywords.slice(0, 3),
      targetSite,
      wordCount
    }, campaignId);

    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY environment variable.');
    }

    try {
      // Select random anchor text and primary keyword
      const primaryKeyword = keywords[0] || 'technology';
      const selectedAnchor = anchorTexts[Math.floor(Math.random() * anchorTexts.length)] || 'learn more';
      
      // Create content generation prompt
      const prompt = this.createContentPrompt({
        keywords,
        anchorText: selectedAnchor,
        targetUrl,
        targetSite,
        wordCount,
        tone
      });

      automationLogger.debug('api', 'Sending request to OpenAI', { 
        model: 'gpt-3.5-turbo',
        wordCount,
        primaryKeyword 
      }, campaignId);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional content writer specializing in SEO-optimized blog posts. Create engaging, informative content that naturally incorporates provided keywords and anchor text links.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: Math.min(4000, Math.ceil(wordCount * 1.5)), // Account for formatting
          temperature: 0.7,
          top_p: 1,
          frequency_penalty: 0.2,
          presence_penalty: 0.1
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content;

      if (!generatedText) {
        throw new Error('No content generated from OpenAI');
      }

      // Parse the generated content
      const parsedContent = this.parseGeneratedContent(generatedText, selectedAnchor, targetUrl);
      
      automationLogger.info('article_submission', 'Content generated successfully', {
        title: parsedContent.title.substring(0, 50),
        wordCount: parsedContent.wordCount,
        hasAnchorLink: parsedContent.hasAnchorLink
      }, campaignId);

      return {
        ...parsedContent,
        targetUrl
      };

    } catch (error) {
      automationLogger.error('api', 'Content generation failed', {
        keywords: keywords.slice(0, 3),
        targetSite
      }, campaignId, error as Error);
      
      throw error;
    }
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
