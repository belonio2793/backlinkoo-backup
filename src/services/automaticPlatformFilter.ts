/**
 * Automatic Platform Filter Service
 * Monitors publishing attempts and automatically removes/blacklists platforms that fail
 * Prevents retry attempts on non-responsive platforms
 */

import { supabase } from '@/integrations/supabase/client';
import { verifiedPlatformManager } from './verifiedPlatformManager';

export interface PublishingAttempt {
  id: string;
  campaignId: string;
  platformId: string;
  platformName: string;
  domain: string;
  targetUrl: string;
  keyword: string;
  anchorText: string;
  status: 'pending' | 'success' | 'failed' | 'timeout' | 'error';
  error?: string;
  responseTime?: number;
  publishedUrl?: string;
  attemptedAt: string;
  completedAt?: string;
  retryCount: number;
}

export interface FilteringRule {
  id: string;
  name: string;
  condition: 'consecutive_failures' | 'timeout_threshold' | 'error_pattern' | 'success_rate';
  threshold: number;
  action: 'blacklist' | 'temporary_disable' | 'mark_unreliable';
  isActive: boolean;
}

class AutomaticPlatformFilter {
  private publishingAttempts: Map<string, PublishingAttempt> = new Map();
  private platformFailures: Map<string, number> = new Map();
  private isMonitoring = false;
  private filteringRules: FilteringRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default filtering rules
   */
  private initializeDefaultRules(): void {
    this.filteringRules = [
      {
        id: 'consecutive_failures',
        name: 'Consecutive Failures',
        condition: 'consecutive_failures',
        threshold: 3, // Blacklist after 3 consecutive failures
        action: 'blacklist',
        isActive: true
      },
      {
        id: 'timeout_threshold',
        name: 'Timeout Threshold',
        condition: 'timeout_threshold',
        threshold: 30000, // 30 seconds timeout
        action: 'temporary_disable',
        isActive: true
      },
      {
        id: 'low_success_rate',
        name: 'Low Success Rate',
        condition: 'success_rate',
        threshold: 25, // Less than 25% success rate
        action: 'blacklist',
        isActive: true
      },
      {
        id: 'authentication_errors',
        name: 'Authentication Errors',
        condition: 'error_pattern',
        threshold: 1, // Immediate blacklist for auth errors
        action: 'blacklist',
        isActive: true
      }
    ];
  }

  /**
   * Start monitoring publishing attempts
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('🔍 Started automatic platform filtering monitoring');
    
    // Load existing failure data from database
    this.loadExistingFailures();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('⏹️ Stopped automatic platform filtering monitoring');
  }

  /**
   * Record a publishing attempt start
   */
  async recordAttemptStart(
    campaignId: string,
    platformId: string,
    platformName: string,
    domain: string,
    targetUrl: string,
    keyword: string,
    anchorText: string
  ): Promise<string> {
    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    const attempt: PublishingAttempt = {
      id: attemptId,
      campaignId,
      platformId,
      platformName,
      domain,
      targetUrl,
      keyword,
      anchorText,
      status: 'pending',
      attemptedAt: new Date().toISOString(),
      retryCount: 0
    };

    this.publishingAttempts.set(attemptId, attempt);
    
    // Save to database
    await this.saveAttemptToDatabase(attempt);
    
    console.log(`📝 Recording publishing attempt: ${platformName} for campaign ${campaignId}`);
    
    return attemptId;
  }

  /**
   * Record a successful publishing attempt
   */
  async recordAttemptSuccess(
    attemptId: string,
    publishedUrl: string,
    responseTime: number
  ): Promise<void> {
    const attempt = this.publishingAttempts.get(attemptId);
    if (!attempt) {
      console.warn(`Attempt ${attemptId} not found for success recording`);
      return;
    }

    attempt.status = 'success';
    attempt.publishedUrl = publishedUrl;
    attempt.responseTime = responseTime;
    attempt.completedAt = new Date().toISOString();

    // Update in database
    await this.updateAttemptInDatabase(attempt);

    // Reset failure count for this platform
    this.platformFailures.delete(attempt.platformId);

    console.log(`✅ Successful publishing: ${attempt.platformName} (${responseTime}ms)`);
    
    // Remove from memory to save space
    this.publishingAttempts.delete(attemptId);
  }

