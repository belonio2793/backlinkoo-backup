/**
 * Safe Blog Auto-Delete Service
 * Enhanced version that NEVER deletes claimed posts
 * Multiple safety checks to prevent accidental deletion of claimed content
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

export interface SafetyReport {
  totalScanned: number;
  safeToDelete: number;
  protectedFromDeletion: number;
  deletedCount: number;
  errors: string[];
  safetyViolations: string[];
}

export class SafeBlogAutoDeleteService {
  private readonly PRIMARY_TABLE = 'blog_posts';
  private cleanupInterval?: number;
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Check every hour

  constructor() {
    console.log('🛡️ SafeBlogAutoDeleteService initialized with maximum protection');
  }

  /**
   * SAFETY LEVEL 1: Get posts that are DEFINITELY safe to delete
   * Multiple layers of verification to prevent claimed post deletion
   */
  async getSafelyExpiredPosts(): Promise<{ safePosts: ExpiredPost[]; report: SafetyReport }> {
    const report: SafetyReport = {
      totalScanned: 0,
      safeToDelete: 0,
      protectedFromDeletion: 0,
      deletedCount: 0,
      errors: [],
      safetyViolations: []
    };

    try {
      const now = new Date().toISOString();

      // SAFETY QUERY: Only get posts with ALL safety conditions
      const { data, error } = await supabase
        .from(this.PRIMARY_TABLE)
        .select(`
          id, slug, published_url, title, created_at, expires_at, 
          user_id, is_trial_post, status, contextual_links
        `)
        .eq('is_trial_post', true)
        .is('user_id', null)
        .not('expires_at', 'is', null)
        .lt('expires_at', now);

      if (error) {
        report.errors.push(`Database query failed: ${error.message}`);
        return { safePosts: [], report };
      }

      report.totalScanned = data?.length || 0;

      if (!data || data.length === 0) {
        console.log('✅ No posts found for deletion review');
        return { safePosts: [], report };
      }

      // SAFETY LEVEL 2: Manual verification of each post
      const safePosts: ExpiredPost[] = [];
      
      for (const post of data) {
        const safetyCheck = this.performSafetyCheck(post);
        
        if (safetyCheck.isSafe) {
          safePosts.push({
            id: post.id,
            slug: post.slug,
            publishedUrl: post.published_url,
            title: post.title,
            createdAt: post.created_at,
            expiresAt: post.expires_at
          });
          report.safeToDelete++;
        } else {
          report.protectedFromDeletion++;
          report.safetyViolations.push(
            `PROTECTED: ${post.slug} - ${safetyCheck.reason}`
          );
          console.warn('🛡️ SAFETY PROTECTION:', {
            slug: post.slug,
            reason: safetyCheck.reason,
            details: safetyCheck.details
          });
        }
      }

      console.log('🔍 Safety scan complete:', {
        total: report.totalScanned,
        safe: report.safeToDelete,
        protected: report.protectedFromDeletion
      });

      return { safePosts, report };

    } catch (error: any) {
      report.errors.push(`Safety scan failed: ${error.message}`);
      console.error('❌ Safety scan error:', error);
      return { safePosts: [], report };
    }
  }

  /**
   * SAFETY LEVEL 3: Individual post safety verification
   */
  private performSafetyCheck(post: any): { isSafe: boolean; reason: string; details: any } {
    // Check 1: Must be trial post
    if (!post.is_trial_post) {
      return {
        isSafe: false,
        reason: 'Not a trial post',
        details: { is_trial_post: post.is_trial_post }
      };
    }

    // Check 2: Must have no user assignment
    if (post.user_id !== null) {
      return {
        isSafe: false,
        reason: 'Post is claimed by user',
        details: { user_id: post.user_id }
      };
    }

    // Check 3: Must have actual expiry date
    if (!post.expires_at) {
      return {
        isSafe: false,
        reason: 'No expiry date (permanent post)',
        details: { expires_at: post.expires_at }
      };
    }

    // Check 4: Must be actually expired
    const now = new Date();
    const expiryDate = new Date(post.expires_at);
    if (expiryDate > now) {
      return {
        isSafe: false,
        reason: 'Post not yet expired',
        details: { expires_at: post.expires_at, now: now.toISOString() }
      };
    }

    // Check 5: Check for permanent protection flags
    if (post.contextual_links && typeof post.contextual_links === 'object') {
      const links = post.contextual_links;
      if (links.permanent_protection || links.never_delete || links.protection_level) {
        return {
          isSafe: false,
          reason: 'Permanent protection flag detected',
          details: { protection_flags: links }
        };
      }
    }

    // Check 6: Status verification
    if (post.status === 'claimed' || post.status === 'published') {
      return {
        isSafe: false,
        reason: 'Post status indicates it should be preserved',
        details: { status: post.status }
      };
    }

    // All checks passed - safe to delete
    return {
      isSafe: true,
      reason: 'All safety checks passed',
      details: {
        is_trial_post: post.is_trial_post,
        user_id: post.user_id,
        expires_at: post.expires_at,
        status: post.status
      }
    };
  }

  /**
   * SAFE CLEANUP: Only delete posts that pass all safety checks
   */
  async performSafeCleanup(): Promise<SafetyReport> {
    try {
      console.log('🛡️ Starting SAFE blog cleanup with maximum protection...');

      const { safePosts, report } = await this.getSafelyExpiredPosts();

      if (safePosts.length === 0) {
        console.log('✅ No posts found that are safe to delete');
        return report;
      }

      console.log(`🔍 Found ${safePosts.length} posts that passed safety verification`);

      // Delete posts one by one with individual safety checks
      for (const post of safePosts) {
        try {
          const deleted = await this.safelyDeletePost(post.id);
          if (deleted) {
            report.deletedCount++;
            console.log(`✅ SAFELY DELETED: ${post.title} (${post.slug})`);
          } else {
            report.errors.push(`Failed to delete post: ${post.slug}`);
          }
        } catch (error: any) {
          const errorMsg = `Error deleting ${post.slug}: ${error.message}`;
          report.errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      }

      console.log('🎯 Safe cleanup completed:', {
        scanned: report.totalScanned,
        deleted: report.deletedCount,
        protected: report.protectedFromDeletion,
        errors: report.errors.length
      });

      return report;

    } catch (error: any) {
      console.error('❌ Safe cleanup failed:', error);
      return {
        totalScanned: 0,
        safeToDelete: 0,
        protectedFromDeletion: 0,
        deletedCount: 0,
        errors: [`Safe cleanup failed: ${error.message}`],
        safetyViolations: []
      };
    }
  }

  /**
   * SAFELY DELETE: Final safety check before deletion
   */
  private async safelyDeletePost(postId: string): Promise<boolean> {
    try {
      // FINAL SAFETY CHECK: Re-verify before deletion
      const { data: finalCheck, error: checkError } = await supabase
        .from(this.PRIMARY_TABLE)
        .select('id, user_id, is_trial_post, expires_at, status, contextual_links')
        .eq('id', postId)
        .single();

      if (checkError || !finalCheck) {
        console.error('❌ Final safety check failed:', checkError?.message);
        return false;
      }

      // Final verification
      const finalSafety = this.performSafetyCheck(finalCheck);
      if (!finalSafety.isSafe) {
        console.error('🛡️ FINAL SAFETY BLOCK:', {
          postId,
          reason: finalSafety.reason,
          details: finalSafety.details
        });
        return false;
      }

      // SAFE DELETION: Mark as expired instead of hard delete
      const { error: updateError } = await supabase
        .from(this.PRIMARY_TABLE)
        .update({
          status: 'expired',
          deleted_at: new Date().toISOString(),
          contextual_links: {
            ...((finalCheck.contextual_links as any) || {}),
            deletion_metadata: {
              deleted_by: 'SafeBlogAutoDeleteService',
              deletion_reason: 'Expired trial post',
              safety_verified: true,
              deletion_timestamp: new Date().toISOString()
            }
          }
        })
        .eq('id', postId)
        .eq('is_trial_post', true)  // Safety constraint
        .is('user_id', null);       // Safety constraint

      if (updateError) {
        console.error('❌ Safe deletion failed:', updateError.message);
        return false;
      }

      return true;

    } catch (error: any) {
      console.error('❌ Safe deletion error:', error.message);
      return false;
    }
  }

  /**
   * Get posts that are expiring soon (for warning purposes)
   */
  async getPostsExpiringSoon(hoursAhead: number = 2): Promise<ExpiredPost[]> {
    try {
      const now = new Date();
      const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from(this.PRIMARY_TABLE)
        .select('id, slug, published_url, title, created_at, expires_at, user_id, is_trial_post')
        .eq('is_trial_post', true)
        .is('user_id', null)
        .not('expires_at', 'is', null)
        .gt('expires_at', now.toISOString())
        .lt('expires_at', futureTime.toISOString());

      if (error) {
        console.error('❌ Error fetching posts expiring soon:', error.message);
        return [];
      }

      // Safety filter
      const safePosts = (data || []).filter(post => 
        post.is_trial_post === true && 
        post.user_id === null &&
        post.expires_at !== null
      );

      return safePosts.map(post => ({
        id: post.id,
        slug: post.slug,
        publishedUrl: post.published_url,
        title: post.title,
        createdAt: post.created_at,
        expiresAt: post.expires_at
      }));

    } catch (error: any) {
      console.error('❌ Error getting posts expiring soon:', error.message);
      return [];
    }
  }

  /**
   * Get comprehensive safety statistics
   */
  async getSafetyStats(): Promise<{
    totalPosts: number;
    trialPosts: number;
    claimedPosts: number;
    permanentPosts: number;
    expiredPosts: number;
    atRiskPosts: number;
    protectedPosts: number;
  }> {
    try {
      const [
        totalResult,
        trialResult,
        claimedResult,
        permanentResult,
        expiredResult
      ] = await Promise.all([
        supabase.from(this.PRIMARY_TABLE).select('id', { count: 'exact' }),
        supabase.from(this.PRIMARY_TABLE).select('id', { count: 'exact' }).eq('is_trial_post', true),
        supabase.from(this.PRIMARY_TABLE).select('id', { count: 'exact' }).not('user_id', 'is', null),
        supabase.from(this.PRIMARY_TABLE).select('id', { count: 'exact' }).is('expires_at', null),
        supabase.from(this.PRIMARY_TABLE).select('id', { count: 'exact' }).eq('status', 'expired')
      ]);

      const atRiskPosts = await this.getPostsExpiringSoon(24); // Next 24 hours

      return {
        totalPosts: totalResult.count || 0,
        trialPosts: trialResult.count || 0,
        claimedPosts: claimedResult.count || 0,
        permanentPosts: permanentResult.count || 0,
        expiredPosts: expiredResult.count || 0,
        atRiskPosts: atRiskPosts.length,
        protectedPosts: (claimedResult.count || 0) + (permanentResult.count || 0)
      };

    } catch (error: any) {
      console.error('❌ Error getting safety stats:', error.message);
      return {
        totalPosts: 0,
        trialPosts: 0,
        claimedPosts: 0,
        permanentPosts: 0,
        expiredPosts: 0,
        atRiskPosts: 0,
        protectedPosts: 0
      };
    }
  }

  /**
   * Emergency protection: Immediately protect all claimed posts
   */
  async emergencyProtectionSweep(): Promise<{ protectedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let protectedCount = 0;

    try {
      console.log('🚨 Running emergency protection sweep...');

      // Get all posts that should be protected
      const { data: postsToProtect, error } = await supabase
        .from(this.PRIMARY_TABLE)
        .select('id, slug, user_id, is_trial_post')
        .or('user_id.not.is.null,is_trial_post.eq.false');

      if (error) {
        errors.push(`Failed to fetch posts for protection: ${error.message}`);
        return { protectedCount: 0, errors };
      }

      // Protect each post
      for (const post of postsToProtect || []) {
        try {
          const { error: updateError } = await supabase
            .from(this.PRIMARY_TABLE)
            .update({
              expires_at: null, // Remove expiry
              contextual_links: {
                permanent_protection: true,
                emergency_protection: true,
                protected_at: new Date().toISOString(),
                protection_reason: 'Emergency protection sweep'
              }
            })
            .eq('id', post.id);

          if (updateError) {
            errors.push(`Failed to protect ${post.slug}: ${updateError.message}`);
          } else {
            protectedCount++;
          }
        } catch (error: any) {
          errors.push(`Error protecting ${post.slug}: ${error.message}`);
        }
      }

      console.log(`🛡️ Emergency protection complete: ${protectedCount} posts protected`);
      return { protectedCount, errors };

    } catch (error: any) {
      errors.push(`Emergency protection failed: ${error.message}`);
      return { protectedCount: 0, errors };
    }
  }

  /**
   * Start automatic safe cleanup interval
   */
  startSafeCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(async () => {
      try {
        const report = await this.performSafeCleanup();
        console.log('🔄 Automatic safe cleanup completed:', {
          deleted: report.deletedCount,
          protected: report.protectedFromDeletion,
          errors: report.errors.length
        });
      } catch (error: any) {
        console.error('❌ Automatic safe cleanup failed:', error.message);
      }
    }, this.CLEANUP_INTERVAL_MS);

    console.log('🔄 Safe automatic cleanup interval started');
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
      console.log('⏹️ Safe cleanup interval stopped');
    }
  }
}

export const safeBlogAutoDeleteService = new SafeBlogAutoDeleteService();
