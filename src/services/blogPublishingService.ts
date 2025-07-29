/**
 * Blog Publishing Service
 * Handles automatic publishing, lifecycle management, and admin integration
 */

import { supabase } from '@/integrations/supabase/client';

export interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  content: string;
  keyword: string;
  anchor_text: string;
  target_url: string;
  word_count: number;
  provider: 'huggingface' | 'cohere';
  generation_time: number;
  seo_score: number;
  reading_time: number;
  keyword_density: number;
  created_at?: string;
  expires_at: string;
  claimed_by?: string;
  claimed_at?: string;
  status: 'published' | 'claimed' | 'expired' | 'deleted';
  generated_by_account?: string;
}

export interface BlogListItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  expires_at: string;
  word_count: number;
  claimed_by?: string;
}

export class BlogPublishingService {
  
  /**
   * Publish blog post to database and make it available on /blog
   */
  async publishBlogPost(postData: Omit<BlogPost, 'id' | 'created_at' | 'status'>): Promise<BlogPost> {
    try {
      const { data, error } = await supabase
        .from('ai_generated_posts')
        .insert([{
          ...postData,
          status: 'published',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);

        // Extract error details properly
        const errorMessage = this.extractErrorMessage(error);
        console.error('Extracted error message:', errorMessage);

        // If table doesn't exist or any database issue, use fallback
        if (
          error.code === 'PGRST116' ||
          error.code === '42P01' ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('relation') ||
          errorMessage.includes('table') ||
          errorMessage.includes('permission') ||
          !errorMessage // Empty error message indicates connection issues
        ) {
          console.warn('Database issue detected, using fallback post creation');
          return this.createFallbackPost(postData);
        }

        throw new Error(`Failed to publish blog post: ${errorMessage}`);
      }

      return data as BlogPost;
    } catch (error) {
      console.error('Unexpected error in publishBlogPost:', error);

      // For now, use fallback for any database issues since table might not exist
      console.warn('Database connection issue, using fallback post creation');
      return this.createFallbackPost(postData);
    }
  }

  /**
   * Extract meaningful error message from error object
   */
  private extractErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object') {
      // Try different error properties
      if (error.message) return error.message;
      if (error.details) return error.details;
      if (error.hint) return error.hint;
      if (error.code) return `Error code: ${error.code}`;

      // Try to stringify, but handle circular references
      try {
        const stringified = JSON.stringify(error, null, 2);
        if (stringified && stringified !== '{}') {
          return stringified;
        }
      } catch (e) {
        // Circular reference or other JSON error
      }

      // Last resort - extract own properties
      const props = Object.getOwnPropertyNames(error);
      if (props.length > 0) {
        return props.map(prop => `${prop}: ${error[prop]}`).join(', ');
      }
    }