  /**
   * Record a failed publishing attempt
   */
  async recordAttemptFailure(
    attemptId: string,
    error: string,
    responseTime?: number
  ): Promise<void> {
    const attempt = this.publishingAttempts.get(attemptId);
    if (!attempt) {
      console.warn(`Attempt ${attemptId} not found for failure recording`);
      return;
    }

    attempt.status = 'failed';
    attempt.error = error;
    attempt.responseTime = responseTime;
    attempt.completedAt = new Date().toISOString();

    // Update in database
    await this.updateAttemptInDatabase(attempt);

    // Track failure count
    const currentFailures = this.platformFailures.get(attempt.platformId) || 0;
    this.platformFailures.set(attempt.platformId, currentFailures + 1);

    console.log(`❌ Failed publishing: ${attempt.platformName} - ${error}`);

    // Apply filtering rules
    await this.applyFilteringRules(attempt);
    
    // Remove from memory
    this.publishingAttempts.delete(attemptId);
  }

  /**
   * Record a timeout
   */
  async recordAttemptTimeout(attemptId: string, timeoutDuration: number): Promise<void> {
    const attempt = this.publishingAttempts.get(attemptId);
    if (!attempt) {
      console.warn(`Attempt ${attemptId} not found for timeout recording`);
      return;
    }

    attempt.status = 'timeout';
    attempt.error = `Request timed out after ${timeoutDuration}ms`;
    attempt.responseTime = timeoutDuration;
    attempt.completedAt = new Date().toISOString();

    // Update in database
    await this.updateAttemptInDatabase(attempt);

    // Track as failure
    const currentFailures = this.platformFailures.get(attempt.platformId) || 0;
    this.platformFailures.set(attempt.platformId, currentFailures + 1);

    console.log(`⏰ Timeout: ${attempt.platformName} after ${timeoutDuration}ms`);

    // Apply filtering rules
    await this.applyFilteringRules(attempt);
    
    // Remove from memory
    this.publishingAttempts.delete(attemptId);
  }

  /**
   * Apply filtering rules based on attempt results
   */
  private async applyFilteringRules(attempt: PublishingAttempt): Promise<void> {
    for (const rule of this.filteringRules) {
      if (!rule.isActive) continue;

      const shouldFilter = await this.evaluateRule(rule, attempt);
      
      if (shouldFilter) {
        await this.executeFilteringAction(rule, attempt);
        break; // Stop after first matching rule
      }
    }
  }

  /**
   * Evaluate if a filtering rule should be applied
   */
  private async evaluateRule(rule: FilteringRule, attempt: PublishingAttempt): Promise<boolean> {
    switch (rule.condition) {
      case 'consecutive_failures':
        const failureCount = this.platformFailures.get(attempt.platformId) || 0;
        return failureCount >= rule.threshold;

      case 'timeout_threshold':
        return attempt.status === 'timeout' && (attempt.responseTime || 0) >= rule.threshold;

      case 'success_rate':
        return await this.checkSuccessRate(attempt.platformId, rule.threshold);

      case 'error_pattern':
        return this.matchesErrorPattern(attempt.error || '', rule);

      default:
        return false;
    }
  }

  /**
   * Check platform success rate
   */
  private async checkSuccessRate(platformId: string, threshold: number): Promise<boolean> {
    try {
      const { data: attempts, error } = await supabase
        .from('publishing_attempts')
        .select('status')
        .eq('platform_id', platformId)
        .order('attempted_at', { ascending: false })
        .limit(10); // Check last 10 attempts

      if (error || !attempts || attempts.length < 5) {
        return false; // Need at least 5 attempts to evaluate
      }

      const successCount = attempts.filter(a => a.status === 'success').length;
      const successRate = (successCount / attempts.length) * 100;
      
      return successRate < threshold;
    } catch (error) {
      console.warn('Error checking success rate:', error);
      return false;
    }
  }

  /**
   * Check if error matches problematic patterns
   */
  private matchesErrorPattern(error: string, rule: FilteringRule): boolean {
    const errorPatterns = [
      'authentication',
      'unauthorized',
      'forbidden',
      'api key',
      'oauth',
      'not implemented',
      'service unavailable',
      'permanently unavailable'
    ];

    const lowerError = error.toLowerCase();
    return errorPatterns.some(pattern => lowerError.includes(pattern));
  }

  /**
   * Execute filtering action
   */
  private async executeFilteringAction(rule: FilteringRule, attempt: PublishingAttempt): Promise<void> {
    console.log(`🚫 Applying filter rule "${rule.name}" to platform ${attempt.platformName}`);

    switch (rule.action) {
      case 'blacklist':
        await this.blacklistPlatform(attempt, rule.name);
        break;

      case 'temporary_disable':
        await this.temporarilyDisablePlatform(attempt, rule.name);
        break;

      case 'mark_unreliable':
        await this.markPlatformUnreliable(attempt, rule.name);
        break;
    }
  }

