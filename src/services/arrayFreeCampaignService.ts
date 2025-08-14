/**
 * Array-Free Campaign Service
 * Redesigned to eliminate array column dependencies and schema issues
 */

import { supabase } from '@/integrations/supabase/client';

// Simplified campaign structure using strings and simple JSON
export interface ArrayFreeCampaign {
  id?: string;
  user_id: string;
  name: string;
  status: 'draft' | 'pending' | 'active' | 'paused' | 'completed' | 'failed';
  
  // Instead of arrays, use simple strings and JSON
  primary_keyword: string;                    // Single main keyword
  secondary_keywords_text: string;            // Comma-separated string
  primary_anchor_text: string;               // Single main anchor text
  alternate_anchors_text: string;            // Comma-separated string
  target_url: string;                        // Single target URL
  
  // Progress tracking using simple fields
  sites_contacted: number;                   // Count instead of array
  links_built: number;                       // Simple counter
  sites_used_text: string;                   // Comma-separated list of domains
  
  // Metadata as simple JSON string
  campaign_metadata: string;                 // JSON string instead of JSONB
  
  // Simple date fields
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  
  // Simple configuration
  links_requested: number;
  auto_start: boolean;
}

// Utility functions for array-like operations without arrays
export class ArrayFreeCampaignUtils {
  
  // Convert comma-separated string to array for processing
  static stringToArray(text: string): string[] {
    if (!text || text.trim() === '') return [];
    return text.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }
  
  // Convert array back to comma-separated string
  static arrayToString(items: string[]): string {
    return items.filter(item => item && item.trim()).join(', ');
  }
  
  // Add item to comma-separated string
  static addToString(existingText: string, newItem: string): string {
    const items = this.stringToArray(existingText);
    if (!items.includes(newItem.trim())) {
      items.push(newItem.trim());
    }
    return this.arrayToString(items);
  }
  
  // Remove item from comma-separated string
  static removeFromString(existingText: string, itemToRemove: string): string {
    const items = this.stringToArray(existingText);
    return this.arrayToString(items.filter(item => item !== itemToRemove.trim()));
  }
  
  // Check if item exists in comma-separated string
  static stringContains(text: string, item: string): boolean {
    return this.stringToArray(text).includes(item.trim());
  }
  
  // Get random item from comma-separated string
  static getRandomFromString(text: string): string | null {
    const items = this.stringToArray(text);
    if (items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)];
  }
}

export class ArrayFreeCampaignService {
  
  // Create campaign without array dependencies
  async createCampaign(campaignData: Omit<ArrayFreeCampaign, 'id' | 'created_at'>): Promise<{
    success: boolean;
    campaign?: ArrayFreeCampaign;
    error?: string;
  }> {
    try {
      // Validate required fields
      if (!campaignData.primary_keyword?.trim()) {
        return { success: false, error: 'Primary keyword is required' };
      }
      
      if (!campaignData.target_url?.trim()) {
        return { success: false, error: 'Target URL is required' };
      }
      
      // Prepare data for insertion (only simple types)
      const insertData = {
        user_id: campaignData.user_id,
        name: campaignData.name,
        status: campaignData.status,
        primary_keyword: campaignData.primary_keyword.trim(),
        secondary_keywords_text: campaignData.secondary_keywords_text || '',
        primary_anchor_text: campaignData.primary_anchor_text || campaignData.primary_keyword,
        alternate_anchors_text: campaignData.alternate_anchors_text || '',
        target_url: campaignData.target_url.trim(),
        sites_contacted: 0,
        links_built: 0,
        sites_used_text: '',
        campaign_metadata: campaignData.campaign_metadata || '{}',
        links_requested: campaignData.links_requested || 5,
        auto_start: campaignData.auto_start || false,
        created_at: new Date().toISOString()
      };
      
      // Insert into database using only standard SQL types
      const { data, error } = await supabase
        .from('automation_campaigns_simple')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.error('Campaign creation error:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, campaign: data };
      
    } catch (error) {
      console.error('Exception in createCampaign:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // Update campaign progress without arrays
  async updateCampaignProgress(
    campaignId: string, 
    updates: {
      sitesContacted?: number;
      linksBuilt?: number;
      newSiteUsed?: string;
      status?: ArrayFreeCampaign['status'];
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current campaign
      const { data: campaign, error: fetchError } = await supabase
        .from('automation_campaigns_simple')
        .select('*')
        .eq('id', campaignId)
        .single();
      
      if (fetchError || !campaign) {
        return { success: false, error: 'Campaign not found' };
      }
      
      // Prepare updates
      const updateData: any = {};
      
      if (updates.sitesContacted !== undefined) {
        updateData.sites_contacted = updates.sitesContacted;
      }
      
      if (updates.linksBuilt !== undefined) {
        updateData.links_built = updates.linksBuilt;
      }
      
      if (updates.newSiteUsed) {
        updateData.sites_used_text = ArrayFreeCampaignUtils.addToString(
          campaign.sites_used_text || '', 
          updates.newSiteUsed
        );
      }
      
      if (updates.status) {
        updateData.status = updates.status;
        
        // Set timestamps based on status
        if (updates.status === 'active' && !campaign.started_at) {
          updateData.started_at = new Date().toISOString();
        }
        
        if (updates.status === 'completed' || updates.status === 'failed') {
          updateData.completed_at = new Date().toISOString();
        }
      }
      
      // Update in database
      const { error: updateError } = await supabase
        .from('automation_campaigns_simple')
        .update(updateData)
        .eq('id', campaignId);
      
      if (updateError) {
        return { success: false, error: updateError.message };
      }
      
      return { success: true };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // Get campaigns without array processing
  async getCampaigns(userId: string, filters?: {
    status?: string;
    limit?: number;
  }): Promise<{ success: boolean; campaigns?: ArrayFreeCampaign[]; error?: string }> {
    try {
      let query = supabase
        .from('automation_campaigns_simple')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, campaigns: data || [] };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // Get campaign statistics without complex array operations
  async getCampaignStats(userId: string): Promise<{
    success: boolean;
    stats?: {
      total: number;
      active: number;
      completed: number;
      totalLinksBuilt: number;
      totalSitesContacted: number;
    };
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('automation_campaigns_simple')
        .select('status, links_built, sites_contacted')
        .eq('user_id', userId);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      const campaigns = data || [];
      
      const stats = {
        total: campaigns.length,
        active: campaigns.filter(c => c.status === 'active').length,
        completed: campaigns.filter(c => c.status === 'completed').length,
        totalLinksBuilt: campaigns.reduce((sum, c) => sum + (c.links_built || 0), 0),
        totalSitesContacted: campaigns.reduce((sum, c) => sum + (c.sites_contacted || 0), 0)
      };
      
      return { success: true, stats };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export const arrayFreeCampaignService = new ArrayFreeCampaignService();
export default arrayFreeCampaignService;
