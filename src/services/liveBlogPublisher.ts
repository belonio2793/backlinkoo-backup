import { supabase } from '@/integrations/supabase/client';
import { blogTemplateEngine, type GeneratedBlogPost } from './blogTemplateEngine';

interface LiveBlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaDescription: string;
  keywords: string[];
  targetUrl: string;
  publishedUrl: string;
  status: 'draft' | 'published' | 'scheduled_deletion';
  createdAt: string;
  updatedAt: string;
  userId?: string;
  isTrialPost: boolean;
  expiresAt?: string;
  viewCount: number;
  seoScore: number;
  contextualLinks: any[];
}

interface PublishResult {
  success: boolean;
  blogPost?: LiveBlogPost;
  publishedUrl?: string;
  error?: string;
}

export class LiveBlogPublisher {
  private baseUrl = 'https://content.backlinkoo.com'; // This would be your actual content domain
  private tempBaseUrl = window.location.origin; // Use current domain for demo
  public inMemoryPosts: Map<string, LiveBlogPost> = new Map(); // Demo storage

  async publishLiveBlogPost(
    keyword: string, 
    targetUrl: string, 
    userId?: string,
    wordCount?: number
  ): Promise<PublishResult> {
    try {
      // Generate the blog post using the template engine
      const generatedPost = await blogTemplateEngine.generateBlogPost(keyword, targetUrl, wordCount);
      
      // Create unique slug with timestamp to ensure uniqueness
      const uniqueSlug = `${generatedPost.slug}-${Date.now()}`;
      const publishedUrl = `${this.tempBaseUrl}/preview/${uniqueSlug}`;
      
      // Create blog post data structure
      const blogPostId = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const blogPost: LiveBlogPost = {
        id: blogPostId,
        slug: uniqueSlug,
        title: generatedPost.title,
        content: generatedPost.content,
        metaDescription: generatedPost.metaDescription,
        keywords: [keyword],
        targetUrl,
        publishedUrl,
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId,
        isTrialPost: !userId,
        expiresAt: !userId ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined,
        viewCount: 0,
        seoScore: generatedPost.seoScore,
        contextualLinks: generatedPost.contextualLinks
      };

      // Store in memory for demo purposes using slug as key (in production, this would use a proper database)
      this.inMemoryPosts.set(uniqueSlug, blogPost);
      const insertedPost = blogPost;

      // Create corresponding campaign entry using existing campaigns table
      if (userId) {
        try {
          await supabase
            .from('campaigns')
            .insert({
              name: `Live Blog: ${generatedPost.title}`,
              target_url: targetUrl,
              keywords: [keyword],
              status: 'completed',
              links_requested: generatedPost.contextualLinks.length,
              links_delivered: generatedPost.contextualLinks.length,
              completed_backlinks: [publishedUrl],
              user_id: userId,
              credits_used: 1
            });
        } catch (error) {
          console.warn('Failed to create campaign entry:', error);
        }
      }

      // Simulate actual blog publishing (in production, this would write to your blog CMS)
      await this.simulatePublishToBlog(insertedPost);

      return {
        success: true,
        blogPost: insertedPost,
        publishedUrl
      };

    } catch (error) {
      console.error('Live blog publishing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }



  private async simulatePublishToBlog(blogPost: LiveBlogPost): Promise<void> {
    // In production, this would:
    // 1. Upload to your WordPress/Ghost/Static site
    // 2. Update your sitemap
    // 3. Submit to search engines
    // 4. Setup monitoring

    // For now, we'll simulate this with a delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update in memory storage using slug
    const stored = this.inMemoryPosts.get(blogPost.slug);
    if (stored) {
      stored.updatedAt = new Date().toISOString();
      stored.status = 'published';
      this.inMemoryPosts.set(blogPost.slug, stored);
    }
  }

  async getBlogPost(slug: string): Promise<LiveBlogPost | null> {
    try {
      console.log(`🔍 Looking for post with slug: "${slug}"`);
      console.log(`📦 Available slugs:`, Array.from(this.inMemoryPosts.keys()));

      // Direct lookup by slug since we store by slug
      const post = this.inMemoryPosts.get(slug);
      if (post && post.status === 'published') {
        console.log(`✅ Found post: "${post.title}"`);
        // Increment view count
        post.viewCount = (post.viewCount || 0) + 1;
        this.inMemoryPosts.set(slug, post);
        return post;
      }

      // If not found by slug, try to find by matching slug in all posts
      for (const [key, storedPost] of this.inMemoryPosts.entries()) {
        if (storedPost.slug === slug && storedPost.status === 'published') {
          console.log(`✅ Found post via slug match: "${storedPost.title}"`);
          storedPost.viewCount = (storedPost.viewCount || 0) + 1;
          this.inMemoryPosts.set(key, storedPost);
          return storedPost;
        }
      }

      console.log(`❌ No post found for slug: "${slug}"`);
      return null;
    } catch (error) {
      console.error('Failed to get blog post:', error);
      return null;
    }
  }

  async getUserBlogPosts(userId: string): Promise<LiveBlogPost[]> {
    try {
      // Get posts from in-memory storage
      const inMemoryPosts = Array.from(this.inMemoryPosts.values())
        .filter(post => post.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Also get claimed posts from database
      let claimedPosts: LiveBlogPost[] = [];
      try {
        const { BlogClaimService } = await import('./blogClaimService');
        const dbPosts = await BlogClaimService.getUserClaimedPosts(userId);

        // Convert claimed posts to LiveBlogPost format
        claimedPosts = dbPosts.map(post => ({
          id: post.id,
          slug: post.slug,
          title: post.title,
          content: '', // Content not needed for dashboard display
          metaDescription: post.excerpt || '',
          keywords: post.tags,
          targetUrl: post.target_url,
          publishedUrl: post.published_url,
          status: 'published' as const,
          createdAt: post.created_at,
          updatedAt: post.created_at,
          userId: post.user_id,
          isTrialPost: post.is_trial_post,
          expiresAt: post.expires_at,
          viewCount: post.view_count || 0,
          seoScore: post.seo_score || 0,
          contextualLinks: []
        }));
      } catch (error) {
        console.warn('Failed to load claimed posts from database:', error);
      }

      // Combine and deduplicate posts (in-memory posts take priority)
      const allPosts = [...inMemoryPosts];
      claimedPosts.forEach(claimedPost => {
        if (!allPosts.find(inMemoryPost => inMemoryPost.slug === claimedPost.slug)) {
          allPosts.push(claimedPost);
        }
      });

      return allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Failed to get user blog posts:', error);
      return [];
    }
  }

  async getAllBlogPosts(limit = 50): Promise<LiveBlogPost[]> {
    try {
      const allPosts = Array.from(this.inMemoryPosts.values())
        .filter(post => post.status === 'published')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
      return allPosts;
    } catch (error) {
      console.error('Failed to get all blog posts:', error);
      return [];
    }
  }

  async updateBlogPost(
    postId: string,
    updates: Partial<Pick<LiveBlogPost, 'title' | 'content' | 'metaDescription' | 'keywords'>>
  ): Promise<boolean> {
    try {
      const post = this.inMemoryPosts.get(postId);
      if (!post) return false;

      // Update the post
      const updatedPost = {
        ...post,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this.inMemoryPosts.set(postId, updatedPost);

      // In production, this would also update the live blog
      await this.updateLiveBlog(postId, updates);

      return true;
    } catch (error) {
      console.error('Failed to update blog post:', error);
      return false;
    }
  }

  async deleteBlogPost(postId: string, userId?: string): Promise<boolean> {
    try {
      const post = this.inMemoryPosts.get(postId);
      if (!post) return false;

      // Verify ownership if userId provided
      if (userId && post.userId !== userId) {
        throw new Error('Unauthorized delete attempt');
      }

      // Soft delete - mark as deleted
      post.status = 'scheduled_deletion';
      post.updatedAt = new Date().toISOString();
      this.inMemoryPosts.set(postId, post);

      // In production, this would remove from live blog
      await this.removeLiveBlog(postId);

      return true;
    } catch (error) {
      console.error('Failed to delete blog post:', error);
      return false;
    }
  }

  async cleanupExpiredPosts(): Promise<number> {
    try {
      const now = new Date();

      // Find expired trial posts
      const expiredPosts: LiveBlogPost[] = [];

      for (const [id, post] of this.inMemoryPosts.entries()) {
        if (post.isTrialPost &&
            post.status === 'published' &&
            post.expiresAt &&
            new Date(post.expiresAt) < now) {
          expiredPosts.push(post);
        }
      }

      if (expiredPosts.length === 0) {
        return 0;
      }

      // Mark as deleted
      for (const post of expiredPosts) {
        post.status = 'scheduled_deletion';
        post.updatedAt = new Date().toISOString();
        this.inMemoryPosts.set(post.id, post);

        // Remove from live blog
        await this.removeLiveBlog(post.id);
      }

      return expiredPosts.length;
    } catch (error) {
      console.error('Failed to cleanup expired posts:', error);
      return 0;
    }
  }

  async extendTrialPost(postId: string, userId: string): Promise<boolean> {
    try {
      const post = this.inMemoryPosts.get(postId);
      if (!post || !post.isTrialPost) return false;

      // Convert trial to permanent
      post.userId = userId;
      post.isTrialPost = false;
      post.expiresAt = undefined;
      post.updatedAt = new Date().toISOString();

      this.inMemoryPosts.set(postId, post);
      return true;
    } catch (error) {
      console.error('Failed to extend trial post:', error);
      return false;
    }
  }

  async getPostStats(postId: string): Promise<{
    viewCount: number;
    clicks: number;
    seoScore: number;
    contextualLinks: number;
  } | null> {
    try {
      const post = this.inMemoryPosts.get(postId);
      if (!post) return null;

      return {
        viewCount: post.viewCount || 0,
        clicks: 0, // Would be tracked separately in production
        seoScore: post.seoScore || 0,
        contextualLinks: post.contextualLinks?.length || 0
      };
    } catch (error) {
      console.error('Failed to get post stats:', error);
      return null;
    }
  }

  private async updateLiveBlog(postId: string, updates: any): Promise<void> {
    // In production, this would update the actual blog post
    console.log('Updating live blog post:', postId, updates);
  }

  private async removeLiveBlog(postId: string): Promise<void> {
    // In production, this would remove the blog post from the live site
    console.log('Removing live blog post:', postId);
  }

  // Generate a realistic demo URL for the blog post
  generateDemoUrl(slug: string): string {
    return `${this.tempBaseUrl}/preview/${slug}`;
  }

  // Simulate indexing check (in production would check Google/Bing)
  async checkIndexingStatus(publishedUrl: string): Promise<{
    google: boolean;
    bing: boolean;
    lastChecked: string;
  }> {
    // Simulate indexing delay
    const daysSincePublish = Math.random() * 7;
    
    return {
      google: daysSincePublish > 1,
      bing: daysSincePublish > 2,
      lastChecked: new Date().toISOString()
    };
  }
}

// Create blog posts table if it doesn't exist (this would be in a migration)
export async function initializeBlogPostsTable() {
  // This would be handled by Supabase migrations in production
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS live_blog_posts (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      meta_description TEXT,
      keywords TEXT[],
      target_url TEXT NOT NULL,
      published_url TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      user_id UUID REFERENCES auth.users(id),
      is_trial_post BOOLEAN DEFAULT true,
      expires_at TIMESTAMPTZ,
      view_count INTEGER DEFAULT 0,
      seo_score INTEGER DEFAULT 0,
      contextual_links JSONB DEFAULT '[]'::jsonb
    );
  `;
}

export const liveBlogPublisher = new LiveBlogPublisher();
export type { LiveBlogPost, PublishResult };
