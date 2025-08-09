import { supabase } from '@/integrations/supabase/client';
import { EnhancedBlogClaimService } from './enhancedBlogClaimService';

export class BlogCleanupService {
  private static readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Start automatic cleanup of expired posts
   */
  static startAutomaticCleanup(): void {
    if (this.isRunning) {
      console.log('🧹 Blog cleanup service is already running');
      return;
    }

    console.log('🧹 Starting blog cleanup service...');
    this.isRunning = true;

    // Run cleanup immediately
    this.performCleanup();

    // Then run every hour
    this.intervalId = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop automatic cleanup
   */
  static stopAutomaticCleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🧹 Blog cleanup service stopped');
  }

  /**
   * Perform cleanup of expired posts
   */
  static async performCleanup(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
      console.log('🧹 Running blog post cleanup...');
      
      const result = await EnhancedBlogClaimService.cleanupExpiredPosts();
      
      if (result.error) {
        console.error('🧹 Cleanup failed:', result.error);
        return { success: false, deletedCount: 0, error: result.error };
      }

      if (result.deletedCount > 0) {
        console.log(`🧹 Cleanup completed: ${result.deletedCount} expired posts deleted`);
      } else {
        console.log('🧹 Cleanup completed: No expired posts found');
      }

      return { success: true, deletedCount: result.deletedCount };
    } catch (error: any) {
      console.error('🧹 Cleanup service error:', error.message || error.toString() || JSON.stringify(error));
      return { success: false, deletedCount: 0, error: error.message };
    }
  }

  /**
   * Get cleanup service status
   */
  static getStatus(): { isRunning: boolean; nextCleanup?: Date } {
    return {
      isRunning: this.isRunning,
      nextCleanup: this.isRunning ? new Date(Date.now() + this.CLEANUP_INTERVAL) : undefined
    };
  }

  /**
   * Manual cleanup trigger (for admin use)
   */
  static async manualCleanup(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    console.log('🧹 Manual cleanup triggered...');
    return await this.performCleanup();
  }

  /**
   * Get expired posts count without deleting
   */
  static async getExpiredPostsCount(): Promise<{ count: number; error?: string }> {
    try {
      const { count, error } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('claimed', false)
        .not('expires_at', 'is', null)
        .lte('expires_at', new Date().toISOString());

      if (error) {
        return { count: 0, error: error.message };
      }

      return { count: count || 0 };
    } catch (error: any) {
      return { count: 0, error: error.message };
    }
  }

  /**
   * Initialize cleanup service on app startup
   */
  static initialize(): void {
    if (typeof window !== 'undefined') {
      // Only run in browser environment
      console.log('🧹 Initializing blog cleanup service...');
      
      // Start cleanup after a short delay to allow app to fully load
      setTimeout(() => {
        this.startAutomaticCleanup();
      }, 5000);

      // Stop cleanup when page is unloaded
      window.addEventListener('beforeunload', () => {
        this.stopAutomaticCleanup();
      });
    }
  }
}

// Auto-initialize if this module is imported
if (typeof window !== 'undefined') {
  // Initialize on next tick to ensure proper loading order
  setTimeout(() => {
    BlogCleanupService.initialize();
  }, 0);
}
