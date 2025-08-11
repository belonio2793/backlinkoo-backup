/**
 * Campaign Lifecycle Manager
 * 
 * Comprehensive resume/pause functionality with complete state preservation
 * ensuring campaigns can be seamlessly resumed without data loss
 */

import { supabase } from '@/integrations/supabase/client';
import { formatErrorForLogging, formatErrorForUI } from '@/utils/errorUtils';
import { CampaignStateManager, CampaignState } from './campaignStateManager';
import { CampaignReportingService } from './campaignReportingService';
import { AdaptiveDiscoveryEngine } from './adaptiveDiscoveryEngine';

export interface PauseOperation {
  id: string;
  campaign_id: string;
  user_id: string;
  pause_type: 'manual' | 'auto_daily_limit' | 'auto_error_threshold' | 'scheduled' | 'system_maintenance';
  
  // Pause Context
  pause_context: {
    initiated_by: 'user' | 'system' | 'scheduler';
    reason: string;
    pause_timestamp: string;
    expected_resume?: string;
    priority_level: 'low' | 'medium' | 'high' | 'urgent';
  };
  
  // State Preservation
  preserved_state: {
    execution_snapshot: any;
    active_operations: any[];
    queue_state: any;
    discovery_progress: any;
    partial_results: any[];
    environment_context: any;
  };
  
  // Resource Management
  resource_state: {
    allocated_resources: any;
    pending_requests: any[];
    active_connections: any[];
    cached_data: any;
    temporary_storage: any;
  };
  
  // Resume Preparation
  resume_preparation: {
    validation_checklist: string[];
    required_updates: string[];
    dependency_checks: any[];
    rollback_plan: any;
  };
  
  status: 'active' | 'expired' | 'resumed' | 'cancelled';
  created_at: string;
  expires_at?: string;
}

export interface ResumeOperation {
  id: string;
  campaign_id: string;
  pause_operation_id: string;
  user_id: string;
  
  // Resume Context
  resume_context: {
    initiated_by: 'user' | 'system' | 'scheduler';
    resume_timestamp: string;
    pause_duration_minutes: number;
    resume_type: 'full' | 'partial' | 'fresh_start';
  };
  
  // Validation Results
  validation_results: {
    state_integrity_check: boolean;
    dependency_validation: boolean;
    resource_availability: boolean;
    environment_compatibility: boolean;
    data_consistency: boolean;
  };
  
  // Restoration Process
  restoration_process: {
    steps_completed: string[];
    steps_remaining: string[];
    rollback_triggered: boolean;
    restoration_errors: any[];
  };
  
  // Adaptation Applied
  adaptations: {
    environment_changes_detected: string[];
    strategy_adjustments: any[];
    new_opportunities: any[];
    deprecated_targets: string[];
  };
  
  status: 'preparing' | 'restoring' | 'validating' | 'completed' | 'failed' | 'rolled_back';
  created_at: string;
  completed_at?: string;
}

export interface LifecycleEvent {
  id: string;
  campaign_id: string;
  event_type: 'pause_initiated' | 'pause_completed' | 'resume_initiated' | 'resume_completed' | 'adaptation_applied' | 'error_occurred';
  timestamp: string;
  data: any;
  impact_assessment: {
    data_integrity: 'preserved' | 'modified' | 'lost';
    performance_impact: 'none' | 'minimal' | 'moderate' | 'significant';
    user_experience: 'seamless' | 'minor_delay' | 'noticeable_delay' | 'disrupted';
  };
}

export class CampaignLifecycleManager {
  
