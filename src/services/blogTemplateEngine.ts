interface BlogTemplate {
  id: string;
  name: string;
  structure: string[];
  style: 'how-to' | 'listicle' | 'review' | 'comparison' | 'guide' | 'analysis';
  minWordCount: number;
  maxWordCount: number;
  contextualLinkStrategy: 'early' | 'middle' | 'multiple' | 'conclusion';
}

interface ContentSection {
  heading: string;
  content: string;
  includeLink?: boolean;
  linkAnchor?: string;
  linkContext?: string;
}

interface GeneratedBlogPost {
  template: BlogTemplate;
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  excerpt: string;
  contextualLinks: Array<{
    anchorText: string;
    targetUrl: string;
    position: number;
    context: string;
    relevanceScore: number;
  }>;
  readingTime: number;
  wordCount: number;
  seoScore: number;
}

export class BlogTemplateEngine {
  private templates: BlogTemplate[] = [
    {
      id: 'ultimate-guide',
      name: 'The Ultimate Guide',
      structure: ['introduction', 'overview', 'detailed-sections', 'best-practices', 'conclusion'],
      style: 'guide',
      minWordCount: 1500,
      maxWordCount: 2500,
      contextualLinkStrategy: 'multiple'
    },
    {
      id: 'step-by-step',
      name: 'Step-by-Step Tutorial',
      structure: ['introduction', 'prerequisites', 'step-sections', 'troubleshooting', 'conclusion'],
      style: 'how-to',
      minWordCount: 1200,
      maxWordCount: 2000,
      contextualLinkStrategy: 'middle'
    },
    {
      id: 'comprehensive-review',
      name: 'Comprehensive Review',
      structure: ['introduction', 'overview', 'features', 'pros-cons', 'comparison', 'verdict'],
      style: 'review',
      minWordCount: 1000,
      maxWordCount: 1800,
      contextualLinkStrategy: 'early'
    },
    {
      id: 'top-strategies',
      name: 'Top Strategies Listicle',
      structure: ['introduction', 'strategy-list', 'implementation', 'results', 'conclusion'],
      style: 'listicle',
      minWordCount: 1200,
      maxWordCount: 2000,
      contextualLinkStrategy: 'multiple'
    },
    {
      id: 'vs-comparison',
      name: 'Versus Comparison',
      structure: ['introduction', 'option-a', 'option-b', 'comparison-table', 'recommendation'],
      style: 'comparison',
      minWordCount: 1000,
      maxWordCount: 1600,
      contextualLinkStrategy: 'conclusion'
    },
    {
      id: 'expert-analysis',
      name: 'Expert Analysis',
      structure: ['introduction', 'current-state', 'analysis', 'insights', 'predictions', 'conclusion'],
      style: 'analysis',
      minWordCount: 1300,
      maxWordCount: 2200,
      contextualLinkStrategy: 'multiple'
    }
  ];

  private anchorTextVariations = [
    'expert {keyword} services',
    'professional {keyword} solutions',
    'comprehensive {keyword} platform',
    'leading {keyword} provider',
    'trusted {keyword} experts',
    'advanced {keyword} tools',
    'proven {keyword} strategies',
    '{keyword} specialists',
    'top-rated {keyword} service',
    'premium {keyword} solutions'
  ];

  getRandomTemplate(): BlogTemplate {
    return this.templates[Math.floor(Math.random() * this.templates.length)];
  }

