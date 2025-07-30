/**
 * Blog Auto-Delete Service
 * Handles 24-hour auto-deletion of unclaimed blog posts
 */

import { supabase } from '@/integrations/supabase/client';

export interface ExpiredPost {
  id: string;
  slug: string;
  publishedUrl: string;
  title: string;
  createdAt: string;
  expiresAt: string;
}

export class BlogAutoDeleteService {
  private cleanupInterval?: number;
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Check every hour

  /**
   * Debug function to test the exact error
   */
  async debugDatabaseConnection(): Promise<void> {
    console.log('🔍 DEBUG: Testing database connection...');

    try {
      // Test 1: Basic connection
      console.log('🔍 Test 1: Basic Supabase connection');
      const { data: basicTest, error: basicError } = await supabase.from('blog_posts').select('count', { count: 'exact', head: true });

      if (basicError) {
        console.error('❌ Basic connection failed:', {
          message: basicError.message,
          details: basicError.details,
          hint: basicError.hint,
          code: basicError.code,
          fullError: basicError
        });
        return;
      }

      console.log('✅ Basic connection successful, count:', basicTest);

      // Test 2: Table structure check
      console.log('🔍 Test 2: Checking table structure');
      const { data: structureTest, error: structureError } = await supabase
        .from('blog_posts')
        .select('*')
        .limit(1);

      if (structureError) {
        console.error('❌ Table structure check failed:', {
          message: structureError.message,
          details: structureError.details,
          hint: structureError.hint,
          code: structureError.code,
          fullError: structureError
        });
        return;
      }

      console.log('✅ Table structure check passed, sample data:', structureTest);

      // Test 3: Actual query that's failing
      console.log('🔍 Test 3: Testing the actual failing query');
      const now = new Date().toISOString();
      const { data: queryTest, error: queryError } = await supabase
        .from('blog_posts')
        .select('id, slug, published_url, title, created_at, expires_at')
        .eq('status', 'unclaimed')
        .eq('is_trial_post', true)
        .lt('expires_at', now);

      if (queryError) {
        console.error('❌ Query test failed:', {
          message: queryError.message,
          details: queryError.details,
          hint: queryError.hint,
          code: queryError.code,
          fullError: queryError,
          query: {
            table: 'blog_posts',
            select: 'id, slug, published_url, title, created_at, expires_at',
            filters: {
              status: 'unclaimed',
              is_trial_post: true,
              expires_at_lt: now
            }
          }
        });
        return;
      }

      console.log('✅ Query test passed, results:', queryTest);

    } catch (error) {
      console.error('❌ DEBUG: Caught exception:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
        stringified: String(error)
      });
    }
  }

  constructor() {
    // Don't start automatic cleanup immediately to avoid startup errors
    // this.startCleanupInterval();
    console.log('📝 BlogAutoDeleteService initialized (manual cleanup only)');
  }

  /**
   * Start the automatic cleanup interval
   */
  startCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredPosts().catch(error => {
        console.error('⚠️ Automatic cleanup failed:', error instanceof Error ? error.message : String(error));
      });
    }, this.CLEANUP_INTERVAL_MS);

    console.log('✅ Automatic cleanup interval started');
  }

  /**
   * Start cleanup interval with initial run (use with caution)
   */
  startCleanupWithInitialRun() {
    this.startCleanupInterval();

    // Run initial cleanup
    this.cleanupExpiredPosts().catch(error => {
      console.error('⚠️ Initial cleanup failed:', error instanceof Error ? error.message : String(error));
    });
  }

  /**
   * Stop the cleanup interval
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Get all expired unclaimed posts
   */
  async getExpiredPosts(): Promise<ExpiredPost[]> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, published_url, title, created_at, expires_at')
        .eq('status', 'unclaimed')
        .eq('is_trial_post', true)
        .lt('expires_at', now);

      if (error) {
        // Handle specific error cases with clear messages
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.error('❌ TABLE MISSING: blog_posts table does not exist in Supabase database');
          console.error('🔧 SOLUTION: Create the blog_posts table in your Supabase SQL editor with this SQL:');
          console.error(`
            CREATE TABLE blog_posts (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              title TEXT NOT NULL,
              slug TEXT NOT NULL UNIQUE,
              content TEXT NOT NULL,
              target_url TEXT NOT NULL,
              anchor_text TEXT NOT NULL,
              keywords TEXT[],
              meta_description TEXT,
              published_url TEXT,
              word_count INTEGER DEFAULT 0,
              expires_at TIMESTAMP WITH TIME ZONE,
              is_trial_post BOOLEAN DEFAULT false,
              user_id UUID REFERENCES auth.users(id),
              status TEXT DEFAULT 'unclaimed' CHECK (status IN ('unclaimed', 'claimed', 'expired')),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              deleted_at TIMESTAMP WITH TIME ZONE,
              claimed_by UUID REFERENCES auth.users(id),
              claimed_at TIMESTAMP WITH TIME ZONE
            );
          `);
          return [];
        }

        if (error.code === '42P01') {
          console.error('❌ TABLE ERROR: blog_posts table relation does not exist');
          return [];
        }

        if (error.message.includes('permission') || error.message.includes('RLS')) {
          console.error('❌ PERMISSION ERROR: Row Level Security policy blocking access');
          console.error('🔧 SOLUTION: Check RLS policies for blog_posts table in Supabase');
          return [];
        }

        // Generic error with full details
        console.error('❌ DATABASE ERROR:', error.message);
        console.error('Error details:', {
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return [];
      }

      return data.map(post => ({
        id: post.id,
        slug: post.slug,
        publishedUrl: post.published_url,
        title: post.title,
        createdAt: post.created_at,
        expiresAt: post.expires_at
      }));
    } catch (error) {
      console.error('Error getting expired posts:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Clean up expired posts
   */
  async cleanupExpiredPosts(): Promise<{ deletedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let deletedCount = 0;

    try {
      console.log('🧹 Running blog auto-delete cleanup...');
      
      const expiredPosts = await this.getExpiredPosts();
      
      if (expiredPosts.length === 0) {
        console.log('✅ No expired posts to delete');
        return { deletedCount: 0, errors: [] };
      }

      console.log(`🗑️ Found ${expiredPosts.length} expired posts to delete`);

      for (const post of expiredPosts) {
        try {
          // Mark as expired in database
          await this.markPostAsExpired(post.id);
          
          // Remove from /blog folder (simulated)
          await this.removeFromBlogFolder(post.slug);
          
          deletedCount++;
          
          console.log(`✅ Deleted expired post: ${post.title} (${post.id})`);
        } catch (error) {
          const errorMsg = `Failed to delete post ${post.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      }

      if (deletedCount > 0) {
        console.log(`🎯 Blog cleanup completed: ${deletedCount} posts deleted, ${errors.length} errors`);
      }

      return { deletedCount, errors };
    } catch (error) {
      const errorMsg = `Blog cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error('❌', errorMsg);
      return { deletedCount, errors };
    }
  }

  /**
   * Mark a post as expired in the database
   */
  private async markPostAsExpired(postId: string): Promise<void> {
    const { error } = await supabase
      .from('blog_posts')
      .update({ 
        status: 'expired',
        deleted_at: new Date().toISOString()
      })
      .eq('id', postId);

    if (error) {
      throw new Error(`Failed to mark post as expired: ${error.message}`);
    }
  }

  /**
   * Remove post from /blog folder
   */
  private async removeFromBlogFolder(slug: string): Promise<void> {
    try {
      // In a real implementation, this would remove the HTML file from the /blog directory
      // For now, we'll simulate the removal
      console.log(`📁 Removed /blog/${slug} from file system`);
      
      // Could also call an API endpoint to remove the file:
      // await fetch(`/api/blog/${slug}`, { method: 'DELETE' });
    } catch (error) {
      throw new Error(`Failed to remove from blog folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Claim a post (prevent auto-deletion)
   */
  async claimPost(postId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          status: 'claimed',
          claimed_by: userId,
          claimed_at: new Date().toISOString(),
          expires_at: null // Remove expiration
        })
        .eq('id', postId)
        .eq('status', 'unclaimed'); // Only allow claiming unclaimed posts

      if (error) {
        return { success: false, error: error.message };
      }

      console.log(`🎯 Post ${postId} claimed by user ${userId}`);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get posts that are expiring soon (within 2 hours)
   */
  async getPostsExpiringSoon(): Promise<ExpiredPost[]> {
    try {
      const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, published_url, title, created_at, expires_at')
        .eq('status', 'unclaimed')
        .eq('is_trial_post', true)
        .gt('expires_at', now)
        .lt('expires_at', twoHoursFromNow);

      if (error) {
        console.error('Error fetching posts expiring soon:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return [];
      }

      return data.map(post => ({
        id: post.id,
        slug: post.slug,
        publishedUrl: post.published_url,
        title: post.title,
        createdAt: post.created_at,
        expiresAt: post.expires_at
      }));
    } catch (error) {
      console.error('Error getting posts expiring soon:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<{
    totalPosts: number;
    unclaimedPosts: number;
    claimedPosts: number;
    expiredPosts: number;
    expiringSoon: number;
  }> {
    try {
      const [total, unclaimed, claimed, expired, expiringSoon] = await Promise.all([
        supabase.from('blog_posts').select('id', { count: 'exact' }).eq('is_trial_post', true),
        supabase.from('blog_posts').select('id', { count: 'exact' }).eq('status', 'unclaimed').eq('is_trial_post', true),
        supabase.from('blog_posts').select('id', { count: 'exact' }).eq('status', 'claimed').eq('is_trial_post', true),
        supabase.from('blog_posts').select('id', { count: 'exact' }).eq('status', 'expired').eq('is_trial_post', true),
        this.getPostsExpiringSoon()
      ]);

      return {
        totalPosts: total.count || 0,
        unclaimedPosts: unclaimed.count || 0,
        claimedPosts: claimed.count || 0,
        expiredPosts: expired.count || 0,
        expiringSoon: expiringSoon.length
      };
    } catch (error) {
      console.error('Error getting cleanup stats:', error instanceof Error ? error.message : String(error));
      return {
        totalPosts: 0,
        unclaimedPosts: 0,
        claimedPosts: 0,
        expiredPosts: 0,
        expiringSoon: 0
      };
    }
  }
}

export const blogAutoDeleteService = new BlogAutoDeleteService();
