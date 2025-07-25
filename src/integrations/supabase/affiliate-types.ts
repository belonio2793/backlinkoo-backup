export interface AffiliateProgram {
  id: string;
  user_id: string;
  affiliate_code: string;
  custom_id: string;
  status: 'active' | 'inactive' | 'suspended';
  commission_rate: number; // Default 50% = 0.5
  total_earnings: number;
  total_paid: number;
  pending_earnings: number;
  referral_url: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliateReferral {
  id: string;
  affiliate_id: string;
  referred_user_id: string | null; // null if user hasn't registered yet
  referral_code: string;
  source_url: string | null;
  conversion_date: string | null;
  total_spend: number;
  commission_earned: number;
  commission_paid: boolean;
  payment_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AffiliatePayment {
  id: string;
  affiliate_id: string;
  amount: number;
  payment_method: 'paypal' | 'bank_transfer' | 'crypto';
  payment_reference: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AffiliateStats {
  affiliate_id: string;
  total_clicks: number;
  total_conversions: number;
  conversion_rate: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
  top_referral_sources: Array<{
    source: string;
    clicks: number;
    conversions: number;
  }>;
  monthly_performance: Array<{
    month: string;
    clicks: number;
    conversions: number;
    commission: number;
  }>;
}

export type AffiliateInsert = Omit<AffiliateProgram, 'id' | 'created_at' | 'updated_at'>;
export type AffiliateUpdate = Partial<Omit<AffiliateProgram, 'id' | 'user_id' | 'created_at'>>;

export type ReferralInsert = Omit<AffiliateReferral, 'id' | 'created_at' | 'updated_at'>;
export type ReferralUpdate = Partial<Omit<AffiliateReferral, 'id' | 'affiliate_id' | 'created_at'>>;

export type PaymentInsert = Omit<AffiliatePayment, 'id' | 'created_at' | 'updated_at'>;
export type PaymentUpdate = Partial<Omit<AffiliatePayment, 'id' | 'affiliate_id' | 'created_at'>>;
