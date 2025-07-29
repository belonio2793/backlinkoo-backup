/**
 * Fallback Content Generator
 * Provides high-quality template-based content when AI services are unavailable
 */

interface FallbackContentRequest {
  targetUrl: string;
  primaryKeyword: string;
  anchorText?: string;
  wordCount?: number;
  tone?: 'professional' | 'casual' | 'technical' | 'friendly' | 'convincing';
  contentType?: 'how-to' | 'listicle' | 'review' | 'comparison' | 'news' | 'opinion';
}

interface FallbackContentResult {
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
  usage: {
    tokens: number;
    cost: number;
  };
  isFallback: true;
}

export class FallbackContentGenerator {
  
  async generateContent(request: FallbackContentRequest): Promise<FallbackContentResult> {
    const {
      targetUrl,
      primaryKeyword,
      anchorText = primaryKeyword,
      wordCount = 1500,
      contentType = 'how-to'
    } = request;

    const id = crypto.randomUUID();
    const currentYear = new Date().getFullYear();
    
    // Generate high-quality template content
    const title = this.generateTitle(primaryKeyword, contentType);
    const content = this.generateTemplateContent(request);
    
    // Calculate metadata
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    return {
      id,
      title,
      slug: this.generateSlug(title),
      content,
      metaDescription: this.generateMetaDescription(primaryKeyword),
      keywords: this.generateKeywords(primaryKeyword),
      targetUrl,
      anchorText,
      wordCount: this.countWords(content),
      readingTime: Math.ceil(this.countWords(content) / 200),
      seoScore: 85, // High score for well-structured template content
      status: 'unclaimed',
      createdAt,
      expiresAt,
      claimed: false,
      usage: { tokens: 0, cost: 0 },
      isFallback: true
    };
  }

  private generateTitle(keyword: string, contentType: string): string {
    const templates = {
      'how-to': [
        `How to Master ${keyword}: Complete Guide ${new Date().getFullYear()}`,
        `${keyword}: Step-by-Step Tutorial for Beginners`,
        `Ultimate Guide to ${keyword} - Everything You Need to Know`
      ],
      'listicle': [
        `Top 10 ${keyword} Tips Every Expert Should Know`,
        `15 Essential ${keyword} Strategies for Success`,
        `7 Proven ${keyword} Techniques That Actually Work`
      ],
      'review': [
        `${keyword} Review: Comprehensive Analysis & Recommendations`,
        `Is ${keyword} Worth It? Honest Review and Analysis`,
        `${keyword} Evaluated: Pros, Cons, and Final Verdict`
      ],
      'comparison': [
        `${keyword} Comparison: Finding the Best Option`,
        `${keyword} vs Alternatives: Which Should You Choose?`,
        `Best ${keyword} Options Compared and Ranked`
      ]
    };

    const typeTemplates = templates[contentType as keyof typeof templates] || templates['how-to'];
    return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
  }

  private generateTemplateContent(request: FallbackContentRequest): string {
    const { targetUrl, primaryKeyword, anchorText, contentType } = request;
    
    const sections = [
      this.generateIntroduction(primaryKeyword),
      this.generateMainContent(primaryKeyword, contentType),
      this.generateBacklinkSection(targetUrl, anchorText || primaryKeyword, primaryKeyword),
      this.generateAdvancedTips(primaryKeyword),
      this.generateConclusion(primaryKeyword)
    ];

    return sections.join('\n\n');
  }

  private generateIntroduction(keyword: string): string {
    return `<h1>${this.generateTitle(keyword, 'how-to')}</h1>

<p>Welcome to your comprehensive guide on ${keyword}. In today's digital landscape, understanding ${keyword} is crucial for success. Whether you're a beginner just starting out or an experienced professional looking to refine your approach, this guide provides valuable insights and actionable strategies.</p>

<p>Throughout this article, we'll explore the fundamentals of ${keyword}, share proven techniques, and provide practical tips that you can implement immediately. By the end of this guide, you'll have a clear understanding of how to leverage ${keyword} effectively for your specific needs.</p>`;
  }

