import { supabase } from '@/integrations/supabase/client';
import type { 
  AffiliateProgram, 
  AffiliateReferral, 
  AffiliatePayment,
  AffiliateInsert,
  ReferralInsert,
  PaymentInsert 
} from '@/integrations/supabase/affiliate-types';

export class AffiliateService {
  // Generate unique affiliate code
  static generateAffiliateCode(userId: string): string {
    const timestamp = Date.now().toString(36);
    const userIdShort = userId.slice(-6);
    const random = Math.random().toString(36).substring(2, 8);
    return `AF_${userIdShort}_${timestamp}_${random}`.toUpperCase();
  }

  // Generate custom ID for user
  static generateCustomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Create affiliate program for user
  static async createAffiliateProgram(userId: string, customId?: string): Promise<AffiliateProgram> {
    const affiliateCode = this.generateAffiliateCode(userId);
    const finalCustomId = customId || this.generateCustomId();
    const referralUrl = `${window.location.origin}/?ref=${affiliateCode}`;

    const affiliateData: AffiliateInsert = {
      user_id: userId,
      affiliate_code: affiliateCode,
      custom_id: finalCustomId,
      status: 'active',
      commission_rate: 0.5, // 50%
      total_earnings: 0,
      total_paid: 0,
      pending_earnings: 0,
      referral_url: referralUrl
    };

    const { data, error } = await supabase
      .from('affiliate_programs')
      .insert(affiliateData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get affiliate program by user ID
  static async getAffiliateByUserId(userId: string): Promise<AffiliateProgram | null> {
    const { data, error } = await supabase
      .from('affiliate_programs')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return data;
  }

  // Get affiliate program by code
  static async getAffiliateByCode(code: string): Promise<AffiliateProgram | null> {
    const { data, error } = await supabase
      .from('affiliate_programs')
      .select('*')
      .eq('affiliate_code', code)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Track referral click
  static async trackReferralClick(affiliateCode: string, sourceUrl?: string): Promise<void> {
    // Store in localStorage for conversion tracking
    localStorage.setItem('affiliate_referral', JSON.stringify({
      code: affiliateCode,
      timestamp: Date.now(),
      sourceUrl: sourceUrl || document.referrer
    }));
  }

  // Convert referral when user makes purchase
  static async convertReferral(userId: string, orderAmount: number): Promise<void> {
    const referralData = localStorage.getItem('affiliate_referral');
    if (!referralData) return;

    const { code, sourceUrl } = JSON.parse(referralData);
    const affiliate = await this.getAffiliateByCode(code);
    
    if (!affiliate) return;

    const commissionAmount = orderAmount * affiliate.commission_rate;

    // Create referral record
    const referralInsert: ReferralInsert = {
      affiliate_id: affiliate.id,
      referred_user_id: userId,
      referral_code: code,
      source_url: sourceUrl,
      conversion_date: new Date().toISOString(),
      total_spend: orderAmount,
      commission_earned: commissionAmount,
      commission_paid: false,
      payment_date: null
    };

    const { error: referralError } = await supabase
      .from('affiliate_referrals')
      .insert(referralInsert);

    if (referralError) throw referralError;

    // Update affiliate earnings
    const { error: updateError } = await supabase
      .from('affiliate_programs')
      .update({
        total_earnings: affiliate.total_earnings + commissionAmount,
        pending_earnings: affiliate.pending_earnings + commissionAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', affiliate.id);

    if (updateError) throw updateError;

    // Clear the referral data
    localStorage.removeItem('affiliate_referral');
  }

  // Get affiliate referrals
  static async getAffiliateReferrals(affiliateId: string): Promise<AffiliateReferral[]> {
    const { data, error } = await supabase
      .from('affiliate_referrals')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get affiliate stats
  static async getAffiliateStats(affiliateId: string): Promise<any> {
    const referrals = await this.getAffiliateReferrals(affiliateId);
    
    const totalConversions = referrals.filter(r => r.conversion_date).length;
    const totalCommission = referrals.reduce((sum, r) => sum + r.commission_earned, 0);
    const paidCommission = referrals
      .filter(r => r.commission_paid)
      .reduce((sum, r) => sum + r.commission_earned, 0);
    const pendingCommission = totalCommission - paidCommission;

    return {
      total_referrals: referrals.length,
      total_conversions: totalConversions,
      conversion_rate: referrals.length > 0 ? (totalConversions / referrals.length) * 100 : 0,
      total_commission: totalCommission,
      pending_commission: pendingCommission,
      paid_commission: paidCommission
    };
  }

  // Request payout
  static async requestPayout(
    affiliateId: string, 
    amount: number, 
    paymentMethod: 'paypal' | 'bank_transfer' | 'crypto'
  ): Promise<AffiliatePayment> {
    const paymentData: PaymentInsert = {
      affiliate_id: affiliateId,
      amount,
      payment_method: paymentMethod,
      payment_reference: null,
      status: 'pending',
      processed_at: null
    };

    const { data, error } = await supabase
      .from('affiliate_payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update payout status (admin function)
  static async updatePayoutStatus(
    paymentId: string, 
    status: 'processing' | 'completed' | 'failed',
    paymentReference?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed' || status === 'processing') {
      updateData.processed_at = new Date().toISOString();
    }

    if (paymentReference) {
      updateData.payment_reference = paymentReference;
    }

    const { error } = await supabase
      .from('affiliate_payments')
      .update(updateData)
      .eq('id', paymentId);

    if (error) throw error;

    // If completed, update affiliate program
    if (status === 'completed') {
      const { data: payment } = await supabase
        .from('affiliate_payments')
        .select('affiliate_id, amount')
        .eq('id', paymentId)
        .single();

      if (payment) {
        const { data: affiliate } = await supabase
          .from('affiliate_programs')
          .select('total_paid, pending_earnings')
          .eq('id', payment.affiliate_id)
          .single();

        if (affiliate) {
          await supabase
            .from('affiliate_programs')
            .update({
              total_paid: affiliate.total_paid + payment.amount,
              pending_earnings: Math.max(0, affiliate.pending_earnings - payment.amount),
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.affiliate_id);
        }
      }
    }
  }
}
