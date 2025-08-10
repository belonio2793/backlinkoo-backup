/**
 * Campaign Metrics Database Service
 * Handles persistent storage of campaign metrics, runtime tracking, and user aggregates
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type CampaignRuntimeMetrics = Database['public']['Tables']['campaign_runtime_metrics']['Row'];
type CampaignRuntimeMetricsInsert = Database['public']['Tables']['campaign_runtime_metrics']['Insert'];
type CampaignRuntimeMetricsUpdate = Database['public']['Tables']['campaign_runtime_metrics']['Update'];

type UserMonthlyAggregates = Database['public']['Tables']['user_monthly_link_aggregates']['Row'];
type CampaignLinkHistory = Database['public']['Tables']['campaign_link_history']['Row'];
type CampaignLinkHistoryInsert = Database['public']['Tables']['campaign_link_history']['Insert'];

type LiveCampaignMonitor = Database['public']['Views']['live_campaign_monitor']['Row'];
type UserDashboardSummary = Database['public']['Views']['user_dashboard_summary']['Row'];

export interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  targetUrl: string;
  keywords: string[];
  anchorTexts: string[];
  status: 'active' | 'paused' | 'stopped' | 'completed' | 'deleted';
  progressiveLinkCount: number;
  linksLive: number;
  linksPending: number;
  averageAuthority: number;
  successRate: number;
  velocity: number;
  dailyLimit: number;
}

export interface LinkRecord {
  campaignId: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  domain: string;
  status: 'pending' | 'live' | 'failed' | 'removed';
  domainAuthority: number;
  verified: boolean;
  linkType: string;
  linkStrategy: string;
}

class CampaignMetricsService {
  /**
   * Update or create campaign runtime metrics
   */
  async updateCampaignMetrics(
    userId: string, 
    metrics: CampaignMetrics
  ): Promise<{ success: boolean; data?: CampaignRuntimeMetrics; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('update_campaign_runtime_metrics', {
        p_campaign_id: metrics.campaignId,
        p_user_id: userId,
        p_campaign_name: metrics.campaignName,
        p_target_url: metrics.targetUrl,
        p_keywords: metrics.keywords,
        p_anchor_texts: metrics.anchorTexts,
        p_status: metrics.status,
        p_progressive_link_count: metrics.progressiveLinkCount,
        p_links_live: metrics.linksLive,
        p_links_pending: metrics.linksPending,
        p_average_authority: metrics.averageAuthority,
        p_success_rate: metrics.successRate
      });

      if (error) {
        console.error('Campaign metrics update failed:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Check if it's a function not found error
        if (error.code === '42883' || error.message?.includes('function') && error.message?.includes('does not exist')) {
          return {
            success: false,
            error: 'Database function missing. Please run the campaign metrics migration first. Visit /verify-database to check setup.'
          };
        }

        return { success: false, error: error.message || 'Database update failed' };
      }

      console.log('✅ Campaign metrics updated in database:', metrics.campaignId);
      return { success: true, data: data as CampaignRuntimeMetrics };
    } catch (error) {
      console.error('Campaign metrics service error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get campaign runtime metrics for a user
   */
  async getCampaignMetrics(
    userId: string, 
    campaignId?: string
  ): Promise<{ success: boolean; data?: CampaignRuntimeMetrics[]; error?: string }> {
    try {
      let query = supabase
        .from('campaign_runtime_metrics')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'deleted')
        .order('updated_at', { ascending: false });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch campaign metrics:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Check if it's a table not found error
        if (error.code === '42P01' || error.message?.includes('relation') && error.message?.includes('does not exist')) {
          return {
            success: false,
            error: 'Campaign metrics table missing. Please run the database migration first. Visit /verify-database to check setup.'
          };
        }

        return { success: false, error: error.message || 'Failed to fetch campaign data' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Campaign metrics fetch error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Record a new link in campaign history
   */
  async recordLink(
    userId: string, 
    linkRecord: LinkRecord
  ): Promise<{ success: boolean; data?: CampaignLinkHistory; error?: string }> {
    try {
      const linkData: CampaignLinkHistoryInsert = {
        campaign_id: linkRecord.campaignId,
        user_id: userId,
        source_url: linkRecord.sourceUrl,
        target_url: linkRecord.targetUrl,
        anchor_text: linkRecord.anchorText,
        domain: linkRecord.domain,
        status: linkRecord.status,
        domain_authority: linkRecord.domainAuthority,
        verified: linkRecord.verified,
        link_type: linkRecord.linkType,
        link_strategy: linkRecord.linkStrategy
      };

      const { data, error } = await supabase
        .from('campaign_link_history')
        .insert([linkData])
        .select()
        .single();

      if (error) {
        console.error('Failed to record link:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        return { success: false, error: error.message || 'Failed to record link' };
      }

      console.log('✅ Link recorded in database:', linkRecord.sourceUrl);
      return { success: true, data };
    } catch (error) {
      console.error('Link recording error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get user's monthly link aggregates
   */
  async getUserMonthlyAggregates(
    userId: string, 
    year?: number, 
    month?: number
  ): Promise<{ success: boolean; data?: UserMonthlyAggregates[]; error?: string }> {
    try {
      let query = supabase
        .from('user_monthly_link_aggregates')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (year && month) {
        query = query.eq('year', year).eq('month', month);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch monthly aggregates:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        return { success: false, error: error.message || 'Failed to fetch monthly data' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Monthly aggregates fetch error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get live campaign monitor data for user
   */
  async getLiveCampaignMonitor(
    userId: string
  ): Promise<{ success: boolean; data?: LiveCampaignMonitor; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('live_campaign_monitor')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Failed to fetch live campaign monitor:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        return { success: false, error: error.message || 'Failed to fetch live monitor data' };
      }

      return { success: true, data: data || null };
    } catch (error) {
      console.error('Live campaign monitor fetch error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get user dashboard summary
   */
  async getUserDashboardSummary(
    userId: string
  ): Promise<{ success: boolean; data?: UserDashboardSummary; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_dashboard_summary')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to fetch user dashboard summary:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        return { success: false, error: error.message || 'Failed to fetch dashboard summary' };
      }

      return { success: true, data: data || null };
    } catch (error) {
      console.error('User dashboard summary fetch error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Delete campaign and all associated data
   */
  async deleteCampaign(
    userId: string, 
    campaignId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Mark campaign as deleted (preserves historical data)
      const { error: metricsError } = await supabase
        .from('campaign_runtime_metrics')
        .update({ status: 'deleted' })
        .eq('user_id', userId)
        .eq('campaign_id', campaignId);

      if (metricsError) {
        console.error('Failed to delete campaign metrics:', {
          code: metricsError.code,
          message: metricsError.message,
          details: metricsError.details
        });
        return { success: false, error: metricsError.message || 'Failed to delete campaign' };
      }

      // Update monthly aggregates
      await supabase.rpc('update_user_monthly_aggregates', { p_user_id: userId });

      console.log('✅ Campaign deleted from database:', campaignId);
      return { success: true };
    } catch (error) {
      console.error('Campaign deletion error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get campaign link history
   */
  async getCampaignLinkHistory(
    userId: string, 
    campaignId?: string,
    limit: number = 100
  ): Promise<{ success: boolean; data?: CampaignLinkHistory[]; error?: string }> {
    try {
      let query = supabase
        .from('campaign_link_history')
        .select('*')
        .eq('user_id', userId)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch link history:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        return { success: false, error: error.message || 'Failed to fetch link history' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Link history fetch error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Sync localStorage data to database (migration helper)
   */
  async syncLocalStorageToDatabase(userId: string): Promise<{ success: boolean; migrated: number; error?: string }> {
    try {
      let migratedCount = 0;

      // Get user storage key patterns that might exist
      const storageKeys = [
        `permanent_campaigns_${userId}`,
        `permanent_campaigns_guest_${userId}`,
        'permanent_campaigns' // Legacy key
      ];

      for (const key of storageKeys) {
        const storedData = localStorage.getItem(key);
        if (!storedData) continue;

        try {
          const campaigns = JSON.parse(storedData);
          if (!Array.isArray(campaigns)) continue;

          for (const campaign of campaigns) {
            if (!campaign.id || campaign.status === 'deleted') continue;

            const metrics: CampaignMetrics = {
              campaignId: campaign.id,
              campaignName: campaign.name || 'Untitled Campaign',
              targetUrl: campaign.targetUrl || campaign.target_url || '',
              keywords: campaign.keywords || [],
              anchorTexts: campaign.anchorTexts || campaign.anchor_texts || [],
              status: campaign.status || 'paused',
              progressiveLinkCount: campaign.progressiveLinkCount || campaign.linksGenerated || 0,
              linksLive: campaign.linksLive || Math.floor((campaign.progressiveLinkCount || 0) * 0.85),
              linksPending: campaign.linksPending || 0,
              averageAuthority: campaign.avgAuthority || campaign.quality?.averageAuthority || 75,
              successRate: campaign.successRate || campaign.quality?.successRate || 95,
              velocity: campaign.quality?.velocity || 0,
              dailyLimit: campaign.dailyLimit || 25
            };

            const result = await this.updateCampaignMetrics(userId, metrics);
            if (result.success) {
              migratedCount++;
              console.log('��� Migrated campaign to database:', campaign.id);
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse localStorage data for key:', key);
        }
      }

      return { success: true, migrated: migratedCount };
    } catch (error) {
      console.error('localStorage sync error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
        code: error.code
      });
      return { success: false, migrated: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Debug utility to test error logging format
   */
  debugErrorLogging(): void {
    console.log('🧪 Testing error logging format...');

    // Create a test error similar to Supabase errors
    const testError = new Error('relation "campaign_metrics" does not exist');
    testError.code = '42P01';
    testError.details = null;
    testError.hint = 'Perhaps you meant to reference the table "public"."campaigns"?';

    // Test the new format
    console.error('Test error with new format:', {
      message: testError.message,
      code: testError.code,
      details: testError.details,
      hint: testError.hint,
      stack: testError.stack,
      name: testError.name
    });

    console.log('✅ If you see detailed error information above (not "[object Object]"), the fix is working!');
  }

  /**
   * Debug utility to test database connectivity and table existence
   */
  async debugDatabaseSetup(): Promise<{
    tablesExist: { [key: string]: boolean };
    viewsExist: { [key: string]: boolean };
    functionsExist: { [key: string]: boolean };
    errors: string[];
  }> {
    const debug = {
      tablesExist: {} as { [key: string]: boolean },
      viewsExist: {} as { [key: string]: boolean },
      functionsExist: {} as { [key: string]: boolean },
      errors: [] as string[]
    };

    // Test tables
    const tables = ['campaign_runtime_metrics', 'user_monthly_link_aggregates', 'campaign_link_history'];
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        debug.tablesExist[table] = !error;
        if (error) debug.errors.push(`Table ${table}: ${error.message}`);
      } catch (err) {
        debug.tablesExist[table] = false;
        debug.errors.push(`Table ${table}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // Test views
    const views = ['live_campaign_monitor', 'user_dashboard_summary'];
    for (const view of views) {
      try {
        const { error } = await supabase.from(view).select('*').limit(1);
        debug.viewsExist[view] = !error;
        if (error) debug.errors.push(`View ${view}: ${error.message}`);
      } catch (err) {
        debug.viewsExist[view] = false;
        debug.errors.push(`View ${view}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // Test functions
    const functions = ['update_campaign_runtime_metrics', 'update_user_monthly_aggregates'];
    for (const func of functions) {
      try {
        const { error } = await supabase.rpc(func as any);
        // If we get a parameter error, the function exists
        debug.functionsExist[func] = !error || error.message.includes('null value');
        if (error && !error.message.includes('null value')) {
          debug.errors.push(`Function ${func}: ${error.message}`);
        }
      } catch (err) {
        debug.functionsExist[func] = false;
        debug.errors.push(`Function ${func}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return debug;
  }
}

export const campaignMetricsService = new CampaignMetricsService();

// Debug utility for console
if (typeof window !== 'undefined') {
  (window as any).debugCampaignMetrics = async () => {
    console.log('🔍 Debugging Campaign Metrics Database Setup...');
    const debug = await campaignMetricsService.debugDatabaseSetup();

    console.log('📊 Tables Status:', debug.tablesExist);
    console.log('👁️ Views Status:', debug.viewsExist);
    console.log('⚙️ Functions Status:', debug.functionsExist);

    if (debug.errors.length > 0) {
      console.error('❌ Errors Found:', debug.errors);
    } else {
      console.log('✅ All database components are working!');
    }

    return debug;
  };

  // Test error logging format
  (window as any).testCampaignMetricsErrorLogging = () => {
    campaignMetricsService.debugErrorLogging();
  };

  // Comprehensive error logging test
  (window as any).testAllErrorLogging = () => {
    console.log('🧪 Testing all error logging patterns...');

    // Test 1: Standard Error object
    const standardError = new Error('This is a test error message');
    standardError.code = 'TEST_ERROR_CODE';
    console.error('Test standard error:', {
      message: standardError.message,
      code: standardError.code,
      stack: standardError.stack,
      name: standardError.name
    });

    // Test 2: Supabase-like error object
    const supabaseError = {
      message: 'relation "campaign_metrics" does not exist',
      code: '42P01',
      details: null,
      hint: 'Perhaps you meant to reference the table "public"."campaigns"?'
    };
    console.error('Test Supabase-like error:', {
      message: supabaseError.message,
      code: supabaseError.code,
      details: supabaseError.details,
      hint: supabaseError.hint
    });

    // Test 3: Network error
    const networkError = new TypeError('fetch failed');
    networkError.cause = { errno: -3008, code: 'ENOTFOUND' };
    console.error('Test network error:', {
      message: networkError.message,
      stack: networkError.stack,
      name: networkError.name,
      cause: networkError.cause
    });

    console.log('✅ Error logging test complete! Check above for properly formatted error objects.');
  };

  (window as any).testCampaignMetricsError = async () => {
    console.log('🧪 Testing campaign metrics error logging...');

    try {
      // This will definitely fail and show us the error format
      const result = await campaignMetricsService.getCampaignMetrics('fake-user-id');
      console.log('Result:', result);
    } catch (error) {
      console.log('Caught error in test - this is expected');
    }
  };

  console.log('🔧 Campaign Metrics Debug Commands:');
  console.log('  - debugCampaignMetrics() - Check database setup');
  console.log('  - testCampaignMetricsError() - Test error logging format');
}

export default campaignMetricsService;
