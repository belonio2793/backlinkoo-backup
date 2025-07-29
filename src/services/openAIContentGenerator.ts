/**
 * OpenAI Content Generator - Single Provider Only
 * Streamlined content generation using only OpenAI API
 */

import { openAIService } from './api/openai';

export interface ContentGenerationRequest {
  targetUrl: string;
  primaryKeyword: string;
  anchorText?: string;
  wordCount?: number;
  tone?: 'professional' | 'casual' | 'technical' | 'friendly' | 'convincing';
  contentType?: 'how-to' | 'listicle' | 'review' | 'comparison' | 'news' | 'opinion';
  retryConfig?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    exponentialBackoff?: boolean;
    retryOnRateLimit?: boolean;
    retryOnServerError?: boolean;
  };
}

export interface GeneratedContentResult {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  keywords: string[];
  targetUrl: string;
  anchorText: string;
  wordCount: number;
  readingTime: number;
  seoScore: number;
  status: 'unclaimed' | 'claimed' | 'expired';
  createdAt: string;
  expiresAt: string;
  claimed: boolean;
  usage: {
    tokens: number;
    cost: number;
  };
  error?: string;
}

export class OpenAIContentGenerator {
  /**
   * Generate content using only OpenAI
   */
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContentResult> {
    const startTime = Date.now();
    const id = crypto.randomUUID();
    
    const {
      targetUrl,
      primaryKeyword,
      anchorText = primaryKeyword,
      wordCount = 1500,
      tone = 'professional',
      contentType = 'how-to'
    } = request;

    // Check if OpenAI is configured
    if (!openAIService.isConfigured()) {
      throw new Error('OpenAI API key is not configured. Please set the VITE_OPENAI_API_KEY environment variable with a valid OpenAI API key to enable content generation.');
    }

    try {
      // Generate comprehensive prompt for OpenAI
      const prompt = this.createPrompt(request);
      const systemPrompt = this.createSystemPrompt(contentType, tone);

      console.log('🤖 Generating content with OpenAI...');

      // Use OpenAI to generate content
      const result = await openAIService.generateContent(prompt, {
        model: 'gpt-3.5-turbo',
        maxTokens: Math.min(4000, Math.floor(wordCount * 2.5)),
        temperature: 0.7,
        systemPrompt
      });

      if (!result.success || !result.content) {
        throw new Error(result.error || 'Failed to generate content with OpenAI');
      }

      // Process and format the content
      const processedContent = this.processContent(result.content, request);
      const metadata = this.extractMetadata(processedContent, request);
      
      // Calculate expiration (24 hours from now)
      const createdAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const contentResult: GeneratedContentResult = {
        id,
        title: metadata.title,
        slug: this.generateSlug(metadata.title),
        content: processedContent,
        metaDescription: metadata.metaDescription,
        keywords: metadata.keywords,
        targetUrl,
        anchorText,
        wordCount: metadata.wordCount,
        readingTime: Math.ceil(metadata.wordCount / 200),
        seoScore: this.calculateSEOScore(processedContent, request),
        status: 'unclaimed',
        createdAt,
        expiresAt,
        claimed: false,
        usage: result.usage
      };

      console.log('✅ Content generated successfully:', {
        wordCount: metadata.wordCount,
        tokens: result.usage.tokens,
        cost: `$${result.usage.cost.toFixed(4)}`,
        processingTime: `${Date.now() - startTime}ms`
      });

      return contentResult;

    } catch (error) {
      console.error('❌ Content generation failed:', error);

      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Invalid API key')) {
          throw new Error('Invalid OpenAI API key. Please check that your API key is correct and has sufficient credits. Visit https://platform.openai.com/api-keys to manage your API keys.');
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
          throw new Error('OpenAI rate limit exceeded. Please wait a moment before trying again. If this persists, check your OpenAI account usage limits.');
        } else if (error.message.includes('insufficient_quota')) {
          throw new Error('OpenAI quota exceeded. Please check your OpenAI account billing and usage limits at https://platform.openai.com/usage');
        } else if (error.message.includes('model_not_found')) {
          throw new Error('The requested OpenAI model is not available. Please try again or contact support if the issue persists.');
        }
      }

