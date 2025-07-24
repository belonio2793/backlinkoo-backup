import { supabase } from "@/integrations/supabase/client";

export interface VerificationRequest {
  campaignId: string;
  userId: string;
  targetUrl: string;
  keywords: string[];
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export class NoHandsSEOVerificationService {
  /**
   * Submit a campaign for verification
   */
  static async submitForVerification(campaignId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          verification_status: 'pending',
          verification_submitted_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) {
        console.error('Error submitting for verification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Verification submission error:', error);
      return false;
    }
  }

  /**
   * Get verification status for a campaign
   */
  static async getVerificationStatus(campaignId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('verification_status')
        .eq('id', campaignId)
        .single();

      if (error) {
        console.error('Error getting verification status:', error);
        return null;
      }

      return data?.verification_status || null;
    } catch (error) {
      console.error('Verification status error:', error);
      return null;
    }
  }

  /**
   * Approve a campaign (Admin function)
   */
  static async approveCampaign(campaignId: string, adminNotes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          verification_status: 'approved',
          status: 'verified',
          verification_notes: adminNotes,
          verification_approved_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) {
        console.error('Error approving campaign:', error);
        return false;
      }

      // TODO: Send notification email to user about approval
      this.sendVerificationNotification(campaignId, 'approved');

      return true;
    } catch (error) {
      console.error('Campaign approval error:', error);
      return false;
    }
  }

  /**
   * Reject a campaign (Admin function)
   */
  static async rejectCampaign(campaignId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          verification_status: 'rejected',
          status: 'failed',
          verification_notes: reason,
          verification_rejected_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) {
        console.error('Error rejecting campaign:', error);
        return false;
      }

      // TODO: Send notification email to user about rejection
      this.sendVerificationNotification(campaignId, 'rejected', reason);

      return true;
    } catch (error) {
      console.error('Campaign rejection error:', error);
      return false;
    }
  }

  /**
   * Get all campaigns pending verification (Admin function)
   */
  static async getPendingVerifications(): Promise<any[]> {
    try {
      // Fetch pending campaigns and filter client-side
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          profiles!inner(email, role)
        `)
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error getting pending verifications:', error);
        return [];
      }

      // Filter for NO Hands SEO campaigns client-side
      const noHandsSEOCampaigns = data?.filter(campaign =>
        campaign.name?.includes('NO Hands SEO') ||
        campaign.campaign_type === 'no_hands_seo'
      ) || [];

      return noHandsSEOCampaigns;
    } catch (error) {
      console.error('Pending verifications error:', error);
      return [];
    }
  }

  /**
   * Send verification notification (placeholder for email service)
   */
  private static async sendVerificationNotification(
    campaignId: string, 
    status: 'approved' | 'rejected', 
    reason?: string
  ): Promise<void> {
    try {
      // TODO: Integrate with email service (SendGrid, etc.)
      console.log(`Verification notification sent for campaign ${campaignId}: ${status}`, { reason });
      
      // For now, we'll just log this. In a production environment, 
      // this would integrate with an email service or notification system.
      
    } catch (error) {
      console.error('Error sending verification notification:', error);
    }
  }

  /**
   * Check if user has pending verifications
   */
  static async hasPendingVerifications(userId: string): Promise<boolean> {
    try {
      let query = supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', userId)
        .eq('verification_status', 'pending');

      const { data, error } = await query.limit(1);

      if (error) {
        console.error('Error checking pending verifications:', error);
        return false;
      }

      return (data && data.length > 0);
    } catch (error) {
      console.error('Pending verification check error:', error);
      return false;
    }
  }

  /**
   * Get verification metrics (Admin function)
   */
  static async getVerificationMetrics(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    avgVerificationTime: number;
  }> {
    try {
      let query = supabase
        .from('campaigns')
        .select('verification_status, created_at, verification_approved_at, verification_rejected_at')
        .or('name.ilike.%NO Hands SEO%,campaign_type.eq.no_hands_seo');

      const { data, error } = await query.not('verification_status', 'is', null);

      if (error) {
        console.error('Error getting verification metrics:', error);
        return { pending: 0, approved: 0, rejected: 0, avgVerificationTime: 0 };
      }

      const pending = data.filter(c => c.verification_status === 'pending').length;
      const approved = data.filter(c => c.verification_status === 'approved').length;
      const rejected = data.filter(c => c.verification_status === 'rejected').length;

      // Calculate average verification time for completed verifications
      const completedVerifications = data.filter(c => 
        c.verification_approved_at || c.verification_rejected_at
      );

      let avgVerificationTime = 0;
      if (completedVerifications.length > 0) {
        const totalTime = completedVerifications.reduce((sum, campaign) => {
          const createdAt = new Date(campaign.created_at);
          const completedAt = new Date(campaign.verification_approved_at || campaign.verification_rejected_at);
          return sum + (completedAt.getTime() - createdAt.getTime());
        }, 0);

        avgVerificationTime = totalTime / completedVerifications.length / (1000 * 60 * 60); // Convert to hours
      }

      return { pending, approved, rejected, avgVerificationTime };
    } catch (error) {
      console.error('Verification metrics error:', error);
      return { pending: 0, approved: 0, rejected: 0, avgVerificationTime: 0 };
    }
  }
}
