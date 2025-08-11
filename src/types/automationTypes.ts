export interface AutomationCampaign {
  id: string;
  user_id: string;
  name: string;
  engine_type: 'blog_comments' | 'web2_platforms' | 'forum_profiles' | 'social_media';
  target_url: string;
  keywords: string[];
  anchor_texts: string[];
  status: 'active' | 'paused' | 'completed' | 'draft';
  daily_limit: number;
  auto_start: boolean;
  priority: 'low' | 'medium' | 'high';
  budget_limit?: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  expires_at?: string;
}

export interface LinkPlacement {
  id: string;
  campaign_id: string;
  user_id: string;
  target_domain: string;
  source_domain: string;
  source_url: string;
  placement_type: 'blog_comment' | 'web2_post' | 'forum_post' | 'social_post' | 'profile_link';
  anchor_text: string;
  target_url: string;
  content_snippet: string;
  status: 'pending' | 'live' | 'rejected' | 'removed' | 'failed';
  quality_score: number;
  domain_authority: number;
  page_authority: number;
  placement_date: string;
  verification_date?: string;
  removal_date?: string;
  cost: number;
  engine_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CampaignReport {
  id: string;
  campaign_id: string;
  user_id: string;
  report_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  period_start: string;
  period_end: string;
  total_links_built: number;
  links_live: number;
  links_pending: number;
  links_failed: number;
  average_domain_authority: number;
  total_cost: number;
  success_rate: number;
  top_domains: string[];
  performance_metrics: Record<string, any>;
  created_at: string;
}

export interface AvailableSite {
  id: string;
  domain: string;
  domain_authority: number;
  page_authority: number;
  spam_score: number;
  category: string;
  niche: string[];
  placement_types: string[];
  cost_per_link: number;
  acceptance_rate: number;
  average_turnaround: number; // hours
  language: string;
  country: string;
  traffic_estimate: number;
  last_checked: string;
  status: 'active' | 'inactive' | 'blacklisted';
  requirements: Record<string, any>;
  contact_info: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserLinkQuota {
  id: string;
  user_id: string;
  plan_type: 'guest' | 'free' | 'premium';
  total_quota: number;
  used_quota: number;
  remaining_quota: number;
  reset_date: string;
  last_updated: string;
}

export interface CampaignMetrics {
  campaign_id: string;
  total_links: number;
  live_links: number;
  pending_links: number;
  failed_links: number;
  success_rate: number;
  average_da: number;
  total_cost: number;
  daily_velocity: number;
  last_activity: string;
}

export interface LinkOpportunity {
  id: string;
  domain: string;
  url: string;
  placement_type: string;
  niche: string[];
  domain_authority: number;
  estimated_cost: number;
  difficulty_score: number;
  discovered_date: string;
  last_verified: string;
  availability_status: 'available' | 'occupied' | 'expired';
  requirements: Record<string, any>;
}

// Database table interfaces for Supabase
export interface AutomationCampaignInsert {
  user_id: string;
  name: string;
  engine_type: AutomationCampaign['engine_type'];
  target_url: string;
  keywords: string[];
  anchor_texts: string[];
  status?: AutomationCampaign['status'];
  daily_limit?: number;
  auto_start?: boolean;
  priority?: AutomationCampaign['priority'];
  budget_limit?: number;
  settings?: Record<string, any>;
  expires_at?: string;
}

export interface LinkPlacementInsert {
  campaign_id: string;
  user_id: string;
  target_domain: string;
  source_domain: string;
  source_url: string;
  placement_type: LinkPlacement['placement_type'];
  anchor_text: string;
  target_url: string;
  content_snippet: string;
  status?: LinkPlacement['status'];
  quality_score?: number;
  domain_authority?: number;
  page_authority?: number;
  placement_date?: string;
  cost?: number;
  engine_data?: Record<string, any>;
}

export interface CampaignFilters {
  engine_type?: string;
  status?: string;
  priority?: string;
  created_after?: string;
  created_before?: string;
  keyword?: string;
}

export interface LinkFilters {
  campaign_id?: string;
  status?: string;
  placement_type?: string;
  domain_authority_min?: number;
  domain_authority_max?: number;
  placement_after?: string;
  placement_before?: string;
  source_domain?: string;
}

export interface ReportFilters {
  campaign_id?: string;
  report_type?: string;
  period_start?: string;
  period_end?: string;
}

// API Response types
export interface CampaignResponse {
  campaign: AutomationCampaign;
  metrics: CampaignMetrics;
  recent_links: LinkPlacement[];
}

export interface DashboardData {
  total_campaigns: number;
  active_campaigns: number;
  total_links: number;
  links_this_month: number;
  success_rate: number;
  top_performing_campaigns: CampaignResponse[];
  recent_placements: LinkPlacement[];
  quota_info: UserLinkQuota;
}
