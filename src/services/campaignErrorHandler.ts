import { supabase } from '@/integrations/supabase/client';
import { formatErrorForUI, formatErrorForLogging } from '@/utils/errorUtils';

export interface CampaignError {
  id: string;
  campaign_id: string;
  error_type: 'content_generation' | 'publishing' | 'api_failure' | 'network' | 'authentication' | 'rate_limit' | 'unknown';
  error_message: string;
  error_details?: any;
  step_name: string;
  retry_count: number;
  max_retries: number;
  can_auto_resume: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface CampaignProgressSnapshot {
  campaign_id: string;
  current_step: string;
  completed_steps: string[];
  platform_progress: {
    [platformId: string]: {
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      published_url?: string;
      error_message?: string;
      attempts: number;
    };
  };
  content_generated?: boolean;
  generated_content?: string;
  created_at: string;
  updated_at: string;
}

export class CampaignErrorHandler {
  private static instance: CampaignErrorHandler;
  private errorCounts = new Map<string, number>();
  private maxRetries = new Map<string, number>();

  static getInstance(): CampaignErrorHandler {
    if (!CampaignErrorHandler.instance) {
      CampaignErrorHandler.instance = new CampaignErrorHandler();
    }
    return CampaignErrorHandler.instance;
  }

  constructor() {
    // Default retry limits for different error types
    this.maxRetries.set('content_generation', 3);
    this.maxRetries.set('publishing', 2);
    this.maxRetries.set('api_failure', 3);
    this.maxRetries.set('network', 5);
    this.maxRetries.set('authentication', 1);
    this.maxRetries.set('rate_limit', 10);
    this.maxRetries.set('unknown', 2);
  }

  /**
   * Determine error type from error object
   */
  private determineErrorType(error: any): 'content_generation' | 'publishing' | 'api_failure' | 'network' | 'authentication' | 'rate_limit' | 'unknown' {
    const errorMessage = formatErrorForUI(error).toLowerCase();
    
    if (errorMessage.includes('content') || errorMessage.includes('generation') || errorMessage.includes('openai')) {
      return 'content_generation';
    }
    
    if (errorMessage.includes('publish') || errorMessage.includes('telegraph') || errorMessage.includes('platform')) {
      return 'publishing';
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      return 'network';
    }
    
    if (errorMessage.includes('auth') || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
      return 'authentication';
    }
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests') || errorMessage.includes('429')) {
      return 'rate_limit';
    }
    
    if (errorMessage.includes('api') || errorMessage.includes('400') || errorMessage.includes('500')) {
      return 'api_failure';
    }
    
    return 'unknown';
  }