    return 'Unknown database error';
  }

  /**
   * Create a fallback post when database is unavailable
   */
  private createFallbackPost(postData: Omit<BlogPost, 'id' | 'created_at' | 'status'>): BlogPost {
    const mockPost: BlogPost = {
      ...postData,
      id: `fallback-${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'published',
      expires_at: postData.expires_at
    };

    // Store in localStorage as backup
    try {
      localStorage.setItem(`ai_post_${mockPost.slug}`, JSON.stringify(mockPost));
      console.log('Fallback post stored in localStorage');
    } catch (err) {
      console.warn('Could not store fallback post in localStorage:', err);
    }

    return mockPost;
  }

  /**
   * Get blog post by slug (for public viewing)
   */
  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const { data, error } = await supabase
        .from('ai_generated_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          // Try localStorage fallback
          return this.getPostFromLocalStorage(slug);
        }
        return null;
      }

      return data as BlogPost;
    } catch (error) {
      console.warn('Database error, trying localStorage fallback:', error);
      return this.getPostFromLocalStorage(slug);
    }
  }

  /**
   * Get post from localStorage fallback
   */
  private getPostFromLocalStorage(slug: string): BlogPost | null {
    try {
      const stored = localStorage.getItem(`ai_post_${slug}`);
      if (stored) {
        const post = JSON.parse(stored);

        // Check if expired
        if (new Date(post.expires_at) <= new Date() && post.status === 'published') {
          localStorage.removeItem(`ai_post_${slug}`);
          return null;
        }

        return post;
      }
    } catch (error) {
      console.warn('Error reading from localStorage:', error);
    }
    return null;
  }

  /**
   * Get all published blog posts (for /blog listing)
   */
  async getPublishedBlogPosts(limit: number = 20, offset: number = 0): Promise<BlogListItem[]> {
    try {
      const { data, error } = await supabase
        .from('ai_generated_posts')
        .select('id, title, slug, status, created_at, expires_at, word_count, claimed_by')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          // Return posts from localStorage
          return this.getPostsFromLocalStorage();
        }
        throw new Error(`Failed to fetch blog posts: ${error.message}`);
      }

      return data as BlogListItem[];
    } catch (error) {
      console.warn('Database error, using localStorage fallback:', error);
      return this.getPostsFromLocalStorage();
    }
  }

  /**
   * Get posts from localStorage fallback
   */
  private getPostsFromLocalStorage(): BlogListItem[] {
    const posts: BlogListItem[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('ai_post_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const post = JSON.parse(stored);

            // Skip expired posts
            if (new Date(post.expires_at) <= new Date() && post.status === 'published') {
              localStorage.removeItem(key);
              continue;
            }

            posts.push({
              id: post.id,
              title: post.title,
              slug: post.slug,
              status: post.status,
              created_at: post.created_at,
              expires_at: post.expires_at,
              word_count: post.word_count,
              claimed_by: post.claimed_by
            });
          }
        }
      }

      // Sort by created_at descending
      posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.warn('Error reading posts from localStorage:', error);
    }

    return posts;
  }

  /**
   * Claim a blog post by user account
   */
  async claimBlogPost(postId: string, userId: string): Promise<BlogPost> {
    const { data, error } = await supabase
      .from('ai_generated_posts')
      .update({
        status: 'claimed',
        claimed_by: userId,
        claimed_at: new Date().toISOString()
      })
      .eq('id', postId)
      .eq('status', 'published')
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to claim blog post: ${error.message}`);
    }

    return data as BlogPost;
  }

  /**
   * Check if user has already generated content (one per account limit)
   */
  async hasUserGeneratedContent(accountId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('ai_generated_posts')
      .select('id')
      .eq('generated_by_account', accountId)
      .limit(1);

    if (error) {
      throw new Error(`Failed to check user generation limit: ${error.message}`);
    }

    return (data?.length || 0) > 0;
  }

  /**
   * Auto-delete expired posts (run via scheduled job)
   */
  async deleteExpiredPosts(): Promise<number> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('ai_generated_posts')
      .update({ status: 'expired' })
      .lt('expires_at', now)
      .eq('status', 'published')
      .select('id');

    if (error) {
      throw new Error(`Failed to expire posts: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Get all posts for admin dashboard
   */
  async getPostsForAdmin(limit: number = 50, offset: number = 0): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('ai_generated_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch posts for admin: ${error.message}`);
    }

    return data as BlogPost[];
  }

  /**
   * Admin delete post
   */
  async adminDeletePost(postId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_generated_posts')
      .update({ status: 'deleted' })
      .eq('id', postId);

    if (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }

  /**
   * Admin edit post
   */
  async adminUpdatePost(postId: string, updates: Partial<BlogPost>): Promise<BlogPost> {
    const { data, error } = await supabase
      .from('ai_generated_posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update post: ${error.message}`);
    }

    return data as BlogPost;
  }

  /**
   * Get post statistics for admin
   */
  async getPostStatistics(): Promise<{
    total: number;
    published: number;
    claimed: number;
    expired: number;
    deleted: number;
  }> {
    const { data, error } = await supabase
      .from('ai_generated_posts')
      .select('status');

    if (error) {
      throw new Error(`Failed to fetch statistics: ${error.message}`);
    }

    const stats = {
      total: data.length,
      published: 0,
      claimed: 0,
      expired: 0,
      deleted: 0
    };

    data.forEach(post => {
      stats[post.status as keyof typeof stats]++;
    });

    return stats;
  }

  /**
   * Generate blog HTML template for SEO-friendly display
   */
  generateBlogHTML(post: BlogPost): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title}</title>
    <meta name="description" content="${this.generateMetaDescription(post.content)}">
    <meta name="keywords" content="${post.keyword}">
    <meta property="og:title" content="${post.title}">
    <meta property="og:description" content="${this.generateMetaDescription(post.content)}">
    <meta property="og:type" content="article">
    <link rel="canonical" href="/blog/${post.slug}">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 { color: #2563eb; margin-bottom: 10px; }
        h2 { color: #1e40af; margin-top: 30px; }
        h3 { color: #1e3a8a; margin-top: 25px; }
        p { margin-bottom: 15px; }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .meta {
            color: #666;
            font-size: 14px;
            margin-bottom: 30px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .claim-banner {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 30px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="claim-banner">
        <strong>Auto-Generated Content</strong> - This post will be removed in 24 hours unless claimed by a registered user.
        <br><a href="/login">Login to claim this content</a>
    </div>
    
    <article>
        <header>
            <h1>${post.title}</h1>
            <div class="meta">
                Published: ${new Date(post.created_at || '').toLocaleDateString()} | 
                Reading time: ${post.reading_time} min | 
                Words: ${post.word_count} |
                Generated by: ${post.provider.toUpperCase()}
            </div>
        </header>
        
        <main>
            ${post.content}
        </main>
    </article>
    
    <script>
        // Add claim functionality
        document.addEventListener('DOMContentLoaded', function() {
            // Auto-redirect expired posts
            const expiresAt = new Date('${post.expires_at}');
            if (new Date() > expiresAt) {
                document.body.innerHTML = '<div style="text-align: center; padding: 50px;"><h2>Content Expired</h2><p>This content has expired and is no longer available.</p><a href="/blog">← Back to Blog</a></div>';
            }
        });
    </script>
</body>
</html>`;
  }

  /**
   * Generate meta description from content
   */
  private generateMetaDescription(content: string): string {
    const text = content.replace(/<[^>]*>/g, ''); // Strip HTML
    const words = text.split(' ').slice(0, 25).join(' ');
    return words.length > 150 ? words.substring(0, 150) + '...' : words;
  }
}

export const blogPublishingService = new BlogPublishingService();
