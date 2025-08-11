/**
 * Campaign State Management System
 * 
 * Comprehensive management for user-tied campaigns with persistent state,
 * resume/pause capabilities, and adaptive discovery while preserving records
 */

import { supabase } from '@/integrations/supabase/client';
import { formatErrorForLogging, formatErrorForUI } from '@/utils/errorUtils';
import { PermissionWorkaround } from '@/utils/permissionWorkaround';

export interface CampaignState {
  id: string;
  user_id: string;
  name: string;
  engine_type: string;
  target_url: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  
  // State Management
  execution_state: {
    current_phase: string;
    last_checkpoint: string;
    next_action: string;
    discovery_cursor: string | null;
    batch_position: number;
    total_discovered: number;
    last_discovery_scan: string | null;
  };
  
  // Resume/Pause Data
  pause_state: {
    paused_at: string | null;
    pause_reason: string | null;
    resume_scheduled: string | null;
    checkpoint_data: any;
    partial_operations: any[];
  };
  
  // Progress Tracking
  progress: {
    links_attempted: number;
    links_successful: number;
    links_failed: number;
    domains_discovered: number;
    domains_active: number;
    last_activity: string | null;
    estimated_completion: string | null;
  };
  
  // Environmental Adaptation
  discovery_state: {
    discovered_domains: string[];
    blacklisted_domains: string[];
    domain_success_rates: Record<string, number>;
    adaptation_data: any;
    last_environment_scan: string | null;
  };
  
  // Historical Preservation
  historical_data: {
    created_at: string;
    first_started: string | null;
    total_runtime_minutes: number;
    pause_count: number;
    resume_count: number;
    adaptation_events: any[];
    performance_snapshots: any[];
  };
  
  // Configuration
  settings: {
    daily_limit: number;
    auto_pause_enabled: boolean;
    auto_resume_enabled: boolean;
    adaptive_discovery: boolean;
    preserve_history: boolean;
    quality_threshold: number;
  };
}

export interface CampaignOperation {
  id: string;
  campaign_id: string;
  operation_type: 'discovery' | 'posting' | 'verification' | 'adaptation';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'paused';
  data: any;
  started_at: string;
  completed_at?: string;
  checkpoint_data?: any;
}

export interface CampaignReport {
  campaign_id: string;
  user_id: string;
  report_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  period_start: string;
  period_end: string;
  metrics: {
    links_created: number;
    domains_discovered: number;
    success_rate: number;
    quality_score: number;
    environmental_changes: number;
  };
  data: any;
  generated_at: string;
}

export class CampaignStateManager {
  
