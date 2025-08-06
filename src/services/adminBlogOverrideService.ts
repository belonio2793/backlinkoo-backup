import { supabase } from '@/integrations/supabase/client';
import { adminAuditLogger } from './adminAuditLogger';

export class AdminBlogOverrideService {
  /**
   * Force delete a blog post - bypasses all conditions and permissions
   * This is for admin use only and should be used with extreme caution
   */
  async forceDeleteBlogPost(postId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔥 ADMIN OVERRIDE: Force deleting blog post ${postId}`);
      
      // Log the override action before attempting deletion
      await adminAuditLogger.logBlogAction(
        'BLOG_FORCE_DELETE',
        'admin_override_delete',
        postId,
        {
          action: 'force_delete_initiated',
          post_id: postId,
          reason: reason || 'No reason provided',
          timestamp: new Date().toISOString(),
          warning: 'ADMIN OVERRIDE - ALL CONDITIONS BYPASSED'
        }
      );

      // Direct database deletion without any RLS checks or conditions
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('❌ Force delete failed:', error);
        
        // Log the failure
        await adminAuditLogger.logBlogAction(
          'BLOG_FORCE_DELETE',
          'admin_override_delete',
          postId,
          {
            action: 'force_delete_failed',
            post_id: postId,
            error: error.message,
            reason: reason || 'No reason provided',
            timestamp: new Date().toISOString()
          },
          false,
          `Force delete failed: ${error.message}`
        );

        return { 
          success: false, 
          error: `Failed to delete post: ${error.message}` 
        };
      }

      console.log(`✅ Successfully force deleted blog post ${postId}`);
      
      // Log successful deletion
      await adminAuditLogger.logBlogAction(
        'BLOG_FORCE_DELETE',
        'admin_override_delete',
        postId,
        {
          action: 'force_delete_completed',
          post_id: postId,
          reason: reason || 'No reason provided',
          timestamp: new Date().toISOString(),
          warning: 'POST PERMANENTLY DELETED - CANNOT BE RECOVERED'
        }
      );

      return { success: true };
    } catch (error) {
      console.error('💥 Critical error in force delete:', error);
      
      // Log the critical error
      try {
        await adminAuditLogger.logBlogAction(
          'BLOG_FORCE_DELETE',
          'admin_override_delete',
          postId,
          {
            action: 'force_delete_critical_error',
            post_id: postId,
            error: error instanceof Error ? error.message : 'Unknown error',
            reason: reason || 'No reason provided',
            timestamp: new Date().toISOString()
          },
          false,
          `Critical error in force delete: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      } catch (logError) {
        console.error('Failed to log critical error:', logError);
      }

      return { 
        success: false, 
        error: `Critical error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Bulk force delete multiple blog posts
   * This is for admin use only and should be used with extreme caution
   */
  async bulkForceDeleteBlogPosts(postIds: string[], reason?: string): Promise<{ success: boolean; deletedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let deletedCount = 0;

    console.log(`🔥 ADMIN OVERRIDE: Bulk force deleting ${postIds.length} blog posts`);
    
    // Log the bulk override action
    await adminAuditLogger.logBlogAction(
      'BLOG_BULK_FORCE_DELETE',
      'admin_bulk_override_delete',
      undefined,
      {
        action: 'bulk_force_delete_initiated',
        post_ids: postIds,
        post_count: postIds.length,
        reason: reason || 'No reason provided',
        timestamp: new Date().toISOString(),
        warning: 'ADMIN BULK OVERRIDE - ALL CONDITIONS BYPASSED'
      }
    );

    for (const postId of postIds) {
      const result = await this.forceDeleteBlogPost(postId, `Bulk delete: ${reason || 'No reason provided'}`);
      
      if (result.success) {
        deletedCount++;
      } else {
        errors.push(`Post ${postId}: ${result.error}`);
      }
    }

    // Log the bulk operation completion
    await adminAuditLogger.logBlogAction(
      'BLOG_BULK_FORCE_DELETE',
      'admin_bulk_override_delete',
      undefined,
      {
        action: 'bulk_force_delete_completed',
        post_ids: postIds,
        deleted_count: deletedCount,
        error_count: errors.length,
        errors: errors,
        reason: reason || 'No reason provided',
        timestamp: new Date().toISOString(),
        warning: `${deletedCount} POSTS PERMANENTLY DELETED - CANNOT BE RECOVERED`
      },
      errors.length === 0,
      errors.length > 0 ? `Bulk delete completed with ${errors.length} errors` : undefined
    );

    return {
      success: errors.length === 0,
      deletedCount,
      errors
    };
  }

  /**
   * Get override delete permissions for admin verification
   */
  async verifyAdminOverridePermissions(): Promise<{ hasPermissions: boolean; adminId?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { hasPermissions: false };
      }

      // Check if user has admin role or is in admin table
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id, email, role')
        .eq('user_id', user.id)
        .single();

      const hasAdminPermissions = adminData && adminData.role === 'admin';

      if (hasAdminPermissions) {
        // Log permission verification
        await adminAuditLogger.logSystemAction(
          'ADMIN_PERMISSION_CHECK',
          {
            action: 'override_permissions_verified',
            admin_id: user.id,
            admin_email: user.email,
            timestamp: new Date().toISOString()
          }
        );
      }

      return {
        hasPermissions: hasAdminPermissions,
        adminId: user.id
      };
    } catch (error) {
      console.error('Failed to verify admin override permissions:', error);
      return { hasPermissions: false };
    }
  }
}

export const adminBlogOverrideService = new AdminBlogOverrideService();
