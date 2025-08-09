/**
 * Campaign Service - Centralized API management for campaign operations
 * Handles authentication, error management, and response processing
 */

import { supabase } from '@/integrations/supabase/client';

export interface CampaignDeletionOptions {
  confirmationText: string;
}

export interface CampaignDeletionSummary {
  campaignId: string;
  campaignName: string;
  deletedAt: string;
  linksArchived: number;
  wasForceDeleted: boolean;
  cascadeOperations: {
    automationCampaigns: string;
    analytics: string;
    generatedLinks: string;
    mainCampaign: string;
  };
}

export interface CampaignDeletionResponse {
  success: boolean;
  message: string;
  deletionSummary?: CampaignDeletionSummary;
  error?: string;
  details?: string;
  requiresConfirmation?: boolean;
  campaign?: {
    id: string;
    name: string;
    status: string;
    links_generated: number;
  };
  supportInfo?: {
    campaignId: string;
    timestamp: string;
    errorCode: string;
    partialDeletion?: boolean;
  };
}

export interface CampaignApiError extends Error {
  statusCode?: number;
  details?: string;
  supportInfo?: any;
  requiresConfirmation?: boolean;
}

class CampaignService {
  private baseUrl = '/.netlify/functions';

  /**
   * Get current user authentication token
   */
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  /**
   * Check if backend services are available
   */
  public async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api-status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const url = `${this.baseUrl}${endpoint}`;

    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });
    } catch (networkError) {
      // Handle network errors (Failed to fetch, etc.)
      throw new Error('Backend services not available. Please try again later or contact support.');
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error('Invalid response from server. Please try again.');
    }

    if (!response.ok) {
      const error = new Error(data.error || 'API request failed') as CampaignApiError;
      error.statusCode = response.status;
      error.details = data.details;
      error.supportInfo = data.supportInfo;
      error.requiresConfirmation = data.requiresConfirmation;
      throw error;
    }

    return data;
  }

  /**
   * Delete a campaign with comprehensive safety checks
   */
  async deleteCampaign(
    campaignId: string,
    options: CampaignDeletionOptions
  ): Promise<CampaignDeletionResponse> {
    try {
      const response = await this.makeRequest<CampaignDeletionResponse>(
        '/backlink-campaigns',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'delete',
            campaignId,
            confirmationText: options.confirmationText
          }),
        }
      );

      return response;
    } catch (error) {
      console.error('Campaign deletion API error:', error);
      
      // Re-throw with enhanced error information
      if (error instanceof Error) {
        const enhancedError = error as CampaignApiError;
        enhancedError.message = `Campaign deletion failed: ${error.message}`;
        throw enhancedError;
      }
      
      throw new Error('Unknown error occurred during campaign deletion');
    }
  }

  /**
   * Get all campaigns for the current user
   */
  async getCampaigns(): Promise<any[]> {
    try {
      const response = await this.makeRequest<{ success: boolean; campaigns: any[] }>('/backlink-campaigns');
      return response.campaigns || [];
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      throw error;
    }
  }

  /**
   * Create a new campaign
   */
  async createCampaign(campaignData: any): Promise<any> {
    try {
      const response = await this.makeRequest('/backlink-campaigns', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          campaign: campaignData
        }),
      });
      return response;
    } catch (error) {
      console.error('Failed to create campaign:', error);
      throw error;
    }
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    try {
      await this.makeRequest('/backlink-campaigns', {
        method: 'POST',
        body: JSON.stringify({
          action: 'pause',
          campaignId
        }),
      });
    } catch (error) {
      console.error('Failed to pause campaign:', error);
      throw error;
    }
  }

  /**
   * Resume a campaign
   */
  async resumeCampaign(campaignId: string): Promise<void> {
    try {
      await this.makeRequest('/backlink-campaigns', {
        method: 'POST',
        body: JSON.stringify({
          action: 'resume',
          campaignId
        }),
      });
    } catch (error) {
      console.error('Failed to resume campaign:', error);
      throw error;
    }
  }

  /**
   * Get campaign deletion logs for audit purposes
   */
  async getDeletionLogs(campaignId?: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_deletion_logs')
        .select('*')
        .eq(campaignId ? 'campaign_id' : undefined, campaignId)
        .order('initiated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch deletion logs:', error);
      throw error;
    }
  }

  /**
   * Validate campaign before deletion
   */
  async validateCampaignForDeletion(campaignId: string): Promise<{
    canDelete: boolean;
    warnings: string[];
    requirements: string[];
  }> {
    try {
      // Get campaign details
      const { data: campaign, error } = await supabase
        .from('backlink_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error || !campaign) {
        return {
          canDelete: false,
          warnings: ['Campaign not found'],
          requirements: ['Campaign must exist']
        };
      }

      const warnings: string[] = [];
      const requirements: string[] = [];

      // Check if campaign is active
      if (campaign.status === 'active') {
        warnings.push('Campaign is currently active');
        requirements.push('Consider pausing the campaign first or use force delete');
      }

      // Check for generated links
      if (campaign.links_generated > 0) {
        warnings.push(`Campaign has ${campaign.links_generated} generated links`);
        requirements.push('Links will be archived unless specifically deleted');
      }

      // Check for incomplete progress
      if (campaign.progress > 0 && campaign.progress < 100) {
        warnings.push(`Campaign is ${campaign.progress}% complete`);
        requirements.push('All progress will be lost');
      }

      return {
        canDelete: true,
        warnings,
        requirements
      };
    } catch (error) {
      console.error('Failed to validate campaign for deletion:', error);
      return {
        canDelete: false,
        warnings: ['Validation failed'],
        requirements: ['Unable to determine campaign status']
      };
    }
  }
}

// Export singleton instance
export const campaignService = new CampaignService();
export default campaignService;
