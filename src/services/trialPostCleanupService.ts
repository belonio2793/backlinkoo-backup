import { supabase } from '@/integrations/supabase/client';
import { publishedBlogService } from './publishedBlogService';

export interface TrialPostCleanupResult {
  deletedCount: number;
  expiredSlugs: string[];
  errors: string[];
}

export interface TrialPostStatus {
  id: string;
  slug: string;
  title: string;
  expires_at: string;
  user_id?: string;
  target_url: string;
  hoursRemaining: number;
  status: 'active' | 'warning' | 'critical' | 'expired';
}

export class TrialPostCleanupService {
  private readonly WARNING_HOURS = 4; // Show warning when 4 hours remain
  private readonly CRITICAL_HOURS = 1; // Show critical alert when 1 hour remains

  /**
   * Get all active trial posts with their remaining time
   */
  async getActiveTrialPosts(): Promise<TrialPostStatus[]> {
    const now = new Date();
    const trialPosts: TrialPostStatus[] = [];

    try {
      // Get from database
      const { data: dbPosts, error } = await supabase
        .from('published_blog_posts')
        .select('id, slug, title, expires_at, user_id, target_url')
        .eq('is_trial_post', true)
        .neq('expires_at', null);

      if (!error && dbPosts) {
        dbPosts.forEach(post => {
          const expiresAt = new Date(post.expires_at!);
          const diffMs = expiresAt.getTime() - now.getTime();
          const hoursRemaining = Math.max(0, diffMs / (1000 * 60 * 60));

          let status: TrialPostStatus['status'] = 'active';
          if (hoursRemaining <= 0) {
            status = 'expired';
          } else if (hoursRemaining <= this.CRITICAL_HOURS) {
            status = 'critical';
          } else if (hoursRemaining <= this.WARNING_HOURS) {
            status = 'warning';
          }

          trialPosts.push({
            id: post.id,
            slug: post.slug,
            title: post.title,
            expires_at: post.expires_at!,
            user_id: post.user_id,
            target_url: post.target_url,
            hoursRemaining,
            status
          });
        });
      }

      // Get from localStorage (for guest users)
      const storedTrialPosts = localStorage.getItem('trial_blog_posts');
      if (storedTrialPosts) {
        const localPosts = JSON.parse(storedTrialPosts);
        localPosts.forEach((post: any) => {
          // Skip if already in database results
          if (trialPosts.some(p => p.slug === post.slug)) return;

          const expiresAt = new Date(post.expires_at);
          const diffMs = expiresAt.getTime() - now.getTime();
          const hoursRemaining = Math.max(0, diffMs / (1000 * 60 * 60));

          let status: TrialPostStatus['status'] = 'active';
          if (hoursRemaining <= 0) {
            status = 'expired';
          } else if (hoursRemaining <= this.CRITICAL_HOURS) {
            status = 'critical';
          } else if (hoursRemaining <= this.WARNING_HOURS) {
            status = 'warning';
          }

          trialPosts.push({
            id: post.id,
            slug: post.slug,
            title: post.title,
            expires_at: post.expires_at,
            user_id: post.user_id,
            target_url: post.target_url,
            hoursRemaining,
            status
          });
        });
      }

      return trialPosts.sort((a, b) => a.hoursRemaining - b.hoursRemaining);
    } catch (error) {
      console.error('Failed to get active trial posts:', error);
      return [];
    }
  }

