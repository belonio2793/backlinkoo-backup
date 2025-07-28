/**
 * Builder.io AI Content Generator
 * Specialized service implementing exact user requirements:
 * - 3 specific prompts with rotation
 * - OpenAI primary, Grok backup
 * - Real-time generation with status updates
 * - Auto-publishing and lifecycle management
 */

import { huggingFaceService } from './api/huggingface';
import { cohereService } from './api/cohere';

export interface BuilderAIRequest {
  keyword: string;
  anchorText: string;
  targetUrl: string;
  userId?: string;
  accountId?: string;
}

export interface GenerationStatus {
  stage: 'initializing' | 'checking_apis' | 'generating' | 'publishing' | 'completed' | 'error';
  message: string;
  progress: number;
  provider?: 'huggingface' | 'cohere';
  error?: string;
}

export interface BuilderAIResult {
  content: string;
  title: string;
  slug: string;
  publishedUrl: string;
  wordCount: number;
  provider: 'huggingface' | 'cohere';
  generationTime: number;
  expiresAt: Date;
  metadata: {
    seoScore: number;
    readingTime: number;
    keywordDensity: number;
  };
}

export class BuilderAIGenerator {
  private readonly prompts = [
    "Generate a 1000 word article on {keyword} including the {anchorText} hyperlinked to {targetUrl}",
    "Write a 1000 word blog post about {keyword} with a hyperlinked {anchorText} linked to {targetUrl}",
    "Produce a 1000-word reader friendly post on {keyword} that links {anchorText} to {targetUrl}"
  ];

  private usageTracker: Map<string, number> = new Map();
  private onStatusUpdate?: (status: GenerationStatus) => void;

  constructor(onStatusUpdate?: (status: GenerationStatus) => void) {
    this.onStatusUpdate = onStatusUpdate;
  }

  /**
   * Check if user has already used their one generation limit
   */
  async checkUserLimit(accountId: string): Promise<boolean> {
    const usageCount = this.usageTracker.get(accountId) || 0;
    return usageCount === 0;
  }

  /**
   * Increment user usage counter
   */
  private incrementUsage(accountId: string): void {
    const current = this.usageTracker.get(accountId) || 0;
    this.usageTracker.set(accountId, current + 1);
  }

  /**
   * Test API connectivity before generation
   */
  async checkApiAvailability(): Promise<{ huggingface: boolean; cohere: boolean }> {
    this.updateStatus('checking_apis', 'Testing API connectivity...', 10);

    const huggingfaceAvailable = await huggingFaceService.testConnection();
    const cohereAvailable = await cohereService.testConnection();

    this.updateStatus('checking_apis',
      `APIs checked - Hugging Face: ${huggingfaceAvailable ? 'available' : 'unavailable'}, Cohere: ${cohereAvailable ? 'available' : 'unavailable'}`,
      25
    );

    return { huggingface: huggingfaceAvailable, cohere: cohereAvailable };
  }

  /**
   * Get next prompt using rotation
   */
  private getRotatedPrompt(): string {
    const index = Math.floor(Math.random() * this.prompts.length);
    return this.prompts[index];
  }

  /**
   * Build SEO-optimized prompt with user inputs
   */
  private buildPrompt(request: BuilderAIRequest): string {
    const basePrompt = this.getRotatedPrompt();
    
    const prompt = basePrompt
      .replace('{keyword}', request.keyword)
      .replace('{anchorText}', request.anchorText)
      .replace('{targetUrl}', request.targetUrl);

    return `${prompt}

Please follow these SEO best practices:
1. Use H1, H2, H3 headings appropriately
2. Include the keyword naturally throughout the content
3. Write in a conversational, engaging tone
4. Include relevant subheadings
5. Add a compelling introduction and conclusion
6. Ensure the anchor text "${request.anchorText}" is naturally integrated with the link to ${request.targetUrl}
7. Make the content readable and valuable to users
8. Use proper paragraph breaks and formatting
9. Include relevant keywords and semantic variations
10. Write exactly 1000 words

Format the response as clean HTML with proper semantic structure.`;
  }

