/**
 * Campaign-Specific Error Handler
 * 
 * Handles errors specifically related to campaign operations
 * to prevent unhandled promise rejections from campaign actions
 */

import { formatErrorForUI } from './errorUtils';
import { toast } from 'sonner';

export class CampaignErrorHandler {
  /**
   * Wrap campaign operations to prevent unhandled promise rejections
   */
  static async safeExecute<T>(
    operation: () => Promise<T>,
    context: string,
    options?: {
      showToast?: boolean;
      fallbackValue?: T;
      retries?: number;
    }
  ): Promise<T | null> {
    const { showToast = true, fallbackValue = null, retries = 0 } = options || {};
    
    let lastError: any;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < retries) {
          console.warn(`Campaign operation failed (attempt ${attempt + 1}/${retries + 1}):`, formatErrorForUI(error));
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }
        
        // Final attempt failed
        const formattedError = formatErrorForUI(error);
        console.error(`Campaign operation failed after ${retries + 1} attempts (${context}):`, formattedError);

        // Debug log the original error to help diagnose formatting issues
        if (import.meta.env.DEV) {
          console.debug('Original error object:', error);
          console.debug('Formatted error:', formattedError);
          console.debug('Error type:', typeof error);
          console.debug('Error keys:', error && typeof error === 'object' ? Object.keys(error) : 'N/A');
        }

        if (showToast) {
          toast.error(`Campaign Error: ${context}`, {
            description: formattedError
          });
        }
        
        break;
      }
    }
    
    return fallbackValue as T;
  }

  /**
   * Wrap async campaign functions to prevent unhandled rejections
   */
  static wrapCampaignFunction<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context: string
  ): T {
    return ((...args: any[]) => {
      return this.safeExecute(
        () => fn(...args),
        context,
        { showToast: true }
      );
    }) as T;
  }

  /**
   * Handle campaign toggle operations safely
   */
  static async safeToggleCampaign(
    campaignId: string,
    toggleFunction: (id: string) => Promise<any>
  ): Promise<boolean> {
    try {
      await this.safeExecute(
        () => toggleFunction(campaignId),
        'Toggle Campaign',
        { retries: 1 }
      );
      return true;
    } catch (error) {
      console.error('Campaign toggle failed:', formatErrorForUI(error));
      return false;
    }
  }

  /**
   * Handle campaign creation safely
   */
  static async safeCreateCampaign(
    campaignData: any,
    createFunction: (data: any) => Promise<any>
  ): Promise<any> {
    return this.safeExecute(
      () => createFunction(campaignData),
      'Create Campaign',
      { retries: 1 }
    );
  }

  /**
   * Handle campaign deletion safely
   */
  static async safeDeleteCampaign(
    campaignId: string,
    deleteFunction: (id: string) => Promise<any>
  ): Promise<boolean> {
    try {
      await this.safeExecute(
        () => deleteFunction(campaignId),
        'Delete Campaign',
        { retries: 1 }
      );
      return true;
    } catch (error) {
      console.error('Campaign deletion failed:', formatErrorForUI(error));
      return false;
    }
  }

  /**
   * Handle live monitoring start safely
   */
  static async safeStartLiveMonitoring(
    campaignId: string,
    startFunction: (id: string) => Promise<any>
  ): Promise<boolean> {
    try {
      await this.safeExecute(
        () => startFunction(campaignId),
        'Start Live Monitoring',
        { retries: 2 }
      );
      return true;
    } catch (error) {
      console.error('Live monitoring start failed:', formatErrorForUI(error));
      return false;
    }
  }

  /**
   * Add global handler for campaign-related promise rejections
   */
  static initializeCampaignErrorHandling(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      const errorMessage = formatErrorForUI(error);
      
      // Check if this is a campaign-related error
      if (this.isCampaignError(error)) {
        console.warn('🎯 Campaign-related promise rejection caught:', errorMessage);
        
        // Show user-friendly notification
        toast.error('Campaign Operation Failed', {
          description: errorMessage
        });
        
        // Prevent the error from appearing as unhandled
        event.preventDefault();
      }
    });

    console.log('🎯 Campaign error handling initialized');
  }

  /**
   * Check if an error is campaign-related
   */
  private static isCampaignError(error: any): boolean {
    const errorMessage = formatErrorForUI(error).toLowerCase();
    const stack = error?.stack?.toLowerCase() || '';
    
    const campaignKeywords = [
      'campaign',
      'automation',
      'backlink',
      'toggle',
      'start monitoring',
      'live monitoring',
      'create campaign',
      'delete campaign'
    ];
    
    return campaignKeywords.some(keyword => 
      errorMessage.includes(keyword) || stack.includes(keyword)
    );
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  CampaignErrorHandler.initializeCampaignErrorHandling();
}

export default CampaignErrorHandler;
