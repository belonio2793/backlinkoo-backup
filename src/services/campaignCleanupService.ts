import { supabase } from '@/integrations/supabase/client';
import { multiApiContentGenerator } from './multiApiContentGenerator';

interface CleanupStats {
  campaignsDeleted: number;
  guestCampaignsChecked: number;
  lastCleanup: string;
}

export class CampaignCleanupService {
  private static instance: CampaignCleanupService;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
  private readonly AUTO_DELETE_HOURS = 24;

  private constructor() {
    this.startPeriodicCleanup();
  }

  static getInstance(): CampaignCleanupService {
    if (!CampaignCleanupService.instance) {
      CampaignCleanupService.instance = new CampaignCleanupService();
    }
    return CampaignCleanupService.instance;
  }

  /**
   * Start periodic cleanup of expired campaigns
   */
  startPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(async () => {
      try {
        await this.performCleanup();
      } catch (error) {
        console.error('Periodic cleanup failed:', error);
      }
    }, this.CLEANUP_INTERVAL_MS);

    // Run initial cleanup
    this.performCleanup().catch(error => {
      console.error('Initial cleanup failed:', error);
    });
  }

  /**
   * Stop periodic cleanup
   */
  stopPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Perform cleanup of expired campaigns
   */
  async performCleanup(): Promise<CleanupStats> {
    const cutoffTime = new Date(Date.now() - this.AUTO_DELETE_HOURS * 60 * 60 * 1000);
    
    try {
      // Find campaigns eligible for deletion
      const { data: eligibleCampaigns, error: fetchError } = await supabase
        .from('campaigns')
        .select('id, name, created_at, user_id, status')
        .or(`status.eq.scheduled_for_deletion,and(user_id.is.null,created_at.lt.${cutoffTime.toISOString()})`)
        .lt('created_at', cutoffTime.toISOString());

      if (fetchError) {
        throw new Error(`Failed to fetch eligible campaigns: ${fetchError.message}`);
      }

      const campaignsToDelete = eligibleCampaigns || [];
      const guestCampaignsChecked = campaignsToDelete.filter(c => !c.user_id).length;

      if (campaignsToDelete.length === 0) {
        return {
          campaignsDeleted: 0,
          guestCampaignsChecked,
          lastCleanup: new Date().toISOString()
        };
      }

      // Delete expired campaigns
      const { error: deleteError } = await supabase
        .from('campaigns')
        .delete()
        .in('id', campaignsToDelete.map(c => c.id));

      if (deleteError) {
        throw new Error(`Failed to delete campaigns: ${deleteError.message}`);
      }

      // Log cleanup activity
      await this.logCleanupActivity(campaignsToDelete.length, guestCampaignsChecked);

      // Also cleanup using the multi-API generator
      const multiApiDeleted = await multiApiContentGenerator.cleanupExpiredCampaigns();

      console.log(`Cleanup completed: ${campaignsToDelete.length + multiApiDeleted} campaigns deleted`);

      return {
        campaignsDeleted: campaignsToDelete.length + multiApiDeleted,
        guestCampaignsChecked,
        lastCleanup: new Date().toISOString()
      };

    } catch (error) {
      console.error('Cleanup operation failed:', error);
      throw error;
    }
  }

  /**
   * Get campaigns that will expire soon (within next 6 hours)
   */
  async getCampaignsNearExpiry(): Promise<Array<{
    id: string;
    name: string;
    created_at: string;
    expiresAt: string;
    hoursRemaining: number;
  }>> {
    const now = new Date();
    const nearExpiryTime = new Date(now.getTime() - (this.AUTO_DELETE_HOURS - 6) * 60 * 60 * 1000);
    const expiryTime = new Date(now.getTime() - this.AUTO_DELETE_HOURS * 60 * 60 * 1000);

    try {
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('id, name, created_at, user_id')
        .is('user_id', null) // Only guest campaigns
        .gte('created_at', expiryTime.toISOString())
        .lt('created_at', nearExpiryTime.toISOString());

      if (error) {
        throw new Error(`Failed to fetch near-expiry campaigns: ${error.message}`);
      }

      return (campaigns || []).map(campaign => {
        const createdAt = new Date(campaign.created_at);
        const expiresAt = new Date(createdAt.getTime() + this.AUTO_DELETE_HOURS * 60 * 60 * 1000);
        const hoursRemaining = Math.max(0, (expiresAt.getTime() - now.getTime()) / (60 * 60 * 1000));

        return {
          id: campaign.id,
          name: campaign.name,
          created_at: campaign.created_at,
          expiresAt: expiresAt.toISOString(),
          hoursRemaining: Math.round(hoursRemaining * 100) / 100
        };
      });

    } catch (error) {
      console.error('Failed to get near-expiry campaigns:', error);
      return [];
    }
  }

  /**
   * Extend campaign expiry by converting guest campaign to registered user
   */
  async extendCampaignForUser(campaignId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          user_id: userId,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)
        .is('user_id', null); // Only allow conversion of guest campaigns

      if (error) {
        throw new Error(`Failed to extend campaign: ${error.message}`);
      }

      console.log(`Campaign ${campaignId} extended for user ${userId}`);
      return true;

    } catch (error) {
      console.error('Failed to extend campaign:', error);
      return false;
    }
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<{
    totalActiveCampaigns: number;
    guestCampaigns: number;
    registeredCampaigns: number;
    campaignsNearExpiry: number;
    lastCleanupTime?: string;
  }> {
    try {
      // Get total campaigns
      const { count: totalCount, error: totalError } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'deleted');

      if (totalError) throw totalError;

      // Get guest campaigns
      const { count: guestCount, error: guestError } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .is('user_id', null)
        .neq('status', 'deleted');

      if (guestError) throw guestError;

      // Get near-expiry campaigns
      const nearExpiryCampaigns = await this.getCampaignsNearExpiry();

      // Get last cleanup time from logs (simplified - in production would use dedicated logging table)
      const { data: lastCleanup } = await supabase
        .from('security_audit_log')
        .select('created_at')
        .eq('action', 'campaign_cleanup')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        totalActiveCampaigns: totalCount || 0,
        guestCampaigns: guestCount || 0,
        registeredCampaigns: (totalCount || 0) - (guestCount || 0),
        campaignsNearExpiry: nearExpiryCampaigns.length,
        lastCleanupTime: lastCleanup?.created_at
      };

    } catch (error) {
      console.error('Failed to get cleanup stats:', error);
      return {
        totalActiveCampaigns: 0,
        guestCampaigns: 0,
        registeredCampaigns: 0,
        campaignsNearExpiry: 0
      };
    }
  }

  /**
   * Force cleanup of specific campaign
   */
  async forceCleanupCampaign(campaignId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) {
        throw new Error(`Failed to delete campaign: ${error.message}`);
      }

      await this.logCleanupActivity(1, 1, `Force cleanup of campaign ${campaignId}`);
      return true;

    } catch (error) {
      console.error('Failed to force cleanup campaign:', error);
      return false;
    }
  }

  /**
   * Preview what would be cleaned up without actually deleting
   */
  async previewCleanup(): Promise<{
    eligibleForDeletion: Array<{
      id: string;
      name: string;
      created_at: string;
      hoursOld: number;
      isGuest: boolean;
    }>;
    totalToDelete: number;
  }> {
    const cutoffTime = new Date(Date.now() - this.AUTO_DELETE_HOURS * 60 * 60 * 1000);
    
    try {
      const { data: eligibleCampaigns, error } = await supabase
        .from('campaigns')
        .select('id, name, created_at, user_id, status')
        .or(`status.eq.scheduled_for_deletion,and(user_id.is.null,created_at.lt.${cutoffTime.toISOString()})`)
        .lt('created_at', cutoffTime.toISOString());

      if (error) {
        throw new Error(`Failed to preview cleanup: ${error.message}`);
      }

      const now = new Date();
      const eligibleForDeletion = (eligibleCampaigns || []).map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        created_at: campaign.created_at,
        hoursOld: (now.getTime() - new Date(campaign.created_at).getTime()) / (60 * 60 * 1000),
        isGuest: !campaign.user_id
      }));

      return {
        eligibleForDeletion,
        totalToDelete: eligibleForDeletion.length
      };

    } catch (error) {
      console.error('Failed to preview cleanup:', error);
      return {
        eligibleForDeletion: [],
        totalToDelete: 0
      };
    }
  }

  private async logCleanupActivity(
    campaignsDeleted: number, 
    guestCampaigns: number, 
    details?: string
  ): Promise<void> {
    try {
      await supabase
        .from('security_audit_log')
        .insert({
          action: 'campaign_cleanup',
          resource: 'campaigns',
          details: {
            campaignsDeleted,
            guestCampaigns,
            timestamp: new Date().toISOString(),
            details
          }
        });
    } catch (error) {
      console.warn('Failed to log cleanup activity:', error);
    }
  }

  /**
   * Send notification to users about campaigns nearing expiry
   */
  async notifyUsersOfExpiringCampaigns(): Promise<void> {
    const nearExpiryCampaigns = await this.getCampaignsNearExpiry();
    
    if (nearExpiryCampaigns.length === 0) {
      return;
    }

    // In a real implementation, this would send emails or push notifications
    // For now, we'll just log the campaigns that need notifications
    console.log(`Found ${nearExpiryCampaigns.length} campaigns nearing expiry:`, 
      nearExpiryCampaigns.map(c => ({
        id: c.id,
        name: c.name,
        hoursRemaining: c.hoursRemaining
      }))
    );

    // Here you would integrate with email service, push notifications, etc.
    // Example: await emailService.sendExpiryWarning(campaign.userEmail, campaign);
  }
}

// Export singleton instance
export const campaignCleanupService = CampaignCleanupService.getInstance();

// Export types
export type { CleanupStats };
