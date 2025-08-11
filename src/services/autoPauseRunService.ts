import { supabase } from '@/integrations/supabase/client';
import { UsageComputeTracker } from './usageComputeTracker';

export interface AutomationConfig {
  id: string;
  user_id: string;
  campaign_id: string;
  auto_pause_enabled: boolean;
  auto_run_enabled: boolean; // Premium feature
  daily_limit: number;
  compute_limit: number;
  pause_triggers: {
    daily_limit_reached: boolean;
    compute_limit_reached: boolean;
    budget_limit_reached: boolean;
    quality_threshold_failed: boolean;
    error_rate_exceeded: boolean;
    user_tier_limit: boolean;
  };
  run_triggers: {
    schedule_based: boolean;
    performance_based: boolean;
    queue_based: boolean;
    competitive_based: boolean;
  };
  premium_mode: boolean;
  current_status: 'manual' | 'auto_paused' | 'auto_running';
  last_pause_reason?: string;
  last_action_timestamp: string;
  configuration: {
    pause_grace_period_minutes: number;
    run_optimization_enabled: boolean;
    smart_scheduling_enabled: boolean;
    competitive_monitoring_enabled: boolean;
    quality_monitoring_enabled: boolean;
  };
}

export interface PremiumTrigger {
  id: string;
  user_id: string;
  trigger_type: 'daily_limit' | 'compute_limit' | 'feature_request' | 'autopause' | 'performance';
  trigger_event: string;
  campaign_id?: string;
  trigger_data: {
    current_tier?: string;
    suggested_tier?: string;
    feature_requested?: string;
    limit_hit?: string;
    benefits?: string[];
    urgency_level?: 'low' | 'medium' | 'high' | 'critical';
  };
  user_response?: 'shown' | 'dismissed' | 'upgraded' | 'ignored';
  conversion_value?: number;
  triggered_at: string;
  responded_at?: string;
  expires_at: string;
  priority: number;
  shown_count: number;
  max_show_count: number;
}

export interface AutomationEvent {
  id: string;
  campaign_id: string;
  event_type: 'auto_pause' | 'auto_resume' | 'manual_pause' | 'manual_resume' | 'premium_upgrade';
  trigger_reason: string;
  event_timestamp: string;
  user_id: string;
  previous_status: string;
  new_status: string;
  automation_data: Record<string, any>;
  premium_trigger_id?: string;
}

export class AutoPauseRunService {
  private static monitoringIntervals = new Map<string, NodeJS.Timeout>();
  private static automationConfigs = new Map<string, AutomationConfig>();
  private static premiumTriggerQueue = new Map<string, PremiumTrigger[]>();

  // ==================== AUTOMATION CONFIGURATION ====================

  static async createAutomationConfig(
    userId: string,
    campaignId: string,
    config: Partial<AutomationConfig> = {}
  ): Promise<AutomationConfig> {
    try {
      // Get user tier to determine default settings
      const userTier = await UsageComputeTracker.getUserTier(userId);
      const tierLimits = UsageComputeTracker.getUserTierLimits(userTier);

      const defaultConfig: Omit<AutomationConfig, 'id'> = {
        user_id: userId,
        campaign_id: campaignId,
        auto_pause_enabled: true,
        auto_run_enabled: userTier !== 'free', // Premium feature
        daily_limit: tierLimits.daily_link_limit > 0 ? tierLimits.daily_link_limit : 20,
        compute_limit: tierLimits.compute_limit > 0 ? tierLimits.compute_limit : 10.0,
        pause_triggers: {
          daily_limit_reached: true,
          compute_limit_reached: true,
          budget_limit_reached: true,
          quality_threshold_failed: true,
          error_rate_exceeded: true,
          user_tier_limit: true
        },
        run_triggers: {
          schedule_based: userTier !== 'free',
          performance_based: userTier === 'enterprise',
          queue_based: userTier !== 'free',
          competitive_based: userTier === 'enterprise'
        },
        premium_mode: userTier !== 'free',
        current_status: 'manual',
        last_action_timestamp: new Date().toISOString(),
        configuration: {
          pause_grace_period_minutes: 5,
          run_optimization_enabled: userTier !== 'free',
          smart_scheduling_enabled: userTier === 'enterprise',
          competitive_monitoring_enabled: userTier === 'enterprise',
          quality_monitoring_enabled: true
        },
        ...config
      };

      // Store in database
      const { data, error } = await supabase
        .from('automation_controls')
        .upsert(defaultConfig, { onConflict: 'user_id,campaign_id' })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create automation config: ${error.message}`);
      }

      const automationConfig = data as AutomationConfig;
      this.automationConfigs.set(campaignId, automationConfig);

      // Start monitoring if auto features are enabled
      if (automationConfig.auto_pause_enabled || automationConfig.auto_run_enabled) {
        this.startAutomationMonitoring(campaignId);
      }

      return automationConfig;
    } catch (error: any) {
      console.error('Error creating automation config:', error);
      throw error;
    }
  }

  static async updateAutomationConfig(
    campaignId: string,
    updates: Partial<AutomationConfig>
  ): Promise<AutomationConfig | null> {
    try {
      const { data, error } = await supabase
        .from('automation_controls')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update automation config: ${error.message}`);
      }

