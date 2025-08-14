import OpenAI from 'openai';

export interface ContentGenerationParams {
  keyword: string;
  anchorText: string;
  targetUrl: string;
}

export interface GeneratedContent {
  type: 'article' | 'blog_post' | 'reader_friendly';
  content: string;
  wordCount: number;
}

export class AutomationContentService {
  private openai: OpenAI;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY environment variable.');
    }
    
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  /**
   * Generate all three types of content for a campaign
   */
  async generateAllContent(params: ContentGenerationParams): Promise<GeneratedContent[]> {
    const { keyword, anchorText, targetUrl } = params;

    const prompts = [
      {
        type: 'article' as const,
        prompt: `Generate a 1000 word article on ${keyword} including the ${anchorText} hyperlinked to ${targetUrl}. Write in a professional, informative style with proper SEO optimization. Include an introduction, main body with multiple sections, and a conclusion. Make sure the anchor text "${anchorText}" appears naturally in the content and would logically link to the provided URL.`
      },
      {
        type: 'blog_post' as const,
        prompt: `Write a 1000 word blog post about ${keyword} with a hyperlinked ${anchorText} linked to ${targetUrl}. Use a conversational, engaging tone suitable for blog readers. Include practical tips, insights, and actionable advice. Naturally incorporate the anchor text "${anchorText}" in a way that makes sense for linking to the target URL.`
      },
      {
        type: 'reader_friendly' as const,
        prompt: `Produce a 1000-word reader friendly post on ${keyword} that links ${anchorText} to ${targetUrl}. Write in an accessible, easy-to-understand style with clear explanations. Break down complex concepts and include examples where helpful. Ensure the anchor text "${anchorText}" fits naturally within the content flow and provides value when linked to the target URL.`
      }
    ];

    const results: GeneratedContent[] = [];

    for (const { type, prompt } of prompts) {
      try {
        console.log(`Generating ${type} content for keyword: ${keyword}`);
        
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional content writer specializing in SEO-optimized articles and blog posts. Write engaging, informative content that naturally incorporates anchor text for backlinking purposes. Always aim for the specified word count and maintain high quality throughout.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error(`No content generated for ${type}`);
        }

        // Format content with proper anchor text linking
        const formattedContent = this.formatContentWithAnchorLink(content, anchorText, targetUrl);
        const wordCount = this.countWords(formattedContent);

        results.push({
          type,
          content: formattedContent,
          wordCount
        });

        console.log(`Successfully generated ${type} content (${wordCount} words)`);
        
        // Add small delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error generating ${type} content:`, error);
        throw new Error(`Failed to generate ${type} content: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  /**
   * Format content to include proper HTML anchor link
   */
  private formatContentWithAnchorLink(content: string, anchorText: string, targetUrl: string): string {
    // Find the anchor text in the content and replace with HTML link
    const anchorLink = `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>`;
    
    // Replace the first occurrence of the anchor text with the HTML link
    const formattedContent = content.replace(
      new RegExp(this.escapeRegExp(anchorText), 'i'),
      anchorLink
    );

    // Convert to basic HTML formatting
    return this.convertToHtml(formattedContent);
  }

  /**
   * Convert plain text to basic HTML formatting
   */
  private convertToHtml(text: string): string {
    // Split into paragraphs and wrap with <p> tags
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs
      .map(paragraph => {
        // Check if it's a heading (starts with #)
        if (paragraph.trim().startsWith('#')) {
          const level = (paragraph.match(/^#+/) || [''])[0].length;
          const headingText = paragraph.replace(/^#+\s*/, '');
          return `<h${Math.min(level, 6)}>${headingText.trim()}</h${Math.min(level, 6)}>`;
        }
        
        // Regular paragraph
        return `<p>${paragraph.trim()}</p>`;
      })
      .join('\n\n');
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    // Remove HTML tags and count words
    const plainText = text.replace(/<[^>]*>/g, '');
    return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Escape special characters for regex
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Validate OpenAI API connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.openai.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI API validation failed:', error);
      return false;
    }
  }
}

// Singleton instance
let contentService: AutomationContentService | null = null;

export const getContentService = (): AutomationContentService => {
  if (!contentService) {
    contentService = new AutomationContentService();
  }
  return contentService;
};