  /**
   * Clean up expired trial posts systematically
   */
  async cleanupExpiredPosts(): Promise<TrialPostCleanupResult> {
    const result: TrialPostCleanupResult = {
      deletedCount: 0,
      expiredSlugs: [],
      errors: []
    };

    try {
      const now = new Date();

      // Clean up database posts
      const { data: expiredPosts, error: selectError } = await supabase
        .from('published_blog_posts')
        .select('slug, title')
        .eq('is_trial_post', true)
        .lt('expires_at', now.toISOString());

      if (selectError) {
        result.errors.push(`Database query error: ${selectError.message}`);
      } else if (expiredPosts && expiredPosts.length > 0) {
        // Delete expired posts
        const { error: deleteError } = await supabase
          .from('published_blog_posts')
          .delete()
          .eq('is_trial_post', true)
          .lt('expires_at', now.toISOString());

        if (deleteError) {
          result.errors.push(`Database deletion error: ${deleteError.message}`);
        } else {
          result.deletedCount += expiredPosts.length;
          result.expiredSlugs.push(...expiredPosts.map(p => p.slug));
          console.log(`✅ Deleted ${expiredPosts.length} expired trial posts from database`);
        }
      }

      // Clean up localStorage posts
      const storedTrialPosts = localStorage.getItem('trial_blog_posts');
      if (storedTrialPosts) {
        const posts = JSON.parse(storedTrialPosts);
        const activePosts = posts.filter((post: any) => {
          const expiresAt = new Date(post.expires_at);
          const isExpired = now > expiresAt;
          
          if (isExpired) {
            result.expiredSlugs.push(post.slug);
            result.deletedCount++;
          }
          
          return !isExpired;
        });

        localStorage.setItem('trial_blog_posts', JSON.stringify(activePosts));
        console.log(`✅ Cleaned up localStorage: ${posts.length - activePosts.length} expired posts removed`);
      }

      // Also call the existing cleanup method for consistency
      await publishedBlogService.cleanupExpiredTrialPosts();

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Cleanup error: ${errorMsg}`);
      console.error('Trial post cleanup failed:', error);
    }

    return result;
  }

  /**
   * Send notifications for posts approaching expiration
   */
  async notifyExpiringPosts(): Promise<void> {
    try {
      const trialPosts = await this.getActiveTrialPosts();
      const warningPosts = trialPosts.filter(p => p.status === 'warning' || p.status === 'critical');

      if (warningPosts.length > 0) {
        // Could integrate with email service here to send warnings
        console.log(`📧 ${warningPosts.length} trial posts approaching expiration:`, 
          warningPosts.map(p => `${p.title} (${p.hoursRemaining.toFixed(1)}h)`));
      }
    } catch (error) {
      console.error('Failed to send expiring post notifications:', error);
    }
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<{
    totalTrial: number;
    active: number;
    warning: number;
    critical: number;
    expired: number;
  }> {
    try {
      const posts = await this.getActiveTrialPosts();
      
      return {
        totalTrial: posts.length,
        active: posts.filter(p => p.status === 'active').length,
        warning: posts.filter(p => p.status === 'warning').length,
        critical: posts.filter(p => p.status === 'critical').length,
        expired: posts.filter(p => p.status === 'expired').length
      };
    } catch (error) {
      console.error('Failed to get cleanup stats:', error);
      return {
        totalTrial: 0,
        active: 0,
        warning: 0,
        critical: 0,
        expired: 0
      };
    }
  }

  /**
   * Schedule automatic cleanup (should be called from a cron job or interval)
   */
  async scheduleCleanup(): Promise<void> {
    // Run cleanup every hour
    const cleanup = async () => {
      console.log('🧹 Running scheduled trial post cleanup...');
      const result = await this.cleanupExpiredPosts();
      
      if (result.deletedCount > 0) {
        console.log(`✅ Cleanup completed: ${result.deletedCount} posts deleted`);
      }
      
      if (result.errors.length > 0) {
        console.warn('⚠️ Cleanup errors:', result.errors);
      }

      // Send notifications for expiring posts
      await this.notifyExpiringPosts();
    };

    // Initial cleanup
    await cleanup();

    // Schedule future cleanups every hour
    setInterval(cleanup, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Force cleanup for admin use
   */
  async forceCleanupAll(): Promise<TrialPostCleanupResult> {
    console.log('🧹 Force cleaning up all expired trial posts...');
    return await this.cleanupExpiredPosts();
  }
}

export const trialPostCleanupService = new TrialPostCleanupService();