  /**
   * Generate content with fallback provider logic
   */
  async generateContent(request: BuilderAIRequest): Promise<BuilderAIResult> {
    const startTime = Date.now();

    this.updateStatus('initializing', 'Starting content generation...', 0);

    // Check user limit
    if (request.accountId && !await this.checkUserLimit(request.accountId)) {
      throw new Error('Account has already used their one-time content generation limit');
    }

    // Check API availability
    const apiStatus = await this.checkApiAvailability();
    
    if (!apiStatus.openai && !apiStatus.grok) {
      throw new Error('No AI providers are currently available');
    }

    // Determine provider (OpenAI primary, Grok backup)
    const useOpenAI = apiStatus.openai;
    const provider = useOpenAI ? 'openai' : 'grok';
    const service = useOpenAI ? openAIService : grokService;

    this.updateStatus('generating', `Generating content using ${provider.toUpperCase()}...`, 50, provider);

    // Build the prompt
    const prompt = this.buildPrompt(request);

    // Generate content
    let content: string;
    try {
      if (useOpenAI) {
        content = await openAIService.generateContent(prompt, {
          model: 'gpt-3.5-turbo',
          maxTokens: 2000,
          temperature: 0.7
        });
      } else {
        content = await grokService.generateContent(prompt, {
          model: 'grok-2-1212',
          maxTokens: 2000,
          temperature: 0.7
        });
      }
    } catch (error) {
      // Try backup provider if primary fails
      const backupProvider = useOpenAI ? 'grok' : 'openai';
      if ((useOpenAI && apiStatus.grok) || (!useOpenAI && apiStatus.openai)) {
        this.updateStatus('generating', `Primary provider failed, trying ${backupProvider.toUpperCase()}...`, 60, backupProvider as any);
        
        if (backupProvider === 'grok') {
          content = await grokService.generateContent(prompt, {
            model: 'grok-2-1212',
            maxTokens: 2000,
            temperature: 0.7
          });
        } else {
          content = await openAIService.generateContent(prompt, {
            model: 'gpt-3.5-turbo',
            maxTokens: 2000,
            temperature: 0.7
          });
        }
      } else {
        throw new Error(`Content generation failed: ${error}`);
      }
    }

    this.updateStatus('publishing', 'Processing and publishing content...', 80);

    // Extract title from content
    const title = this.extractTitle(content, request.keyword);
    const slug = this.generateSlug(title);
    const wordCount = this.countWords(content);
    const generationTime = Date.now() - startTime;

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Increment usage if accountId provided
    if (request.accountId) {
      this.incrementUsage(request.accountId);
    }

    this.updateStatus('completed', 'Content generated and published successfully!', 100);

    const result: BuilderAIResult = {
      content,
      title,
      slug,
      publishedUrl: `/blog/${slug}`,
      wordCount,
      provider: provider as 'openai' | 'grok',
      generationTime,
      expiresAt,
      metadata: {
        seoScore: this.calculateSEOScore(content, request.keyword),
        readingTime: Math.ceil(wordCount / 200),
        keywordDensity: this.calculateKeywordDensity(content, request.keyword)
      }
    };

    return result;
  }

  /**
   * Extract or generate title from content
   */
  private extractTitle(content: string, keyword: string): string {
    // Try to extract H1 tag
    const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) {
      return h1Match[1].replace(/<[^>]*>/g, ''); // Strip any HTML tags
    }

    // Try to extract first heading
    const headingMatch = content.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
    if (headingMatch) {
      return headingMatch[1].replace(/<[^>]*>/g, '');
    }

    // Generate title from keyword
    return `Complete Guide to ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 60) + '-' + Date.now();
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    const text = content.replace(/<[^>]*>/g, ''); // Strip HTML
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Calculate basic SEO score
   */
  private calculateSEOScore(content: string, keyword: string): number {
    let score = 0;
    const lowerContent = content.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    // Check for H1 tag
    if (content.includes('<h1')) score += 20;
    
    // Check for multiple headings
    const headingCount = (content.match(/<h[1-6]/g) || []).length;
    if (headingCount >= 3) score += 15;

    // Check keyword presence
    const keywordCount = (lowerContent.match(new RegExp(lowerKeyword, 'g')) || []).length;
    if (keywordCount >= 3 && keywordCount <= 8) score += 25;

    // Check content length
    const wordCount = this.countWords(content);
    if (wordCount >= 800) score += 20;

    // Check for proper HTML structure
    if (content.includes('<p>') && content.includes('</p>')) score += 10;

    // Check for internal linking
    if (content.includes('<a href=')) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Calculate keyword density
   */
  private calculateKeywordDensity(content: string, keyword: string): number {
    const text = content.replace(/<[^>]*>/g, '').toLowerCase();
    const words = text.split(/\s+/);
    const keywordOccurrences = words.filter(word => 
      word.includes(keyword.toLowerCase())
    ).length;
    
    return (keywordOccurrences / words.length) * 100;
  }

  /**
   * Update status callback
   */
  private updateStatus(stage: GenerationStatus['stage'], message: string, progress: number, provider?: 'openai' | 'grok'): void {
    if (this.onStatusUpdate) {
      this.onStatusUpdate({ stage, message, progress, provider });
    }
  }
}

// Export singleton instance
export const builderAIGenerator = new BuilderAIGenerator();
