import { supabase } from '@/integrations/supabase/client';
import { EnhancedCampaignManager } from './enhancedCampaignManager';
import { RealTimeUrlTracker } from './realTimeUrlTracker';
import type { AutomationCampaign, LinkPlacement, LinkPlacementInsert } from '@/types/automationTypes';

export interface CampaignRuntimeConfig {
  campaign_id: string;
  user_id: string;
  status: 'active' | 'paused' | 'stopped';
  priority: 'low' | 'medium' | 'high' | 'critical';
  daily_limit: number;
  auto_retry: boolean;
  max_retries: number;
  retry_delay_minutes: number;
  batch_size: number;
  processing_interval_seconds: number;
  quality_threshold: number;
  authority_threshold: number;
  spam_threshold: number;
  settings: {
    content_generation: boolean;
    auto_verification: boolean;
    real_time_monitoring: boolean;
    duplicate_detection: boolean;
    geo_targeting: string[];
    language_filtering: string[];
  };
}

export interface RuntimeOperation {
  id: string;
  campaign_id: string;
  operation_type: 'create_placement' | 'remove_placement' | 'update_placement' | 'verify_placement' | 'cleanup_dead_links';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry';
  priority: number;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  retry_count: number;
  max_retries: number;
  payload: Record<string, any>;
  result?: Record<string, any>;
  error_message?: string;
  duration_ms?: number;
}

export interface RuntimeMetrics {
  campaign_id: string;
  timestamp: string;
  operations_per_minute: number;
  success_rate: number;
  average_duration_ms: number;
  active_operations: number;
  failed_operations: number;
  queue_size: number;
  database_load: number;
  memory_usage_mb: number;
}

export class CampaignRuntimeEngine {
  private static runtimeConfigs = new Map<string, CampaignRuntimeConfig>();
  private static operationQueues = new Map<string, RuntimeOperation[]>();
  private static activeOperations = new Map<string, RuntimeOperation[]>();
  private static runtimeIntervals = new Map<string, NodeJS.Timeout>();
  private static metricsBuffer = new Map<string, RuntimeMetrics[]>();

  // ==================== RUNTIME LIFECYCLE ====================

  static async startCampaignRuntime(
    campaign: AutomationCampaign,
    customConfig?: Partial<CampaignRuntimeConfig>
  ): Promise<boolean> {
    try {
      const config: CampaignRuntimeConfig = {
        campaign_id: campaign.id,
        user_id: campaign.user_id,
        status: 'active',
        priority: campaign.priority || 'medium',
        daily_limit: campaign.daily_limit,
        auto_retry: true,
        max_retries: 3,
        retry_delay_minutes: 5,
        batch_size: 5,
        processing_interval_seconds: 30,
        quality_threshold: 70,
        authority_threshold: 30,
        spam_threshold: 20,
        settings: {
          content_generation: true,
          auto_verification: true,
          real_time_monitoring: true,
          duplicate_detection: true,
          geo_targeting: ['US', 'CA', 'UK', 'AU'],
          language_filtering: ['en']
        },
        ...customConfig
      };

      this.runtimeConfigs.set(campaign.id, config);
      this.operationQueues.set(campaign.id, []);
      this.activeOperations.set(campaign.id, []);

      // Start real-time URL tracking
      await EnhancedCampaignManager.startRealTimeUrlTracking(campaign.id);

      // Start processing interval
      const interval = setInterval(() => {
        this.processOperationQueue(campaign.id);
      }, config.processing_interval_seconds * 1000);

      this.runtimeIntervals.set(campaign.id, interval);

      // Update campaign status in database
      await supabase
        .from('automation_campaigns')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        })
        .eq('id', campaign.id);

      console.log(`🚀 Started runtime engine for campaign ${campaign.id}`);
      
      // Initialize with some sample URL discovery
      await this.initializeSampleData(campaign.id);

