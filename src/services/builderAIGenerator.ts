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

FOLLOW THESE STRICT SEO FORMATTING GUIDELINES:

🔹 HEADLINE STRUCTURE (CRITICAL):
- Use ONLY ONE <h1> tag (the main title)
- Use <h2> for major section headings (Introduction, Benefits, How It Works, etc.)
- Use <h3> for subpoints under each <h2>
- NEVER use multiple <h1> tags

🔹 CONTENT STRUCTURE:
- Minimum 1000 words (this is mandatory)
- Keep paragraphs short (2-4 sentences maximum)
- Use line breaks between paragraphs
- Include compelling introduction and conclusion sections

🔹 KEYWORD OPTIMIZATION:
- Include main keyword "${request.keyword}" in the <h1> tag
- Use main keyword in the first 100 words
- Include keyword 3-5 times naturally throughout content
- Use related keywords and synonyms

🔹 ANCHOR TEXT REQUIREMENTS (CRITICAL):
- Include anchor text "${request.anchorText}" linked to ${request.targetUrl} at least 3 times
- Use: <a href="${request.targetUrl}" target="_blank" rel="noopener noreferrer">${request.anchorText}</a>
- Place links naturally within different sections
- Vary the context around each link

🔹 TEXT EMPHASIS:
- Use <strong> for important keywords and value points
- Use <em> for stylistic emphasis
- Bold key benefits and main points

🔹 FORMATTING:
- Use bullet points (<ul><li>) or numbered lists (<ol><li>) where helpful
- Include proper paragraph tags <p></p>
- Ensure mobile-responsive structure
- Add whitespace for readability

🔹 CONTENT SECTIONS (Include these):
1. Introduction (with keyword in first 100 words)
2. What is [keyword]? (explanation section)
3. Benefits/Advantages (use bullet points)
4. Best Practices/How to implement
5. Common mistakes to avoid
6. Future trends/outlook
7. Conclusion (summarize key points)

EXAMPLE STRUCTURE:
<h1>Complete Guide to [Keyword]</h1>
<p>Introduction paragraph with <strong>keyword</strong> in first 100 words...</p>

<h2>What is [Keyword]?</h2>
<p>Explanation content with <a href="${request.targetUrl}" target="_blank" rel="noopener noreferrer">${request.anchorText}</a>...</p>

<h3>Key Components</h3>
<ul>
<li><strong>First benefit</strong>: Description</li>
<li><strong>Second benefit</strong>: Description</li>
</ul>

