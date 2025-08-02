import { supabase } from '@/integrations/supabase/client';
// Deprecated: import { blogTemplateEngine } from './blogTemplateEngine';
import { formatBlogTitle, formatBlogContent } from '@/utils/textFormatting';

export interface PublishedBlogPost {
  id: string;
  user_id?: string;
  slug: string;
  title: string;
  content: string;
  meta_description?: string;
  excerpt?: string;
  keywords: string[];
  target_url: string;
  published_url: string;
  status: 'draft' | 'published' | 'archived';
  is_trial_post: boolean;
  expires_at?: string;
  view_count: number;
  seo_score: number;
  contextual_links: any[];
  reading_time: number;
  word_count: number;
  featured_image?: string;
  author_name: string;
  author_avatar?: string;
  tags: string[];
  category: string;
  created_at: string;
  updated_at: string;
  published_at: string;
}

export interface CreateBlogPostParams {
  keyword: string;
  targetUrl: string;
  userId?: string;
  isTrialPost?: boolean;
  wordCount?: number;
}

export class PublishedBlogService {
  // In-memory storage for demo/trial posts (fallback when DB isn't available)
  private inMemoryPosts: Map<string, PublishedBlogPost> = new Map();

  async createBlogPost(params: CreateBlogPostParams): Promise<PublishedBlogPost> {
    const { keyword, targetUrl, userId, isTrialPost = false, wordCount = 1200 } = params;

    try {
      // Template engine deprecated - redirect to AI Live Generator
      console.warn('Template engine deprecated. Please use /ai-live for fresh AI content generation.');

      // Return a placeholder directing users to AI Live Generator
      const generatedPost = {
        title: `Fresh AI Content Available: ${keyword}`,
        slug: `ai-live-redirect-${Date.now()}`,
        content: `<div style="padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; text-align: center;">
          <h1>🚀 Fresh AI Content Generation</h1>
          <p style="font-size: 1.2em; margin: 1rem 0;">Templates have been replaced with fresh AI generation!</p>
          <p>Visit <strong><a href="/ai-live" style="color: #fff; text-decoration: underline;">AI Live Blog Generator</a></strong> for:</p>
          <ul style="text-align: left; max-width: 400px; margin: 1rem auto;">
            <li>✨ Unique content every time</li>
            <li>🎯 SEO-optimized structure</li>
            <li>📝 1000+ words of quality content</li>
            <li>🔗 Natural anchor text integration</li>
            <li>⚡ Real-time generation</li>
          </ul>
          <p style="margin-top: 2rem;"><a href="/ai-live" style="background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 5px; color: white; text-decoration: none; border: 1px solid rgba(255,255,255,0.3);">Generate Fresh Content Now →</a></p>
        </div>`,
        wordCount: 300,
        excerpt: 'Templates deprecated. Use AI Live Generator for fresh content.',
        readingTime: 2,
        contextualLinks: []
      };
      
      // Create unique slug
      const uniqueSlug = `${generatedPost.slug}-${Date.now()}`;
      const publishedUrl = `${window.location.origin}/blog/${uniqueSlug}`;
      
      // Create blog post data with formatting
      const formattedTitle = formatBlogTitle(generatedPost.title);
      const formattedContent = formatBlogContent(generatedPost.content);

      const blogPost: PublishedBlogPost = {
        id: `blog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        slug: uniqueSlug,
        title: formattedTitle,
        content: formattedContent,
        meta_description: generatedPost.metaDescription,
        excerpt: generatedPost.excerpt,
        keywords: [keyword, ...this.extractKeywordsFromContent(generatedPost.content)],
        target_url: targetUrl,
        published_url: publishedUrl,
        status: 'published',
        is_trial_post: isTrialPost,
        expires_at: isTrialPost ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined,
        view_count: 0,
        seo_score: generatedPost.seoScore,
        contextual_links: generatedPost.contextualLinks,
        reading_time: generatedPost.readingTime,
        word_count: generatedPost.wordCount,
        featured_image: this.generateFeaturedImage(keyword),
        author_name: 'Backlink ∞',
        author_avatar: '/placeholder.svg',
        tags: this.generateTags(keyword, targetUrl),
        category: this.categorizeContent(keyword),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString()
      };

      // Try to save to database first
      if (userId) {
        try {
          const { data, error } = await supabase
            .from('blog_posts')
            .insert(blogPost)
            .select()
            .single();

          if (error) {
            console.warn('Database save failed, using in-memory storage:', error);
            this.inMemoryPosts.set(blogPost.slug, blogPost);
          } else {
            console.log('✅ Blog post saved to database:', data);
            return data as PublishedBlogPost;
          }
        } catch (dbError) {
          console.warn('Database error, using in-memory storage:', dbError);
          this.inMemoryPosts.set(blogPost.slug, blogPost);
        }
      } else {
        // For trial posts, always use in-memory storage
        this.inMemoryPosts.set(blogPost.slug, blogPost);
      }

      return blogPost;
    } catch (error) {
      console.error('Failed to create blog post:', error);
      throw new Error('Failed to generate blog post content');
    }
  }

  async getBlogPostBySlug(slug: string): Promise<PublishedBlogPost | null> {
    // Try database first
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single();

      if (data && !error) {
        // Increment view count
        await this.incrementViewCount(slug);
        return data as PublishedBlogPost;
      }
    } catch (dbError) {
      console.warn('Database query failed, checking in-memory storage:', dbError);
    }

    // Fallback to in-memory storage
    const post = this.inMemoryPosts.get(slug);
    if (post && post.status === 'published') {
      // Check if trial post has expired
      if (post.is_trial_post && post.expires_at) {
        const now = new Date();
        const expiresAt = new Date(post.expires_at);
        if (now > expiresAt) {
          this.inMemoryPosts.delete(slug);
          return null;
        }
      }
      
      // Increment view count for in-memory posts
      post.view_count += 1;
      this.inMemoryPosts.set(slug, post);
      
      return post;
    }

    return null;
  }

  async getRecentBlogPosts(limit: number = 10): Promise<PublishedBlogPost[]> {
    try {
      console.log('📖 Fetching blog posts from Supabase blog_posts table...');
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (data && !error) {
        return data as PublishedBlogPost[];
      }
    } catch (dbError) {
      console.warn('Database query failed, using in-memory storage:', dbError);
    }

    // Fallback to in-memory storage
    const posts = Array.from(this.inMemoryPosts.values())
      .filter(post => post.status === 'published')
      .filter(post => {
        // Filter out expired trial posts
        if (post.is_trial_post && post.expires_at) {
          const now = new Date();
          const expiresAt = new Date(post.expires_at);
          return now <= expiresAt;
        }
        return true;
      })
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, limit);

    return posts;
  }

  async getUserBlogPosts(userId: string): Promise<PublishedBlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data && !error) {
        return data as PublishedBlogPost[];
      }
    } catch (dbError) {
      console.warn('Database query failed:', dbError);
    }

    // Fallback to in-memory storage
    const posts = Array.from(this.inMemoryPosts.values())
      .filter(post => post.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return posts;
  }

  private async incrementViewCount(slug: string): Promise<void> {
    try {
      await supabase.rpc('increment_blog_post_views', { post_slug: slug });
    } catch (error) {
      console.warn('Failed to increment view count:', error);
    }
  }

  private extractKeywordsFromContent(content: string): string[] {
    // Simple keyword extraction - can be enhanced
    const words = content
      // Strip HTML tags first
      .replace(/<[^>]*>/g, ' ')
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private generateFeaturedImage(keyword: string): string {
    // Generate a placeholder image URL - in production, you'd use a real image service
    const encodedKeyword = encodeURIComponent(keyword);
    return `https://images.unsplash.com/1600x900/?${encodedKeyword}`;
  }

  private generateTags(keyword: string, targetUrl: string): string[] {
    const domain = new URL(targetUrl).hostname.replace('www.', '');
    // Strip HTML tags from keyword before splitting
    const cleanKeyword = keyword.replace(/<[^>]*>/g, '');
    const keywordTags = cleanKeyword.split(' ').slice(0, 2);
    return [...keywordTags, domain, 'SEO', 'digital marketing'];
  }

  private categorizeContent(keyword: string): string {
    const lowerKeyword = keyword.toLowerCase();
    
    if (lowerKeyword.includes('marketing') || lowerKeyword.includes('seo')) {
      return 'Digital Marketing';
    } else if (lowerKeyword.includes('tech') || lowerKeyword.includes('software')) {
      return 'Technology';
    } else if (lowerKeyword.includes('business') || lowerKeyword.includes('startup')) {
      return 'Business';
    } else if (lowerKeyword.includes('health') || lowerKeyword.includes('fitness')) {
      return 'Health & Wellness';
    } else if (lowerKeyword.includes('travel') || lowerKeyword.includes('tourism')) {
      return 'Travel';
    } else if (lowerKeyword.includes('finance') || lowerKeyword.includes('money')) {
      return 'Finance';
    } else {
      return 'General';
    }
  }

  // Clean up expired trial posts
  async cleanupExpiredTrialPosts(): Promise<void> {
    const now = new Date();
    
    // Clean up in-memory posts
    for (const [slug, post] of this.inMemoryPosts.entries()) {
      if (post.is_trial_post && post.expires_at) {
        const expiresAt = new Date(post.expires_at);
        if (now > expiresAt) {
          this.inMemoryPosts.delete(slug);
        }
      }
    }

    // Clean up database posts
    try {
      await supabase
        .from('blog_posts')
        .delete()
        .eq('is_trial_post', true)
        .lt('expires_at', now.toISOString());
    } catch (error) {
      console.warn('Failed to cleanup expired trial posts from database:', error);
    }
  }
}

export const publishedBlogService = new PublishedBlogService();
