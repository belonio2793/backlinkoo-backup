import { supabase } from '@/integrations/supabase/client';
import { blogTemplateEngine } from './blogTemplateEngine';

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
      // Generate the blog post content using existing AI services
      const generatedPost = await blogTemplateEngine.generateBlogPost(keyword, targetUrl, wordCount);
      
      // Create unique slug
      const uniqueSlug = `${generatedPost.slug}-${Date.now()}`;

      // Create URLs for both domains to ensure accessibility
      const currentDomainUrl = `${window.location.origin}/blog/${uniqueSlug}`;
      const backlinkooUrl = `https://backlinkoo.com/blog/${uniqueSlug}`;

      // Use backlinkoo.com as primary published URL, current domain as fallback
      const publishedUrl = backlinkooUrl;
      
      // Create blog post data
      const blogPost: PublishedBlogPost = {
        id: `blog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        slug: uniqueSlug,
        title: generatedPost.title,
        content: generatedPost.content,
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
        author_name: 'Backlinkoo Team',
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
            .from('published_blog_posts')
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
        .from('published_blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
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
      const { data, error } = await supabase
        .from('published_blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
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
        .from('published_blog_posts')
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
    const words = content.toLowerCase()
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
    const keywordTags = keyword.split(' ').slice(0, 2);
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
        .from('published_blog_posts')
        .delete()
        .eq('is_trial_post', true)
        .lt('expires_at', now.toISOString());
    } catch (error) {
      console.warn('Failed to cleanup expired trial posts from database:', error);
    }
  }

  // Public method to save blog posts directly (for development/mock data)
  saveBlogPost(blogPost: PublishedBlogPost): void {
    this.inMemoryPosts.set(blogPost.slug, blogPost);
    console.log(`✅ Blog post saved to in-memory storage: ${blogPost.slug}`);
  }
}

export const publishedBlogService = new PublishedBlogService();
