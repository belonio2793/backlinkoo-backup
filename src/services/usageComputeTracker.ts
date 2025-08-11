import { supabase } from '@/integrations/supabase/client';

export interface UsageMetrics {
  user_id: string;
  date: string;
  campaign_count: number;
  links_processed: number;
  links_posted: number;
  compute_units_used: number;
  api_requests: number;
  storage_used_mb: number;
  bandwidth_used_mb: number;
  processing_time_seconds: number;
  premium_features_used: string[];
  hosting_cost_estimated: number;
  tier_limit_reached: boolean;
  autopause_triggered: boolean;
  premium_upgrade_suggested: boolean;
}

export interface ComputeOperation {
  operation_type: string;
  engine_type: string;
  difficulty_level: 'easy' | 'medium' | 'hard' | 'expert';
  base_cost: number;
  premium_discount: number;
  hosting_factor: number;
  success_bonus: number;
}

export interface HostingCapabilities {
  max_concurrent_campaigns: number;
  max_daily_operations: number;
  max_storage_mb: number;
  max_bandwidth_mb: number;
  max_compute_units: number;
  max_api_requests: number;
  supported_features: string[];
  tier_name: string;
  cost_per_hour: number;
  scaling_available: boolean;
}

export interface AdminHostingStats {
  total_users: number;
  active_users: number;
  total_campaigns: number;
  active_campaigns: number;
  total_compute_usage: number;
  avg_compute_per_user: number;
  storage_usage_mb: number;
  bandwidth_usage_mb: number;
  hosting_costs: {
    daily: number;
    weekly: number;
    monthly: number;
    projected_monthly: number;
  };
  resource_utilization: {
    cpu_percent: number;
    memory_percent: number;
    storage_percent: number;
    bandwidth_percent: number;
  };
  scaling_recommendations: {
    should_scale: boolean;
    scale_factor: number;
    estimated_cost_increase: number;
    timeline: string;
  };
}

export interface UserTierLimits {
  tier: 'free' | 'premium' | 'enterprise';
  daily_link_limit: number;
  compute_limit: number;
  storage_limit_mb: number;
  bandwidth_limit_mb: number;
  api_request_limit: number;
  campaign_limit: number;
  premium_features: string[];
  cost_multiplier: number;
}

export class UsageComputeTracker {
  private static tierLimits: Record<string, UserTierLimits> = {
    free: {
      tier: 'free',
      daily_link_limit: 20,
      compute_limit: 10.0,
      storage_limit_mb: 100,
      bandwidth_limit_mb: 500,
      api_request_limit: 1000,
      campaign_limit: 3,
      premium_features: [],
      cost_multiplier: 1.0
    },
    premium: {
      tier: 'premium',
      daily_link_limit: 500,
      compute_limit: 100.0,
      storage_limit_mb: 1000,
      bandwidth_limit_mb: 5000,
      api_request_limit: 10000,
      campaign_limit: 25,
      premium_features: ['auto_run', 'advanced_targeting', 'priority_support', 'custom_domains'],
      cost_multiplier: 0.8
    },
    enterprise: {
      tier: 'enterprise',
      daily_link_limit: -1, // Unlimited
      compute_limit: -1, // Unlimited
      storage_limit_mb: -1, // Unlimited
      bandwidth_limit_mb: -1, // Unlimited
      api_request_limit: -1, // Unlimited
      campaign_limit: -1, // Unlimited
      premium_features: ['auto_run', 'advanced_targeting', 'priority_support', 'custom_domains', 'white_label', 'api_access', 'dedicated_resources'],
      cost_multiplier: 0.6
    }
  };

  // ==================== USAGE TRACKING ====================

  static async trackOperation(
    userId: string,
    campaignId: string,
    operationType: string,
    engineType: string,
    difficultyLevel: ComputeOperation['difficulty_level'] = 'medium',
    success: boolean = true
  ): Promise<number> {
    try {
      // Get compute cost from matrix
      const computeCost = await this.calculateComputeCost(
        operationType,
        engineType,
        difficultyLevel,
        userId,
        success
      );

      // Update daily usage
      await this.updateDailyUsage(userId, {
        api_requests: 1,
        compute_units_used: computeCost,
        processing_time_seconds: Math.floor(Math.random() * 30) + 5, // Simulated
        bandwidth_used_mb: this.estimateBandwidthUsage(operationType),
        storage_used_mb: this.estimateStorageUsage(operationType)
      });

      // Log operation for admin tracking
      await this.logOperationForAdmin(userId, campaignId, {
        operation_type: operationType,
        engine_type: engineType,
        difficulty_level: difficultyLevel,
        compute_cost: computeCost,
        success
      });

      // Check limits and trigger premium upgrades if needed
      await this.checkLimitsAndTriggerUpgrades(userId);

      return computeCost;
    } catch (error) {
      console.error('Error tracking operation:', error);
      return 0;
    }
  }

