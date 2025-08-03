interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  keywords: string[];
  targetUrl: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  authorId?: string;
  isTrial?: boolean;
  trialExpiresAt?: string;
}

interface PublishingResult {
  success: boolean;
  publishedUrl?: string;
  backlinkUrl?: string;
  error?: string;
}

interface BacklinkData {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  createdAt: string;
  status: 'active' | 'pending' | 'removed';
}

export class BlogPublisher {
  private domain = 'backlinkoo.com';
  private blogPath = '/blog';

  async publishPost(post: BlogPost): Promise<PublishingResult> {
    try {
      // Simulate publishing process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate URLs
      const publishedUrl = `https://${this.domain}${this.blogPath}/${post.slug}`;
      const backlinkUrl = publishedUrl;

      // In a real implementation, this would:
      // 1. Save the post to a database/CMS
      // 2. Generate static HTML files
      // 3. Upload to CDN/hosting
      // 4. Create backlink entry
      // 5. Submit to search engines

      // Set trial expiration for free posts
      const trialExpiresAt = new Date();
      trialExpiresAt.setHours(trialExpiresAt.getHours() + 24);

      const publishedPost = {
        ...post,
        id: post.id || this.generateId(),
        status: 'published' as const,
        publishedAt: new Date().toISOString(),
        isTrial: true,
        trialExpiresAt: trialExpiresAt.toISOString()
      };

      // Store in local storage for demo purposes
      this.saveToLocalStorage(publishedPost);

      // Create backlink record
      await this.createBacklink({
        sourceUrl: publishedUrl,
        targetUrl: post.targetUrl,
        anchorText: this.extractAnchorText(post.content),
        createdAt: new Date().toISOString(),
        status: 'active'
      });

      return {
        success: true,
        publishedUrl,
        backlinkUrl
      };

    } catch (error) {
      console.error('Publishing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async createBacklink(backlinkData: BacklinkData): Promise<boolean> {
    try {
      // In production, this would:
      // 1. Validate the target URL
      // 2. Create database entry
      // 3. Set up monitoring
      // 4. Send notifications

      const backlinks = this.getBacklinksFromStorage();
      backlinks.push({
        ...backlinkData,
        id: this.generateId()
      });
      
      localStorage.setItem('blog_backlinks', JSON.stringify(backlinks));
      
      // Simulate external API call for backlink verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Backlink creation failed:', error);
      return false;
    }
  }

  async generateSEOOptimizedHTML(post: BlogPost): Promise<string> {
    const currentDate = new Date().toISOString().split('T')[0];

    // Escape HTML special characters for safe insertion
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    };

    // Escape JSON special characters
    const escapeJson = (text: string) => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
    };

    const safeTitle = escapeHtml(post.title);
    const safeDescription = escapeHtml(post.metaDescription);
    const safeKeywords = escapeHtml(post.keywords.join(', '));
    const jsonTitle = escapeJson(post.title);
    const jsonDescription = escapeJson(post.metaDescription);
    const jsonKeywords = escapeJson(post.keywords.join(', '));

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}">
    <meta name="keywords" content="${safeKeywords}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://${this.domain}${this.blogPath}/${post.slug}">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDescription}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://${this.domain}${this.blogPath}/${post.slug}">
    <meta property="twitter:title" content="${safeTitle}">
    <meta property="twitter:description" content="${safeDescription}">

    <!-- SEO Meta Tags -->
    <meta name="robots" content="index, follow">
    <meta name="author" content="Backlink ∞">
    <meta name="publisher" content="Backlink ∞">
    <link rel="canonical" href="https://${this.domain}${this.blogPath}/${post.slug}">

    <!-- Schema.org markup -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "${jsonTitle}",
        "description": "${jsonDescription}",
        "author": {
            "@type": "Organization",
            "name": "Backlink ∞"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Backlink ∞",
            "logo": {
                "@type": "ImageObject",
                "url": "https://${this.domain}/logo.png"
            }
        },
        "datePublished": "${post.publishedAt || post.createdAt}",
        "dateModified": "${post.publishedAt || post.createdAt}",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "https://${this.domain}${this.blogPath}/${post.slug}"
        },
        "keywords": "${jsonKeywords}"
    }
    </script>
    
    <link rel="stylesheet" href="/css/blog.css">
</head>
<body>
    <header>
        <nav>
            <a href="https://${this.domain}">Backlink ∞</a>
        </nav>
    </header>
    
    <main class="article-content">
        <article>
            ${post.content}
            
            <div class="article-footer">
                <p><strong>Published by <a href="https://${this.domain}">Backlink ∞</a></strong> - The premier platform for high-quality backlink services.</p>
                <p><em>Looking to improve your SEO with quality backlinks? <a href="https://${this.domain}">Start your campaign today</a>.</em></p>
            </div>
        </article>
    </main>
    
    <footer>
        <p>&copy; 2024 Backlink ∞. All rights reserved.</p>
    </footer>