  /**
   * Save current campaign progress snapshot
   */
  async saveProgressSnapshot(campaignId: string, progress: Partial<CampaignProgressSnapshot>): Promise<void> {
    try {
      const snapshot: Partial<CampaignProgressSnapshot> = {
        campaign_id: campaignId,
        ...progress,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('campaign_progress_snapshots')
        .upsert(snapshot, { onConflict: 'campaign_id' });

      if (error) {
        console.error('Error saving progress snapshot:', error);
      }
    } catch (error) {
      console.error('Failed to save progress snapshot:', error);
    }
  }

  /**
   * Load campaign progress snapshot
   */
  async loadProgressSnapshot(campaignId: string): Promise<CampaignProgressSnapshot | null> {
    try {
      const { data, error } = await supabase
        .from('campaign_progress_snapshots')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found is OK
          console.error('Error loading progress snapshot:', error);
        }
        return null;
      }

      return data as CampaignProgressSnapshot;
    } catch (error) {
      console.error('Failed to load progress snapshot:', error);
      return null;
    }
  }

  /**
   * Handle campaign error with auto-pause logic
   */
  async handleCampaignError(
    campaignId: string,
    error: any,
    stepName: string,
    currentProgress?: Partial<CampaignProgressSnapshot>
  ): Promise<{
    shouldPause: boolean;
    shouldRetry: boolean;
    retryDelay?: number;
    errorRecord?: CampaignError;
  }> {
    const errorType = this.determineErrorType(error);
    const errorMessage = formatErrorForUI(error);
    const maxRetries = this.maxRetries.get(errorType) || 2;
    
    // Get current error count for this campaign/step combination
    const errorKey = `${campaignId}:${stepName}:${errorType}`;
    const currentRetries = this.errorCounts.get(errorKey) || 0;
    const newRetryCount = currentRetries + 1;
    
    // Update retry count
    this.errorCounts.set(errorKey, newRetryCount);

    // Save progress snapshot before handling error
    if (currentProgress) {
      await this.saveProgressSnapshot(campaignId, currentProgress);
    }

    // Create error record
    const errorRecord: Partial<CampaignError> = {
      campaign_id: campaignId,
      error_type: errorType,
      error_message: errorMessage,
      error_details: error,
      step_name: stepName,
      retry_count: newRetryCount,
      max_retries: maxRetries,
      can_auto_resume: this.canAutoResume(errorType),
      created_at: new Date().toISOString()
    };

    // Save error record to database
    try {
      const { data, error: dbError } = await supabase
        .from('campaign_errors')
        .insert(errorRecord)
        .select()
        .single();

      if (!dbError && data) {
        errorRecord.id = data.id;
      }
    } catch (dbError) {
      console.error('Failed to save error record:', dbError);
    }

    // Determine if we should retry or pause
    const shouldRetry = newRetryCount <= maxRetries && this.canAutoRetry(errorType);
    const shouldPause = !shouldRetry;

    // Calculate retry delay based on error type and attempt count
    const retryDelay = this.calculateRetryDelay(errorType, newRetryCount);

    console.log(`Campaign ${campaignId} error handling:`, {
      errorType,
      stepName,
      retryCount: newRetryCount,
      maxRetries,
      shouldRetry,
      shouldPause,
      retryDelay
    });

    return {
      shouldPause,
      shouldRetry,
      retryDelay,
      errorRecord: errorRecord as CampaignError
    };
  }

  /**
   * Check if error type can be auto-resumed
   */
  private canAutoResume(errorType: string): boolean {
    const autoResumableTypes = ['network', 'rate_limit', 'api_failure'];
    return autoResumableTypes.includes(errorType);
  }

  /**
   * Check if error type can be auto-retried
   */
  private canAutoRetry(errorType: string): boolean {
    const retryableTypes = ['network', 'rate_limit', 'api_failure', 'content_generation', 'publishing'];
    return retryableTypes.includes(errorType);
  }

  /**
   * Calculate retry delay based on error type and attempt count
   */
  private calculateRetryDelay(errorType: string, attemptCount: number): number {
    const baseDelays = {
      'content_generation': 30000, // 30 seconds
      'publishing': 15000,         // 15 seconds
      'api_failure': 10000,        // 10 seconds
      'network': 5000,             // 5 seconds
      'authentication': 60000,     // 1 minute
      'rate_limit': 300000,        // 5 minutes
      'unknown': 20000             // 20 seconds
    };

    const baseDelay = baseDelays[errorType as keyof typeof baseDelays] || 20000;
    
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attemptCount - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    
    return Math.min(exponentialDelay + jitter, 600000); // Max 10 minutes
  }

  /**
   * Clear error count for a campaign step (e.g., after successful completion)
   */
  clearErrorCount(campaignId: string, stepName: string, errorType?: string): void {
    if (errorType) {
      const errorKey = `${campaignId}:${stepName}:${errorType}`;
      this.errorCounts.delete(errorKey);
    } else {
      // Clear all error counts for this campaign/step
      for (const key of this.errorCounts.keys()) {
        if (key.startsWith(`${campaignId}:${stepName}:`)) {
          this.errorCounts.delete(key);
        }
      }
    }
  }

  /**
   * Get campaign errors from database
   */
  async getCampaignErrors(campaignId: string): Promise<CampaignError[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_errors')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaign errors:', error);
        return [];
      }

      return data as CampaignError[];
    } catch (error) {
      console.error('Failed to fetch campaign errors:', error);
      return [];
    }
  }

  /**
   * Mark error as resolved
   */
  async resolveError(errorId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('campaign_errors')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', errorId);

      if (error) {
        console.error('Error resolving error record:', error);
      }
    } catch (error) {
      console.error('Failed to resolve error:', error);
    }
  }

  /**
   * Check if campaign can be auto-resumed based on recent errors
   */
  async canAutoResumeCampaign(campaignId: string): Promise<{
    canResume: boolean;
    reason?: string;
    suggestedDelay?: number;
  }> {
    const errors = await this.getCampaignErrors(campaignId);
    const recentErrors = errors.filter(error => 
      !error.resolved_at && 
      new Date(error.created_at).getTime() > Date.now() - 3600000 // Last hour
    );

    if (recentErrors.length === 0) {
      return { canResume: true };
    }

    const hasNonRetryableErrors = recentErrors.some(error => !this.canAutoResume(error.error_type));
    if (hasNonRetryableErrors) {
      return { 
        canResume: false, 
        reason: 'Campaign has non-recoverable errors that require manual intervention' 
      };
    }

    const rateLimitErrors = recentErrors.filter(error => error.error_type === 'rate_limit');
    if (rateLimitErrors.length > 0) {
      return { 
        canResume: true, 
        reason: 'Rate limit detected - will resume with delay',
        suggestedDelay: 300000 // 5 minutes
      };
    }

    return { canResume: true };
  }
}

export const campaignErrorHandler = CampaignErrorHandler.getInstance();
