import type { BlogPost } from '@/types/blogTypes';
import { SEOAnalyzer } from './seoAnalyzer';

interface ExternalBlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  published_at: string;
  author?: string;
  meta_description?: string;
  featured_image?: string;
  categories?: string[];
  tags?: string[];
  view_count?: number;
  reading_time?: number;
}

export class ExternalBlogService {
  private static readonly BASE_URL = 'https://backlinkoo.com';
  private static readonly API_ENDPOINT = '/api/blog/posts'; // Assuming REST API endpoint
  private static readonly BLOG_URL = '/blog';

  /**
   * Fetch blog posts from external website
   */
  static async fetchExternalBlogPosts(): Promise<BlogPost[]> {
    try {
      // First, try to fetch from API endpoint if available
      try {
        const response = await fetch(`${this.BASE_URL}${this.API_ENDPOINT}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'BacklinkApp/1.0'
          }
        });

        if (response.ok) {
          const data = await response.json();
          return this.transformExternalPosts(data.posts || data);
        }
      } catch (apiError) {
        console.log('API endpoint not available, trying blog page scraping...');
      }

      // Fallback: Scrape blog page if API not available
      const response = await fetch(`${this.BASE_URL}${this.BLOG_URL}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'User-Agent': 'BacklinkApp/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch blog posts: ${response.status}`);
      }

      const html = await response.text();
      return this.extractBlogPostsFromHTML(html);

    } catch (error) {
      console.error('Error fetching external blog posts:', error);
      // Return fallback data if external fetch fails
      return this.getFallbackPosts();
    }
  }

  /**
   * Transform external blog post format to internal format
   */
  private static transformExternalPosts(externalPosts: ExternalBlogPost[]): BlogPost[] {
    return externalPosts.map((post, index) => ({
      id: post.id || `external-${index}`,
      title: post.title,
      slug: post.slug,
      content: post.content || '',
      excerpt: post.excerpt || post.meta_description || '',
      keywords: [...(post.categories || []), ...(post.tags || [])],
      meta_description: post.meta_description || post.excerpt || '',
      target_url: `${this.BASE_URL}/blog/${post.slug}`,
      anchor_text: post.title, // Use title as default anchor text
      seo_score: SEOAnalyzer.analyzeBlogPost(
        post.title,
        post.content || '',
        post.meta_description
      ).overallScore,
      reading_time: post.reading_time || Math.ceil((post.content?.length || 1000) / 200),
      published_url: `${this.BASE_URL}/blog/${post.slug}`,
      is_trial_post: false,
      expires_at: '',
      created_at: post.published_at,
      updated_at: post.published_at
    }));
  }

  /**
   * Extract blog posts from HTML (fallback method)
   */
  private static extractBlogPostsFromHTML(html: string): BlogPost[] {
    try {
      // Create a temporary div to parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Look for common blog post selectors
      const postElements = doc.querySelectorAll('article, .post, .blog-post, [class*="post"]');
      const posts: BlogPost[] = [];

      postElements.forEach((element, index) => {
        try {
          const titleElement = element.querySelector('h1, h2, h3, .title, [class*="title"]');
          const linkElement = element.querySelector('a[href*="/blog/"]') || element.querySelector('a');
          const dateElement = element.querySelector('time, .date, [class*="date"]');
          const excerptElement = element.querySelector('.excerpt, .summary, p');

          if (titleElement && linkElement) {
            const title = titleElement.textContent?.trim() || `Blog Post ${index + 1}`;
            const href = linkElement.getAttribute('href') || '';
            const slug = href.split('/').pop() || `post-${index}`;
            const dateText = dateElement?.textContent?.trim() || dateElement?.getAttribute('datetime') || new Date().toISOString();
            
            const targetUrl = href.startsWith('http') ? href : `${this.BASE_URL}${href}`;
            const excerpt = excerptElement?.textContent?.trim().substring(0, 160) || '';

            posts.push({
              id: `scraped-${index}`,
              title,
              slug,
              content: excerpt, // Use excerpt as content for scraped posts
              excerpt,
              keywords: this.extractKeywords(title),
              meta_description: excerpt,
              target_url: targetUrl,
              anchor_text: title,
              seo_score: Math.floor(Math.random() * 25) + 75,
              reading_time: Math.floor(Math.random() * 8) + 3,
              published_url: targetUrl,
              is_trial_post: false,
              expires_at: '',
              created_at: this.parseDate(dateText),
              updated_at: this.parseDate(dateText)
            });
          }
        } catch (parseError) {
          console.warn(`Error parsing blog post element ${index}:`, parseError);
        }
      });

      return posts.length > 0 ? posts : this.getFallbackPosts();

    } catch (error) {
      console.error('Error parsing HTML:', error);
      return this.getFallbackPosts();
    }
  }

  /**
   * Parse date string to ISO format
   */
  private static parseDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  /**
   * Extract keywords from title
   */
  private static extractKeywords(title: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'when', 'where', 'why'];
    const words = title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    return words.slice(0, 5); // Return first 5 keywords
  }