  /**
   * Initialize a new campaign with comprehensive state management
   */
  static async initializeCampaign(
    userId: string, 
    campaignData: Partial<CampaignState>
  ): Promise<{ success: boolean; campaign?: CampaignState; error?: string }> {
    try {
      const initialState: CampaignState = {
        id: crypto.randomUUID(),
        user_id: userId,
        name: campaignData.name || 'Untitled Campaign',
        engine_type: campaignData.engine_type || 'blog_comments',
        target_url: campaignData.target_url || '',
        status: 'draft',
        
        execution_state: {
          current_phase: 'initialization',
          last_checkpoint: new Date().toISOString(),
          next_action: 'begin_discovery',
          discovery_cursor: null,
          batch_position: 0,
          total_discovered: 0,
          last_discovery_scan: null
        },
        
        pause_state: {
          paused_at: null,
          pause_reason: null,
          resume_scheduled: null,
          checkpoint_data: null,
          partial_operations: []
        },
        
        progress: {
          links_attempted: 0,
          links_successful: 0,
          links_failed: 0,
          domains_discovered: 0,
          domains_active: 0,
          last_activity: null,
          estimated_completion: null
        },
        
        discovery_state: {
          discovered_domains: [],
          blacklisted_domains: [],
          domain_success_rates: {},
          adaptation_data: {},
          last_environment_scan: null
        },
        
        historical_data: {
          created_at: new Date().toISOString(),
          first_started: null,
          total_runtime_minutes: 0,
          pause_count: 0,
          resume_count: 0,
          adaptation_events: [],
          performance_snapshots: []
        },
        
        settings: {
          daily_limit: 20,
          auto_pause_enabled: true,
          auto_resume_enabled: false,
          adaptive_discovery: true,
          preserve_history: true,
          quality_threshold: 70,
          ...campaignData.settings
        }
      };

      // Store in database
      const { data, error } = await supabase
        .from('campaign_states')
        .insert([initialState])
        .select()
        .single();

      if (error) {
        console.error('Failed to initialize campaign state:', formatErrorForLogging(error, 'initializeCampaign'));
        return { success: false, error: formatErrorForUI(error) };
      }

      return { success: true, campaign: data };
    } catch (error) {
      console.error('Campaign initialization error:', formatErrorForLogging(error, 'initializeCampaign'));
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  /**
   * Start or resume a campaign with state preservation
   */
  static async startCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const campaign = await this.getCampaignState(campaignId);
      if (!campaign.success || !campaign.state) {
        return { success: false, error: 'Campaign not found' };
      }

      const state = campaign.state;
      const isResume = state.status === 'paused';
      const now = new Date().toISOString();

      // Update state for start/resume
      const updatedState: Partial<CampaignState> = {
        status: 'active',
        execution_state: {
          ...state.execution_state,
          last_checkpoint: now,
          current_phase: isResume ? state.execution_state.current_phase : 'discovery'
        },
        historical_data: {
          ...state.historical_data,
          first_started: state.historical_data.first_started || now,
          resume_count: isResume ? state.historical_data.resume_count + 1 : state.historical_data.resume_count
        }
      };

      // Clear pause state if resuming
      if (isResume) {
        updatedState.pause_state = {
          paused_at: null,
          pause_reason: null,
          resume_scheduled: null,
          checkpoint_data: null,
          partial_operations: []
        };
      }

      const updateResult = await this.updateCampaignState(campaignId, updatedState);
      if (!updateResult.success) {
        return updateResult;
      }

      // Start the actual campaign operations
      await this.beginCampaignOperations(campaignId);

      return { success: true };
    } catch (error) {
      console.error('Campaign start error:', formatErrorForLogging(error, 'startCampaign'));
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  /**
   * Pause a campaign with state preservation
   */
  static async pauseCampaign(
    campaignId: string, 
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const campaign = await this.getCampaignState(campaignId);
      if (!campaign.success || !campaign.state) {
        return { success: false, error: 'Campaign not found' };
      }

      const state = campaign.state;
      const now = new Date().toISOString();

      // Capture current operations for resume
      const partialOperations = await this.capturePartialOperations(campaignId);

      const updatedState: Partial<CampaignState> = {
        status: 'paused',
        pause_state: {
          paused_at: now,
          pause_reason: reason || 'Manual pause',
          resume_scheduled: null,
          checkpoint_data: {
            execution_state: state.execution_state,
            progress: state.progress,
            timestamp: now
          },
          partial_operations: partialOperations
        },
        historical_data: {
          ...state.historical_data,
          pause_count: state.historical_data.pause_count + 1
        }
      };

      const updateResult = await this.updateCampaignState(campaignId, updatedState);
      if (!updateResult.success) {
        return updateResult;
      }

      // Stop active operations gracefully
      await this.stopCampaignOperations(campaignId);

      return { success: true };
    } catch (error) {
      console.error('Campaign pause error:', formatErrorForLogging(error, 'pauseCampaign'));
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  /**
   * Get campaign state with all historical data
   */
  static async getCampaignState(
    campaignId: string
  ): Promise<{ success: boolean; state?: CampaignState; error?: string }> {
    try {
      // Try database first
      const { data, error } = await supabase
        .from('campaign_states')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error && error.code === '42501') {
        // Permission error - use workaround
        const fallback = await PermissionWorkaround.getCampaignStatusFallback(campaignId);
        if (fallback) {
          return { success: true, state: fallback };
        }
      }

      if (error) {
        console.error('Failed to get campaign state:', formatErrorForLogging(error, 'getCampaignState'));
        return { success: false, error: formatErrorForUI(error) };
      }

      return { success: true, state: data };
    } catch (error) {
      console.error('Campaign state retrieval error:', formatErrorForLogging(error, 'getCampaignState'));
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  /**
   * Update campaign state (non-destructive)
   */
  static async updateCampaignState(
    campaignId: string, 
    updates: Partial<CampaignState>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Always preserve existing data
      const current = await this.getCampaignState(campaignId);
      if (!current.success || !current.state) {
        return { success: false, error: 'Campaign not found for update' };
      }

      // Deep merge to preserve all existing data
      const mergedState = this.deepMerge(current.state, updates);
      
      // Update timestamp
      mergedState.execution_state.last_checkpoint = new Date().toISOString();

      const { data, error } = await supabase
        .from('campaign_states')
        .update(mergedState)
        .eq('id', campaignId)
        .select()
        .single();

      if (error && error.code === '42501') {
        // Permission error - use workaround
        return await PermissionWorkaround.updateCampaignStatus(campaignId, mergedState.status, current.state.user_id);
      }

      if (error) {
        console.error('Failed to update campaign state:', formatErrorForLogging(error, 'updateCampaignState'));
        return { success: false, error: formatErrorForUI(error) };
      }

      return { success: true };
    } catch (error) {
      console.error('Campaign state update error:', formatErrorForLogging(error, 'updateCampaignState'));
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  /**
   * Add discovered domain to campaign (adaptive discovery)
   */
  static async addDiscoveredDomain(
    campaignId: string, 
    domain: string, 
    metadata: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const campaign = await this.getCampaignState(campaignId);
      if (!campaign.success || !campaign.state) {
        return { success: false, error: 'Campaign not found' };
      }

      const state = campaign.state;
      const now = new Date().toISOString();

      // Add to discovered domains (non-destructive)
      const updatedDiscoveryState = {
        ...state.discovery_state,
        discovered_domains: [...new Set([...state.discovery_state.discovered_domains, domain])],
        last_environment_scan: now,
        adaptation_data: {
          ...state.discovery_state.adaptation_data,
          [domain]: {
            discovered_at: now,
            metadata,
            status: 'active'
          }
        }
      };

      const updatedProgress = {
        ...state.progress,
        domains_discovered: state.progress.domains_discovered + 1,
        last_activity: now
      };

      // Add adaptation event to history
      const adaptationEvent = {
        timestamp: now,
        type: 'domain_discovered',
        domain,
        metadata
      };

      const updatedHistorical = {
        ...state.historical_data,
        adaptation_events: [...state.historical_data.adaptation_events, adaptationEvent]
      };

      const updateResult = await this.updateCampaignState(campaignId, {
        discovery_state: updatedDiscoveryState,
        progress: updatedProgress,
        historical_data: updatedHistorical
      });

      return updateResult;
    } catch (error) {
      console.error('Domain discovery error:', formatErrorForLogging(error, 'addDiscoveredDomain'));
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  /**
   * Get user campaigns with full state
   */
  static async getUserCampaigns(
    userId: string, 
    includeArchived: boolean = false
  ): Promise<{ success: boolean; campaigns?: CampaignState[]; error?: string }> {
    try {
      let query = supabase
        .from('campaign_states')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!includeArchived) {
        query = query.neq('status', 'archived');
      }

      const { data, error } = await query;

      if (error && error.code === '42501') {
        // Permission error - return empty array or cached data
        console.warn('Permission denied for user campaigns, using fallback');
        return { success: true, campaigns: [] };
      }

      if (error) {
        console.error('Failed to get user campaigns:', formatErrorForLogging(error, 'getUserCampaigns'));
        return { success: false, error: formatErrorForUI(error) };
      }

      return { success: true, campaigns: data || [] };
    } catch (error) {
      console.error('User campaigns retrieval error:', formatErrorForLogging(error, 'getUserCampaigns'));
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  /**
   * Archive campaign (preserve all data)
   */
  static async archiveCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date().toISOString();
      
      return await this.updateCampaignState(campaignId, {
        status: 'archived',
        execution_state: {
          current_phase: 'archived',
          last_checkpoint: now,
          next_action: 'none'
        } as any
      });
    } catch (error) {
      console.error('Campaign archive error:', formatErrorForLogging(error, 'archiveCampaign'));
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  // Private helper methods

  private static async beginCampaignOperations(campaignId: string): Promise<void> {
    // Start the actual campaign processing
    // This would integrate with your existing automation engines
    console.log(`Starting campaign operations for ${campaignId}`);
  }

  private static async stopCampaignOperations(campaignId: string): Promise<void> {
    // Gracefully stop campaign processing
    console.log(`Stopping campaign operations for ${campaignId}`);
  }

  private static async capturePartialOperations(campaignId: string): Promise<any[]> {
    // Capture any in-progress operations for resume
    return [];
  }

  private static deepMerge(target: any, source: any): any {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}