  private static async calculateComputeCost(
    operationType: string,
    engineType: string,
    difficultyLevel: ComputeOperation['difficulty_level'],
    userId: string,
    success: boolean
  ): Promise<number> {
    try {
      // Get base cost from matrix
      const { data: costMatrix } = await supabase
        .from('compute_cost_matrix')
        .select('*')
        .eq('operation_type', operationType)
        .eq('engine_type', engineType)
        .eq('difficulty_level', difficultyLevel)
        .single();

      if (!costMatrix) {
        // Default cost if not found
        return 0.01;
      }

      // Get user tier for discount
      const userTier = await this.getUserTier(userId);
      const tierConfig = this.tierLimits[userTier];

      let finalCost = costMatrix.base_cost * costMatrix.hosting_factor;

      // Apply premium discount
      if (userTier !== 'free') {
        finalCost *= (1 - costMatrix.premium_discount);
      }

      // Apply tier cost multiplier
      finalCost *= tierConfig.cost_multiplier;

      // Apply success bonus
      if (success && costMatrix.success_bonus) {
        finalCost += costMatrix.success_bonus;
      }

      return Math.round(finalCost * 10000) / 10000; // Round to 4 decimal places
    } catch (error) {
      console.error('Error calculating compute cost:', error);
      return 0.01;
    }
  }

  private static estimateBandwidthUsage(operationType: string): number {
    const bandwidthMap: Record<string, number> = {
      url_discovery: 0.5,
      content_posting: 2.0,
      verification: 1.0,
      sync: 0.2,
      compute: 0.1
    };
    return bandwidthMap[operationType] || 0.5;
  }

  private static estimateStorageUsage(operationType: string): number {
    const storageMap: Record<string, number> = {
      url_discovery: 0.1,
      content_posting: 0.5,
      verification: 0.05,
      sync: 0.02,
      compute: 0.01
    };
    return storageMap[operationType] || 0.1;
  }