  async generateBlogPost(keyword: string, targetUrl: string, wordCount?: number): Promise<GeneratedBlogPost> {
    const template = this.getRandomTemplate();
    const targetWordCount = wordCount || this.getRandomWordCount(template);
    
    const title = this.generateTitle(keyword, template);
    const slug = this.generateSlug(title);
    const metaDescription = this.generateMetaDescription(keyword, template);
    
    const sections = await this.generateSections(keyword, targetUrl, template, targetWordCount);
    const content = this.assembleBlogPost(title, sections, template);
    const excerpt = this.generateExcerpt(content);
    
    const contextualLinks = this.extractContextualLinks(content, targetUrl, keyword);
    const readingTime = Math.ceil(targetWordCount / 200); // 200 WPM average
    const seoScore = this.calculateSEOScore(content, keyword, contextualLinks);

    return {
      template,
      title,
      slug,
      metaDescription,
      content,
      excerpt,
      contextualLinks,
      readingTime,
      wordCount: targetWordCount,
      seoScore
    };
  }

  private getRandomWordCount(template: BlogTemplate): number {
    return Math.floor(Math.random() * (template.maxWordCount - template.minWordCount + 1)) + template.minWordCount;
  }

  private generateTitle(keyword: string, template: BlogTemplate): string {
    const titleTemplates = {
      'ultimate-guide': [
        `The Ultimate Guide to ${keyword} in 2024`,
        `Complete ${keyword} Guide: Everything You Need to Know`,
        `Master ${keyword}: The Definitive Guide`,
        `${keyword} Mastery: A Comprehensive Guide`
      ],
      'step-by-step': [
        `How to Master ${keyword}: Step-by-Step Guide`,
        `${keyword} Tutorial: Complete Step-by-Step Process`,
        `Learn ${keyword}: A Step-by-Step Approach`,
        `${keyword} Made Simple: Step-by-Step Instructions`
      ],
      'comprehensive-review': [
        `${keyword} Review: Is It Worth It in 2024?`,
        `Complete ${keyword} Review and Analysis`,
        `${keyword}: Honest Review and Recommendations`,
        `In-Depth ${keyword} Review: Pros, Cons, and Verdict`
      ],
      'top-strategies': [
        `Top 10 ${keyword} Strategies That Actually Work`,
        `15 Proven ${keyword} Techniques for Success`,
        `Best ${keyword} Strategies: Expert Recommendations`,
        `${keyword} Success: Top Strategies Revealed`
      ],
      'vs-comparison': [
        `${keyword} vs Alternatives: Which Is Better?`,
        `Comparing ${keyword} Options: Complete Analysis`,
        `${keyword} Comparison: Finding the Best Solution`,
        `${keyword} Showdown: Detailed Comparison`
      ],
      'expert-analysis': [
        `${keyword} in 2024: Expert Analysis and Insights`,
        `The Future of ${keyword}: Expert Perspective`,
        `${keyword} Trends: What Experts Are Saying`,
        `Professional ${keyword} Analysis: Key Insights`
      ]
    };

    const templates = titleTemplates[template.id] || titleTemplates['ultimate-guide'];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private generateMetaDescription(keyword: string, template: BlogTemplate): string {
    const descriptions = [
      `Discover everything about ${keyword} with our comprehensive guide. Expert insights, proven strategies, and actionable tips included.`,
      `Learn ${keyword} from industry experts. Complete guide with practical examples, best practices, and professional recommendations.`,
      `Master ${keyword} with our detailed analysis. Get expert advice, proven methods, and real-world applications.`,
      `Ultimate ${keyword} resource with expert insights, practical tips, and proven strategies for success.`
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private async generateSections(
    keyword: string, 
    targetUrl: string, 
    template: BlogTemplate, 
    wordCount: number
  ): Promise<ContentSection[]> {
    const sections: ContentSection[] = [];
    const wordsPerSection = Math.floor(wordCount / template.structure.length);

    for (const [index, sectionType] of template.structure.entries()) {
      const section = await this.generateSection(
        sectionType, 
        keyword, 
        targetUrl, 
        wordsPerSection, 
        template,
        index
      );
      sections.push(section);
    }

    return sections;
  }

  private async generateSection(
    sectionType: string,
    keyword: string,
    targetUrl: string,
    wordCount: number,
    template: BlogTemplate,
    index: number
  ): Promise<ContentSection> {
    const shouldIncludeLink = this.shouldIncludeLink(sectionType, template, index);
    const linkAnchor = shouldIncludeLink ? this.generateAnchorText(keyword) : undefined;

    const sectionGenerators = {
      introduction: () => this.generateIntroduction(keyword, linkAnchor, targetUrl),
      overview: () => this.generateOverview(keyword, linkAnchor, targetUrl),
      'detailed-sections': () => this.generateDetailedSection(keyword, linkAnchor, targetUrl),
      'best-practices': () => this.generateBestPractices(keyword, linkAnchor, targetUrl),
      conclusion: () => this.generateConclusion(keyword, linkAnchor, targetUrl),
      prerequisites: () => this.generatePrerequisites(keyword, linkAnchor, targetUrl),
      'step-sections': () => this.generateStepSection(keyword, linkAnchor, targetUrl),
      troubleshooting: () => this.generateTroubleshooting(keyword, linkAnchor, targetUrl),
      features: () => this.generateFeatures(keyword, linkAnchor, targetUrl),
      'pros-cons': () => this.generateProsCons(keyword, linkAnchor, targetUrl),
      comparison: () => this.generateComparison(keyword, linkAnchor, targetUrl),
      verdict: () => this.generateVerdict(keyword, linkAnchor, targetUrl),
      'strategy-list': () => this.generateStrategyList(keyword, linkAnchor, targetUrl),
      implementation: () => this.generateImplementation(keyword, linkAnchor, targetUrl),
      results: () => this.generateResults(keyword, linkAnchor, targetUrl),
      'option-a': () => this.generateOptionA(keyword, linkAnchor, targetUrl),
      'option-b': () => this.generateOptionB(keyword, linkAnchor, targetUrl),
      'comparison-table': () => this.generateComparisonTable(keyword, linkAnchor, targetUrl),
      recommendation: () => this.generateRecommendation(keyword, linkAnchor, targetUrl),
      'current-state': () => this.generateCurrentState(keyword, linkAnchor, targetUrl),
      analysis: () => this.generateAnalysis(keyword, linkAnchor, targetUrl),
      insights: () => this.generateInsights(keyword, linkAnchor, targetUrl),
      predictions: () => this.generatePredictions(keyword, linkAnchor, targetUrl)
    };

    const generator = sectionGenerators[sectionType] || sectionGenerators.introduction;
    const sectionData = generator();

    return {
      ...sectionData,
      includeLink: shouldIncludeLink,
      linkAnchor,
      linkContext: shouldIncludeLink ? `Learn more about ${keyword}` : undefined
    };
  }

  private shouldIncludeLink(sectionType: string, template: BlogTemplate, index: number): boolean {
    switch (template.contextualLinkStrategy) {
      case 'early':
        return index <= 1;
      case 'middle':
        return index === Math.floor(template.structure.length / 2);
      case 'conclusion':
        return index === template.structure.length - 1;
      case 'multiple':
        return index === 1 || index === template.structure.length - 1;
      default:
        return index === 1;
    }
  }

  private generateAnchorText(keyword: string): string {
    const variations = this.anchorTextVariations;
    const selected = variations[Math.floor(Math.random() * variations.length)];
    return selected.replace('{keyword}', keyword);
  }

  // Section generators - these create high-quality, contextual content
  private generateIntroduction(keyword: string, linkAnchor?: string, targetUrl?: string) {
    const content = `
      <p class="lead">In today's competitive digital landscape, understanding <strong>${keyword}</strong> is crucial for success. Whether you're a beginner looking to get started or an experienced professional seeking to refine your approach, this comprehensive guide will provide you with the insights and strategies you need.</p>
      
      <p>The world of ${keyword} has evolved significantly, and staying ahead requires not just knowledge, but the right approach and tools. ${linkAnchor && targetUrl ? `Working with <a href="${targetUrl}" target="_blank" rel="noopener noreferrer"><strong>${linkAnchor}</strong></a> can provide the expertise and resources needed to achieve exceptional results.` : `This guide covers everything from fundamental concepts to advanced strategies.`}</p>
      
      <p>Throughout this guide, we'll explore proven methodologies, real-world applications, and expert insights that will help you master ${keyword} and achieve your goals more effectively.</p>
    `;
    
    return {
      heading: `Introduction to ${keyword}`,
      content: content.trim()
    };
  }

  private generateOverview(keyword: string, linkAnchor?: string, targetUrl?: string) {
    const content = `
      <p><strong>${keyword}</strong> encompasses a wide range of strategies and techniques that have proven effective across various industries. Understanding the fundamental principles is essential for success.</p>
      
      <h3>Key Components of ${keyword}</h3>
      <ul>
        <li><strong>Strategic Planning:</strong> Developing a comprehensive approach tailored to your specific needs</li>
        <li><strong>Implementation:</strong> Executing strategies with precision and attention to detail</li>
        <li><strong>Optimization:</strong> Continuously improving performance based on data and results</li>
        <li><strong>Monitoring:</strong> Tracking progress and making necessary adjustments</li>
      </ul>
      
      <p>${linkAnchor && targetUrl ? `Professional <a href="${targetUrl}" target="_blank" rel="noopener noreferrer"><strong>${linkAnchor}</strong></a> understand these components and can help you navigate the complexities effectively.` : `These components work together to create a comprehensive ${keyword} strategy.`}</p>
    `;
    
    return {
      heading: `${keyword} Overview`,
      content: content.trim()
    };
  }

  private generateDetailedSection(keyword: string, linkAnchor?: string, targetUrl?: string) {
    const content = `
      <p>When diving deeper into <em>${keyword}</em>, it's important to understand the nuances that separate good results from exceptional ones. This section explores the detailed aspects that professionals focus on.</p>
      
      <h3>Advanced Strategies</h3>
      <p>Successful ${keyword} implementation requires attention to several critical factors:</p>
      
      <ol>
        <li><strong>Research and Analysis:</strong> Thorough understanding of your market and competition</li>
        <li><strong>Target Audience Identification:</strong> Precise definition of who you're trying to reach</li>
        <li><strong>Content Strategy:</strong> Developing messaging that resonates with your audience</li>
        <li><strong>Technical Implementation:</strong> Ensuring all technical aspects are properly configured</li>
      </ol>
      
      <p>${linkAnchor && targetUrl ? `Experienced <a href="${targetUrl}" target="_blank" rel="noopener noreferrer"><strong>${linkAnchor}</strong></a> have the expertise to handle these complex requirements and deliver superior results.` : `Each of these elements plays a crucial role in overall ${keyword} success.`}</p>
    `;
    
    return {
      heading: `Advanced ${keyword} Strategies`,
      content: content.trim()
    };
  }

  private generateBestPractices(keyword: string, linkAnchor?: string, targetUrl?: string) {
    const content = `
      <p>Following industry best practices is essential for achieving consistent results with <strong>${keyword}</strong>. These proven methodologies have been refined through years of experience and testing.</p>
      
      <h3>Essential Best Practices</h3>
      <div class="best-practices-grid">
        <div class="practice-item">
          <h4>Consistency is Key</h4>
          <p>Maintain regular, high-quality efforts rather than sporadic intensive campaigns.</p>
        </div>
        
        <div class="practice-item">
          <h4>Data-Driven Decisions</h4>
          <p>Base all strategic decisions on solid data and measurable results.</p>
        </div>
        
        <div class="practice-item">
          <h4>Continuous Learning</h4>
          <p>Stay updated with industry trends and evolving best practices.</p>
        </div>
        
        <div class="practice-item">
          <h4>Quality Over Quantity</h4>
          <p>Focus on high-quality implementations rather than volume-based approaches.</p>
        </div>
      </div>
      
      <p>${linkAnchor && targetUrl ? `Professional <a href="${targetUrl}" target="_blank" rel="noopener noreferrer"><strong>${linkAnchor}</strong></a> follow these best practices consistently and can help ensure your ${keyword} efforts meet the highest standards.` : `Implementing these practices consistently will significantly improve your ${keyword} results.`}</p>
    `;
    
    return {
      heading: `${keyword} Best Practices`,
      content: content.trim()
    };
  }

  private generateConclusion(keyword: string, linkAnchor?: string, targetUrl?: string) {
    const content = `
      <p>Mastering <strong>${keyword}</strong> requires dedication, the right strategy, and consistent execution. Throughout this guide, we've covered the essential elements that contribute to success in this field.</p>
      
      <h3>Key Takeaways</h3>
      <ul>
        <li>Understanding fundamentals is crucial for long-term success</li>
        <li>Consistent application of best practices yields the best results</li>
        <li>Continuous learning and adaptation are essential</li>
        <li>Professional guidance can accelerate your progress significantly</li>
      </ul>
      
      <p>The investment in proper ${keyword} strategies pays dividends over time. Whether you're just starting or looking to improve existing efforts, the principles outlined in this guide will serve you well.</p>
      
      <p>${linkAnchor && targetUrl ? `Ready to take your ${keyword} efforts to the next level? <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="cta-link"><strong>${linkAnchor}</strong></a> provide the expertise and support needed to achieve exceptional results.` : `Apply these strategies consistently, and you'll see significant improvements in your ${keyword} performance.`}</p>
    `;
    
    return {
      heading: 'Conclusion',
      content: content.trim()
    };
  }

  // Additional section generators for other template types
  private generatePrerequisites(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `Prerequisites for ${keyword}`,
      content: `<p>Before diving into ${keyword}, ensure you have the necessary foundation and resources in place for success.</p>`
    };
  }

  private generateStepSection(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `Step-by-Step ${keyword} Process`,
      content: `<p>Follow this detailed step-by-step process to implement ${keyword} effectively.</p>`
    };
  }

  private generateTroubleshooting(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `${keyword} Troubleshooting`,
      content: `<p>Common issues and solutions when working with ${keyword}.</p>`
    };
  }

  private generateFeatures(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `Key ${keyword} Features`,
      content: `<p>Essential features and capabilities that make ${keyword} effective.</p>`
    };
  }

  private generateProsCons(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `${keyword} Pros and Cons`,
      content: `<p>Balanced analysis of the advantages and potential drawbacks of ${keyword}.</p>`
    };
  }

  private generateComparison(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `${keyword} Comparison`,
      content: `<p>Detailed comparison of different ${keyword} approaches and solutions.</p>`
    };
  }

  private generateVerdict(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `Final Verdict on ${keyword}`,
      content: `<p>Our final assessment and recommendations regarding ${keyword}.</p>`
    };
  }

  private generateStrategyList(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `Top ${keyword} Strategies`,
      content: `<p>Proven strategies for maximizing ${keyword} effectiveness.</p>`
    };
  }

  private generateImplementation(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `${keyword} Implementation`,
      content: `<p>Practical steps for implementing ${keyword} in your organization.</p>`
    };
  }

  private generateResults(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `Expected ${keyword} Results`,
      content: `<p>What results to expect from proper ${keyword} implementation.</p>`
    };
  }

  private generateOptionA(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `${keyword} Option A`,
      content: `<p>Detailed analysis of the first ${keyword} option.</p>`
    };
  }

  private generateOptionB(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `${keyword} Option B`,
      content: `<p>Comprehensive review of the alternative ${keyword} approach.</p>`
    };
  }

  private generateComparisonTable(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `${keyword} Comparison Table`,
      content: `<p>Side-by-side comparison of ${keyword} options.</p>`
    };
  }

  private generateRecommendation(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `${keyword} Recommendation`,
      content: `<p>Our expert recommendation for ${keyword} implementation.</p>`
    };
  }

  private generateCurrentState(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `Current State of ${keyword}`,
      content: `<p>Analysis of the current ${keyword} landscape and trends.</p>`
    };
  }

  private generateAnalysis(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `${keyword} Analysis`,
      content: `<p>In-depth analysis of ${keyword} trends and patterns.</p>`
    };
  }

  private generateInsights(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `${keyword} Insights`,
      content: `<p>Key insights and findings about ${keyword}.</p>`
    };
  }

  private generatePredictions(keyword: string, linkAnchor?: string, targetUrl?: string) {
    return {
      heading: `${keyword} Future Predictions`,
      content: `<p>Expert predictions about the future of ${keyword}.</p>`
    };
  }

  private assembleBlogPost(title: string, sections: ContentSection[], template: BlogTemplate): string {
    let content = `<h1>${title}</h1>\n\n`;
    
    sections.forEach(section => {
      content += `<h2>${section.heading}</h2>\n`;
      content += `${section.content}\n\n`;
    });

    return content;
  }

  private generateExcerpt(content: string): string {
    const textContent = content.replace(/<[^>]*>/g, '');
    const sentences = textContent.split('.').slice(0, 3);
    return sentences.join('.') + '.';
  }

  private extractContextualLinks(content: string, targetUrl: string, keyword: string) {
    const links: any[] = [];
    const linkMatches = content.match(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g);
    
    if (linkMatches) {
      linkMatches.forEach((match, index) => {
        const hrefMatch = match.match(/href="([^"]*)"/);
        const textMatch = match.match(/>([^<]*)</);
        
        if (hrefMatch && textMatch && hrefMatch[1] === targetUrl) {
          links.push({
            anchorText: textMatch[1].replace(/<[^>]*>/g, ''),
            targetUrl: hrefMatch[1],
            position: content.indexOf(match),
            context: this.extractLinkContext(content, content.indexOf(match)),
            relevanceScore: this.calculateRelevanceScore(textMatch[1], keyword)
          });
        }
      });
    }
    
    return links;
  }

  private extractLinkContext(content: string, position: number): string {
    const start = Math.max(0, position - 100);
    const end = Math.min(content.length, position + 100);
    return content.substring(start, end).replace(/<[^>]*>/g, '');
  }

  private calculateRelevanceScore(anchorText: string, keyword: string): number {
    const anchor = anchorText.toLowerCase();
    const key = keyword.toLowerCase();
    
    if (anchor.includes(key)) return 1.0;
    if (anchor.includes(key.split(' ')[0])) return 0.8;
    return 0.6;
  }

  private calculateSEOScore(content: string, keyword: string, links: any[]): number {
    let score = 0;
    const textContent = content.replace(/<[^>]*>/g, '');
    const wordCount = textContent.split(/\s+/).length;
    
    // Keyword density (1-3% is optimal)
    const keywordCount = (textContent.match(new RegExp(keyword, 'gi')) || []).length;
    const density = (keywordCount / wordCount) * 100;
    if (density >= 1 && density <= 3) score += 25;
    else score += Math.max(0, 25 - Math.abs(density - 2) * 5);
    
    // Content length
    if (wordCount >= 1000) score += 25;
    else score += (wordCount / 1000) * 25;
    
    // Contextual links
    score += Math.min(25, links.length * 8);
    
    // Structure (headings)
    const h2Count = (content.match(/<h2>/g) || []).length;
    const h3Count = (content.match(/<h3>/g) || []).length;
    if (h2Count >= 3 && h3Count >= 2) score += 25;
    else score += Math.min(25, (h2Count + h3Count) * 3);
    
    return Math.round(score);
  }
}

export const blogTemplateEngine = new BlogTemplateEngine();
export type { GeneratedBlogPost, BlogTemplate };
