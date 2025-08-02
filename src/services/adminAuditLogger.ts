import { supabase } from '@/integrations/supabase/client';

export interface AdminAuditLog {
  id?: string;
  admin_user_id: string;
  admin_email: string;
  action: AdminAction;
  resource: string;
  resource_id?: string;
  old_values?: any;
  new_values?: any;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  created_at?: string;
}

export type AdminAction = 
  // User Management Actions
  | 'USER_ROLE_ASSIGNED' 
  | 'USER_ROLE_REMOVED'
  | 'USER_SUSPENDED'
  | 'USER_ACTIVATED'
  | 'USER_DELETED'
  | 'USER_CREATED'
  | 'USER_PROFILE_UPDATED'
  | 'USER_PASSWORD_RESET'
  | 'USER_EMAIL_VERIFIED'
  
  // Blog Management Actions
  | 'BLOG_POST_CREATED'
  | 'BLOG_POST_UPDATED'
  | 'BLOG_POST_DELETED'
  | 'BLOG_POST_PUBLISHED'
  | 'BLOG_POST_UNPUBLISHED'
  | 'BLOG_POST_MODERATED'
  | 'BLOG_POST_ARCHIVED'
  | 'BLOG_POST_RESTORED'
  | 'BLOG_BULK_DELETE'
  | 'BLOG_BULK_UPDATE'
  
  // Content Management Actions
  | 'CONTENT_MODERATED'
  | 'CONTENT_APPROVED'
  | 'CONTENT_REJECTED'
  | 'CONTENT_FLAGGED'
  | 'CONTENT_UNFLAGGED'
  
  // System Configuration Actions
  | 'API_KEY_UPDATED'
  | 'ENVIRONMENT_VARIABLE_UPDATED'
  | 'SYSTEM_SETTING_CHANGED'
  | 'DATABASE_QUERY_EXECUTED'
  | 'CACHE_CLEARED'
  | 'BACKUP_CREATED'
  | 'BACKUP_RESTORED'
  
  // Security Actions
  | 'SECURITY_SETTINGS_UPDATED'
  | 'RLS_POLICY_UPDATED'
  | 'ACCESS_CONTROL_CHANGED'
  | 'ADMIN_LOGIN'
  | 'ADMIN_LOGOUT'
  | 'FAILED_LOGIN_ATTEMPT'
  | 'SUSPICIOUS_ACTIVITY_DETECTED'
  
  // Email & Communication Actions
  | 'EMAIL_CAMPAIGN_CREATED'
  | 'EMAIL_CAMPAIGN_SENT'
  | 'EMAIL_CAMPAIGN_DELETED'
  | 'SMTP_SETTINGS_UPDATED'
  | 'EMAIL_VERIFICATION_SENT'
  
  // Financial & Subscription Actions
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'PAYMENT_PROCESSED'
  | 'REFUND_ISSUED'
  | 'BILLING_UPDATED'
  
  // General Actions
  | 'DATA_EXPORT'
  | 'DATA_IMPORT'
  | 'METRICS_VIEWED'
  | 'REPORT_GENERATED';

class AdminAuditLogger {
  private static instance: AdminAuditLogger;
  private currentAdmin: { id: string; email: string } | null = null;

  static getInstance(): AdminAuditLogger {
    if (!AdminAuditLogger.instance) {
      AdminAuditLogger.instance = new AdminAuditLogger();
    }
    return AdminAuditLogger.instance;
  }

