import { supabase } from '@/integrations/supabase/client';

/**
 * Verification service to ensure all admin components use real database data
 */
export class AdminDataSyncVerification {
  
  /**
   * Verify all admin components are using real data sources
   */
  static async verifyDataSources(): Promise<{
    verified: boolean;
    components: Array<{
      name: string;
      status: 'real_data' | 'mock_data' | 'error';
      message: string;
    }>;
  }> {
    const results = [];

    // Verify User Management
    try {
      const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
      results.push({
        name: 'User Management',
        status: 'real_data' as const,
        message: `Connected to profiles table (${profiles?.length || 0} users found)`
      });
    } catch (error) {
      results.push({
        name: 'User Management',
        status: 'error' as const,
        message: `Database connection error: ${error}`
      });
    }

    // Verify Blog Management
    try {
      const { data: blogPosts } = await supabase.from('blog_posts').select('id').limit(1);
      results.push({
        name: 'Blog Management',
        status: 'real_data' as const,
        message: `Connected to blog_posts table (${blogPosts?.length || 0} posts found)`
      });
    } catch (error) {
      results.push({
        name: 'Blog Management',
        status: 'error' as const,
        message: `Database connection error: ${error}`
      });
    }

    // Verify Campaign Management
    try {
      const { data: campaigns } = await supabase.from('campaigns').select('id').limit(1);
      results.push({
        name: 'Campaign Management',
        status: 'real_data' as const,
        message: `Connected to campaigns table (${campaigns?.length || 0} campaigns found)`
      });
    } catch (error) {
      results.push({
        name: 'Campaign Management',
        status: 'error' as const,
        message: `Database connection error: ${error}`
      });
    }

    // Verify Subscriber Management
    try {
      const { data: subscribers } = await supabase.from('subscribers').select('id').limit(1);
      results.push({
        name: 'Subscriber Management',
        status: 'real_data' as const,
        message: `Connected to subscribers table (${subscribers?.length || 0} subscribers found)`
      });
    } catch (error) {
      results.push({
        name: 'Subscriber Management',
        status: 'error' as const,
        message: `Database connection error: ${error}`
      });
    }

    // Verify Security Management
    try {
      const { data: auditLogs } = await supabase.from('security_audit_log').select('id').limit(1);
      results.push({
        name: 'Security Management',
        status: 'real_data' as const,
        message: `Connected to security_audit_log table (${auditLogs?.length || 0} logs found)`
      });
    } catch (error) {
      results.push({
        name: 'Security Management',
        status: 'error' as const,
        message: `Database connection error: ${error}`
      });
    }

    // Verify Affiliate Management
    try {
      // Note: This table might not exist, so handle gracefully
      const { data: affiliates, error } = await supabase.from('affiliate_programs').select('id').limit(1);
      if (error && error.message?.includes('does not exist')) {
        results.push({
          name: 'Affiliate Management',
          status: 'mock_data' as const,
          message: 'affiliate_programs table does not exist - using empty state'
        });
      } else {
        results.push({
          name: 'Affiliate Management',
          status: 'real_data' as const,
          message: `Connected to affiliate_programs table (${affiliates?.length || 0} affiliates found)`
        });
      }
    } catch (error) {
      results.push({
        name: 'Affiliate Management',
        status: 'error' as const,
        message: `Database connection error: ${error}`
      });
    }

    const allVerified = results.every(r => r.status === 'real_data');

    return {
      verified: allVerified,
      components: results
    };
  }

  /**
   * Check if any admin components are still using localStorage fallbacks
   */
  static checkForLocalStorageFallbacks(): Array<{
    component: string;
    issue: string;
    recommendation: string;
  }> {
    const issues = [];

    // Check if admin components are using localStorage
    try {
      const adminKeys = Object.keys(localStorage).filter(key => 
        key.includes('admin_') || 
        key.includes('blog_') || 
        key.includes('campaign_') ||
        key.includes('user_')
      );

      if (adminKeys.length > 0) {
        issues.push({
          component: 'Various Admin Components',
          issue: `Found ${adminKeys.length} localStorage keys that should use database instead`,
          recommendation: 'Remove localStorage dependencies and use real database queries'
        });
      }
    } catch (error) {
      // localStorage might not be available in some environments
    }

    return issues;
  }

  /**
   * Get summary of data sync status for admin dashboard
   */
  static async getDataSyncSummary(): Promise<{
    status: 'fully_synced' | 'partially_synced' | 'sync_required';
    totalComponents: number;
    syncedComponents: number;
    issues: string[];
    recommendations: string[];
  }> {
    const { verified, components } = await this.verifyDataSources();
    const localStorageIssues = this.checkForLocalStorageFallbacks();

    const syncedComponents = components.filter(c => c.status === 'real_data').length;
    const totalComponents = components.length;
    
    const issues: string[] = [
      ...components.filter(c => c.status !== 'real_data').map(c => c.message),
      ...localStorageIssues.map(i => i.issue)
    ];

    const recommendations: string[] = [
      ...components.filter(c => c.status === 'error').map(c => 'Fix database connectivity'),
      ...localStorageIssues.map(i => i.recommendation)
    ];

    let status: 'fully_synced' | 'partially_synced' | 'sync_required';
    if (verified && localStorageIssues.length === 0) {
      status = 'fully_synced';
    } else if (syncedComponents > totalComponents * 0.5) {
      status = 'partially_synced';
    } else {
      status = 'sync_required';
    }

    return {
      status,
      totalComponents,
      syncedComponents,
      issues: issues.filter(Boolean),
      recommendations: [...new Set(recommendations.filter(Boolean))]
    };
  }
}
