import { DomainBlogService, ValidatedDomain } from './domainBlogService';

export interface BlogTemplate {
  title: string;
  content: string;
  slug: string;
  meta_description: string;
  keywords: string[];
  author?: string;
  published_date: string;
}

export interface DomainBlogPost {
  id: string;
  domain_id: string;
  domain: string;
  title: string;
  slug: string;
  content: string;
  published_url: string;
  status: 'draft' | 'published' | 'failed';
  created_at: string;
  published_at?: string;
}

export class DomainBlogTemplateService {
  
  /**
   * Generate a blog post for domain publishing
   */
  static async generateBlogPost(
    keywords: string[], 
    targetUrl: string, 
    brandName?: string
  ): Promise<BlogTemplate> {
    const primaryKeyword = keywords[0] || 'business growth';
    const slug = this.generateSlug(primaryKeyword);
    const title = this.generateTitle(primaryKeyword, brandName);
    const content = this.generateBlogContent(keywords, targetUrl, brandName);
    
    return {
      title,
      content,
      slug,
      meta_description: this.generateMetaDescription(primaryKeyword, brandName),
      keywords,
      author: brandName || 'Editorial Team',
      published_date: new Date().toISOString()
    };
  }

  /**
   * Publish blog post to a specific domain
   */
  static async publishToDomain(
    domainId: string, 
    blogPost: BlogTemplate
  ): Promise<DomainBlogPost> {
    try {
      // Get domain info
      const domains = await DomainBlogService.getValidatedDomains();
      const domain = domains.find(d => d.id === domainId);
      
      if (!domain) {
        throw new Error('Domain not found or not validated');
      }

      if (!domain.blog_enabled) {
        throw new Error('Blog publishing not enabled for this domain');
      }

      // Create blog URL
      const publishedUrl = DomainBlogService.createBlogURL(
        domain.domain, 
        domain.blog_subdirectory, 
        blogPost.slug
      );

      // In a real implementation, this would:
      // 1. Upload the blog post content to the domain's blog system
      // 2. Configure SEO settings
      // 3. Set up proper URL structure
      // For now, we'll simulate the publishing process

      const blogPostRecord: DomainBlogPost = {
        id: this.generateId(),
        domain_id: domainId,
        domain: domain.domain,
        title: blogPost.title,
        slug: blogPost.slug,
        content: blogPost.content,
        published_url: publishedUrl,
        status: 'published',
        created_at: new Date().toISOString(),
        published_at: new Date().toISOString()
      };

      // Increment the published pages counter
      await DomainBlogService.incrementPublishedPages(domainId);

      return blogPostRecord;
    } catch (error) {
      console.error('Error publishing blog to domain:', error);
      throw error;
    }
  }