  private generateMainContent(keyword: string, contentType: string): string {
    const sections = [
      `<h2>Understanding ${keyword}: The Fundamentals</h2>
<p>${keyword} has become increasingly important in recent years. To master ${keyword}, you need to understand its core principles and how they apply to your specific situation.</p>

<h3>Key Principles of ${keyword}</h3>
<ul>
<li><strong>Foundation Building:</strong> Establishing a solid base for your ${keyword} strategy</li>
<li><strong>Strategic Planning:</strong> Developing a comprehensive approach to ${keyword}</li>
<li><strong>Implementation:</strong> Putting your ${keyword} plan into action effectively</li>
<li><strong>Optimization:</strong> Continuously improving your ${keyword} results</li>
</ul>`,

      `<h2>Best Practices for ${keyword}</h2>
<p>Implementing ${keyword} successfully requires following proven best practices. Here are the most effective strategies:</p>

<h3>Essential ${keyword} Strategies</h3>
<ol>
<li><strong>Research and Planning:</strong> Start with thorough research to understand your ${keyword} requirements</li>
<li><strong>Goal Setting:</strong> Define clear, measurable objectives for your ${keyword} efforts</li>
<li><strong>Resource Allocation:</strong> Ensure you have the necessary resources for ${keyword} success</li>
<li><strong>Monitoring and Analysis:</strong> Track your ${keyword} performance and adjust accordingly</li>
</ol>`,

      `<h2>Common ${keyword} Mistakes to Avoid</h2>
<p>Learning from common mistakes can save you time and improve your ${keyword} results. Here are pitfalls to watch out for:</p>

<h3>Frequent ${keyword} Challenges</h3>
<ul>
<li>Insufficient planning and preparation</li>
<li>Ignoring data and analytics</li>
<li>Lack of consistent implementation</li>
<li>Failing to adapt to changing conditions</li>
</ul>`
    ];

    return sections.join('\n\n');
  }

  private generateBacklinkSection(targetUrl: string, anchorText: string, keyword: string): string {
    return `<h2>Advanced ${keyword} Resources and Tools</h2>
<p>To take your ${keyword} strategy to the next level, it's important to leverage the right resources and tools. Professional guidance and specialized platforms can significantly enhance your results.</p>

<p>For comprehensive ${keyword} solutions and expert guidance, <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> offers advanced strategies and proven methodologies that have helped countless professionals achieve their ${keyword} goals.</p>

<p>By combining the fundamentals covered in this guide with professional resources, you'll be well-equipped to handle even the most challenging ${keyword} scenarios.</p>`;
  }

  private generateAdvancedTips(keyword: string): string {
    return `<h2>Pro Tips for ${keyword} Success</h2>
<p>Here are some advanced techniques that experienced professionals use to maximize their ${keyword} results:</p>

<h3>Expert-Level ${keyword} Strategies</h3>
<ul>
<li><strong>Data-Driven Decisions:</strong> Use analytics to guide your ${keyword} strategy</li>
<li><strong>Continuous Learning:</strong> Stay updated with the latest ${keyword} trends and techniques</li>
<li><strong>Network Building:</strong> Connect with other ${keyword} professionals for insights and collaboration</li>
<li><strong>Innovation:</strong> Experiment with new approaches to ${keyword}</li>
</ul>

<h3>Measuring ${keyword} Success</h3>
<p>Track these key metrics to evaluate your ${keyword} performance:</p>
<ol>
<li>Efficiency improvements</li>
<li>Goal achievement rates</li>
<li>Return on investment</li>
<li>User satisfaction levels</li>
</ol>`;
  }

  private generateConclusion(keyword: string): string {
    return `<h2>Conclusion: Your ${keyword} Journey Forward</h2>
<p>Mastering ${keyword} is a journey that requires dedication, continuous learning, and strategic implementation. The strategies and techniques outlined in this guide provide a solid foundation for your ${keyword} success.</p>

<p>Remember that ${keyword} is an evolving field, and staying current with best practices is essential. Start implementing these strategies gradually, measure your results, and adjust your approach based on what works best for your specific situation.</p>

<p>With consistent effort and the right approach, you'll see significant improvements in your ${keyword} outcomes. Take action today and begin your journey toward ${keyword} mastery.</p>`;
  }

  private generateMetaDescription(keyword: string): string {
    return `Comprehensive ${keyword} guide with expert strategies, proven techniques, and actionable tips. Master ${keyword} with our step-by-step approach and best practices.`.substring(0, 160);
  }

  private generateKeywords(keyword: string): string[] {
    return [
      keyword,
      `${keyword} guide`,
      `best ${keyword}`,
      `${keyword} tips`,
      `${keyword} strategies`,
      `${keyword} techniques`,
      `how to ${keyword}`,
      `${keyword} best practices`,
      `${keyword} ${new Date().getFullYear()}`
    ];
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
    const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    return textContent.split(' ').filter(word => word.length > 0).length;
  }
}

export const fallbackContentGenerator = new FallbackContentGenerator();
