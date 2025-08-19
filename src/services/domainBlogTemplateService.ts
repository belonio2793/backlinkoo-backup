import { DomainBlogService, ValidatedDomain } from './domainBlogService';
import BlogThemesService, { BlogTheme } from './blogThemesService';
import { supabase } from '@/integrations/supabase/client';

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

export interface DomainThemeRecord {
  id: string;
  domain_id: string;
  theme_id: string;
  theme_name: string;
  custom_styles: Record<string, any>;
  custom_settings: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class DomainBlogTemplateService {

  /**
   * Get theme settings for a specific domain
   */
  static async getDomainTheme(domainId: string): Promise<DomainThemeRecord | null> {
    try {
      const { data, error } = await supabase
        .from('domain_blog_themes')
        .select('*')
        .eq('domain_id', domainId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        const errorMessage = error.message || error.details || JSON.stringify(error);
        console.error('Error fetching domain theme:', errorMessage, error);
        throw new Error(`Failed to fetch domain theme: ${errorMessage}`);
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message :
                          error && typeof error === 'object' ? JSON.stringify(error) :
                          String(error);

      if (errorMessage.includes('does not exist') || errorMessage.includes('domain_blog_themes')) {
        console.warn('⚠️ Domain blog themes table not set up. Run: npm run setup:blog-themes');
      } else {
        console.error('Error in getDomainTheme:', errorMessage, error);
      }
      return null;
    }
  }

  /**
   * Set theme for a specific domain
   */
  static async setDomainTheme(
    domainId: string,
    themeId: string,
    customStyles: Record<string, any> = {},
    customSettings: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const theme = BlogThemesService.getThemeById(themeId);
      if (!theme) {
        throw new Error(`Theme ${themeId} not found`);
      }

      const { error } = await supabase.rpc('update_domain_blog_theme', {
        p_domain_id: domainId,
        p_theme_id: themeId,
        p_theme_name: theme.name,
        p_custom_styles: customStyles,
        p_custom_settings: customSettings
      });

      if (error) {
        // Handle missing function gracefully
        if (error.message?.includes('Could not find the function') ||
            error.message?.includes('update_domain_blog_theme')) {
          console.warn('⚠️ Domain blog theme function not set up. Run: npm run setup:blog-themes');
          // Try fallback approach using direct table insert/update
          return await this.setDomainThemeFallback(domainId, themeId, customStyles, customSettings);
        }

        const errorMessage = error.message || error.details || JSON.stringify(error);
        console.error('Error setting domain theme:', errorMessage, error);
        return false;
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message :
                          error && typeof error === 'object' ? JSON.stringify(error) :
                          String(error);

      if (errorMessage.includes('Could not find the function') ||
          errorMessage.includes('update_domain_blog_theme')) {
        console.warn('⚠️ Domain blog theme function not set up. Run: npm run setup:blog-themes');
        return await this.setDomainThemeFallback(domainId, themeId, customStyles, customSettings);
      }

      console.error('Error in setDomainTheme:', errorMessage, error);
      return false;
    }
  }

  /**
   * Fallback method for setting domain theme without database function
   */
  private static async setDomainThemeFallback(
    domainId: string,
    themeId: string,
    customStyles: Record<string, any> = {},
    customSettings: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const theme = BlogThemesService.getThemeById(themeId);
      if (!theme) {
        throw new Error(`Theme ${themeId} not found`);
      }

      // Deactivate current theme
      await supabase
        .from('domain_blog_themes')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('domain_id', domainId)
        .eq('is_active', true);

      // Insert new active theme
      const { error } = await supabase
        .from('domain_blog_themes')
        .insert({
          domain_id: domainId,
          theme_id: themeId,
          theme_name: theme.name,
          custom_styles: customStyles,
          custom_settings: customSettings,
          is_active: true
        });

      if (error) {
        console.error('Error in fallback theme setting:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in setDomainThemeFallback:', error);
      return false;
    }
  }

  /**
   * Ensure default theme for domain when blog is enabled
   */
  static async ensureDefaultTheme(domainId: string): Promise<void> {
    try {
      const existingTheme = await this.getDomainTheme(domainId);

      if (!existingTheme) {
        await this.setDomainTheme(domainId, 'minimal');
        console.log(`✅ Default theme assigned to domain ${domainId}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message :
                          error && typeof error === 'object' ? JSON.stringify(error) :
                          String(error);
      console.error('Error ensuring default theme:', errorMessage, error);
    }
  }

  /**
   * Get all themes for blog-enabled domains
   */
  static async getAllDomainThemes(): Promise<DomainThemeRecord[]> {
    try {
      const { data, error } = await supabase
        .from('domain_blog_themes')
        .select(`
          *,
          domains!inner (
            domain,
            blog_enabled,
            status
          )
        `)
        .eq('is_active', true)
        .eq('domains.blog_enabled', true)
        .eq('domains.status', 'active');

      if (error) {
        // Handle missing table gracefully
        if (error.message?.includes('does not exist') || error.message?.includes('domain_blog_themes')) {
          console.warn('⚠️ Domain blog themes table not set up. Run: npm run setup:blog-themes');
          return [];
        }

        const errorMessage = error.message || error.details || JSON.stringify(error);
        console.error('Error fetching all domain themes:', errorMessage, error);
        return [];
      }

      return data || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message :
                          error && typeof error === 'object' ? JSON.stringify(error) :
                          String(error);
      console.error('Error in getAllDomainThemes:', errorMessage, error);
      return [];
    }
  }

  /**
   * Generate a blog post for domain publishing
   */
  static async generateBlogPost(
    keywords: string[],
    targetUrl: string,
    brandName?: string,
    themeId?: string,
    domainId?: string
  ): Promise<BlogTemplate> {
    const primaryKeyword = keywords[0] || 'business growth';
    const slug = this.generateSlug(primaryKeyword);
    const title = this.generateTitle(primaryKeyword, brandName);
    const rawContent = this.generateBlogContent(keywords, targetUrl, brandName);

    // Get domain-specific theme if domainId is provided
    let finalThemeId = themeId || 'minimal';
    let customStyles = {};

    if (domainId) {
      const domainTheme = await this.getDomainTheme(domainId);
      if (domainTheme) {
        finalThemeId = domainTheme.theme_id;
        customStyles = domainTheme.custom_styles || {};
      }
    }

    // Apply theme to content
    const theme = BlogThemesService.getThemeById(finalThemeId) || BlogThemesService.getDefaultTheme();
    const themedContent = BlogThemesService.generateThemedBlogPost(rawContent, title, theme, customStyles);

    return {
      title,
      content: themedContent,
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

      // Ensure domain has a default theme assigned
      await this.ensureDefaultTheme(domainId);

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

      // Store blog post in database
      try {
        const domainTheme = await this.getDomainTheme(domainId);

        await supabase
          .from('domain_blog_posts')
          .insert({
            domain_id: domainId,
            domain_name: domain.domain,
            title: blogPost.title,
            slug: blogPost.slug,
            content: blogPost.content,
            published_url: publishedUrl,
            theme_id: domainTheme?.theme_id || 'minimal',
            status: 'published',
            keywords: blogPost.keywords,
            meta_description: blogPost.meta_description,
            published_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.error('Error storing blog post in database:', dbError);
        // Don't throw - the post was published successfully
      }

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
          // Generate unique content for each domain using domain-specific theme
          const blogPost = await this.generateBlogPost(keywords, targetUrl, brandName, undefined, domain.id);

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
