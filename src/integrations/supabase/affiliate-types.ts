import type { Database } from './types';

// Affiliate Program Types
export interface AffiliateProfile {
  id: string;
  user_id: string;
  affiliate_id: string; // Unique tracking ID
  status: 'pending' | 'active' | 'suspended' | 'banned';
  commission_rate: number; // Default 20%
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'partner';
  total_earnings: number;
  total_referrals: number;
  total_conversions: number;
  lifetime_value: number;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  payout_method?: 'paypal' | 'stripe' | 'crypto' | 'bank';
  payout_details?: Record<string, any>;
}

export interface AffiliateReferral {
  id: string;
  affiliate_id: string;
  referral_code: string;
  referred_user_id?: string;
  visitor_ip: string;
  user_agent: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  landing_page: string;
  conversion_status: 'pending' | 'converted' | 'expired';
  conversion_value?: number;
  commission_earned?: number;
  clicked_at: string;
  converted_at?: string;
  expires_at: string;
  device_fingerprint?: string;
  session_id?: string;
}

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  referral_id: string;
  user_id: string; // The referred user who converted
  commission_type: 'signup' | 'subscription' | 'purchase' | 'bonus';
  amount: number;
  percentage: number;
  order_value: number;
  status: 'pending' | 'approved' | 'paid' | 'disputed';
  created_at: string;
  approved_at?: string;
  paid_at?: string;
  payment_id?: string;
  notes?: string;
}

export interface AffiliatePayout {
  id: string;
  affiliate_id: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: 'paypal' | 'stripe' | 'crypto' | 'bank';
  transaction_id?: string;
  created_at: string;
  processed_at?: string;
  completed_at?: string;
  failure_reason?: string;
  commission_ids: string[]; // Array of commission IDs included in this payout
}

export interface AffiliateClick {
  id: string;
  affiliate_id: string;
  referral_code: string;
  visitor_ip: string;
  user_agent: string;
  referer?: string;
  utm_params?: Record<string, string>;
  landing_page: string;
  clicked_at: string;
  country?: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
}

export interface AffiliateAsset {
  id: string;
  name: string;
  type: 'banner' | 'button' | 'email_template' | 'social_post' | 'video' | 'landing_page';
  category: string;
  dimensions?: string; // e.g., "728x90", "300x250"
  file_url: string;
  preview_url?: string;
  download_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface AffiliateCampaign {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  commission_rate: number;
  bonus_amount?: number;
  target_conversions?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  eligible_tiers: string[];
  campaign_assets: string[]; // Asset IDs
}

export interface AffiliateLeaderboard {
  id: string;
  affiliate_id: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  rank: number;
  referrals: number;
  conversions: number;
  earnings: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface AffiliateMilestone {
  id: string;
  affiliate_id: string;
  milestone_type: 'referrals' | 'earnings' | 'conversions';
  milestone_value: number;
  reward_type: 'bonus' | 'tier_upgrade' | 'badge' | 'credits';
  reward_value: number;
  achieved_at: string;
  is_claimed: boolean;
  claimed_at?: string;
}

export interface AffiliateSettings {
  id: string;
  default_commission_rate: number;
  cookie_duration_days: number;
  minimum_payout: number;
  payout_schedule: 'weekly' | 'bi_weekly' | 'monthly';
  auto_approve_affiliates: boolean;
  require_tax_info: boolean;
  commission_tiers: Record<string, number>;
  bonus_milestones: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Utility types for API responses
export interface AffiliateStats {
  total_clicks: number;
  total_referrals: number;
  total_conversions: number;
  total_earnings: number;
  conversion_rate: number;
  epc: number; // Earnings per click
  pending_commissions: number;
  paid_commissions: number;
  current_tier: string;
  next_tier_threshold?: number;
}

export interface AffiliateAnalytics {
  period: string;
  clicks: number;
  referrals: number;
  conversions: number;
  earnings: number;
  top_sources: Array<{ source: string; clicks: number; conversions: number }>;
  device_breakdown: Record<string, number>;
  geo_breakdown: Record<string, number>;
}

export interface AffiliateLink {
  base_url: string;
  affiliate_code: string;
  utm_params?: Record<string, string>;
  short_url?: string;
  qr_code?: string;
}

// Enums for better type safety
export const AFFILIATE_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BANNED: 'banned'
} as const;

export const AFFILIATE_TIERS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  PARTNER: 'partner'
} as const;

export const COMMISSION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PAID: 'paid',
  DISPUTED: 'disputed'
} as const;

export const PAYOUT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

export type AffiliateStatusType = typeof AFFILIATE_STATUS[keyof typeof AFFILIATE_STATUS];
export type AffiliateTierType = typeof AFFILIATE_TIERS[keyof typeof AFFILIATE_TIERS];
export type CommissionStatusType = typeof COMMISSION_STATUS[keyof typeof COMMISSION_STATUS];
export type PayoutStatusType = typeof PAYOUT_STATUS[keyof typeof PAYOUT_STATUS];