      throw error;
    }
  }

  /**
   * Create optimized prompt for OpenAI
   */
  private createPrompt(request: ContentGenerationRequest): string {
    const {
      targetUrl,
      primaryKeyword,
      anchorText,
      wordCount = 1500,
      contentType = 'how-to',
      tone = 'professional'
    } = request;

    const currentYear = new Date().getFullYear();

    return `Create a comprehensive ${wordCount}-word ${contentType} blog post about "${primaryKeyword}" that naturally incorporates a backlink.

CONTENT REQUIREMENTS:
- Write exactly ${wordCount} words of high-quality, original content
- Focus on "${primaryKeyword}" as the main topic
- Use ${tone} tone throughout the article
- Include practical, actionable advice
- Structure with proper headings (H1, H2, H3)
- Natural integration of anchor text "${anchorText}" linking to ${targetUrl}

CONTENT STRUCTURE:
1. Compelling H1 title with the primary keyword
2. Engaging introduction that hooks the reader
3. 4-6 main sections with H2 headings
4. Subsections with H3 headings where appropriate
5. Natural placement of backlink: "${anchorText}" → ${targetUrl}
6. Strong conclusion with actionable takeaways

SEO OPTIMIZATION:
- Include primary keyword "${primaryKeyword}" naturally throughout
- Use semantic keywords and related terms
- Optimize for featured snippets where possible
- Include numbered lists or bullet points
- Add FAQ section if relevant
- Write compelling meta description

BACKLINK INTEGRATION:
- Place the backlink "${anchorText}" naturally within the content
- Make the link contextually relevant to the surrounding text
- Use it as a resource or reference point
- Ensure it adds value to the reader

OUTPUT FORMAT:
Return the content as HTML with proper tags:
- Use <h1> for main title
- Use <h2> for main sections
- Use <h3> for subsections
- Use <p> for paragraphs
- Use <ul>/<ol> and <li> for lists
- Use <strong> for emphasis
- Use <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> for the backlink

Focus on creating valuable, informative content that genuinely helps readers while naturally incorporating the backlink.`;
  }

  /**
   * Create system prompt based on content type and tone
   */
  private createSystemPrompt(contentType: string, tone: string): string {
    const basePrompt = `You are an expert SEO content writer specializing in creating high-quality, engaging blog posts that rank well in search engines.`;

    const contentTypePrompts = {
      'how-to': 'Focus on step-by-step instructions, practical tips, and actionable advice.',
      'listicle': 'Create numbered or bulleted lists with detailed explanations for each point.',
      'review': 'Provide balanced analysis with pros, cons, and honest recommendations.',
      'comparison': 'Compare options objectively with clear criteria and recommendations.',
      'news': 'Present information clearly with context and analysis.',
      'opinion': 'Share insights and perspectives while backing up claims with evidence.'
    };

    const tonePrompts = {
      'professional': 'Use formal, authoritative language suitable for business contexts.',
      'casual': 'Write in a friendly, conversational tone that feels approachable.',
      'technical': 'Use precise terminology and detailed explanations for technical audiences.',
      'friendly': 'Maintain warmth and approachability while being informative.',
      'convincing': 'Use persuasive language and compelling arguments.'
    };

    return `${basePrompt} ${contentTypePrompts[contentType as keyof typeof contentTypePrompts] || contentTypePrompts['how-to']} ${tonePrompts[tone as keyof typeof tonePrompts] || tonePrompts['professional']} Always create original, valuable content that genuinely helps readers and ensures natural, contextual backlink integration.`;
  }

  /**
   * Process and enhance the generated content
   */
  private processContent(content: string, request: ContentGenerationRequest): string {
    let processed = content.trim();

    // Ensure backlink is present
    if (!processed.includes(request.targetUrl)) {
      const sections = processed.split('\n\n');
      if (sections.length > 2) {
        const midIndex = Math.floor(sections.length / 2);
        const linkText = request.anchorText || request.primaryKeyword;
        const linkHtml = `<a href="${request.targetUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
        const linkParagraph = `<p>For more comprehensive information and advanced strategies about ${request.primaryKeyword}, ${linkHtml} provides expert resources and proven solutions.</p>`;
        sections.splice(midIndex, 0, linkParagraph);
        processed = sections.join('\n\n');
      }
    }

    // Clean up formatting
    processed = processed
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');

    return processed;
  }

  /**
   * Extract metadata from content
   */
  private extractMetadata(content: string, request: ContentGenerationRequest) {
    // Extract title
    const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>|^#\s(.+)/m);
    const title = titleMatch ? 
      (titleMatch[1] || titleMatch[2]).replace(/<[^>]+>/g, '') : 
      `${request.primaryKeyword}: Complete Guide ${new Date().getFullYear()}`;

    // Calculate word count
    const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const wordCount = textContent.split(' ').filter(word => word.length > 0).length;

    // Generate keywords
    const keywords = [
      request.primaryKeyword,
      `${request.primaryKeyword} guide`,
      `best ${request.primaryKeyword}`,
      `${request.primaryKeyword} tips`,
      `${request.primaryKeyword} strategies`,
      `${request.primaryKeyword} ${new Date().getFullYear()}`
    ];

    // Generate meta description
    const metaDescription = `Comprehensive ${request.primaryKeyword} guide with expert insights, practical tips, and proven strategies. Learn everything you need to know about ${request.primaryKeyword}.`.substring(0, 160);

    return {
      title,
      wordCount,
      keywords,
      metaDescription
    };
  }

  /**
   * Calculate SEO score
   */
  private calculateSEOScore(content: string, request: ContentGenerationRequest): number {
    let score = 70; // Base score

    // Check for title
    if (content.includes('<h1>')) score += 5;

    // Check for headings
    const h2Count = (content.match(/<h2[^>]*>/g) || []).length;
    if (h2Count >= 3) score += 5;

    // Check for lists
    if (content.includes('<ul>') || content.includes('<ol>')) score += 5;

    // Check for backlink
    if (content.includes(request.targetUrl)) score += 10;

    // Check keyword density
    const textContent = content.replace(/<[^>]+>/g, ' ').toLowerCase();
    const keywordOccurrences = (textContent.match(new RegExp(request.primaryKeyword.toLowerCase(), 'g')) || []).length;
    const wordCount = textContent.split(' ').filter(w => w.length > 0).length;
    const density = (keywordOccurrences / wordCount) * 100;
    
    if (density >= 1 && density <= 3) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 60)
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Test OpenAI connection
   */
  async testConnection(): Promise<boolean> {
    return await openAIService.testConnection();
  }

  /**
   * Check if OpenAI is configured
   */
  isConfigured(): boolean {
    return openAIService.isConfigured();
  }
}

export const openAIContentGenerator = new OpenAIContentGenerator();