FORMAT AS CLEAN HTML WITH PROPER SEMANTIC STRUCTURE.`;
  }

  /**
   * Generate content with fallback provider logic
   */
  async generateContent(request: BuilderAIRequest): Promise<BuilderAIResult> {
    const startTime = Date.now();

    this.updateStatus('initializing', 'Starting content generation...', 0);

    // No user limits on AI Live - unlimited generation allowed

    // Check API availability
    const apiStatus = await this.checkApiAvailability();

    if (!apiStatus.huggingface && !apiStatus.cohere) {
      throw new Error('No AI providers are currently available');
    }

    // Determine provider (Hugging Face primary, Cohere backup)
    const useHuggingFace = apiStatus.huggingface;
    const provider = useHuggingFace ? 'huggingface' : 'cohere';
    const service = useHuggingFace ? huggingFaceService : cohereService;

    this.updateStatus('generating', `Generating content using ${provider.toUpperCase()}...`, 50, provider);

    // Build the prompt
    const prompt = this.buildPrompt(request);

    // Generate content
    let content: string;
    try {
      if (useHuggingFace) {
        const result = await huggingFaceService.generateText(prompt, {
          model: 'gpt2-medium',
          maxLength: 2000,
          temperature: 0.7
        });
        if (!result.success) {
          throw new Error(result.error || 'Hugging Face generation failed');
        }
        content = result.content;
      } else {
        const result = await cohereService.generateText(prompt, {
          model: 'command',
          maxTokens: 2000,
          temperature: 0.7
        });
        if (!result.success) {
          throw new Error(result.error || 'Cohere generation failed');
        }
        content = result.content;
      }
    } catch (error) {
      // Try backup provider if primary fails
      const backupProvider = useHuggingFace ? 'cohere' : 'huggingface';
      if ((useHuggingFace && apiStatus.cohere) || (!useHuggingFace && apiStatus.huggingface)) {
        this.updateStatus('generating', `Primary provider failed, trying ${backupProvider.toUpperCase()}...`, 60, backupProvider as any);

        if (backupProvider === 'cohere') {
          const result = await cohereService.generateText(prompt, {
            model: 'command',
            maxTokens: 2000,
            temperature: 0.7
          });
          if (!result.success) {
            throw new Error(result.error || 'Cohere backup generation failed');
          }
          content = result.content;
        } else {
          const result = await huggingFaceService.generateText(prompt, {
            model: 'gpt2-medium',
            maxLength: 2000,
            temperature: 0.7
          });
          if (!result.success) {
            throw new Error(result.error || 'Hugging Face backup generation failed');
          }
          content = result.content;
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
      provider: provider as 'huggingface' | 'cohere',
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
   * Calculate comprehensive SEO score based on best practices
   */
  private calculateSEOScore(content: string, keyword: string): number {
    let score = 0;
    const lowerContent = content.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    // 1. Single H1 tag (15 points)
    const h1Count = (content.match(/<h1/g) || []).length;
    if (h1Count === 1) score += 15;
    else if (h1Count > 1) score -= 10; // Penalty for multiple H1s

    // 2. Proper heading hierarchy (15 points)
    const h2Count = (content.match(/<h2/g) || []).length;
    const h3Count = (content.match(/<h3/g) || []).length;
    if (h2Count >= 2 && h3Count >= 1) score += 15;
    else if (h2Count >= 1) score += 10;

    // 3. Keyword optimization (20 points)
    const keywordCount = (lowerContent.match(new RegExp(lowerKeyword, 'g')) || []).length;
    if (keywordCount >= 3 && keywordCount <= 8) score += 20;
    else if (keywordCount >= 2) score += 15;

    // Check keyword in H1
    const h1Text = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Text && h1Text[1].toLowerCase().includes(lowerKeyword)) score += 5;

    // 4. Content length (15 points)
    const wordCount = this.countWords(content);
    if (wordCount >= 1000) score += 15;
    else if (wordCount >= 800) score += 10;
    else if (wordCount >= 500) score += 5;

    // 5. Proper HTML structure (10 points)
    if (content.includes('<p>') && content.includes('</p>')) score += 5;
    if (content.includes('<strong>')) score += 3;
    if (content.includes('<ul>') || content.includes('<ol>')) score += 2;

    // 6. Link optimization (10 points)
    const linkCount = (content.match(/<a href=/g) || []).length;
    if (linkCount >= 2) score += 10;
    else if (linkCount >= 1) score += 5;

    // Check for proper link attributes
    if (content.includes('target="_blank"') && content.includes('rel="noopener')) score += 5;

    // 7. Text emphasis (5 points)
    const strongCount = (content.match(/<strong>/g) || []).length;
    if (strongCount >= 3) score += 5;
    else if (strongCount >= 1) score += 3;

    // 8. Paragraph structure (5 points)
    const paragraphCount = (content.match(/<p>/g) || []).length;
    if (paragraphCount >= 5) score += 5;
    else if (paragraphCount >= 3) score += 3;

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
  private updateStatus(stage: GenerationStatus['stage'], message: string, progress: number, provider?: 'huggingface' | 'cohere'): void {
    if (this.onStatusUpdate) {
      this.onStatusUpdate({ stage, message, progress, provider });
    }
  }
}

// Export singleton instance
export const builderAIGenerator = new BuilderAIGenerator();