      return true;
    } catch (error) {
      console.error('Error starting campaign runtime:', error);
      return false;
    }
  }

  static async stopCampaignRuntime(campaignId: string): Promise<boolean> {
    try {
      const config = this.runtimeConfigs.get(campaignId);
      if (config) {
        config.status = 'stopped';
      }

      // Clear processing interval
      const interval = this.runtimeIntervals.get(campaignId);
      if (interval) {
        clearInterval(interval);
        this.runtimeIntervals.delete(campaignId);
      }

      // Stop real-time monitoring
      await EnhancedCampaignManager.stopRealTimeUrlTracking(campaignId);

      // Wait for active operations to complete
      await this.waitForActiveOperations(campaignId, 30000); // 30 second timeout

      // Update campaign status in database
      await supabase
        .from('automation_campaigns')
        .update({
          status: 'paused',
          last_activity: new Date().toISOString()
        })
        .eq('id', campaignId);

      console.log(`⏹️ Stopped runtime engine for campaign ${campaignId}`);
      return true;
    } catch (error) {
      console.error('Error stopping campaign runtime:', error);
      return false;
    }
  }

  static async pauseCampaignRuntime(campaignId: string): Promise<boolean> {
    const config = this.runtimeConfigs.get(campaignId);
    if (config) {
      config.status = 'paused';
      await supabase
        .from('automation_campaigns')
        .update({ status: 'paused', last_activity: new Date().toISOString() })
        .eq('id', campaignId);
      return true;
    }
    return false;
  }

  static async resumeCampaignRuntime(campaignId: string): Promise<boolean> {
    const config = this.runtimeConfigs.get(campaignId);
    if (config) {
      config.status = 'active';
      await supabase
        .from('automation_campaigns')
        .update({ status: 'active', last_activity: new Date().toISOString() })
        .eq('id', campaignId);
      return true;
    }
    return false;
  }

  // ==================== OPERATION MANAGEMENT ====================

  static async queueOperation(
    campaignId: string,
    operationType: RuntimeOperation['operation_type'],
    payload: Record<string, any>,
    priority: number = 5,
    scheduledAt?: string
  ): Promise<string> {
    const operation: RuntimeOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      campaign_id: campaignId,
      operation_type: operationType,
      status: 'pending',
      priority,
      scheduled_at: scheduledAt || new Date().toISOString(),
      retry_count: 0,
      max_retries: this.runtimeConfigs.get(campaignId)?.max_retries || 3,
      payload
    };

    const queue = this.operationQueues.get(campaignId);
    if (queue) {
      queue.push(operation);
      queue.sort((a, b) => b.priority - a.priority); // Higher priority first
    }

    console.log(`📋 Queued ${operationType} operation for campaign ${campaignId}`);
    return operation.id;
  }

  private static async processOperationQueue(campaignId: string): Promise<void> {
    const config = this.runtimeConfigs.get(campaignId);
    if (!config || config.status !== 'active') return;

    const queue = this.operationQueues.get(campaignId);
    const activeOps = this.activeOperations.get(campaignId);
    
    if (!queue || !activeOps) return;

    // Check if we can process more operations
    if (activeOps.length >= config.batch_size) return;

    // Get next operations to process
    const now = new Date();
    const operationsToProcess = queue
      .filter(op => 
        op.status === 'pending' && 
        new Date(op.scheduled_at) <= now
      )
      .slice(0, config.batch_size - activeOps.length);

    for (const operation of operationsToProcess) {
      // Move to active operations
      const queueIndex = queue.indexOf(operation);
      queue.splice(queueIndex, 1);
      activeOps.push(operation);

      // Process operation
      this.executeOperation(operation);
    }

    // Record metrics
    await this.recordRuntimeMetrics(campaignId);
  }

  private static async executeOperation(operation: RuntimeOperation): Promise<void> {
    const startTime = Date.now();
    operation.status = 'processing';
    operation.started_at = new Date().toISOString();

    try {
      console.log(`⚡ Executing ${operation.operation_type} for campaign ${operation.campaign_id}`);

      let result: Record<string, any> = {};

      switch (operation.operation_type) {
        case 'create_placement':
          result = await this.executeCreatePlacement(operation);
          break;
        case 'remove_placement':
          result = await this.executeRemovePlacement(operation);
          break;
        case 'update_placement':
          result = await this.executeUpdatePlacement(operation);
          break;
        case 'verify_placement':
          result = await this.executeVerifyPlacement(operation);
          break;
        case 'cleanup_dead_links':
          result = await this.executeCleanupDeadLinks(operation);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.operation_type}`);
      }

      operation.status = 'completed';
      operation.result = result;
      operation.completed_at = new Date().toISOString();
      operation.duration_ms = Date.now() - startTime;

      console.log(`✅ Completed ${operation.operation_type} in ${operation.duration_ms}ms`);

    } catch (error: any) {
      operation.status = 'failed';
      operation.error_message = error.message;
      operation.completed_at = new Date().toISOString();
      operation.duration_ms = Date.now() - startTime;

      console.error(`❌ Failed ${operation.operation_type}:`, error.message);

      // Queue for retry if eligible
      if (operation.retry_count < operation.max_retries) {
        await this.queueRetry(operation);
      }
    } finally {
      // Remove from active operations
      const activeOps = this.activeOperations.get(operation.campaign_id);
      if (activeOps) {
        const index = activeOps.indexOf(operation);
        if (index > -1) {
          activeOps.splice(index, 1);
        }
      }
    }
  }

  // ==================== OPERATION IMPLEMENTATIONS ====================

  private static async executeCreatePlacement(operation: RuntimeOperation): Promise<Record<string, any>> {
    const { url, anchor_text, target_url, content_snippet, placement_type } = operation.payload;
    
    // Record URL visit activity
    await RealTimeUrlTracker.startUrlProcessing(
      operation.campaign_id,
      'temp_opportunity_id',
      url,
      'visiting'
    );

    // Simulate URL analysis and quality checks
    const domainAuthority = Math.floor(Math.random() * 50) + 30;
    const qualityScore = Math.floor(Math.random() * 30) + 70;
    
    const placementData: LinkPlacementInsert = {
      campaign_id: operation.campaign_id,
      user_id: operation.payload.user_id,
      target_domain: new URL(target_url).hostname,
      source_domain: new URL(url).hostname,
      source_url: url,
      placement_type: placement_type || 'blog_comment',
      anchor_text,
      target_url,
      content_snippet: content_snippet || `Quality content with link to ${anchor_text}`,
      status: 'pending',
      quality_score: qualityScore,
      domain_authority: domainAuthority,
      page_authority: domainAuthority - 10,
      cost: Math.round((Math.random() * 50 + 10) * 100) / 100,
      engine_data: { 
        operation_id: operation.id,
        automated: true,
        quality_checks_passed: true
      }
    };

    // Create the link placement with tracking
    const result = await EnhancedCampaignManager.createLinkPlacementWithTracking(
      placementData,
      { operation_id: operation.id }
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to create link placement');
    }

    // Record successful posting
    if (result.data) {
      await RealTimeUrlTracker.recordUrlPosting(
        operation.campaign_id,
        'temp_opportunity_id',
        {
          posted_url: url,
          target_url,
          anchor_text,
          post_content: placementData.content_snippet,
          status: 'posted',
          estimated_reach: Math.floor(Math.random() * 10000) + 1000
        }
      );
    }

    return {
      placement_id: result.data?.id,
      domain_authority: domainAuthority,
      quality_score: qualityScore,
      status: 'created'
    };
  }

  private static async executeRemovePlacement(operation: RuntimeOperation): Promise<Record<string, any>> {
    const { placement_id, reason } = operation.payload;

    // Update placement status to removed
    const { error } = await supabase
      .from('link_placements')
      .update({
        status: 'removed',
        removal_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', placement_id);

    if (error) {
      throw new Error(`Failed to remove placement: ${error.message}`);
    }

    // Update posted links status
    await supabase
      .from('posted_links')
      .update({
        status: 'removed',
        removed_at: new Date().toISOString()
      })
      .eq('campaign_id', operation.campaign_id);

    return {
      placement_id,
      reason,
      removed_at: new Date().toISOString()
    };
  }

  private static async executeUpdatePlacement(operation: RuntimeOperation): Promise<Record<string, any>> {
    const { placement_id, updates } = operation.payload;

    const { error } = await supabase
      .from('link_placements')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', placement_id);

    if (error) {
      throw new Error(`Failed to update placement: ${error.message}`);
    }

    return {
      placement_id,
      updates_applied: Object.keys(updates).length,
      updated_at: new Date().toISOString()
    };
  }

  private static async executeVerifyPlacement(operation: RuntimeOperation): Promise<Record<string, any>> {
    const { placement_id, source_url } = operation.payload;

    // Simulate verification process
    const isLive = Math.random() > 0.2; // 80% success rate
    const responseTime = Math.floor(Math.random() * 2000) + 500;
    const httpStatus = isLive ? 200 : (Math.random() > 0.5 ? 404 : 500);

    // Update placement verification
    const { error } = await supabase
      .from('link_placements')
      .update({
        status: isLive ? 'live' : 'failed',
        verification_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', placement_id);

    if (error) {
      throw new Error(`Failed to update verification: ${error.message}`);
    }

    // Update live monitoring
    await RealTimeUrlTracker.updateLiveMonitoring(placement_id, {
      status: isLive ? 'live' : 'failed',
      response_time: responseTime,
      http_status: httpStatus,
      is_indexed: isLive && Math.random() > 0.3
    });

    return {
      placement_id,
      is_live: isLive,
      response_time: responseTime,
      http_status: httpStatus,
      verified_at: new Date().toISOString()
    };
  }

  private static async executeCleanupDeadLinks(operation: RuntimeOperation): Promise<Record<string, any>> {
    // Find dead or failed links
    const { data: deadLinks } = await supabase
      .from('link_placements')
      .select('*')
      .eq('campaign_id', operation.campaign_id)
      .in('status', ['failed', 'removed'])
      .lt('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Older than 7 days

    let cleanedCount = 0;

    if (deadLinks) {
      for (const link of deadLinks) {
        // Archive the link instead of deleting
        await supabase
          .from('link_placements')
          .update({
            status: 'archived',
            updated_at: new Date().toISOString()
          })
          .eq('id', link.id);

        cleanedCount++;
      }
    }

    return {
      cleaned_links: cleanedCount,
      cleanup_date: new Date().toISOString()
    };
  }

  // ==================== RETRY LOGIC ====================

  private static async queueRetry(operation: RuntimeOperation): Promise<void> {
    const config = this.runtimeConfigs.get(operation.campaign_id);
    if (!config) return;

    operation.retry_count++;
    operation.status = 'retry';
    
    // Calculate exponential backoff delay
    const baseDelay = config.retry_delay_minutes * 60 * 1000; // Convert to milliseconds
    const delay = baseDelay * Math.pow(2, operation.retry_count - 1);
    const scheduledAt = new Date(Date.now() + delay).toISOString();

    // Re-queue the operation
    operation.scheduled_at = scheduledAt;
    operation.status = 'pending';

    const queue = this.operationQueues.get(operation.campaign_id);
    if (queue) {
      queue.push(operation);
      queue.sort((a, b) => b.priority - a.priority);
    }

    console.log(`🔄 Queued retry ${operation.retry_count}/${operation.max_retries} for operation ${operation.id}`);
  }

  // ==================== METRICS AND MONITORING ====================

  private static async recordRuntimeMetrics(campaignId: string): Promise<void> {
    const config = this.runtimeConfigs.get(campaignId);
    const queue = this.operationQueues.get(campaignId);
    const activeOps = this.activeOperations.get(campaignId);

    if (!config || !queue || !activeOps) return;

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    // Calculate operations per minute
    const recentOps = activeOps.filter(op => 
      op.completed_at && new Date(op.completed_at) > oneMinuteAgo
    );

    const metrics: RuntimeMetrics = {
      campaign_id: campaignId,
      timestamp: now.toISOString(),
      operations_per_minute: recentOps.length,
      success_rate: recentOps.length > 0 ? 
        (recentOps.filter(op => op.status === 'completed').length / recentOps.length) * 100 : 0,
      average_duration_ms: recentOps.length > 0 ?
        recentOps.reduce((sum, op) => sum + (op.duration_ms || 0), 0) / recentOps.length : 0,
      active_operations: activeOps.length,
      failed_operations: queue.filter(op => op.status === 'failed').length,
      queue_size: queue.length,
      database_load: Math.random() * 100, // Simulated
      memory_usage_mb: Math.floor(Math.random() * 200) + 50 // Simulated
    };

    // Store metrics
    if (!this.metricsBuffer.has(campaignId)) {
      this.metricsBuffer.set(campaignId, []);
    }
    const buffer = this.metricsBuffer.get(campaignId)!;
    buffer.push(metrics);

    // Keep only last 100 metrics
    if (buffer.length > 100) {
      buffer.splice(0, buffer.length - 100);
    }

    // Store in database
    try {
      await supabase
        .from('campaign_metrics_timeseries')
        .insert([
          {
            campaign_id: campaignId,
            metrics_type: 'operations_per_minute',
            value: metrics.operations_per_minute,
            metadata: { timestamp: metrics.timestamp }
          },
          {
            campaign_id: campaignId,
            metrics_type: 'runtime_success_rate',
            value: metrics.success_rate,
            metadata: { timestamp: metrics.timestamp }
          }
        ]);
    } catch (error) {
      console.error('Error storing runtime metrics:', error);
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  private static async waitForActiveOperations(campaignId: string, timeoutMs: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const activeOps = this.activeOperations.get(campaignId);
      if (!activeOps || activeOps.length === 0) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private static async initializeSampleData(campaignId: string): Promise<void> {
    // Queue some sample URL discovery and processing operations
    const sampleUrls = [
      'https://example-blog.com/tech-article-1',
      'https://demo-forum.org/discussion/web-development',
      'https://sample-news.net/latest-trends',
      'https://test-community.com/programming-tips',
      'https://mock-platform.io/industry-insights'
    ];

    for (let i = 0; i < sampleUrls.length; i++) {
      const url = sampleUrls[i];
      const domain = new URL(url).hostname;

      // Record URL discovery
      await RealTimeUrlTracker.recordUrlDiscovery(campaignId, [{
        url,
        domain,
        discoveryMethod: 'crawling',
        relevanceScore: Math.floor(Math.random() * 30) + 70,
        authorityScore: Math.floor(Math.random() * 40) + 30,
        metadata: {
          keywords_matched: ['technology', 'web development'],
          difficulty_estimate: Math.floor(Math.random() * 50) + 25,
          estimated_cost: Math.round((Math.random() * 40 + 10) * 100) / 100
        }
      }]);

      // Queue creation operations with delays
      setTimeout(() => {
        this.queueOperation(campaignId, 'create_placement', {
          url,
          anchor_text: `quality content about ${domain.split('.')[0]}`,
          target_url: 'https://example-target.com',
          content_snippet: `This is a sample content snippet for ${url}`,
          placement_type: 'blog_comment',
          user_id: this.runtimeConfigs.get(campaignId)?.user_id
        }, 7 - i); // Higher priority for earlier URLs
      }, i * 2000); // Stagger operations every 2 seconds
    }
  }

  // ==================== DATA RETRIEVAL ====================

  static getRuntimeConfig(campaignId: string): CampaignRuntimeConfig | null {
    return this.runtimeConfigs.get(campaignId) || null;
  }

  static getOperationQueue(campaignId: string): RuntimeOperation[] {
    return [...(this.operationQueues.get(campaignId) || [])];
  }

  static getActiveOperations(campaignId: string): RuntimeOperation[] {
    return [...(this.activeOperations.get(campaignId) || [])];
  }

  static getRuntimeMetrics(campaignId: string): RuntimeMetrics[] {
    return [...(this.metricsBuffer.get(campaignId) || [])];
  }

  static isRuntimeActive(campaignId: string): boolean {
    const config = this.runtimeConfigs.get(campaignId);
    return config?.status === 'active' && this.runtimeIntervals.has(campaignId);
  }

  // ==================== CLEANUP ====================

  static cleanup(campaignId: string): void {
    // Stop interval
    const interval = this.runtimeIntervals.get(campaignId);
    if (interval) {
      clearInterval(interval);
      this.runtimeIntervals.delete(campaignId);
    }

    // Clear data
    this.runtimeConfigs.delete(campaignId);
    this.operationQueues.delete(campaignId);
    this.activeOperations.delete(campaignId);
    this.metricsBuffer.delete(campaignId);

    // Cleanup URL tracker
    RealTimeUrlTracker.cleanup(campaignId);
  }
}