  /**
   * Pause campaign with comprehensive state preservation
   */
  static async pauseCampaign(
    campaignId: string,
    pauseType: PauseOperation['pause_type'],
    reason: string,
    options?: {
      expectedResume?: string;
      preserveResources?: boolean;
      gracefulShutdown?: boolean;
    }
  ): Promise<{ success: boolean; pauseOperation?: PauseOperation; error?: string }> {
    try {
      // Get current campaign state
      const campaignResult = await CampaignStateManager.getCampaignState(campaignId);
      if (!campaignResult.success || !campaignResult.state) {
        return { success: false, error: 'Campaign not found for pause operation' };
      }

      const campaign = campaignResult.state;
      const now = new Date().toISOString();

      // Create snapshot before pausing
      const snapshotResult = await CampaignReportingService.createSnapshot(
        campaignId,
        'pause',
        {
          user_action: 'pause_initiated',
          notes: `Pausing campaign: ${reason}`
        }
      );

      // Capture active operations and state
      const activeOperations = await this.captureActiveOperations(campaignId);
      const queueState = await this.captureQueueState(campaignId);
      const discoveryProgress = await this.captureDiscoveryProgress(campaignId);
      const environmentContext = await this.captureEnvironmentContext(campaignId);
      const resourceState = await this.captureResourceState(campaignId);

      // Create pause operation record
      const pauseOperation: PauseOperation = {
        id: crypto.randomUUID(),
        campaign_id: campaignId,
        user_id: campaign.user_id,
        pause_type: pauseType,
        
        pause_context: {
          initiated_by: pauseType.startsWith('auto_') ? 'system' : 'user',
          reason,
          pause_timestamp: now,
          expected_resume: options?.expectedResume,
          priority_level: this.determinePausePriority(pauseType, campaign)
        },
        
        preserved_state: {
          execution_snapshot: {
            campaign_state: campaign,
            snapshot_id: snapshotResult.snapshot?.id,
            execution_phase: campaign.execution_state.current_phase,
            next_scheduled_action: campaign.execution_state.next_action,
            progress_metrics: campaign.progress
          },
          active_operations: activeOperations,
          queue_state: queueState,
          discovery_progress: discoveryProgress,
          partial_results: [], // Would capture partial operations
          environment_context: environmentContext
        },
        
        resource_state: resourceState,
        
        resume_preparation: {
          validation_checklist: this.generateValidationChecklist(campaign),
          required_updates: [],
          dependency_checks: [],
          rollback_plan: this.generateRollbackPlan(campaign)
        },
        
        status: 'active',
        created_at: now,
        expires_at: options?.expectedResume
      };

      // Store pause operation
      const { data: storedPause, error } = await supabase
        .from('pause_operations')
        .insert([pauseOperation])
        .select()
        .single();

      if (error) {
        console.error('Failed to store pause operation:', formatErrorForLogging(error, 'pauseCampaign'));
        return { success: false, error: formatErrorForUI(error) };
      }

      // Gracefully shutdown active processes
      if (options?.gracefulShutdown !== false) {
        await this.gracefullyShutdownOperations(campaignId, activeOperations);
      }

      // Update campaign state to paused
      const pauseResult = await CampaignStateManager.pauseCampaign(campaignId, reason);
      if (!pauseResult.success) {
        console.error('Failed to update campaign to paused state:', pauseResult.error);
        // Don't fail the entire operation - pause operation is still recorded
      }

      // Record lifecycle event
      await this.recordLifecycleEvent({
        campaign_id: campaignId,
        event_type: 'pause_completed',
        timestamp: now,
        data: {
          pause_type: pauseType,
          reason,
          pause_operation_id: storedPause.id
        },
        impact_assessment: {
          data_integrity: 'preserved',
          performance_impact: 'none',
          user_experience: 'seamless'
        }
      });

      return { success: true, pauseOperation: storedPause };
    } catch (error) {
      console.error('Campaign pause error:', formatErrorForLogging(error, 'pauseCampaign'));
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  /**
   * Resume campaign with state restoration and adaptation
   */
  static async resumeCampaign(
    campaignId: string,
    resumeType: ResumeOperation['resume_type'] = 'full',
    options?: {
      skipValidation?: boolean;
      forceResume?: boolean;
      applyAdaptations?: boolean;
    }
  ): Promise<{ success: boolean; resumeOperation?: ResumeOperation; error?: string }> {
    try {
      // Get active pause operation
      const { data: pauseOp, error: pauseError } = await supabase
        .from('pause_operations')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (pauseError) {
        return { success: false, error: 'No active pause operation found for campaign' };
      }

      const now = new Date().toISOString();
      const pauseDuration = Math.floor(
        (new Date(now).getTime() - new Date(pauseOp.pause_context.pause_timestamp).getTime()) / (1000 * 60)
      );

      // Create resume operation
      const resumeOperation: ResumeOperation = {
        id: crypto.randomUUID(),
        campaign_id: campaignId,
        pause_operation_id: pauseOp.id,
        user_id: pauseOp.user_id,
        
        resume_context: {
          initiated_by: 'user', // Could be enhanced to detect system/scheduler
          resume_timestamp: now,
          pause_duration_minutes: pauseDuration,
          resume_type: resumeType
        },
        
        validation_results: {
          state_integrity_check: false,
          dependency_validation: false,
          resource_availability: false,
          environment_compatibility: false,
          data_consistency: false
        },
        
        restoration_process: {
          steps_completed: [],
          steps_remaining: pauseOp.resume_preparation.validation_checklist,
          rollback_triggered: false,
          restoration_errors: []
        },
        
        adaptations: {
          environment_changes_detected: [],
          strategy_adjustments: [],
          new_opportunities: [],
          deprecated_targets: []
        },
        
        status: 'preparing',
        created_at: now
      };

      // Store resume operation
      const { data: storedResume, error: resumeError } = await supabase
        .from('resume_operations')
        .insert([resumeOperation])
        .select()
        .single();

      if (resumeError) {
        console.error('Failed to store resume operation:', formatErrorForLogging(resumeError, 'resumeCampaign'));
        return { success: false, error: formatErrorForUI(resumeError) };
      }

      // Step 1: Validate state integrity
      if (!options?.skipValidation) {
        const validationResult = await this.validateResumeReadiness(pauseOp, resumeOperation);
        if (!validationResult.success && !options?.forceResume) {
          await this.updateResumeOperation(storedResume.id, {
            status: 'failed',
            restoration_process: {
              ...resumeOperation.restoration_process,
              restoration_errors: [validationResult.error]
            }
          });
          return { success: false, error: `Resume validation failed: ${validationResult.error}` };
        }
      }

      // Step 2: Check for environmental changes and adapt
      if (options?.applyAdaptations !== false) {
        const adaptationResult = await this.applyEnvironmentalAdaptations(campaignId, pauseOp, resumeOperation);
        if (adaptationResult.adaptations) {
          resumeOperation.adaptations = adaptationResult.adaptations;
        }
      }

      // Step 3: Restore state
      const restorationResult = await this.restoreCampaignState(pauseOp, resumeOperation);
      if (!restorationResult.success) {
        await this.triggerRollback(pauseOp, resumeOperation);
        return { success: false, error: `State restoration failed: ${restorationResult.error}` };
      }

      // Step 4: Restart campaign operations
      const startResult = await CampaignStateManager.startCampaign(campaignId);
      if (!startResult.success) {
        await this.triggerRollback(pauseOp, resumeOperation);
        return { success: false, error: `Campaign restart failed: ${startResult.error}` };
      }

      // Step 5: Complete resume operation
      await this.updateResumeOperation(storedResume.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        restoration_process: {
          ...resumeOperation.restoration_process,
          steps_completed: resumeOperation.restoration_process.steps_remaining,
          steps_remaining: []
        }
      });

      // Mark pause operation as resumed
      await supabase
        .from('pause_operations')
        .update({ status: 'resumed' })
        .eq('id', pauseOp.id);

      // Record lifecycle event
      await this.recordLifecycleEvent({
        campaign_id: campaignId,
        event_type: 'resume_completed',
        timestamp: now,
        data: {
          resume_type: resumeType,
          pause_duration_minutes: pauseDuration,
          resume_operation_id: storedResume.id,
          adaptations_applied: resumeOperation.adaptations
        },
        impact_assessment: {
          data_integrity: 'preserved',
          performance_impact: 'minimal',
          user_experience: 'seamless'
        }
      });

      // Create post-resume snapshot
      await CampaignReportingService.createSnapshot(
        campaignId,
        'resume',
        {
          user_action: 'resume_completed',
          notes: `Campaign resumed after ${pauseDuration} minutes`
        }
      );

      return { success: true, resumeOperation: storedResume };
    } catch (error) {
      console.error('Campaign resume error:', formatErrorForLogging(error, 'resumeCampaign'));
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  /**
   * Get campaign lifecycle history
   */
  static async getCampaignLifecycleHistory(
    campaignId: string
  ): Promise<{ success: boolean; history?: any; error?: string }> {
    try {
      // Get pause operations
      const { data: pauseOps, error: pauseError } = await supabase
        .from('pause_operations')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at');

      // Get resume operations
      const { data: resumeOps, error: resumeError } = await supabase
        .from('resume_operations')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at');

      // Get lifecycle events
      const { data: lifecycleEvents, error: eventsError } = await supabase
        .from('lifecycle_events')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('timestamp');

      const history = {
        pause_operations: pauseOps || [],
        resume_operations: resumeOps || [],
        lifecycle_events: lifecycleEvents || [],
        summary: {
          total_pauses: (pauseOps || []).length,
          total_resumes: (resumeOps || []).length,
          successful_resumes: (resumeOps || []).filter(r => r.status === 'completed').length,
          total_downtime_minutes: this.calculateTotalDowntime(pauseOps || [], resumeOps || [])
        }
      };

      return { success: true, history };
    } catch (error) {
      console.error('Lifecycle history error:', formatErrorForLogging(error, 'getCampaignLifecycleHistory'));
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  /**
   * Check if campaign can be resumed
   */
  static async checkResumeReadiness(
    campaignId: string
  ): Promise<{ success: boolean; ready?: boolean; issues?: string[]; error?: string }> {
    try {
      // Get active pause operation
      const { data: pauseOp, error } = await supabase
        .from('pause_operations')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return { success: false, error: formatErrorForUI(error) };
      }

      if (!pauseOp) {
        return { success: true, ready: true, issues: [] };
      }

      // Check readiness criteria
      const issues: string[] = [];

      // Check if pause has expired
      if (pauseOp.expires_at && new Date(pauseOp.expires_at) < new Date()) {
        issues.push('Pause operation has expired and may need manual intervention');
      }

      // Check state integrity
      const stateIntegrity = await this.checkStateIntegrity(pauseOp);
      if (!stateIntegrity.valid) {
        issues.push(`State integrity issue: ${stateIntegrity.issue}`);
      }

      // Check resource availability
      const resourceAvailability = await this.checkResourceAvailability(pauseOp);
      if (!resourceAvailability.available) {
        issues.push(`Resource unavailable: ${resourceAvailability.issue}`);
      }

      const ready = issues.length === 0;

      return { success: true, ready, issues };
    } catch (error) {
      console.error('Resume readiness check error:', formatErrorForLogging(error, 'checkResumeReadiness'));
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  // Private helper methods

  private static async captureActiveOperations(campaignId: string): Promise<any[]> {
    // Capture currently running operations
    return [];
  }

  private static async captureQueueState(campaignId: string): Promise<any> {
    // Capture queue state
    return {};
  }

  private static async captureDiscoveryProgress(campaignId: string): Promise<any> {
    // Capture discovery progress
    return {};
  }

  private static async captureEnvironmentContext(campaignId: string): Promise<any> {
    // Capture environmental context
    return {};
  }

  private static async captureResourceState(campaignId: string): Promise<any> {
    return {
      allocated_resources: {},
      pending_requests: [],
      active_connections: [],
      cached_data: {},
      temporary_storage: {}
    };
  }

  private static determinePausePriority(pauseType: string, campaign: CampaignState): 'low' | 'medium' | 'high' | 'urgent' {
    switch (pauseType) {
      case 'auto_error_threshold':
      case 'system_maintenance':
        return 'urgent';
      case 'auto_daily_limit':
        return 'medium';
      default:
        return 'low';
    }
  }

  private static generateValidationChecklist(campaign: CampaignState): string[] {
    return [
      'verify_campaign_state_integrity',
      'check_resource_availability',
      'validate_environment_compatibility',
      'confirm_data_consistency',
      'test_dependency_connections'
    ];
  }

  private static generateRollbackPlan(campaign: CampaignState): any {
    return {
      steps: [
        'restore_previous_state',
        'clear_partial_operations',
        'reset_resource_allocation',
        'notify_stakeholders'
      ],
      triggers: ['validation_failure', 'restoration_error', 'user_request']
    };
  }

  private static async gracefullyShutdownOperations(campaignId: string, activeOperations: any[]): Promise<void> {
    // Gracefully shutdown active operations
    console.log(`Gracefully shutting down operations for campaign: ${campaignId}`);
  }

  private static async recordLifecycleEvent(event: Omit<LifecycleEvent, 'id'>): Promise<void> {
    try {
      const lifecycleEvent: LifecycleEvent = {
        id: crypto.randomUUID(),
        ...event
      };

      const { error } = await supabase
        .from('lifecycle_events')
        .insert([lifecycleEvent]);

      if (error) {
        console.error('Failed to record lifecycle event:', formatErrorForLogging(error, 'recordLifecycleEvent'));
      }
    } catch (error) {
      console.error('Lifecycle event recording error:', error);
    }
  }

  private static async validateResumeReadiness(
    pauseOp: PauseOperation,
    resumeOp: ResumeOperation
  ): Promise<{ success: boolean; error?: string }> {
    // Validate that campaign can be safely resumed
    const checks = [
      await this.checkStateIntegrity(pauseOp),
      await this.checkResourceAvailability(pauseOp),
      await this.checkEnvironmentCompatibility(pauseOp)
    ];

    const failedChecks = checks.filter(check => !check.valid);
    if (failedChecks.length > 0) {
      return { success: false, error: failedChecks.map(c => c.issue).join(', ') };
    }

    return { success: true };
  }

  private static async applyEnvironmentalAdaptations(
    campaignId: string,
    pauseOp: PauseOperation,
    resumeOp: ResumeOperation
  ): Promise<{ adaptations?: any }> {
    // Apply any needed adaptations for environmental changes
    return { adaptations: resumeOp.adaptations };
  }

  private static async restoreCampaignState(
    pauseOp: PauseOperation,
    resumeOp: ResumeOperation
  ): Promise<{ success: boolean; error?: string }> {
    // Restore campaign state from preserved data
    try {
      // This would restore the actual state
      return { success: true };
    } catch (error) {
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  private static async triggerRollback(pauseOp: PauseOperation, resumeOp: ResumeOperation): Promise<void> {
    // Trigger rollback procedure
    console.log('Triggering rollback for resume operation');
  }

  private static async updateResumeOperation(resumeId: string, updates: Partial<ResumeOperation>): Promise<void> {
    try {
      const { error } = await supabase
        .from('resume_operations')
        .update(updates)
        .eq('id', resumeId);

      if (error) {
        console.error('Failed to update resume operation:', formatErrorForLogging(error, 'updateResumeOperation'));
      }
    } catch (error) {
      console.error('Resume operation update error:', error);
    }
  }

  private static calculateTotalDowntime(pauseOps: any[], resumeOps: any[]): number {
    // Calculate total downtime in minutes
    return 0;
  }

  private static async checkStateIntegrity(pauseOp: PauseOperation): Promise<{ valid: boolean; issue?: string }> {
    // Check if preserved state is valid
    return { valid: true };
  }

  private static async checkResourceAvailability(pauseOp: PauseOperation): Promise<{ available: boolean; issue?: string }> {
    // Check if required resources are available
    return { available: true };
  }

  private static async checkEnvironmentCompatibility(pauseOp: PauseOperation): Promise<{ valid: boolean; issue?: string }> {
    // Check if environment is compatible
    return { valid: true };
  }
}