  /**
   * Fallback blog posts if external fetch fails
   */
  private static getFallbackPosts(): BlogPost[] {
    return [
      {
        id: 'fallback-1',
        title: 'The Complete Guide to SEO Optimization',
        slug: 'complete-guide-seo-optimization',
        content: 'Learn the complete guide to SEO optimization with proven strategies that work. This comprehensive guide covers everything from keyword research to technical SEO, helping you boost your website rankings effectively.',
        excerpt: 'Learn the complete guide to SEO optimization with proven strategies that work.',
        keywords: ['seo', 'optimization', 'search', 'engine'],
        meta_description: 'Learn the complete guide to SEO optimization with proven strategies that work.',
        target_url: 'https://backlinkoo.com/blog/complete-guide-seo-optimization',
        anchor_text: 'SEO Optimization Guide',
        seo_score: 95,
        reading_time: 8,
        published_url: 'https://backlinkoo.com/blog/complete-guide-seo-optimization',
        is_trial_post: false,
        expires_at: '',
        created_at: new Date('2024-01-15').toISOString(),
        updated_at: new Date('2024-01-15').toISOString()
      },
      {
        id: 'fallback-2',
        title: 'Best Link Building Strategies for 2024',
        slug: 'best-link-building-strategies-2024',
        content: 'Discover the most effective link building strategies for 2024. From guest posting to digital PR, learn how to build high-quality backlinks that improve your search rankings.',
        excerpt: 'Discover the most effective link building strategies for 2024.',
        keywords: ['link', 'building', 'backlinks', 'strategy'],
        meta_description: 'Discover the most effective link building strategies for 2024.',
        target_url: 'https://backlinkoo.com/blog/best-link-building-strategies-2024',
        anchor_text: 'Link Building Strategies',
        seo_score: 88,
        reading_time: 6,
        published_url: 'https://backlinkoo.com/blog/best-link-building-strategies-2024',
        is_trial_post: false,
        expires_at: '',
        created_at: new Date('2024-01-10').toISOString(),
        updated_at: new Date('2024-01-10').toISOString()
      },
      {
        id: 'fallback-3',
        title: 'Content Marketing Automation Tools',
        slug: 'content-marketing-automation-tools',
        content: 'Top content marketing automation tools to streamline your workflow. Learn how to automate your content creation, distribution, and analysis for better results.',
        excerpt: 'Top content marketing automation tools to streamline your workflow.',
        keywords: ['content', 'marketing', 'automation', 'tools'],
        meta_description: 'Top content marketing automation tools to streamline your workflow.',
        target_url: 'https://backlinkoo.com/blog/content-marketing-automation-tools',
        anchor_text: 'Marketing Automation Tools',
        seo_score: 82,
        reading_time: 5,
        published_url: 'https://backlinkoo.com/blog/content-marketing-automation-tools',
        is_trial_post: false,
        expires_at: '',
        created_at: new Date('2024-01-05').toISOString(),
        updated_at: new Date('2024-01-05').toISOString()
      }
    ];
  }

  /**
   * Get a single blog post by slug from external source
   */
  static async fetchExternalBlogPost(slug: string): Promise<BlogPost | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/blog/${slug}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'User-Agent': 'BacklinkApp/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch blog post: ${response.status}`);
      }

      const html = await response.text();
      const posts = this.extractBlogPostsFromHTML(html);
      
      return posts.find(post => post.slug === slug) || null;

    } catch (error) {
      console.error(`Error fetching external blog post ${slug}:`, error);
      return null;
    }
  }
}
