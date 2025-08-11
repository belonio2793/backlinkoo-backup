/**
 * Campaign Metrics Error Handler
 * Handles RLS permission errors and provides fallback functionality
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface CampaignMetricsError {
  isRLSError: boolean;
  isUsersPermissionError: boolean;
  originalError: any;
  fallbackApplied: boolean;
  suggestedFix?: string;
}

export interface SafeCampaignMetrics {
  success: boolean;
  data: any[];
  error?: string;
  fallbackUsed: boolean;
  errorDetails?: CampaignMetricsError;
}

class CampaignMetricsErrorHandler {
  
  /**
   * Check if an error is the known "permission denied for table users" issue
   */
  static isUsersPermissionError(error: any): boolean {
    const message = error?.message || error;
    return (
      typeof message === 'string' && 
      (
        message.includes('permission denied for table users') ||
        message.includes('permission denied for table auth.users') ||
        (message.includes('permission denied') && message.includes('users'))
      )
    );
  }

  /**
   * Check if an error is RLS-related
   */
  static isRLSError(error: any): boolean {
    const message = error?.message || error;
    return (
      typeof message === 'string' && 
      (
        message.includes('row-level security') ||
        message.includes('RLS') ||
        message.includes('policy') ||
        this.isUsersPermissionError(error)
      )
    );
  }

  /**
   * Analyze an error and provide detailed information
   */
  static analyzeError(error: any): CampaignMetricsError {
    return {
      isRLSError: this.isRLSError(error),
      isUsersPermissionError: this.isUsersPermissionError(error),
      originalError: error,
      fallbackApplied: false,
      suggestedFix: this.isUsersPermissionError(error) 
        ? 'Fix RLS recursion by dropping get_current_user_role() function'
        : 'Check database permissions and RLS policies'
    };
  }

  /**
   * Safe method to get campaign metrics with fallback
   */
  static async safeGetCampaignMetrics(userId?: string): Promise<SafeCampaignMetrics> {
    try {
      // Try the normal campaign metrics query first
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        const errorAnalysis = this.analyzeError(error);
        
        if (errorAnalysis.isUsersPermissionError) {
          console.warn('⚠️ RLS permission error detected - using fallback data');
          
          // Try fallback approaches
          const fallbackData = await this.getFallbackCampaignData(userId);
          
          return {
            success: true,
            data: fallbackData,
            fallbackUsed: true,
            errorDetails: { ...errorAnalysis, fallbackApplied: true },
            error: 'Using fallback data due to database permission issue'
          };
        }

        // For other errors, return the error
        return {
          success: false,
          data: [],
          fallbackUsed: false,
          errorDetails: errorAnalysis,
          error: error.message || 'Failed to fetch campaign metrics'
        };
      }

      return {
        success: true,
        data: data || [],
        fallbackUsed: false
      };

    } catch (error: any) {
      const errorAnalysis = this.analyzeError(error);
      
      // Try fallback for any unexpected error
      const fallbackData = await this.getFallbackCampaignData(userId);
      
      return {
        success: true,
        data: fallbackData,
        fallbackUsed: true,
        errorDetails: { ...errorAnalysis, fallbackApplied: true },
        error: 'Using fallback data due to unexpected error'
      };
    }
  }

  /**
   * Get fallback campaign data from various sources
   */
  static async getFallbackCampaignData(userId?: string): Promise<any[]> {
    const fallbackData: any[] = [];

    try {
      // Try localStorage first
      const localData = this.getLocalStorageCampaigns(userId);
      if (localData.length > 0) {
        fallbackData.push(...localData);
        console.log('📦 Retrieved campaigns from localStorage');
      }

      // Try alternative database tables that might work
      try {
        const { data: backlinkCampaigns } = await supabase
          .from('backlink_campaigns')
          .select('*')
          .limit(10);

        if (backlinkCampaigns && backlinkCampaigns.length > 0) {
          const converted = backlinkCampaigns.map(campaign => ({
            id: campaign.id,
            name: campaign.name || 'Backlink Campaign',
            status: campaign.status || 'active',
            created_at: campaign.created_at,
            target_url: campaign.target_url || '',
            progress: campaign.progress || 0
          }));
          fallbackData.push(...converted);
          console.log('🔗 Retrieved campaigns from backlink_campaigns table');
        }
      } catch (backlinkError) {
        console.warn('⚠️ Backlink campaigns table also inaccessible');
      }

      // If no data found, provide mock data for testing
      if (fallbackData.length === 0) {
        fallbackData.push({
          id: 'fallback-1',
          name: 'Sample Campaign (Fallback)',
          status: 'active',
          created_at: new Date().toISOString(),
          target_url: 'https://example.com',
          progress: 0,
          note: 'This is fallback data due to database permission issues'
        });
        console.log('🎭 Using mock fallback data');
      }

    } catch (error) {
      console.error('❌ Fallback data retrieval failed:', error);
    }

    return fallbackData;
  }

  /**
   * Get campaigns from localStorage
   */
  static getLocalStorageCampaigns(userId?: string): any[] {
    try {
      const storageKeys = [
        `permanent_campaigns_${userId}`,
        'permanent_campaigns',
        'campaigns',
        'campaign_metrics'
      ];

      for (const key of storageKeys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map(campaign => ({
              ...campaign,
              source: 'localStorage',
              id: campaign.id || campaign.campaignId || `local-${Date.now()}`
            }));
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ localStorage campaign retrieval failed:', error);
    }

    return [];
  }

  /**
   * Log detailed error information for debugging
   */
  static logErrorDetails(error: any, context: string = 'campaign-metrics') {
    const errorDetails = {
      context,
      timestamp: new Date().toISOString(),
      message: error?.message || 'Unknown error',
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      isRLSError: this.isRLSError(error),
      isUsersPermissionError: this.isUsersPermissionError(error)
    };

    console.error(`❌ Campaign Metrics Error (${context}):`, JSON.stringify(errorDetails, null, 2));
    
    if (errorDetails.isUsersPermissionError) {
      console.error(`
🚨 CRITICAL: "permission denied for table users" error detected!

This is caused by RLS policy recursion. To fix:

1. Go to Supabase Dashboard SQL Editor
2. Run: DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
3. Run: ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
4. Run: ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
5. Create simple policies without function calls

Fallback data is being used temporarily.
      `);
    }

    return errorDetails;
  }
}

export default CampaignMetricsErrorHandler;
export { CampaignMetricsErrorHandler };