  private static async updateDailyUsage(
    userId: string,
    updates: Partial<{
      campaign_count: number;
      links_processed: number;
      links_posted: number;
      compute_units_used: number;
      api_requests: number;
      storage_used_mb: number;
      bandwidth_used_mb: number;
      processing_time_seconds: number;
      premium_features_used: string[];
    }>
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Upsert daily usage record
      await supabase
        .from('daily_usage_tracking')
        .upsert({
          user_id: userId,
          usage_date: today,
          campaign_count: 0,
          links_processed: 0,
          links_posted: 0,
          compute_units_used: 0,
          api_requests: 0,
          storage_used_mb: 0,
          bandwidth_used_mb: 0,
          processing_time_seconds: 0,
          premium_features_used: [],
          hosting_cost_estimated: 0,
          tier_limit_reached: false,
          autopause_triggered: false,
          premium_upgrade_suggested: false,
          ...updates
        }, {
          onConflict: 'user_id,usage_date',
          ignoreDuplicates: false
        });

      // Update totals
      await supabase.rpc('increment_daily_usage', {
        p_user_id: userId,
        p_date: today,
        p_updates: updates
      });

    } catch (error) {
      console.error('Error updating daily usage:', error);
    }
  }

  private static async logOperationForAdmin(
    userId: string,
    campaignId: string,
    operationData: any
  ): Promise<void> {
    try {
      await supabase
        .from('system_operations')
        .insert({
          user_id: userId,
          campaign_id: campaignId,
          operation_type: operationData.operation_type,
          operation_subtype: operationData.engine_type,
          status: operationData.success ? 'completed' : 'failed',
          compute_cost: operationData.compute_cost,
          operation_data: operationData,
          hosting_impact: {
            cpu_usage: Math.random() * 20 + 10,
            memory_usage: Math.random() * 30 + 15,
            bandwidth_usage: this.estimateBandwidthUsage(operationData.operation_type)
          }
        });
    } catch (error) {
      console.error('Error logging operation for admin:', error);
    }
  }

  // ==================== LIMIT CHECKING ====================

  private static async checkLimitsAndTriggerUpgrades(userId: string): Promise<void> {
    try {
      const userTier = await this.getUserTier(userId);
      const tierConfig = this.tierLimits[userTier];
      const today = new Date().toISOString().split('T')[0];

      // Get current usage
      const { data: usage } = await supabase
        .from('daily_usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .single();

      if (!usage) return;

      let shouldTriggerUpgrade = false;
      let triggerReasons: string[] = [];

      // Check daily link limit
      if (tierConfig.daily_link_limit > 0 && usage.links_posted >= tierConfig.daily_link_limit) {
        shouldTriggerUpgrade = true;
        triggerReasons.push('daily_link_limit');
        
        // Auto-pause campaigns if limit reached
        await this.autoPauseCampaigns(userId, 'daily_limit_reached');
      }

      // Check compute limit
      if (tierConfig.compute_limit > 0 && usage.compute_units_used >= tierConfig.compute_limit) {
        shouldTriggerUpgrade = true;
        triggerReasons.push('compute_limit');
      }

      // Check storage limit
      if (tierConfig.storage_limit_mb > 0 && usage.storage_used_mb >= tierConfig.storage_limit_mb) {
        shouldTriggerUpgrade = true;
        triggerReasons.push('storage_limit');
      }

      // Check bandwidth limit
      if (tierConfig.bandwidth_limit_mb > 0 && usage.bandwidth_used_mb >= tierConfig.bandwidth_limit_mb) {
        shouldTriggerUpgrade = true;
        triggerReasons.push('bandwidth_limit');
      }

      // Check campaign limit
      if (tierConfig.campaign_limit > 0 && usage.campaign_count >= tierConfig.campaign_limit) {
        shouldTriggerUpgrade = true;
        triggerReasons.push('campaign_limit');
      }

      // Update usage record with limit status
      await supabase
        .from('daily_usage_tracking')
        .update({
          tier_limit_reached: shouldTriggerUpgrade,
          premium_upgrade_suggested: shouldTriggerUpgrade,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('usage_date', today);

      // Trigger premium upgrade suggestions
      if (shouldTriggerUpgrade) {
        await this.triggerPremiumUpgrade(userId, triggerReasons);
      }

    } catch (error) {
      console.error('Error checking limits:', error);
    }
  }

  private static async triggerPremiumUpgrade(userId: string, reasons: string[]): Promise<void> {
    try {
      const userTier = await this.getUserTier(userId);
      const nextTier = userTier === 'free' ? 'premium' : 'enterprise';
      
      if (userTier === 'enterprise') return; // Already at highest tier

      await supabase
        .from('premium_triggers')
        .insert({
          user_id: userId,
          trigger_type: 'usage_limit',
          trigger_event: reasons.join(','),
          trigger_data: {
            current_tier: userTier,
            suggested_tier: nextTier,
            reasons: reasons,
            benefits: this.getUpgradeBenefits(userTier, nextTier)
          },
          priority: reasons.length > 2 ? 9 : 7, // High priority if multiple limits hit
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        });
    } catch (error) {
      console.error('Error triggering premium upgrade:', error);
    }
  }

  private static getUpgradeBenefits(currentTier: string, nextTier: string): string[] {
    const benefits: Record<string, string[]> = {
      'free->premium': [
        '25x more daily links (500 vs 20)',
        '10x more compute power',
        'Auto-run campaigns',
        'Advanced targeting',
        'Priority support'
      ],
      'premium->enterprise': [
        'Unlimited everything',
        'White-label solution',
        'API access',
        'Dedicated resources',
        'Custom integrations'
      ]
    };

    return benefits[`${currentTier}->${nextTier}`] || [];
  }

  private static async autoPauseCampaigns(userId: string, reason: string): Promise<void> {
    try {
      // Get active campaigns
      const { data: campaigns } = await supabase
        .from('automation_campaigns')
        .select('id, name')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (campaigns && campaigns.length > 0) {
        // Pause all active campaigns
        await supabase
          .from('automation_campaigns')
          .update({
            status: 'auto_paused',
            paused_reason: reason,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('status', 'active');

        // Log auto-pause event
        await supabase
          .from('activity_feed')
          .insert({
            user_id: userId,
            activity_type: 'alert',
            activity_subtype: 'auto_pause',
            message: `${campaigns.length} campaigns auto-paused due to ${reason}`,
            details: { campaigns: campaigns.map(c => c.name), reason },
            severity: 'warning',
            ui_placement: 'notification'
          });

        // Update daily usage to mark autopause triggered
        const today = new Date().toISOString().split('T')[0];
        await supabase
          .from('daily_usage_tracking')
          .update({ autopause_triggered: true })
          .eq('user_id', userId)
          .eq('usage_date', today);
      }
    } catch (error) {
      console.error('Error auto-pausing campaigns:', error);
    }
  }

  // ==================== ADMIN HOSTING CAPABILITIES ====================

  static async getAdminHostingStats(): Promise<AdminHostingStats> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get user counts
      const { count: totalUsers } = await supabase
        .from('daily_usage_tracking')
        .select('*', { count: 'exact', head: true })
        .eq('usage_date', today);

      const { count: activeUsers } = await supabase
        .from('daily_usage_tracking')
        .select('*', { count: 'exact', head: true })
        .eq('usage_date', today)
        .gt('api_requests', 0);

      // Get campaign counts
      const { count: totalCampaigns } = await supabase
        .from('automation_campaigns')
        .select('*', { count: 'exact', head: true });

      const { count: activeCampaigns } = await supabase
        .from('automation_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get usage totals
      const { data: usageData } = await supabase
        .from('daily_usage_tracking')
        .select('compute_units_used, storage_used_mb, bandwidth_used_mb, hosting_cost_estimated')
        .eq('usage_date', today);

      const totalCompute = usageData?.reduce((sum, u) => sum + u.compute_units_used, 0) || 0;
      const totalStorage = usageData?.reduce((sum, u) => sum + u.storage_used_mb, 0) || 0;
      const totalBandwidth = usageData?.reduce((sum, u) => sum + u.bandwidth_used_mb, 0) || 0;

      // Calculate hosting costs
      const dailyCosts = await this.calculateHostingCosts('day');
      const weeklyCosts = await this.calculateHostingCosts('week');
      const monthlyCosts = await this.calculateHostingCosts('month');

      // Calculate resource utilization (simulated based on usage)
      const maxCapacity = {
        cpu: 100, // Assume 100 CPU cores available
        memory: 1000, // Assume 1TB memory available
        storage: 10000, // Assume 10TB storage available
        bandwidth: 100000 // Assume 100TB bandwidth available
      };

      const resourceUtilization = {
        cpu_percent: Math.min((activeCampaigns || 0) * 2, 100),
        memory_percent: Math.min((totalUsers || 0) * 0.5, 100),
        storage_percent: Math.min((totalStorage / maxCapacity.storage) * 100, 100),
        bandwidth_percent: Math.min((totalBandwidth / maxCapacity.bandwidth) * 100, 100)
      };

      // Calculate scaling recommendations
      const scalingRecommendations = this.calculateScalingRecommendations(
        resourceUtilization,
        activeCampaigns || 0,
        totalUsers || 0
      );

      return {
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        total_campaigns: totalCampaigns || 0,
        active_campaigns: activeCampaigns || 0,
        total_compute_usage: totalCompute,
        avg_compute_per_user: totalUsers ? totalCompute / totalUsers : 0,
        storage_usage_mb: totalStorage,
        bandwidth_usage_mb: totalBandwidth,
        hosting_costs: {
          daily: dailyCosts,
          weekly: weeklyCosts,
          monthly: monthlyCosts,
          projected_monthly: dailyCosts * 30
        },
        resource_utilization: resourceUtilization,
        scaling_recommendations: scalingRecommendations
      };
    } catch (error) {
      console.error('Error getting admin hosting stats:', error);
      throw error;
    }
  }

  private static async calculateHostingCosts(period: 'day' | 'week' | 'month'): Promise<number> {
    try {
      let dateFilter: string;
      const now = new Date();

      switch (period) {
        case 'day':
          dateFilter = now.toISOString().split('T')[0];
          break;
        case 'week':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'month':
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
      }

      let query = supabase
        .from('daily_usage_tracking')
        .select('hosting_cost_estimated');

      if (period === 'day') {
        query = query.eq('usage_date', dateFilter);
      } else {
        query = query.gte('usage_date', dateFilter);
      }

      const { data } = await query;

      return data?.reduce((sum, usage) => sum + (usage.hosting_cost_estimated || 0), 0) || 0;
    } catch (error) {
      console.error('Error calculating hosting costs:', error);
      return 0;
    }
  }

  private static calculateScalingRecommendations(
    utilization: AdminHostingStats['resource_utilization'],
    activeCampaigns: number,
    totalUsers: number
  ): AdminHostingStats['scaling_recommendations'] {
    // Determine if scaling is needed
    const maxUtilization = Math.max(
      utilization.cpu_percent,
      utilization.memory_percent,
      utilization.storage_percent,
      utilization.bandwidth_percent
    );

    const shouldScale = maxUtilization > 80; // Scale if any resource > 80%
    
    let scaleFactor = 1;
    let timeline = '3-6 months';
    
    if (maxUtilization > 90) {
      scaleFactor = 2;
      timeline = 'immediate';
    } else if (maxUtilization > 80) {
      scaleFactor = 1.5;
      timeline = '1-2 months';
    }

    // Estimate cost increase
    const baseCostPerMonth = 1000; // Assume $1000/month base hosting
    const estimatedCostIncrease = (scaleFactor - 1) * baseCostPerMonth;

    return {
      should_scale: shouldScale,
      scale_factor: scaleFactor,
      estimated_cost_increase: estimatedCostIncrease,
      timeline: timeline
    };
  }

  // ==================== USER TIER MANAGEMENT ====================

  static async getUserTier(userId: string): Promise<string> {
    try {
      // Check user's subscription/plan (implementation depends on your auth system)
      // For now, we'll check a user profile or subscription table
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('user_id', userId)
        .single();

      return userProfile?.subscription_tier || 'free';
    } catch (error) {
      console.error('Error getting user tier:', error);
      return 'free';
    }
  }

  static getUserTierLimits(tier: string): UserTierLimits {
    return this.tierLimits[tier] || this.tierLimits.free;
  }

  static async getUserUsageStats(userId: string, days: number = 30): Promise<UsageMetrics[]> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .gte('usage_date', startDate)
        .lte('usage_date', endDate)
        .order('usage_date', { ascending: false });

      if (error) {
        console.error('Error fetching user usage stats:', error);
        return [];
      }

      return data?.map(usage => ({
        user_id: usage.user_id,
        date: usage.usage_date,
        campaign_count: usage.campaign_count,
        links_processed: usage.links_processed,
        links_posted: usage.links_posted,
        compute_units_used: usage.compute_units_used,
        api_requests: usage.api_requests,
        storage_used_mb: usage.storage_used_mb,
        bandwidth_used_mb: usage.bandwidth_used_mb,
        processing_time_seconds: usage.processing_time_seconds,
        premium_features_used: usage.premium_features_used,
        hosting_cost_estimated: usage.hosting_cost_estimated,
        tier_limit_reached: usage.tier_limit_reached,
        autopause_triggered: usage.autopause_triggered,
        premium_upgrade_suggested: usage.premium_upgrade_suggested
      })) || [];
    } catch (error) {
      console.error('Error in getUserUsageStats:', error);
      return [];
    }
  }

  // ==================== UTILITY METHODS ====================

  static async estimateHostingCapabilities(
    expectedUsers: number,
    avgCampaignsPerUser: number,
    avgLinksPerDay: number
  ): Promise<HostingCapabilities> {
    const totalCampaigns = expectedUsers * avgCampaignsPerUser;
    const totalDailyOperations = expectedUsers * avgLinksPerDay * 3; // Assume 3 operations per link
    const totalStorageMb = expectedUsers * 500; // 500MB per user average
    const totalBandwidthMb = totalDailyOperations * 2; // 2MB per operation average
    const totalComputeUnits = totalDailyOperations * 0.05; // 0.05 compute units per operation

    return {
      max_concurrent_campaigns: Math.ceil(totalCampaigns * 0.3), // 30% concurrent
      max_daily_operations: totalDailyOperations,
      max_storage_mb: totalStorageMb,
      max_bandwidth_mb: totalBandwidthMb,
      max_compute_units: totalComputeUnits,
      max_api_requests: totalDailyOperations * 5, // 5 API calls per operation
      supported_features: ['basic_automation', 'real_time_monitoring', 'reporting'],
      tier_name: 'standard',
      cost_per_hour: (totalComputeUnits * 0.10) + (totalStorageMb * 0.001) + (totalBandwidthMb * 0.01),
      scaling_available: true
    };
  }

  // ==================== CLEANUP ====================

  static async cleanup(): Promise<void> {
    try {
      // Clean up old usage records (keep last 90 days)
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      await supabase
        .from('daily_usage_tracking')
        .delete()
        .lt('usage_date', cutoffDate);

      // Clean up old system operations (keep last 30 days)
      const operationCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      await supabase
        .from('system_operations')
        .delete()
        .lt('start_time', operationCutoff);

      console.log('✅ Usage tracking cleanup completed');
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  }
}
