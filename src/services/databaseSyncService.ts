/**
 * Database Sync Service
 * Ensures blog posts are properly synced and manages database health
 */

import { blogService } from './blogService';

export class DatabaseSyncService {
  /**
   * Verify database connection and sync status
   */
  static async verifyDatabaseSync(): Promise<{
    connected: boolean;
    postsCount: number;
    trialPostsCount: number;
    message: string;
  }> {
    try {
      // Get blog post statistics
      const stats = await blogService.getBlogPostStats();
      
      console.log('📊 Database sync status:', {
        total: stats.total,
        published: stats.published,
        trialPosts: stats.trialPosts,
        totalViews: stats.totalViews
      });

      return {
        connected: true,
        postsCount: stats.total,
        trialPostsCount: stats.trialPosts,
        message: `Database connected. ${stats.total} total posts, ${stats.trialPosts} trial posts`
      };
    } catch (error) {
      console.error('❌ Database sync check failed:', error);
      return {
        connected: false,
        postsCount: 0,
        trialPostsCount: 0,
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Clean up invalid and expired posts
   */
  static async cleanupInvalidPosts(): Promise<{
    success: boolean;
    deletedCount: number;
    message: string;
  }> {
    try {
      console.log('🧹 Starting cleanup of invalid posts...');
      
      const deletedCount = await blogService.cleanupExpiredTrialPosts();
      
      console.log(`✅ Cleanup completed. Deleted ${deletedCount} expired posts`);
      
      return {
        success: true,
        deletedCount,
        message: `Successfully cleaned up ${deletedCount} expired posts`
      };
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      return {
        success: false,
        deletedCount: 0,
        message: `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get recent blog posts from database
   */
  static async getRecentPosts(limit: number = 5) {
    try {
      const posts = await blogService.getRecentBlogPosts(limit);
      console.log(`📚 Retrieved ${posts.length} recent posts from database`);
      return posts;
    } catch (error) {
      console.error('❌ Failed to retrieve recent posts:', error);
      return [];
    }
  }

  /**
   * Force sync and verify database integrity
   */
  static async forceSyncVerification(): Promise<{
    syncStatus: any;
    recentPosts: any[];
    cleanupResult: any;
  }> {
    console.log('🔄 Starting force sync verification...');
    
    const [syncStatus, recentPosts, cleanupResult] = await Promise.all([
      this.verifyDatabaseSync(),
      this.getRecentPosts(3),
      this.cleanupInvalidPosts()
    ]);

    console.log('✅ Force sync verification completed:', {
      connected: syncStatus.connected,
      postsCount: syncStatus.postsCount,
      recentPostsCount: recentPosts.length,
      cleanedUp: cleanupResult.deletedCount
    });

    return {
      syncStatus,
      recentPosts,
      cleanupResult
    };
  }

  /**
   * Schedule automatic cleanup
   */
  static scheduleCleanup() {
    // Clean up every 30 minutes in development
    if (import.meta.env.DEV) {
      setInterval(async () => {
        console.log('⏰ Scheduled cleanup starting...');
        await this.cleanupInvalidPosts();
      }, 30 * 60 * 1000); // 30 minutes
    }
  }
}

// Export for browser console testing
if (import.meta.env.DEV) {
  (window as any).DatabaseSyncService = DatabaseSyncService;
}