  /**
   * Blacklist a platform permanently
   */
  private async blacklistPlatform(attempt: PublishingAttempt, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('platform_blacklist')
        .upsert({
          platform_id: attempt.platformId,
          domain: attempt.domain,
          reason: `Auto-filtered: ${reason} - ${attempt.error}`,
          failure_count: this.platformFailures.get(attempt.platformId) || 1,
          last_failure: attempt.completedAt || new Date().toISOString(),
          is_active: true,
          auto_filtered: true,
          filter_rule: reason
        });

      if (error) {
        console.error('Error blacklisting platform:', error);
      } else {
        console.log(`🚫 Blacklisted platform: ${attempt.platformName} (${reason})`);
        
        // Notify verified platform manager
        await verifiedPlatformManager.blacklistPlatform(
          attempt.platformId, 
          `Auto-filtered: ${reason}`
        );

        // Log filtering action
        await this.logFilteringAction(attempt, 'blacklist', reason);
      }
    } catch (error) {
      console.error('Error in blacklistPlatform:', error);
    }
  }

  /**
   * Temporarily disable a platform
   */
  private async temporarilyDisablePlatform(attempt: PublishingAttempt, reason: string): Promise<void> {
    try {
      const disableUntil = new Date();
      disableUntil.setHours(disableUntil.getHours() + 24); // Disable for 24 hours

      const { error } = await supabase
        .from('platform_temporary_disables')
        .upsert({
          platform_id: attempt.platformId,
          domain: attempt.domain,
          reason: `Auto-filtered: ${reason}`,
          disabled_until: disableUntil.toISOString(),
          is_active: true
        });

      if (error) {
        console.error('Error temporarily disabling platform:', error);
      } else {
        console.log(`⏸️ Temporarily disabled platform: ${attempt.platformName} until ${disableUntil.toLocaleString()}`);
        
        // Log filtering action
        await this.logFilteringAction(attempt, 'temporary_disable', reason);
      }
    } catch (error) {
      console.error('Error in temporarilyDisablePlatform:', error);
    }
  }

  /**
   * Mark platform as unreliable
   */
  private async markPlatformUnreliable(attempt: PublishingAttempt, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('platform_reliability_scores')
        .upsert({
          platform_id: attempt.platformId,
          domain: attempt.domain,
          reliability_score: 25, // Low reliability score
          last_updated: new Date().toISOString(),
          reason: `Auto-filtered: ${reason}`
        });

      if (error) {
        console.error('Error marking platform unreliable:', error);
      } else {
        console.log(`⚠️ Marked platform unreliable: ${attempt.platformName} (${reason})`);
        
        // Log filtering action
        await this.logFilteringAction(attempt, 'mark_unreliable', reason);
      }
    } catch (error) {
      console.error('Error in markPlatformUnreliable:', error);
    }
  }

  /**
   * Log filtering action for audit trail
   */
  private async logFilteringAction(
    attempt: PublishingAttempt, 
    action: string, 
    reason: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('platform_filtering_log')
        .insert({
          platform_id: attempt.platformId,
          platform_name: attempt.platformName,
          domain: attempt.domain,
          action,
          reason,
          campaign_id: attempt.campaignId,
          failed_attempt_id: attempt.id,
          error_message: attempt.error,
          filtered_at: new Date().toISOString()
        });

      if (error) {
        console.warn('Error logging filtering action:', error);
      }
    } catch (error) {
      console.warn('Error in logFilteringAction:', error);
    }
  }

  /**
   * Save attempt to database
   */
  private async saveAttemptToDatabase(attempt: PublishingAttempt): Promise<void> {
    try {
      const { error } = await supabase
        .from('publishing_attempts')
        .insert({
          id: attempt.id,
          campaign_id: attempt.campaignId,
          platform_id: attempt.platformId,
          platform_name: attempt.platformName,
          domain: attempt.domain,
          target_url: attempt.targetUrl,
          keyword: attempt.keyword,
          anchor_text: attempt.anchorText,
          status: attempt.status,
          attempted_at: attempt.attemptedAt,
          retry_count: attempt.retryCount
        });

      if (error) {
        console.warn('Error saving attempt to database:', error);
      }
    } catch (error) {
      console.warn('Error in saveAttemptToDatabase:', error);
    }
  }

  /**
   * Update attempt in database
   */
  private async updateAttemptInDatabase(attempt: PublishingAttempt): Promise<void> {
    try {
      const { error } = await supabase
        .from('publishing_attempts')
        .update({
          status: attempt.status,
          error_message: attempt.error,
          response_time: attempt.responseTime,
          published_url: attempt.publishedUrl,
          completed_at: attempt.completedAt
        })
        .eq('id', attempt.id);

      if (error) {
        console.warn('Error updating attempt in database:', error);
      }
    } catch (error) {
      console.warn('Error in updateAttemptInDatabase:', error);
    }
  }

  /**
   * Load existing failure data from database
   */
  private async loadExistingFailures(): Promise<void> {
    try {
      const { data: attempts, error } = await supabase
        .from('publishing_attempts')
        .select('platform_id, status')
        .neq('status', 'success')
        .gte('attempted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (error) {
        console.warn('Error loading existing failures:', error);
        return;
      }

      // Count failures per platform
      const failureCounts = new Map<string, number>();
      for (const attempt of attempts || []) {
        const count = failureCounts.get(attempt.platform_id) || 0;
        failureCounts.set(attempt.platform_id, count + 1);
      }

      this.platformFailures = failureCounts;
      console.log(`📊 Loaded failure data for ${failureCounts.size} platforms`);
    } catch (error) {
      console.warn('Error in loadExistingFailures:', error);
    }
  }

  /**
   * Check if platform should be filtered out
   */
  async shouldFilterPlatform(platformId: string): Promise<{
    shouldFilter: boolean;
    reason?: string;
    action?: string;
  }> {
    try {
      // Check blacklist
      const { data: blacklisted, error: blacklistError } = await supabase
        .from('platform_blacklist')
        .select('reason, filter_rule')
        .eq('platform_id', platformId)
        .eq('is_active', true)
        .single();

      if (blacklistError && blacklistError.code !== 'PGRST116') {
        console.warn('Error checking blacklist:', blacklistError);
      }

      if (blacklisted) {
        return {
          shouldFilter: true,
          reason: blacklisted.reason,
          action: 'blacklisted'
        };
      }

      // Check temporary disable
      const { data: disabled, error: disableError } = await supabase
        .from('platform_temporary_disables')
        .select('reason, disabled_until')
        .eq('platform_id', platformId)
        .eq('is_active', true)
        .gt('disabled_until', new Date().toISOString())
        .single();

      if (disableError && disableError.code !== 'PGRST116') {
        console.warn('Error checking temporary disables:', disableError);
      }

      if (disabled) {
        return {
          shouldFilter: true,
          reason: disabled.reason,
          action: 'temporarily_disabled'
        };
      }

      return { shouldFilter: false };
    } catch (error) {
      console.warn('Error in shouldFilterPlatform:', error);
      return { shouldFilter: false };
    }
  }

  /**
   * Get platform statistics
   */
  async getPlatformFilteringStats(): Promise<{
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    blacklistedPlatforms: number;
    temporarilyDisabled: number;
    averageSuccessRate: number;
  }> {
    try {
      const [
        attemptsResult,
        blacklistResult,
        disabledResult
      ] = await Promise.all([
        supabase
          .from('publishing_attempts')
          .select('status')
          .gte('attempted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        
        supabase
          .from('platform_blacklist')
          .select('id')
          .eq('is_active', true),
        
        supabase
          .from('platform_temporary_disables')
          .select('id')
          .eq('is_active', true)
          .gt('disabled_until', new Date().toISOString())
      ]);

      const attempts = attemptsResult.data || [];
      const successfulAttempts = attempts.filter(a => a.status === 'success').length;
      const failedAttempts = attempts.filter(a => a.status !== 'success').length;
      const averageSuccessRate = attempts.length > 0 ? (successfulAttempts / attempts.length) * 100 : 0;

      return {
        totalAttempts: attempts.length,
        successfulAttempts,
        failedAttempts,
        blacklistedPlatforms: blacklistResult.data?.length || 0,
        temporarilyDisabled: disabledResult.data?.length || 0,
        averageSuccessRate: Math.round(averageSuccessRate)
      };
    } catch (error) {
      console.error('Error getting filtering stats:', error);
      return {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        blacklistedPlatforms: 0,
        temporarilyDisabled: 0,
        averageSuccessRate: 0
      };
    }
  }

  /**
   * Get current filtering rules
   */
  getFilteringRules(): FilteringRule[] {
    return [...this.filteringRules];
  }

  /**
   * Update filtering rule
   */
  updateFilteringRule(ruleId: string, updates: Partial<FilteringRule>): void {
    const ruleIndex = this.filteringRules.findIndex(r => r.id === ruleId);
    if (ruleIndex >= 0) {
      this.filteringRules[ruleIndex] = { ...this.filteringRules[ruleIndex], ...updates };
      console.log(`📝 Updated filtering rule: ${ruleId}`);
    }
  }
}

// Export singleton instance
export const automaticPlatformFilter = new AutomaticPlatformFilter();
export default automaticPlatformFilter;