</body>
</html>`;
  }

  async submitToSearchEngines(postUrl: string): Promise<boolean> {
    try {
      // In production, this would submit to:
      // 1. Google Search Console
      // 2. Bing Webmaster Tools
      // 3. Other search engines
      
      console.log(`Submitting ${postUrl} to search engines...`);
      
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return true;
    } catch (error) {
      console.error('Search engine submission failed:', error);
      return false;
    }
  }

  async getBacklinkAnalytics(postSlug: string): Promise<any> {
    // Simulate backlink analytics data
    return {
      postUrl: `https://${this.domain}${this.blogPath}/${postSlug}`,
      totalClicks: Math.floor(Math.random() * 500) + 50,
      uniqueVisitors: Math.floor(Math.random() * 300) + 30,
      conversionRate: (Math.random() * 5 + 1).toFixed(2),
      backlinkStrength: Math.floor(Math.random() * 40) + 60,
      domainAuthority: 85,
      pageAuthority: Math.floor(Math.random() * 30) + 50
    };
  }

  getPublishedPosts(): BlogPost[] {
    try {
      const posts = localStorage.getItem('published_blog_posts');
      return posts ? JSON.parse(posts) : [];
    } catch {
      return [];
    }
  }

  getBacklinks(): any[] {
    return this.getBacklinksFromStorage();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveToLocalStorage(post: BlogPost): void {
    try {
      const posts = this.getPublishedPosts();
      const existingIndex = posts.findIndex(p => p.id === post.id);
      
      if (existingIndex >= 0) {
        posts[existingIndex] = post;
      } else {
        posts.push(post);
      }
      
      localStorage.setItem('published_blog_posts', JSON.stringify(posts));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private getBacklinksFromStorage(): any[] {
    try {
      const backlinks = localStorage.getItem('blog_backlinks');
      return backlinks ? JSON.parse(backlinks) : [];
    } catch {
      return [];
    }
  }

  private extractAnchorText(content: string): string {
    // Extract the first strong/underlined link text for anchor text
    const matches = content.match(/<(?:strong|u)><a[^>]*>([^<]+)<\/a><\/(?:strong|u)>/i) ||
                   content.match(/<a[^>]*><(?:strong|u)>([^<]+)<\/(?:strong|u)><\/a>/i) ||
                   content.match(/<a[^>]*>([^<]+)<\/a>/i);
    
    return matches ? matches[1] : 'Learn more';
  }

  // Utility method to validate URLs
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Generate sitemap entry for the published post
  generateSitemapEntry(post: BlogPost): string {
    const postUrl = `https://${this.domain}${this.blogPath}/${post.slug}`;
    const lastmod = post.publishedAt || post.createdAt;

    return `
  <url>
    <loc>${postUrl}</loc>
    <lastmod>${lastmod.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  // Create a sample campaign for dashboard display
  async createSampleCampaign(blogPost: BlogPost): Promise<any> {
    const sampleCampaign = {
      id: blogPost.id || this.generateId(),
      target_url: blogPost.targetUrl,
      keywords: blogPost.keywords.join(', '),
      links_requested: 1,
      links_delivered: 1,
      status: blogPost.isTrial ? 'trial' : 'completed',
      created_at: blogPost.createdAt,
      completed_at: blogPost.publishedAt,
      campaign_type: 'Blog Post Backlink',
      domain_rating: 85,
      traffic_estimated: Math.floor(Math.random() * 500) + 100,
      backlink_url: `https://${this.domain}${this.blogPath}/${blogPost.slug}`,
      anchor_text: this.extractAnchorText(blogPost.content),
      is_trial: blogPost.isTrial || false,
      trial_expires_at: blogPost.trialExpiresAt,
      blog_post_title: blogPost.title,
      word_count: blogPost.content.split(' ').length
    };

    // Store sample campaign
    try {
      const existingCampaigns = JSON.parse(localStorage.getItem('sample_campaigns') || '[]');
      existingCampaigns.push(sampleCampaign);
      localStorage.setItem('sample_campaigns', JSON.stringify(existingCampaigns));
      return sampleCampaign;
    } catch (error) {
      console.error('Failed to save sample campaign:', error);
      return null;
    }
  }

  getSampleCampaigns(): any[] {
    try {
      return JSON.parse(localStorage.getItem('sample_campaigns') || '[]');
    } catch {
      return [];
    }
  }
}

// Export singleton instance
export const blogPublisher = new BlogPublisher();

// Export types
export type { BlogPost, PublishingResult, BacklinkData };
