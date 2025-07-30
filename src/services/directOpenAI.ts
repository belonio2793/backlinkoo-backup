/**
 * Direct OpenAI Service
 * Simple, efficient OpenAI API integration without fallbacks or testing
 */

export interface DirectOpenAIRequest {
  targetUrl: string;
  primaryKeyword: string;
  anchorText?: string;
  wordCount?: number;
}

export interface DirectOpenAIResult {
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
  status: 'unclaimed';
  createdAt: string;
  expiresAt: string;
  claimed: false;
}

export class DirectOpenAIService {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  async generateBlogPost(request: DirectOpenAIRequest): Promise<DirectOpenAIResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const {
      targetUrl,
      primaryKeyword,
      anchorText = primaryKeyword,
      wordCount = 1500
    } = request;

    const prompt = this.createPrompt(targetUrl, primaryKeyword, anchorText, wordCount);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert SEO content writer. Create high-quality blog posts with natural backlink integration.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 3000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      if (!content) {
        throw new Error('No content generated');
      }

      return this.formatResult(content, request);

    } catch (error) {
      console.error('OpenAI generation failed:', error);
      throw error;
    }
  }

  private createPrompt(targetUrl: string, primaryKeyword: string, anchorText: string, wordCount: number): string {
    return `Create a comprehensive ${wordCount}-word blog post about "${primaryKeyword}" that naturally incorporates a backlink.

REQUIREMENTS:
- Write exactly ${wordCount} words of high-quality, original content
- Focus on "${primaryKeyword}" as the main topic
- Use professional tone throughout
- Include practical, actionable advice
- Structure with proper headings (H1, H2, H3)
- Natural integration of anchor text "${anchorText}" linking to ${targetUrl}

CONTENT STRUCTURE:
1. Compelling H1 title with the primary keyword
2. Engaging introduction
3. 4-6 main sections with H2 headings
4. Natural placement of backlink: "${anchorText}" → ${targetUrl}
5. Strong conclusion

SEO OPTIMIZATION:
- Include primary keyword "${primaryKeyword}" naturally throughout
- Use semantic keywords and related terms
- Add numbered lists or bullet points
- Write compelling meta description

BACKLINK INTEGRATION:
- Place the backlink "${anchorText}" naturally within the content
- Make the link contextually relevant
- Use it as a resource or reference point

OUTPUT FORMAT:
Return the content as HTML with proper tags:
- Use <h1> for main title
- Use <h2> for main sections
- Use <h3> for subsections
- Use <p> for paragraphs
- Use <ul>/<ol> and <li> for lists
- Use <strong> for emphasis
- Use <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> for the backlink

Create valuable, informative content that helps readers while naturally incorporating the backlink.`;
  }

  private formatResult(content: string, request: DirectOpenAIRequest): DirectOpenAIResult {
    const id = crypto.randomUUID();
    const title = this.extractTitle(content) || `Complete Guide to ${request.primaryKeyword}`;
    const slug = this.generateSlug(title);
    const wordCount = this.countWords(content);
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return {
      id,
      title,
      slug,
      content: this.processContent(content, request),
      metaDescription: `Comprehensive ${request.primaryKeyword} guide with expert insights and practical tips.`,
      keywords: [
        request.primaryKeyword,
        `${request.primaryKeyword} guide`,
        `best ${request.primaryKeyword}`,
        `${request.primaryKeyword} tips`,
        `${request.primaryKeyword} ${new Date().getFullYear()}`
      ],
      targetUrl: request.targetUrl,
      anchorText: request.anchorText || request.primaryKeyword,
      wordCount,
      readingTime: Math.ceil(wordCount / 200),
      seoScore: this.calculateSEOScore(content, request),
      status: 'unclaimed',
      createdAt,
      expiresAt,
      claimed: false
    };
  }

  private extractTitle(content: string): string | null {
    const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : null;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 60)
      .replace(/^-+|-+$/g, '');
  }

  private countWords(content: string): number {
    const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return textContent.split(' ').filter(word => word.length > 0).length;
  }

  private processContent(content: string, request: DirectOpenAIRequest): string {
    let processed = content.trim();

    // Ensure backlink is present
    if (!processed.includes(request.targetUrl)) {
      const sections = processed.split('\n\n');
      if (sections.length > 2) {
        const midIndex = Math.floor(sections.length / 2);
        const linkText = request.anchorText || request.primaryKeyword;
        const linkHtml = `<a href="${request.targetUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
        const linkParagraph = `<p>For more information about ${request.primaryKeyword}, ${linkHtml} provides expert resources and solutions.</p>`;
        sections.splice(midIndex, 0, linkParagraph);
        processed = sections.join('\n\n');
      }
    }

    return processed;
  }

  private calculateSEOScore(content: string, request: DirectOpenAIRequest): number {
    let score = 70;

    if (content.includes('<h1>')) score += 5;
    if ((content.match(/<h2[^>]*>/g) || []).length >= 3) score += 5;
    if (content.includes('<ul>') || content.includes('<ol>')) score += 5;
    if (content.includes(request.targetUrl)) score += 10;

    const textContent = content.replace(/<[^>]+>/g, ' ').toLowerCase();
    const keywordOccurrences = (textContent.match(new RegExp(request.primaryKeyword.toLowerCase(), 'g')) || []).length;
    const wordCount = textContent.split(' ').filter(w => w.length > 0).length;
    const density = (keywordOccurrences / wordCount) * 100;
    
    if (density >= 1 && density <= 3) score += 5;

    return Math.min(score, 100);
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.startsWith('sk-'));
  }
}

export const directOpenAI = new DirectOpenAIService();
