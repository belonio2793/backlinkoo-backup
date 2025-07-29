/**
 * Simplified AI Content Engine - OpenAI Only
 * For free backlink feature - uses only OpenAI for content generation
 */

import { openAIService } from './api/openai';

export interface FreeBacklinkRequest {
  targetUrl: string;
  primaryKeyword: string;
  anchorText?: string;
  wordCount?: number;
  tone?: 'professional' | 'casual' | 'technical' | 'friendly' | 'convincing';
  contentType?: 'how-to' | 'listicle' | 'review' | 'comparison' | 'news' | 'opinion';
}

export interface FreeBacklinkResult {
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

export class SimpleAIContentEngine {
  /**
   * Generate content for free backlink feature using only OpenAI
   */
  async generateFreeBacklink(request: FreeBacklinkRequest): Promise<FreeBacklinkResult> {
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

    let result: any = { success: false, content: '', usage: { tokens: 0, cost: 0 } };
    let usingFallback = false;

    try {
      // Check if OpenAI is configured before attempting to use it
      if (openAIService.isConfigured()) {
        // Generate comprehensive prompt for OpenAI
        const prompt = this.generatePrompt(request);

        console.log('🤖 Generating free backlink content with OpenAI...');

        // Use OpenAI to generate content
        result = await openAIService.generateContent(prompt, {
          model: 'gpt-3.5-turbo',
          maxTokens: Math.min(4000, Math.floor(wordCount * 2.5)),
          temperature: 0.7,
          systemPrompt: this.getSystemPrompt(contentType, tone)
        });

        if (!result.success || !result.content) {
          console.log('🔄 OpenAI generation failed, using fallback content...');
          usingFallback = true;
        }
      } else {
        console.log('⚠️ OpenAI not configured, using fallback content...');
        usingFallback = true;
      }

      // If OpenAI failed or not configured, use fallback
      if (usingFallback) {
        result = {
          success: true,
          content: this.generateFallbackContent(request),
          usage: { tokens: 0, cost: 0 }
        };
      }

      // Process and format the content
      const processedContent = this.processContent(result.content, request);
      const metadata = this.extractMetadata(processedContent, request);
      
      // Calculate expiration (24 hours from now)
      const createdAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const freeBacklinkResult: FreeBacklinkResult = {
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

      console.log('✅ Free backlink content generated successfully:', {
        wordCount: metadata.wordCount,
        tokens: result.usage.tokens,
        cost: `$${result.usage.cost.toFixed(4)}`,
        processingTime: `${Date.now() - startTime}ms`
      });

      return freeBacklinkResult;

    } catch (error) {
      console.error('❌ Free backlink generation failed:', error);
      
      return {
        id,
        title: `${primaryKeyword}: Complete Guide`,
        slug: this.generateSlug(`${primaryKeyword}-complete-guide`),
        content: this.generateFallbackContent(request),
        metaDescription: `Learn everything about ${primaryKeyword}. Comprehensive guide with expert insights.`,
        keywords: [primaryKeyword],
        targetUrl,
        anchorText,
        wordCount: 800,
        readingTime: 4,
        seoScore: 70,
        status: 'unclaimed',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        claimed: false,
        usage: { tokens: 0, cost: 0 },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate sophisticated prompt for OpenAI
   */
  private generatePrompt(request: FreeBacklinkRequest): string {
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
- Write ${wordCount} words of high-quality, original content
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
   * Get system prompt based on content type and tone
   */
  private getSystemPrompt(contentType: string, tone: string): string {
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

    return `${basePrompt} ${contentTypePrompts[contentType as keyof typeof contentTypePrompts] || contentTypePrompts['how-to']} ${tonePrompts[tone as keyof typeof tonePrompts] || tonePrompts['professional']} Always create original, valuable content that genuinely helps readers.`;
  }

  /**
   * Process and enhance the generated content
   */
  private processContent(content: string, request: FreeBacklinkRequest): string {
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
  private extractMetadata(content: string, request: FreeBacklinkRequest) {
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
  private calculateSEOScore(content: string, request: FreeBacklinkRequest): number {
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
   * Generate fallback content when AI generation fails
   */
  private generateFallbackContent(request: FreeBacklinkRequest): string {
    const { primaryKeyword, targetUrl, anchorText } = request;
    const anchor = anchorText || primaryKeyword;
    
    return `<h1>${primaryKeyword}: Your Ultimate Guide</h1>

<h2>Introduction</h2>
<p>Understanding <strong>${primaryKeyword}</strong> is essential in today's digital landscape. This comprehensive guide will provide you with everything you need to know about ${primaryKeyword}, from basic concepts to advanced strategies.</p>

<h2>What is ${primaryKeyword}?</h2>
<p>${primaryKeyword} represents a crucial element that can significantly impact your success. Whether you're a beginner or experienced professional, mastering ${primaryKeyword} will give you a competitive advantage.</p>

<h2>Key Benefits</h2>
<ul>
<li><strong>Enhanced Performance</strong>: Improve your results with proven ${primaryKeyword} strategies</li>
<li><strong>Expert Guidance</strong>: Learn from industry professionals</li>
<li><strong>Practical Solutions</strong>: Get actionable insights you can implement immediately</li>
<li><strong>Long-term Success</strong>: Build sustainable growth through ${primaryKeyword}</li>
</ul>

<h2>Getting Started</h2>
<p>The best approach to ${primaryKeyword} combines theoretical knowledge with practical application. For comprehensive resources and expert tools, <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchor}</a> provides everything you need to succeed.</p>

<h2>Best Practices</h2>
<ol>
<li>Start with a solid foundation in ${primaryKeyword} fundamentals</li>
<li>Implement strategies systematically</li>
<li>Monitor your progress regularly</li>
<li>Stay updated with latest trends</li>
<li>Seek professional guidance when needed</li>
</ol>

<h2>Conclusion</h2>
<p>Mastering <strong>${primaryKeyword}</strong> requires dedication and the right resources. Take the first step toward success by exploring the comprehensive solutions available through <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchor}</a>.</p>

<p>Ready to excel in ${primaryKeyword}? Start your journey today!</p>`;
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

export const simpleAIContentEngine = new SimpleAIContentEngine();
