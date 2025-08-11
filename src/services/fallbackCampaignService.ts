/**
 * Fallback Campaign Service
 * 
 * Provides campaign functionality that works even with missing database columns
 * Uses only existing columns and localStorage for missing functionality
 */

import { supabase } from '@/integrations/supabase/client';
import { formatErrorForUI } from '@/utils/errorUtils';

export interface FallbackCampaign {
  id: string;
  user_id: string;
  name: string;
  engine_type: string;
  target_url: string;
  keywords: string[];
  anchor_texts: string[];
  status: string;
  daily_limit: number;
  created_at: string;
  updated_at: string;
  // These will be stored in localStorage if DB columns don't exist
  started_at?: string;
  completed_at?: string;
  auto_start?: boolean;
}

export class FallbackCampaignService {
  
  /**
   * Toggle campaign status without requiring started_at column
   */
  static async toggleCampaign(campaignId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current campaign
      const { data: campaign, error: fetchError } = await supabase
        .from('automation_campaigns')
        .select('id, name, status, created_at')
        .eq('id', campaignId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        return { success: false, error: formatErrorForUI(fetchError) };
      }

      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      // Toggle status
      const newStatus = campaign.status === 'active' ? 'paused' : 'active';
      
      // Update only the status (without started_at)
      const { error: updateError } = await supabase
        .from('automation_campaigns')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)
        .eq('user_id', userId);

      if (updateError) {
        return { success: false, error: formatErrorForUI(updateError) };
      }

      // Store started_at in localStorage if we're starting the campaign
      if (newStatus === 'active') {
        this.setLocalCampaignData(campaignId, {
          started_at: new Date().toISOString(),
          auto_start: false
        });
      }

      return { success: true };

    } catch (error) {
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  /**
   * Create campaign without requiring extra columns
   */
  static async createCampaign(campaignData: any, userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Only use columns that definitely exist
      const baseCampaign = {
        user_id: userId,
        name: campaignData.name,
        engine_type: campaignData.engine_type,
        target_url: campaignData.target_url,
        keywords: campaignData.keywords || [],
        anchor_texts: campaignData.anchor_texts || [],
        status: campaignData.status || 'draft',
        daily_limit: campaignData.daily_limit || 20,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('automation_campaigns')
        .insert([baseCampaign])
        .select()
        .single();

      if (error) {
        return { success: false, error: formatErrorForUI(error) };
      }

      // Store extra data in localStorage
      if (data) {
        this.setLocalCampaignData(data.id, {
          auto_start: campaignData.auto_start || false
        });

        // If auto_start is true, set started_at
        if (campaignData.auto_start) {
          this.setLocalCampaignData(data.id, {
            started_at: new Date().toISOString()
          });
        }
      }

      return { success: true, data };

    } catch (error) {
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  /**
   * Get campaigns with fallback data from localStorage
   */
  static async getCampaigns(userId: string): Promise<{ success: boolean; data?: FallbackCampaign[]; error?: string }> {
    try {
      const { data: campaigns, error } = await supabase
        .from('automation_campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: formatErrorForUI(error) };
      }

      // Enhance campaigns with localStorage data
      const enhancedCampaigns = (campaigns || []).map(campaign => {
        const localData = this.getLocalCampaignData(campaign.id);
        return {
          ...campaign,
          ...localData
        } as FallbackCampaign;
      });

      return { success: true, data: enhancedCampaigns };

    } catch (error) {
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  /**
   * Store campaign data in localStorage
   */
  private static setLocalCampaignData(campaignId: string, data: any): void {
    try {
      const key = `campaign_${campaignId}`;
      const existing = localStorage.getItem(key);
      const currentData = existing ? JSON.parse(existing) : {};
      
      const newData = { ...currentData, ...data };
      localStorage.setItem(key, JSON.stringify(newData));
    } catch (error) {
      console.warn('Failed to store campaign data locally:', error);
    }
  }

  /**
   * Get campaign data from localStorage
   */
  private static getLocalCampaignData(campaignId: string): any {
    try {
      const key = `campaign_${campaignId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn('Failed to get campaign data from localStorage:', error);
      return {};
    }
  }

  /**
   * Check if we need to use fallback mode
   */
  static async needsFallbackMode(): Promise<boolean> {
    try {
      // Try to select a column that might not exist
      const { error } = await supabase
        .from('automation_campaigns')
        .select('id, started_at')
        .limit(1);

      return !!(error && error.message.includes('does not exist'));
    } catch (error) {
      return true; // Assume we need fallback if we can't check
    }
  }
}

export default FallbackCampaignService;