      const updatedConfig = data as AutomationConfig;
      this.automationConfigs.set(campaignId, updatedConfig);

      // Restart monitoring if settings changed
      if (updates.auto_pause_enabled !== undefined || updates.auto_run_enabled !== undefined) {
        this.stopAutomationMonitoring(campaignId);
        if (updatedConfig.auto_pause_enabled || updatedConfig.auto_run_enabled) {
          this.startAutomationMonitoring(campaignId);
        }
      }

      return updatedConfig;
    } catch (error: any) {
      console.error('Error updating automation config:', error);
      return null;
    }
  }

  // ==================== AUTO-PAUSE FUNCTIONALITY ====================

  static async checkAndTriggerAutoPause(campaignId: string): Promise<boolean> {
    try {
      const config = await this.getAutomationConfig(campaignId);
      if (!config || !config.auto_pause_enabled) {
        return false;
      }

      const pauseReasons: string[] = [];

      // Check daily limit
      if (config.pause_triggers.daily_limit_reached) {
        const dailyUsage = await this.getDailyUsage(config.user_id);
        if (dailyUsage.links_posted >= config.daily_limit) {
          pauseReasons.push('daily_limit_reached');
        }
      }

      // Check compute limit
      if (config.pause_triggers.compute_limit_reached) {
        const dailyUsage = await this.getDailyUsage(config.user_id);
        if (dailyUsage.compute_units_used >= config.compute_limit) {
          pauseReasons.push('compute_limit_reached');
        }
      }

      // Check budget limit
      if (config.pause_triggers.budget_limit_reached) {
        const campaign = await this.getCampaignData(campaignId);
        if (campaign?.budget_limit) {
          const totalCost = await this.getCampaignTotalCost(campaignId);
          if (totalCost >= campaign.budget_limit) {
            pauseReasons.push('budget_limit_reached');
          }
        }
      }

      // Check quality threshold
      if (config.pause_triggers.quality_threshold_failed) {
        const qualityScore = await this.getCampaignQualityScore(campaignId);
        if (qualityScore < 50) { // Threshold of 50
          pauseReasons.push('quality_threshold_failed');
        }
      }

      // Check error rate
      if (config.pause_triggers.error_rate_exceeded) {
        const errorRate = await this.getCampaignErrorRate(campaignId);
        if (errorRate > 0.3) { // 30% error rate threshold
          pauseReasons.push('error_rate_exceeded');
        }
      }

      // Check user tier limits
      if (config.pause_triggers.user_tier_limit) {
        const tierLimitReached = await this.checkUserTierLimits(config.user_id);
        if (tierLimitReached) {
          pauseReasons.push('user_tier_limit');
        }
      }

      // Trigger auto-pause if any conditions are met
      if (pauseReasons.length > 0) {
        const success = await this.executeCampaignPause(campaignId, pauseReasons.join(', '));
        
        if (success) {
          // Trigger premium upgrade suggestion
          await this.triggerPremiumUpgrade(config.user_id, campaignId, pauseReasons);
        }

        return success;
      }

      return false;
    } catch (error: any) {
      console.error('Error checking auto-pause triggers:', error);
      return false;
    }
  }

  private static async executeCampaignPause(campaignId: string, reason: string): Promise<boolean> {
    try {
      // Update campaign status
      const { error: campaignError } = await supabase
        .from('automation_campaigns')
        .update({
          status: 'auto_paused',
          paused_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (campaignError) {
        throw new Error(`Failed to pause campaign: ${campaignError.message}`);
      }

      // Update automation config
      await this.updateAutomationConfig(campaignId, {
        current_status: 'auto_paused',
        last_pause_reason: reason,
        last_action_timestamp: new Date().toISOString()
      });

      // Log automation event
      await this.logAutomationEvent(campaignId, 'auto_pause', reason);

      console.log(`🛑 Auto-paused campaign ${campaignId}: ${reason}`);
      return true;
    } catch (error: any) {
      console.error('Error executing campaign pause:', error);
      return false;
    }
  }

  // ==================== AUTO-RUN FUNCTIONALITY (PREMIUM) ====================

  static async checkAndTriggerAutoRun(campaignId: string): Promise<boolean> {
    try {
      const config = await this.getAutomationConfig(campaignId);
      if (!config || !config.auto_run_enabled || !config.premium_mode) {
        return false;
      }

      const campaign = await this.getCampaignData(campaignId);
      if (!campaign || campaign.status !== 'paused') {
        return false;
      }

      const runReasons: string[] = [];

      // Check schedule-based triggers
      if (config.run_triggers.schedule_based) {
        const shouldRunBySchedule = await this.checkScheduleTrigger(campaignId);
        if (shouldRunBySchedule) {
          runReasons.push('scheduled_run');
        }
      }

      // Check performance-based triggers
      if (config.run_triggers.performance_based) {
        const performanceImproved = await this.checkPerformanceTrigger(campaignId);
        if (performanceImproved) {
          runReasons.push('performance_improved');
        }
      }

      // Check queue-based triggers
      if (config.run_triggers.queue_based) {
        const queueOptimal = await this.checkQueueTrigger(campaignId);
        if (queueOptimal) {
          runReasons.push('queue_optimal');
        }
      }

      // Check competitive-based triggers
      if (config.run_triggers.competitive_based) {
        const competitiveOpportunity = await this.checkCompetitiveTrigger(campaignId);
        if (competitiveOpportunity) {
          runReasons.push('competitive_opportunity');
        }
      }

      // Trigger auto-run if conditions are met
      if (runReasons.length > 0) {
        return await this.executeCampaignResume(campaignId, runReasons.join(', '));
      }

      return false;
    } catch (error: any) {
      console.error('Error checking auto-run triggers:', error);
      return false;
    }
  }

  private static async executeCampaignResume(campaignId: string, reason: string): Promise<boolean> {
    try {
      // Check if limits are still within bounds
      const config = await this.getAutomationConfig(campaignId);
      if (!config) return false;

      const dailyUsage = await this.getDailyUsage(config.user_id);
      if (dailyUsage.links_posted >= config.daily_limit || 
          dailyUsage.compute_units_used >= config.compute_limit) {
        return false; // Still at limits
      }

      // Update campaign status
      const { error: campaignError } = await supabase
        .from('automation_campaigns')
        .update({
          status: 'active',
          paused_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (campaignError) {
        throw new Error(`Failed to resume campaign: ${campaignError.message}`);
      }

      // Update automation config
      await this.updateAutomationConfig(campaignId, {
        current_status: 'auto_running',
        last_action_timestamp: new Date().toISOString()
      });

      // Log automation event
      await this.logAutomationEvent(campaignId, 'auto_resume', reason);

      console.log(`▶️ Auto-resumed campaign ${campaignId}: ${reason}`);
      return true;
    } catch (error: any) {
      console.error('Error executing campaign resume:', error);
      return false;
    }
  }

  // ==================== PREMIUM TRIGGERS ====================

  private static async triggerPremiumUpgrade(
    userId: string,
    campaignId: string,
    reasons: string[]
  ): Promise<void> {
    try {
      const userTier = await UsageComputeTracker.getUserTier(userId);
      if (userTier === 'enterprise') return; // Already at highest tier

      const urgencyLevel = this.calculateUrgencyLevel(reasons);
      const suggestedTier = userTier === 'free' ? 'premium' : 'enterprise';

      const trigger: Omit<PremiumTrigger, 'id'> = {
        user_id: userId,
        trigger_type: 'autopause',
        trigger_event: `auto_pause_triggered: ${reasons.join(', ')}`,
        campaign_id: campaignId,
        trigger_data: {
          current_tier: userTier,
          suggested_tier: suggestedTier,
          limit_hit: reasons.join(', '),
          benefits: this.getUpgradeBenefits(userTier, suggestedTier),
          urgency_level: urgencyLevel
        },
        triggered_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + (urgencyLevel === 'critical' ? 2 : 24) * 60 * 60 * 1000).toISOString(),
        priority: this.calculatePriority(urgencyLevel, reasons.length),
        shown_count: 0,
        max_show_count: urgencyLevel === 'critical' ? 5 : 3
      };

      const { data, error } = await supabase
        .from('premium_triggers')
        .insert(trigger)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create premium trigger: ${error.message}`);
      }

      // Add to queue for display
      if (!this.premiumTriggerQueue.has(userId)) {
        this.premiumTriggerQueue.set(userId, []);
      }
      this.premiumTriggerQueue.get(userId)!.push(data as PremiumTrigger);

      console.log(`💎 Premium upgrade triggered for user ${userId}: ${reasons.join(', ')}`);
    } catch (error: any) {
      console.error('Error triggering premium upgrade:', error);
    }
  }

  private static calculateUrgencyLevel(reasons: string[]): PremiumTrigger['trigger_data']['urgency_level'] {
    if (reasons.includes('daily_limit_reached') && reasons.includes('compute_limit_reached')) {
      return 'critical';
    }
    if (reasons.includes('quality_threshold_failed') || reasons.includes('error_rate_exceeded')) {
      return 'high';
    }
    if (reasons.length > 1) {
      return 'medium';
    }
    return 'low';
  }

  private static calculatePriority(urgencyLevel: string, reasonCount: number): number {
    const basePriority = {
      critical: 10,
      high: 8,
      medium: 6,
      low: 4
    }[urgencyLevel] || 4;

    return Math.min(basePriority + reasonCount, 10);
  }

  private static getUpgradeBenefits(currentTier: string, nextTier: string): string[] {
    const benefits: Record<string, string[]> = {
      'free->premium': [
        'Remove daily limits with 500 links/day',
        'Enable auto-run campaigns',
        '10x more compute power',
        'Advanced targeting options',
        'Priority support',
        'Smart scheduling'
      ],
      'premium->enterprise': [
        'Unlimited everything',
        'Competitive monitoring',
        'White-label solution',
        'API access',
        'Dedicated resources',
        'Custom integrations'
      ]
    };

    return benefits[`${currentTier}->${nextTier}`] || [];
  }

  // ==================== TRIGGER CHECKING FUNCTIONS ====================

  private static async checkScheduleTrigger(campaignId: string): Promise<boolean> {
    // Check if it's an optimal time to run based on schedule
    const hour = new Date().getHours();
    const optimalHours = [9, 10, 11, 14, 15, 16]; // Business hours
    return optimalHours.includes(hour);
  }

  private static async checkPerformanceTrigger(campaignId: string): Promise<boolean> {
    // Check if recent performance has improved
    const qualityScore = await this.getCampaignQualityScore(campaignId);
    const errorRate = await this.getCampaignErrorRate(campaignId);
    
    return qualityScore > 70 && errorRate < 0.1;
  }

  private static async checkQueueTrigger(campaignId: string): Promise<boolean> {
    // Check if system load is optimal
    try {
      const { count: activeOperations } = await supabase
        .from('system_operations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['processing', 'started']);

      return (activeOperations || 0) < 50; // Less than 50 active operations
    } catch (error) {
      return false;
    }
  }

  private static async checkCompetitiveTrigger(campaignId: string): Promise<boolean> {
    // Simulate competitive opportunity detection
    return Math.random() > 0.8; // 20% chance of competitive opportunity
  }

  // ==================== MONITORING ====================

  private static startAutomationMonitoring(campaignId: string): void {
    if (this.monitoringIntervals.has(campaignId)) {
      this.stopAutomationMonitoring(campaignId);
    }

    const interval = setInterval(async () => {
      try {
        // Check auto-pause triggers
        await this.checkAndTriggerAutoPause(campaignId);
        
        // Check auto-run triggers
        await this.checkAndTriggerAutoRun(campaignId);
      } catch (error) {
        console.error(`Error in automation monitoring for campaign ${campaignId}:`, error);
      }
    }, 60000); // Check every minute

    this.monitoringIntervals.set(campaignId, interval);
    console.log(`🔄 Started automation monitoring for campaign ${campaignId}`);
  }

  private static stopAutomationMonitoring(campaignId: string): void {
    const interval = this.monitoringIntervals.get(campaignId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(campaignId);
      console.log(`⏹️ Stopped automation monitoring for campaign ${campaignId}`);
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  private static async getAutomationConfig(campaignId: string): Promise<AutomationConfig | null> {
    try {
      // Try from cache first
      if (this.automationConfigs.has(campaignId)) {
        return this.automationConfigs.get(campaignId)!;
      }

      // Load from database
      const { data, error } = await supabase
        .from('automation_controls')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();

      if (error || !data) {
        return null;
      }

      const config = data as AutomationConfig;
      this.automationConfigs.set(campaignId, config);
      return config;
    } catch (error) {
      console.error('Error getting automation config:', error);
      return null;
    }
  }

  private static async getDailyUsage(userId: string): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await supabase
      .from('daily_usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .single();

    return data || {
      links_posted: 0,
      compute_units_used: 0,
      storage_used_mb: 0,
      bandwidth_used_mb: 0
    };
  }

  private static async getCampaignData(campaignId: string): Promise<any> {
    const { data } = await supabase
      .from('automation_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    return data;
  }

  private static async getCampaignTotalCost(campaignId: string): Promise<number> {
    const { data } = await supabase
      .from('live_urls')
      .select('compute_cost')
      .eq('campaign_id', campaignId);

    return data?.reduce((sum, url) => sum + (url.compute_cost || 0), 0) || 0;
  }

  private static async getCampaignQualityScore(campaignId: string): Promise<number> {
    const { data } = await supabase
      .from('live_urls')
      .select('quality_score')
      .eq('campaign_id', campaignId)
      .not('quality_score', 'is', null);

    if (!data || data.length === 0) return 100;
    
    return data.reduce((sum, url) => sum + url.quality_score, 0) / data.length;
  }

  private static async getCampaignErrorRate(campaignId: string): Promise<number> {
    const { data } = await supabase
      .from('live_urls')
      .select('status')
      .eq('campaign_id', campaignId);

    if (!data || data.length === 0) return 0;

    const errorCount = data.filter(url => url.status === 'failed').length;
    return errorCount / data.length;
  }

  private static async checkUserTierLimits(userId: string): Promise<boolean> {
    const dailyUsage = await this.getDailyUsage(userId);
    return dailyUsage.tier_limit_reached || false;
  }

  private static async logAutomationEvent(
    campaignId: string,
    eventType: AutomationEvent['event_type'],
    reason: string
  ): Promise<void> {
    try {
      const campaign = await this.getCampaignData(campaignId);
      if (!campaign) return;

      await supabase
        .from('automation_events')
        .insert({
          campaign_id: campaignId,
          event_type: eventType,
          trigger_reason: reason,
          event_timestamp: new Date().toISOString(),
          user_id: campaign.user_id,
          previous_status: 'unknown',
          new_status: campaign.status,
          automation_data: { reason, timestamp: new Date().toISOString() }
        });

      // Also log to activity feed
      await supabase
        .from('activity_feed')
        .insert({
          user_id: campaign.user_id,
          campaign_id: campaignId,
          activity_type: eventType === 'auto_pause' ? 'alert' : 'milestone',
          activity_subtype: eventType,
          message: `Campaign ${eventType.replace('_', '-')}: ${reason}`,
          details: { campaign_name: campaign.name, reason },
          severity: eventType === 'auto_pause' ? 'warning' : 'info',
          ui_placement: 'notification'
        });
    } catch (error) {
      console.error('Error logging automation event:', error);
    }
  }

  // ==================== PUBLIC API ====================

  static async getPremiumTriggers(userId: string): Promise<PremiumTrigger[]> {
    try {
      const { data, error } = await supabase
        .from('premium_triggers')
        .select('*')
        .eq('user_id', userId)
        .is('user_response', null)
        .gt('expires_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching premium triggers:', error);
        return [];
      }

      return data as PremiumTrigger[];
    } catch (error) {
      console.error('Error in getPremiumTriggers:', error);
      return [];
    }
  }

  static async respondToPremiumTrigger(
    triggerId: string,
    response: PremiumTrigger['user_response']
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('premium_triggers')
        .update({
          user_response: response,
          responded_at: new Date().toISOString()
        })
        .eq('id', triggerId);

      if (error) {
        console.error('Error responding to premium trigger:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in respondToPremiumTrigger:', error);
      return false;
    }
  }

  static async manualPauseCampaign(campaignId: string, reason: string = 'manual_pause'): Promise<boolean> {
    return await this.executeCampaignPause(campaignId, reason);
  }

  static async manualResumeCampaign(campaignId: string, reason: string = 'manual_resume'): Promise<boolean> {
    return await this.executeCampaignResume(campaignId, reason);
  }

  // ==================== CLEANUP ====================

  static cleanup(campaignId?: string): void {
    if (campaignId) {
      this.stopAutomationMonitoring(campaignId);
      this.automationConfigs.delete(campaignId);
    } else {
      // Cleanup all
      for (const cId of this.monitoringIntervals.keys()) {
        this.stopAutomationMonitoring(cId);
      }
      this.automationConfigs.clear();
      this.premiumTriggerQueue.clear();
    }
  }
}
