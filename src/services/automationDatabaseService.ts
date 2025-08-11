import { supabase } from '@/integrations/supabase/client';
import { FallbackAutomationService } from './fallbackAutomationService';
import type {
  AutomationCampaign,
  AutomationCampaignInsert,
  LinkPlacement,
  LinkPlacementInsert,
  CampaignReport,
  AvailableSite,
  UserLinkQuota,
  CampaignFilters,
  LinkFilters,
  ReportFilters,
  CampaignMetrics,
  DashboardData,
  CampaignResponse
} from '@/types/automationTypes';

export class AutomationDatabaseService {

  // Check if automation tables exist
  private static async checkTablesExist(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('automation_campaigns')
        .select('count')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }

  // ==================== CAMPAIGNS ====================
  
  static async createCampaign(campaignData: AutomationCampaignInsert): Promise<{ success: boolean; data?: AutomationCampaign; error?: string }> {
    try {
      // Check if tables exist first
      const tablesExist = await this.checkTablesExist();
      if (!tablesExist) {
        console.warn('⚠️ Automation tables do not exist, using fallback service');
        return await FallbackAutomationService.createCampaign(campaignData);
      }

      const { data, error } = await supabase
        .from('automation_campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) {
        console.error('Error creating campaign:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // If it's a table not found error, use fallback
        if (error.code === '42P01') {
          console.warn('⚠️ Table not found, using fallback service');
          return await FallbackAutomationService.createCampaign(campaignData);
        }
        return { success: false, error: error.message || 'Failed to create campaign' };
      }

      // Initialize user quota tracking
      await this.updateUserQuota(campaignData.user_id);
      
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating campaign (catch):', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      // Try fallback on any error
      try {
        return await FallbackAutomationService.createCampaign(campaignData);
      } catch {
        return { success: false, error: error.message || 'Unexpected error creating campaign' };
      }
    }
  }

  static async getCampaigns(userId: string, filters?: CampaignFilters): Promise<{ success: boolean; data?: AutomationCampaign[]; error?: string }> {
    try {
      // Check if tables exist first
      const tablesExist = await this.checkTablesExist();
      if (!tablesExist) {
        console.warn('⚠️ Automation tables do not exist, using fallback service');
        return await FallbackAutomationService.getCampaigns(userId);
      }

      let query = supabase
        .from('automation_campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.engine_type) {
        query = query.eq('engine_type', filters.engine_type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.created_after) {
        query = query.gte('created_at', filters.created_after);
      }
      if (filters?.created_before) {
        query = query.lte('created_at', filters.created_before);
      }
      if (filters?.keyword) {
        query = query.contains('keywords', [filters.keyword]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching campaigns:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // If it's a table not found error, use fallback
        if (error.code === '42P01') {
          console.warn('⚠️ Table not found, using fallback service');
          return await FallbackAutomationService.getCampaigns(userId);
        }
        return { success: false, error: error.message || 'Failed to fetch campaigns' };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching campaigns (catch):', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      // Try fallback on any error
      try {
        return await FallbackAutomationService.getCampaigns(userId);
      } catch {
        return { success: false, error: error.message || 'Unexpected error fetching campaigns' };
      }
    }
  }

  static async getCampaign(campaignId: string, userId: string): Promise<{ success: boolean; data?: CampaignResponse; error?: string }> {
    try {
      // Get campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('automation_campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('user_id', userId)
        .single();

      if (campaignError) {
        console.error('Error fetching campaign:', campaignError);
        return { success: false, error: campaignError.message };
      }

      // Get metrics
      const metrics = await this.getCampaignMetrics(campaignId);
      
      // Get recent links
      const { data: recentLinks } = await supabase
        .from('link_placements')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(10);

      return { 
        success: true, 
        data: {
          campaign,
          metrics: metrics.data || this.getDefaultMetrics(campaignId),
          recent_links: recentLinks || []
        }
      };
    } catch (error: any) {
      console.error('Error fetching campaign:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateCampaign(campaignId: string, userId: string, updates: Partial<AutomationCampaign>): Promise<{ success: boolean; data?: AutomationCampaign; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('automation_campaigns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', campaignId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating campaign:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error updating campaign:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteCampaign(campaignId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First delete associated link placements
      await supabase
        .from('link_placements')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('user_id', userId);

      // Delete campaign reports
      await supabase
        .from('campaign_reports')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('user_id', userId);

      // Delete the campaign
      const { error } = await supabase
        .from('automation_campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting campaign:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== LINK PLACEMENTS ====================

  static async createLinkPlacement(placementData: LinkPlacementInsert): Promise<{ success: boolean; data?: LinkPlacement; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('link_placements')
        .insert(placementData)
        .select()
        .single();

      if (error) {
        console.error('Error creating link placement:', error);
        return { success: false, error: error.message };
      }

      // Update user quota
      await this.incrementUserQuota(placementData.user_id);

      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating link placement:', error);
      return { success: false, error: error.message };
    }
  }

  static async getLinkPlacements(userId: string, filters?: LinkFilters): Promise<{ success: boolean; data?: LinkPlacement[]; error?: string }> {
    try {
      // Check if tables exist first
      const tablesExist = await this.checkTablesExist();
      if (!tablesExist) {
        console.warn('⚠️ Automation tables do not exist, using fallback service');
        return await FallbackAutomationService.getLinkPlacements(userId);
      }

      let query = supabase
        .from('link_placements')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.campaign_id) {
        query = query.eq('campaign_id', filters.campaign_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.placement_type) {
        query = query.eq('placement_type', filters.placement_type);
      }
      if (filters?.domain_authority_min) {
        query = query.gte('domain_authority', filters.domain_authority_min);
      }
      if (filters?.domain_authority_max) {
        query = query.lte('domain_authority', filters.domain_authority_max);
      }
      if (filters?.placement_after) {
        query = query.gte('placement_date', filters.placement_after);
      }
      if (filters?.placement_before) {
        query = query.lte('placement_date', filters.placement_before);
      }
      if (filters?.source_domain) {
        query = query.eq('source_domain', filters.source_domain);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching link placements:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return { success: false, error: error.message || 'Failed to fetch link placements' };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching link placements (catch):', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      return { success: false, error: error.message || 'Unexpected error fetching link placements' };
    }
  }

  static async updateLinkPlacement(placementId: string, userId: string, updates: Partial<LinkPlacement>): Promise<{ success: boolean; data?: LinkPlacement; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('link_placements')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', placementId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating link placement:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error updating link placement:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== REPORTS ====================

  static async createReport(reportData: Omit<CampaignReport, 'id' | 'created_at'>): Promise<{ success: boolean; data?: CampaignReport; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('campaign_reports')
        .insert(reportData)
        .select()
        .single();

      if (error) {
        console.error('Error creating report:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating report:', error);
      return { success: false, error: error.message };
    }
  }

  static async getReports(userId: string, filters?: ReportFilters): Promise<{ success: boolean; data?: CampaignReport[]; error?: string }> {
    try {
      let query = supabase
        .from('campaign_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.campaign_id) {
        query = query.eq('campaign_id', filters.campaign_id);
      }
      if (filters?.report_type) {
        query = query.eq('report_type', filters.report_type);
      }
      if (filters?.period_start) {
        query = query.gte('period_start', filters.period_start);
      }
      if (filters?.period_end) {
        query = query.lte('period_end', filters.period_end);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reports:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== AVAILABLE SITES ====================

  static async getAvailableSites(filters?: any): Promise<{ success: boolean; data?: AvailableSite[]; error?: string }> {
    try {
      let query = supabase
        .from('available_sites')
        .select('*')
        .eq('status', 'active')
        .order('domain_authority', { ascending: false });

      if (filters?.niche) {
        query = query.contains('niche', [filters.niche]);
      }
      if (filters?.min_da) {
        query = query.gte('domain_authority', filters.min_da);
      }
      if (filters?.max_cost) {
        query = query.lte('cost_per_link', filters.max_cost);
      }
      if (filters?.placement_type) {
        query = query.contains('placement_types', [filters.placement_type]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching available sites:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching available sites:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== USER QUOTA MANAGEMENT ====================

  static async getUserQuota(userId: string): Promise<{ success: boolean; data?: UserLinkQuota; error?: string }> {
    try {
      // Check if tables exist first
      const tablesExist = await this.checkTablesExist();
      if (!tablesExist) {
        console.warn('⚠️ Automation tables do not exist, using fallback service');
        return await FallbackAutomationService.getUserQuota(userId);
      }

      const { data, error } = await supabase
        .from('user_link_quotas')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is OK
        console.error('Error fetching user quota:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // If it's a table not found error, use fallback
        if (error.code === '42P01') {
          console.warn('⚠️ Table not found, using fallback service');
          return await FallbackAutomationService.getUserQuota(userId);
        }
        return { success: false, error: error.message || 'Failed to fetch user quota' };
      }

      if (!data) {
        // Create default quota for new users
        const defaultQuota = await this.createDefaultQuota(userId);
        return { success: true, data: defaultQuota };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error fetching user quota (catch):', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      // Try fallback on any error
      try {
        return await FallbackAutomationService.getUserQuota(userId);
      } catch {
        return { success: false, error: error.message || 'Unexpected error fetching user quota' };
      }
    }
  }

  static async updateUserQuota(userId: string): Promise<void> {
    try {
      const quota = await this.getUserQuota(userId);
      if (!quota.success || !quota.data) return;

      // Count actual links built
      const { count } = await supabase
        .from('link_placements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'live');

      const usedQuota = count || 0;
      const remainingQuota = Math.max(0, quota.data.total_quota - usedQuota);

      await supabase
        .from('user_link_quotas')
        .update({
          used_quota: usedQuota,
          remaining_quota: remainingQuota,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating user quota:', error);
    }
  }

  static async incrementUserQuota(userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_user_quota', {
        user_id: userId
      });

      if (error) {
        console.error('Error incrementing user quota:', error);
      }
    } catch (error) {
      console.error('Error incrementing user quota:', error);
    }
  }

  // ==================== DASHBOARD DATA ====================

  static async getDashboardData(userId: string): Promise<{ success: boolean; data?: DashboardData; error?: string }> {
    try {
      // Get campaign counts
      const { count: totalCampaigns } = await supabase
        .from('automation_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: activeCampaigns } = await supabase
        .from('automation_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active');

      // Get link counts
      const { count: totalLinks } = await supabase
        .from('link_placements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get this month's links
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      const { count: linksThisMonth } = await supabase
        .from('link_placements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', firstOfMonth.toISOString());

      // Calculate success rate
      const { count: liveLinks } = await supabase
        .from('link_placements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'live');

      const successRate = totalLinks ? ((liveLinks || 0) / totalLinks) * 100 : 0;

      // Get quota info
      const quotaResult = await this.getUserQuota(userId);

      return {
        success: true,
        data: {
          total_campaigns: totalCampaigns || 0,
          active_campaigns: activeCampaigns || 0,
          total_links: totalLinks || 0,
          links_this_month: linksThisMonth || 0,
          success_rate: Math.round(successRate),
          top_performing_campaigns: [], // TODO: Implement
          recent_placements: [], // TODO: Implement
          quota_info: quotaResult.data || await this.createDefaultQuota(userId)
        }
      };
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== HELPER METHODS ====================

  private static async getCampaignMetrics(campaignId: string): Promise<{ success: boolean; data?: CampaignMetrics; error?: string }> {
    try {
      const { count: totalLinks } = await supabase
        .from('link_placements')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId);

      const { count: liveLinks } = await supabase
        .from('link_placements')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('status', 'live');

      const { count: pendingLinks } = await supabase
        .from('link_placements')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('status', 'pending');

      const { count: failedLinks } = await supabase
        .from('link_placements')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .in('status', ['failed', 'rejected']);

      const successRate = totalLinks ? ((liveLinks || 0) / totalLinks) * 100 : 0;

      return {
        success: true,
        data: {
          campaign_id: campaignId,
          total_links: totalLinks || 0,
          live_links: liveLinks || 0,
          pending_links: pendingLinks || 0,
          failed_links: failedLinks || 0,
          success_rate: Math.round(successRate),
          average_da: 0, // TODO: Calculate from actual placements
          total_cost: 0, // TODO: Calculate from actual placements
          daily_velocity: 0, // TODO: Calculate
          last_activity: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private static getDefaultMetrics(campaignId: string): CampaignMetrics {
    return {
      campaign_id: campaignId,
      total_links: 0,
      live_links: 0,
      pending_links: 0,
      failed_links: 0,
      success_rate: 0,
      average_da: 0,
      total_cost: 0,
      daily_velocity: 0,
      last_activity: new Date().toISOString()
    };
  }

  private static async createDefaultQuota(userId: string): Promise<UserLinkQuota> {
    // Determine plan type based on user's premium status
    // This would be enhanced to check actual user plan
    const defaultQuota: Omit<UserLinkQuota, 'id'> = {
      user_id: userId,
      plan_type: 'free',
      total_quota: 20,
      used_quota: 0,
      remaining_quota: 20,
      reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      last_updated: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_link_quotas')
      .insert(defaultQuota)
      .select()
      .single();

    if (error) {
      console.error('Error creating default quota:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return defaultQuota as UserLinkQuota;
    }

    return data;
  }
}