  async initialize() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        this.currentAdmin = {
          id: user.id,
          email: user.email || 'unknown@admin.com'
        };
      }
    } catch (error) {
      console.warn('Could not initialize admin audit logger:', error);
    }
  }

  async logAction(params: {
    action: AdminAction;
    resource: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
    details?: any;
    success?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      // Ensure admin is initialized
      if (!this.currentAdmin) {
        await this.initialize();
      }

      if (!this.currentAdmin) {
        console.warn('No admin user found for audit logging');
        return;
      }

      const auditEntry: AdminAuditLog = {
        admin_user_id: this.currentAdmin.id,
        admin_email: this.currentAdmin.email,
        action: params.action,
        resource: params.resource,
        resource_id: params.resourceId,
        old_values: params.oldValues,
        new_values: params.newValues,
        details: params.details,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        success: params.success !== false, // Default to true unless explicitly false
        error_message: params.errorMessage
      };

      // Insert into security_audit_log table
      const { error } = await supabase
        .from('security_audit_log')
        .insert({
          user_id: auditEntry.admin_user_id,
          action: auditEntry.action,
          resource: auditEntry.resource,
          details: {
            admin_email: auditEntry.admin_email,
            resource_id: auditEntry.resource_id,
            old_values: auditEntry.old_values,
            new_values: auditEntry.new_values,
            success: auditEntry.success,
            error_message: auditEntry.error_message,
            ...auditEntry.details
          },
          ip_address: auditEntry.ip_address,
          user_agent: auditEntry.user_agent
        });

      if (error) {
        console.error('Failed to log admin action:', error);
      } else {
        console.log(`✅ Admin action logged: ${params.action} on ${params.resource}`);
      }
    } catch (error) {
      console.error('Error in admin audit logging:', error);
    }
  }

  private async getClientIP(): Promise<string | null> {
    try {
      // In production, this would be handled by the server
      // For now, we'll use a placeholder
      return null;
    } catch {
      return null;
    }
  }

  // Convenience methods for common actions
  async logUserAction(action: AdminAction, userId: string, details?: any, success = true, errorMessage?: string) {
    await this.logAction({
      action,
      resource: 'users',
      resourceId: userId,
      details,
      success,
      errorMessage
    });
  }

  async logBlogAction(action: AdminAction, blogPostId: string, oldValues?: any, newValues?: any, success = true, errorMessage?: string) {
    await this.logAction({
      action,
      resource: 'blog_posts',
      resourceId: blogPostId,
      oldValues,
      newValues,
      success,
      errorMessage
    });
  }

  async logSystemAction(action: AdminAction, details?: any, success = true, errorMessage?: string) {
    await this.logAction({
      action,
      resource: 'system',
      details,
      success,
      errorMessage
    });
  }

  async logSecurityAction(action: AdminAction, resource: string, details?: any, success = true, errorMessage?: string) {
    await this.logAction({
      action,
      resource,
      details,
      success,
      errorMessage
    });
  }

  // Get audit logs with filtering
  async getAuditLogs(filters?: {
    limit?: number;
    offset?: number;
    action?: AdminAction;
    resource?: string;
    adminEmail?: string;
    dateFrom?: Date;
    dateTo?: Date;
    successOnly?: boolean;
  }) {
    try {
      let query = supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      if (filters?.resource) {
        query = query.eq('resource', filters.resource);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(log => ({
        id: log.id,
        admin_user_id: log.user_id,
        admin_email: log.details?.admin_email || 'Unknown',
        action: log.action as AdminAction,
        resource: log.resource,
        resource_id: log.details?.resource_id,
        old_values: log.details?.old_values,
        new_values: log.details?.new_values,
        details: log.details,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        success: log.details?.success !== false,
        error_message: log.details?.error_message,
        created_at: log.created_at
      })) || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  // Get audit statistics
  async getAuditStats() {
    try {
      const [totalLogs, recentLogs, failedActions, uniqueAdmins] = await Promise.all([
        // Total logs count
        supabase
          .from('security_audit_log')
          .select('*', { count: 'exact', head: true }),
        
        // Recent logs (last 24 hours)
        supabase
          .from('security_audit_log')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        
        // Failed actions
        supabase
          .from('security_audit_log')
          .select('*', { count: 'exact', head: true })
          .eq('details->success', false),
        
        // Unique admin users
        supabase
          .from('security_audit_log')
          .select('user_id')
          .limit(1000) // Reasonable limit for counting unique users
      ]);

      const uniqueAdminCount = uniqueAdmins.data 
        ? new Set(uniqueAdmins.data.map(log => log.user_id)).size 
        : 0;

      return {
        totalLogs: totalLogs.count || 0,
        recentLogs: recentLogs.count || 0,
        failedActions: failedActions.count || 0,
        uniqueAdmins: uniqueAdminCount
      };
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      return {
        totalLogs: 0,
        recentLogs: 0,
        failedActions: 0,
        uniqueAdmins: 0
      };
    }
  }
}

// Export singleton instance
export const adminAuditLogger = AdminAuditLogger.getInstance();

// Export types
export type { AdminAction };