  /**
   * Publish to multiple domains (domain rotation)
   */
  static async publishToMultipleDomains(
    keywords: string[],
    targetUrl: string,
    maxDomains: number = 3,
    brandName?: string
  ): Promise<DomainBlogPost[]> {
    try {
      // Get available blog-enabled domains
      const availableDomains = await DomainBlogService.getBlogEnabledDomains();
      
      if (availableDomains.length === 0) {
        throw new Error('No blog-enabled domains available. Please set up domains first.');
      }

      const selectedDomains = availableDomains.slice(0, maxDomains);
      const publishedPosts: DomainBlogPost[] = [];

      for (const domain of selectedDomains) {
        try {
          // Generate unique content for each domain
          const blogPost = await this.generateBlogPost(keywords, targetUrl, brandName);
          
          // Modify title slightly for uniqueness
          blogPost.title = this.varyTitle(blogPost.title, domain.domain);
          blogPost.slug = this.generateSlug(blogPost.title);

          const published = await this.publishToDomain(domain.id, blogPost);
          publishedPosts.push(published);
          
          // Small delay between publications
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to publish to ${domain.domain}:`, error);
          // Continue with other domains even if one fails
        }
      }

      return publishedPosts;
    } catch (error) {
      console.error('Error in multi-domain publishing:', error);
      throw error;
    }
  }

  /**
   * Generate blog content with proper SEO structure
   */
  private static generateBlogContent(
    keywords: string[], 
    targetUrl: string, 
    brandName?: string
  ): string {
    const primaryKeyword = keywords[0] || 'business growth';
    const secondaryKeywords = keywords.slice(1, 3);
    
    return `
<article class="blog-post">
  <header>
    <h1>The Ultimate Guide to ${primaryKeyword}</h1>
  </header>
  
  <section class="introduction">
    <p>In today's competitive landscape, understanding <strong>${primaryKeyword}</strong> is crucial for success. This comprehensive guide will walk you through everything you need to know about implementing effective strategies that drive real results.</p>
  </section>

  <section class="main-content">
    <h2>Why ${primaryKeyword} Matters in 2024</h2>
    <p>The importance of ${primaryKeyword} cannot be overstated. Whether you're a startup or an established business, implementing the right approach to ${primaryKeyword} can make the difference between success and stagnation.</p>
    
    ${secondaryKeywords.length > 0 ? `
    <h2>Key Areas to Focus On</h2>
    <ul>
      ${secondaryKeywords.map(keyword => `<li><strong>${keyword}</strong>: Essential for comprehensive strategy</li>`).join('')}
    </ul>
    ` : ''}

    <h2>Best Practices and Implementation</h2>
    <p>When it comes to ${primaryKeyword}, following proven methodologies is essential. Here are the key strategies that leading experts recommend:</p>
    
    <ol>
      <li><strong>Strategic Planning</strong>: Begin with a clear understanding of your goals and objectives.</li>
      <li><strong>Implementation</strong>: Execute your plan with precision and attention to detail.</li>
      <li><strong>Monitoring</strong>: Continuously track progress and adjust strategies as needed.</li>
      <li><strong>Optimization</strong>: Refine your approach based on data and results.</li>
    </ol>

    <h2>Taking Action</h2>
    <p>Ready to implement these ${primaryKeyword} strategies? The next step is crucial for your success. <a href="${targetUrl}" target="_blank" rel="noopener">Learn more about professional implementation solutions</a> that can accelerate your results.</p>
  </section>

  <section class="conclusion">
    <h2>Conclusion</h2>
    <p>Mastering ${primaryKeyword} requires dedication, the right strategies, and often professional guidance. By following the approaches outlined in this guide, you'll be well-positioned to achieve meaningful results in your ${primaryKeyword} initiatives.</p>
    
    <p><em>For personalized guidance and advanced strategies, <a href="${targetUrl}" target="_blank" rel="noopener">explore our comprehensive resources</a> designed to help you succeed.</em></p>
  </section>
</article>

<style>
.blog-post {
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
  color: #333;
}

.blog-post h1 {
  color: #2c3e50;
  border-bottom: 3px solid #3498db;
  padding-bottom: 10px;
}

.blog-post h2 {
  color: #34495e;
  margin-top: 2em;
}

.blog-post a {
  color: #3498db;
  text-decoration: none;
}

.blog-post a:hover {
  text-decoration: underline;
}

.blog-post ul, .blog-post ol {
  padding-left: 20px;
}

.blog-post li {
  margin-bottom: 5px;
}
</style>
    `.trim();
  }

  /**
   * Generate SEO-optimized title
   */
  private static generateTitle(keyword: string, brandName?: string): string {
    const templates = [
      `The Complete Guide to ${keyword}`,
      `Master ${keyword}: Expert Tips and Strategies`,
      `${keyword}: Everything You Need to Know`,
      `Unlock Success with ${keyword}`,
      `Professional ${keyword} Strategies That Work`
    ];
    
    const baseTitle = templates[Math.floor(Math.random() * templates.length)];
    return brandName ? `${baseTitle} | ${brandName}` : baseTitle;
  }

  /**
   * Vary title for uniqueness across domains
   */
  private static varyTitle(title: string, domain: string): string {
    const variations = [
      `${title} - Complete Guide`,
      `${title}: Professional Insights`,
      `${title} - Expert Analysis`,
      `${title}: Comprehensive Overview`
    ];
    
    return variations[Math.floor(Math.random() * variations.length)];
  }

  /**
   * Generate URL-friendly slug
   */
  private static generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 60);
  }

  /**
   * Generate meta description
   */
  private static generateMetaDescription(keyword: string, brandName?: string): string {
    const base = `Discover professional ${keyword} strategies and expert insights. Complete guide with actionable tips for success.`;
    return brandName ? `${base} Trusted by ${brandName}.` : base;
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `blog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get available domains for publishing
   */
  static async getAvailableDomains(): Promise<ValidatedDomain[]> {
    return await DomainBlogService.getBlogEnabledDomains();
  }

  /**
   * Get domain blog statistics
   */
  static async getPublishingStats() {
    return await DomainBlogService.getBlogStats();
  }
}

export default DomainBlogTemplateService;
