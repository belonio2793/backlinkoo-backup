import { supabase } from '@/integrations/supabase/client';

export interface DirectCampaignData {
  id: string;
  name: string;
  target_url: string;
  keywords: string;
  anchor_texts: string;
  daily_limit: number;
  total_target: number;
  status: string;
  user_id: string;
}

export interface DirectCampaignResult {
  id: string;
  name: string;
  target_url: string;
  keywords: string;
  anchor_texts: string;
  daily_limit: number;
  total_target: number;
  status: string;
  user_id: string;
  links_generated: number;
  links_live: number;
  average_authority: number;
  average_relevance: number;
  success_rate: number;
  velocity: number;
  trend: string;
  efficiency: number;
  created_at: string;
  last_activity: string;
  estimated_completion: string;
}

class DirectCampaignService {
  /**
   * Create campaign directly in database
   */
  async createCampaign(campaignData: DirectCampaignData): Promise<DirectCampaignResult> {
    try {
      const { data, error } = await supabase
        .from('backlink_campaigns')
        .insert({
          id: campaignData.id,
          name: campaignData.name,
          target_url: campaignData.target_url,
          keywords: campaignData.keywords,
          anchor_texts: campaignData.anchor_texts,
          daily_limit: campaignData.daily_limit,
          total_target: campaignData.total_target,
          status: campaignData.status,
          user_id: campaignData.user_id,
          links_generated: 0,
          links_live: 0,
          average_authority: 0,
          average_relevance: 0,
          success_rate: 0,
          velocity: 0,
          trend: 'stable',
          efficiency: 0,
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          estimated_completion: new Date(Date.now() + 86400000 * Math.ceil(campaignData.total_target / campaignData.daily_limit)).toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Direct campaign creation error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ Campaign created directly in database:', data);
      return data;
    } catch (error) {
      console.error('Failed to create campaign directly:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * Get all campaigns for user directly from database
   */
  async getCampaigns(userId: string): Promise<DirectCampaignResult[]> {
    try {
      const { data, error } = await supabase
        .from('backlink_campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Direct campaign fetch error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ Campaigns fetched directly from database:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch campaigns directly:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * Update campaign status directly
   */
  async updateCampaignStatus(campaignId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('backlink_campaigns')
        .update({ 
          status,
          last_activity: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) {
        console.error('Direct campaign status update error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ Campaign status updated directly:', campaignId, status);
    } catch (error) {
      console.error('Failed to update campaign status directly:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * Update campaign metrics directly
   */
  async updateCampaignMetrics(campaignId: string, metrics: {
    links_generated?: number;
    links_live?: number;
    average_authority?: number;
    success_rate?: number;
    velocity?: number;
    efficiency?: number;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('backlink_campaigns')
        .update({
          ...metrics,
          last_activity: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) {
        console.error('Direct campaign metrics update error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ Campaign metrics updated directly:', campaignId, metrics);
    } catch (error) {
      console.error('Failed to update campaign metrics directly:', formatErrorForLogging(error, 'updateCampaignMetricsDirectly'));
      throw error;
    }
  }

  /**
   * Delete campaign directly
   */
  async deleteCampaign(campaignId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('backlink_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) {
        console.error('Direct campaign deletion error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ Campaign deleted directly:', campaignId);
    } catch (error) {
      console.error('Failed to delete campaign directly:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
        code: error.code
      });
      throw error;
    }
  }
}

// Export singleton instance
export const directCampaignService = new DirectCampaignService();
export default directCampaignService;
