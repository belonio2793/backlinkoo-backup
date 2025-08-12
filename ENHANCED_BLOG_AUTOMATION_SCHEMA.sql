-- ============================================================================
-- ENHANCED BLOG COMMENT AUTOMATION SYSTEM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- This schema implements a comprehensive crawler/detector/poster pipeline
-- for automated blog comment backlink building with human oversight
-- 
-- Run this entire script in your Supabase SQL Editor
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Blog campaigns table (enhanced with crawler settings)
CREATE TABLE IF NOT EXISTS blog_campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  target_url text not null, -- User's website to link to
  keyword text not null,
  anchor_text text,
  status text not null default 'paused' check (status in ('active', 'paused', 'completed')),
  automation_enabled boolean default false,
  max_posts_per_domain integer default 1,
  recurrence_interval interval default '7 days',
  links_found integer default 0,
  links_posted integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Crawler settings
  discovery_settings jsonb default '{
    "max_targets_per_keyword": 50,
    "min_confidence_score": 12,
    "respect_robots_txt": true,
    "enable_js_rendering": true,
    "rate_limit_delay": 2000,
    "max_concurrent_crawlers": 3
  }'::jsonb
);

-- Crawler targets table (discovered pages with comment potential)
CREATE TABLE IF NOT EXISTS crawler_targets (
  id uuid default gen_random_uuid() primary key,
  url text unique not null,
  domain text not null,
  canonical_url text,
  discovered_at timestamptz default now(),
  last_checked timestamptz,
  crawl_status text default 'pending' check (crawl_status in ('pending', 'checked', 'blocked', 'error', 'skipped')),
  robots_allowed boolean default true,
  score integer default 0,
  page_title text,
  meta_description text,
  discovered_by_keywords text[],
  discovery_method text default 'search' check (discovery_method in ('search', 'crawl', 'manual', 'import')),
  
  -- Content analysis
  content_hash text, -- For duplicate detection
  word_count integer,
  has_comments_section boolean default false,
  estimated_traffic integer default 0,
  last_crawl_error text,
  crawl_attempts integer default 0,
  
  -- Indexing
  created_at timestamptz default now()
);

-- Form maps table (detected comment forms with field mappings)
CREATE TABLE IF NOT EXISTS form_maps (
  id uuid default gen_random_uuid() primary key,
  target_id uuid references crawler_targets(id) on delete cascade,
  form_selector text not null,
  action_url text,
  method text not null default 'POST',
  fields jsonb not null default '{}', -- {name: "selector", email: "selector", etc.}
  hidden_fields jsonb not null default '{}', -- CSRF tokens, hidden inputs
  submit_selector text,
  confidence integer not null default 0,
  status text default 'detected' check (status in ('detected', 'vetted', 'flagged', 'blocked')),
  needs_human_review boolean default false,
  last_posted_at timestamptz,
  detection_method text default 'html_parse',
  
  -- Form analysis
  form_complexity_score integer default 0,
  requires_javascript boolean default false,
  has_captcha boolean default false,
  estimated_success_rate numeric(5,2) default 100.00,
  
  -- Review tracking
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  
  created_at timestamptz default now()
);

-- Enhanced blog accounts table (posting identities)
CREATE TABLE IF NOT EXISTS blog_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  platform text not null check (platform in ('substack', 'medium', 'wordpress', 'generic')),
  email text not null,
  display_name text,
  website text,
  avatar_url text,
  bio text,
  
  -- Authentication data (encrypted)
  cookies text, -- Encrypted session data
  session_data jsonb,
  auth_tokens jsonb,
  
  -- Account health
  is_verified boolean default false,
  verification_status text default 'pending' check (verification_status in ('pending', 'verified', 'failed', 'expired', 'suspended')),
  health_score integer default 100,
  trust_level text default 'new' check (trust_level in ('new', 'established', 'trusted', 'expert')),
  
  -- Usage tracking
  total_posts integer default 0,
  successful_posts integer default 0,
  failed_posts integer default 0,
  captcha_encounters integer default 0,
  last_used timestamptz,
  last_success timestamptz,
  
  -- Rate limiting
  daily_post_limit integer default 5,
  posts_today integer default 0,
  last_post_date date,
  
  created_at timestamptz default now(),
  UNIQUE(user_id, platform, email)
);

-- Enhanced automation jobs queue
CREATE TABLE IF NOT EXISTS automation_jobs (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references blog_campaigns(id) on delete cascade,
  job_type text not null check (job_type in ('discover_targets', 'detect_forms', 'post_comments', 'verify_forms', 'cleanup_failed')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  priority integer default 5, -- 1 = highest, 10 = lowest
  payload jsonb,
  result jsonb,
  progress integer default 0,
  error_message text,
  retry_count integer default 0,
  max_retries integer default 3,
  
  -- Scheduling
  scheduled_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz,
  estimated_duration interval,
  
  -- Worker assignment
  worker_id text,
  worker_host text,
  
  created_at timestamptz default now()
);

-- Blog posts table (posting attempts and results)
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references blog_campaigns(id) on delete cascade,
  form_id uuid references form_maps(id) on delete cascade,
  target_url text not null,
  account_id uuid references blog_accounts(id),
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'posted', 'failed', 'captcha', 'moderation', 'blocked', 'duplicate')),
  
  -- Response data
  response_data jsonb,
  screenshot_url text,
  error_message text,
  
  -- Success indicators
  comment_visible boolean default false,
  awaiting_moderation boolean default false,
  backlink_live boolean default false,
  
  -- Timing
  posted_at timestamptz,
  verified_at timestamptz,
  moderated_at timestamptz,
  
  -- Performance tracking
  post_duration_ms integer, -- How long the posting took
  page_load_time_ms integer,
  
  created_at timestamptz default now()
);

-- ============================================================================
-- ADVANCED TABLES
-- ============================================================================

-- Crawler queue table (for managing crawler tasks)
CREATE TABLE IF NOT EXISTS crawler_queue (
  id uuid default gen_random_uuid() primary key,
  job_type text not null check (job_type in ('discover', 'fetch', 'detect', 'post', 'verify')),
  target_url text not null,
  payload jsonb,
  priority integer default 5,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'retrying')),
  retry_count integer default 0,
  max_retries integer default 3,
  worker_assigned text,
  
  -- Rate limiting
  rate_limit_group text, -- Group by domain for rate limiting
  earliest_run_time timestamptz default now(),
  
  scheduled_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Domain health tracking
CREATE TABLE IF NOT EXISTS domain_health (
  id uuid default gen_random_uuid() primary key,
  domain text unique not null,
  
  -- Success metrics
  success_rate numeric(5,2) default 100.00,
  total_attempts integer default 0,
  successful_posts integer default 0,
  failed_posts integer default 0,
  
  -- Issue tracking
  captcha_rate numeric(5,2) default 0.00,
  block_rate numeric(5,2) default 0.00,
  timeout_rate numeric(5,2) default 0.00,
  
  -- Timing analysis
  avg_response_time_ms integer default 0,
  avg_post_duration_ms integer default 0,
  
  -- Status
  is_blocked boolean default false,
  block_reason text,
  last_success timestamptz,
  last_failure timestamptz,
  
  -- Health score (0-100)
  health_score integer default 100,
  risk_level text default 'low' check (risk_level in ('low', 'medium', 'high', 'critical')),
  
  -- Rate limiting recommendations
  recommended_delay_ms integer default 5000,
  max_concurrent_posts integer default 1,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Content generation templates
CREATE TABLE IF NOT EXISTS content_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  template_text text not null,
  category text not null default 'general',
  variables text[], -- Variables that can be replaced
  tone text default 'professional' check (tone in ('professional', 'casual', 'friendly', 'expert', 'enthusiastic')),
  length text default 'medium' check (length in ('short', 'medium', 'long')),
  
  -- Usage tracking
  usage_count integer default 0,
  success_rate numeric(5,2) default 0.00,
  last_used timestamptz,
  
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Review logs (human oversight tracking)
CREATE TABLE IF NOT EXISTS review_logs (
  id uuid default gen_random_uuid() primary key,
  reviewer_id uuid references auth.users(id),
  item_type text not null check (item_type in ('form_map', 'blog_post', 'domain', 'account')),
  item_id uuid not null,
  action text not null check (action in ('approved', 'rejected', 'flagged', 'modified', 'escalated')),
  
  -- Review details
  confidence_before integer,
  confidence_after integer,
  notes text,
  tags text[],
  
  -- Context
  automated_score integer,
  human_score integer,
  disagreement_reason text,
  
  reviewed_at timestamptz default now()
);

-- Performance analytics
CREATE TABLE IF NOT EXISTS analytics_daily (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  user_id uuid references auth.users(id),
  campaign_id uuid references blog_campaigns(id),
  
  -- Discovery metrics
  targets_discovered integer default 0,
  forms_detected integer default 0,
  forms_vetted integer default 0,
  
  -- Posting metrics
  posts_attempted integer default 0,
  posts_successful integer default 0,
  posts_failed integer default 0,
  captcha_encounters integer default 0,
  
  -- Quality metrics
  avg_confidence_score numeric(5,2) default 0.00,
  avg_post_duration_ms integer default 0,
  unique_domains integer default 0,
  
  -- Human review metrics
  items_reviewed integer default 0,
  approval_rate numeric(5,2) default 0.00,
  
  created_at timestamptz default now(),
  UNIQUE(date, user_id, campaign_id)
);

-- Keyword research and tracking
CREATE TABLE IF NOT EXISTS keyword_research (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  keyword text not null,
  search_volume integer,
  competition_level text check (competition_level in ('low', 'medium', 'high')),
  
  -- Discovery potential
  estimated_targets integer default 0,
  quality_score integer default 0,
  
  -- Usage tracking
  campaigns_count integer default 0,
  success_rate numeric(5,2) default 0.00,
  last_used timestamptz,
  
  -- Research data
  related_keywords text[],
  top_domains text[],
  research_date timestamptz default now(),
  
  created_at timestamptz default now(),
  UNIQUE(user_id, keyword)
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE blog_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_research ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Blog campaigns policies
CREATE POLICY "Users can view their own campaigns" ON blog_campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" ON blog_campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON blog_campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON blog_campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Crawler targets policies (system-managed, read-only for users)
CREATE POLICY "Users can view targets" ON crawler_targets
  FOR SELECT USING (true);

CREATE POLICY "System can manage targets" ON crawler_targets
  FOR ALL USING (true);

-- Form maps policies (system-managed, read-only for users)
CREATE POLICY "Users can view form maps" ON form_maps
  FOR SELECT USING (true);

CREATE POLICY "System can manage form maps" ON form_maps
  FOR ALL USING (true);

-- Blog accounts policies
CREATE POLICY "Users can view their own accounts" ON blog_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts" ON blog_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON blog_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" ON blog_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Automation jobs policies
CREATE POLICY "Users can view jobs for their campaigns" ON automation_jobs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM blog_campaigns
    WHERE blog_campaigns.id = automation_jobs.campaign_id
    AND blog_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "System can manage automation jobs" ON automation_jobs
  FOR ALL USING (true);

-- Blog posts policies
CREATE POLICY "Users can view posts for their campaigns" ON blog_posts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM blog_campaigns
    WHERE blog_campaigns.id = blog_posts.campaign_id
    AND blog_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "System can manage blog posts" ON blog_posts
  FOR ALL USING (true);

-- Crawler queue policies (system-managed)
CREATE POLICY "System can manage crawler queue" ON crawler_queue
  FOR ALL USING (true);

-- Domain health policies (read-only for users)
CREATE POLICY "Users can view domain health" ON domain_health
  FOR SELECT USING (true);

CREATE POLICY "System can manage domain health" ON domain_health
  FOR ALL USING (true);

-- Content templates policies
CREATE POLICY "Users can view their own templates" ON content_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" ON content_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON content_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON content_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Review logs policies
CREATE POLICY "Users can view review logs" ON review_logs
  FOR SELECT USING (auth.uid() = reviewer_id);

CREATE POLICY "System can manage review logs" ON review_logs
  FOR ALL USING (true);

-- Analytics policies
CREATE POLICY "Users can view their own analytics" ON analytics_daily
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage analytics" ON analytics_daily
  FOR ALL USING (true);

-- Keyword research policies
CREATE POLICY "Users can view their own keyword research" ON keyword_research
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own keyword research" ON keyword_research
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keyword research" ON keyword_research
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keyword research" ON keyword_research
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Blog campaigns indexes
CREATE INDEX IF NOT EXISTS idx_blog_campaigns_user_id ON blog_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_campaigns_status ON blog_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_blog_campaigns_automation ON blog_campaigns(automation_enabled);
CREATE INDEX IF NOT EXISTS idx_blog_campaigns_created_at ON blog_campaigns(created_at);

-- Crawler targets indexes
CREATE INDEX IF NOT EXISTS idx_crawler_targets_domain ON crawler_targets(domain);
CREATE INDEX IF NOT EXISTS idx_crawler_targets_status ON crawler_targets(crawl_status);
CREATE INDEX IF NOT EXISTS idx_crawler_targets_score ON crawler_targets(score DESC);
CREATE INDEX IF NOT EXISTS idx_crawler_targets_url_hash ON crawler_targets USING hash(url);
CREATE INDEX IF NOT EXISTS idx_crawler_targets_discovered_at ON crawler_targets(discovered_at);
CREATE INDEX IF NOT EXISTS idx_crawler_targets_keywords ON crawler_targets USING gin(discovered_by_keywords);

-- Form maps indexes
CREATE INDEX IF NOT EXISTS idx_form_maps_target_id ON form_maps(target_id);
CREATE INDEX IF NOT EXISTS idx_form_maps_confidence ON form_maps(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_form_maps_status ON form_maps(status);
CREATE INDEX IF NOT EXISTS idx_form_maps_needs_review ON form_maps(needs_human_review);
CREATE INDEX IF NOT EXISTS idx_form_maps_last_posted ON form_maps(last_posted_at);

-- Blog accounts indexes
CREATE INDEX IF NOT EXISTS idx_blog_accounts_user_id ON blog_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_accounts_platform ON blog_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_blog_accounts_verified ON blog_accounts(is_verified);
CREATE INDEX IF NOT EXISTS idx_blog_accounts_health ON blog_accounts(health_score DESC);
CREATE INDEX IF NOT EXISTS idx_blog_accounts_last_used ON blog_accounts(last_used);

-- Automation jobs indexes
CREATE INDEX IF NOT EXISTS idx_automation_jobs_campaign_id ON automation_jobs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON automation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_type ON automation_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_scheduled ON automation_jobs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_priority ON automation_jobs(priority);

-- Blog posts indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_campaign_id ON blog_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_form_id ON blog_posts(form_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_posted_at ON blog_posts(posted_at);

-- Crawler queue indexes
CREATE INDEX IF NOT EXISTS idx_crawler_queue_status ON crawler_queue(status);
CREATE INDEX IF NOT EXISTS idx_crawler_queue_priority ON crawler_queue(priority);
CREATE INDEX IF NOT EXISTS idx_crawler_queue_scheduled_at ON crawler_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_crawler_queue_rate_limit ON crawler_queue(rate_limit_group);

-- Domain health indexes
CREATE INDEX IF NOT EXISTS idx_domain_health_domain ON domain_health(domain);
CREATE INDEX IF NOT EXISTS idx_domain_health_success_rate ON domain_health(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_domain_health_blocked ON domain_health(is_blocked);
CREATE INDEX IF NOT EXISTS idx_domain_health_score ON domain_health(health_score DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(date);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_user_id ON analytics_daily(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_campaign_id ON analytics_daily(campaign_id);

-- Review logs indexes
CREATE INDEX IF NOT EXISTS idx_review_logs_reviewer ON review_logs(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_item ON review_logs(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_reviewed_at ON review_logs(reviewed_at);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update campaign statistics
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update campaign statistics when posts are updated
  UPDATE blog_campaigns
  SET
    links_posted = (
      SELECT COUNT(*) FROM blog_posts
      WHERE campaign_id = NEW.campaign_id AND status = 'posted'
    ),
    updated_at = now()
  WHERE id = NEW.campaign_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_stats_trigger
  AFTER INSERT OR UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_stats();

-- Function to update domain health
CREATE OR REPLACE FUNCTION update_domain_health()
RETURNS TRIGGER AS $$
DECLARE
  target_domain text;
  total_posts integer;
  successful_posts integer;
  captcha_posts integer;
BEGIN
  -- Extract domain from target_url
  SELECT split_part(split_part(NEW.target_url, '://', 2), '/', 1) INTO target_domain;
  
  -- Count all posts for this domain
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'posted'),
    COUNT(*) FILTER (WHERE status = 'captcha')
  INTO total_posts, successful_posts, captcha_posts
  FROM blog_posts
  WHERE split_part(split_part(target_url, '://', 2), '/', 1) = target_domain;
  
  -- Update or insert domain health record
  INSERT INTO domain_health (
    domain, 
    total_attempts, 
    successful_posts, 
    failed_posts,
    captcha_rate,
    success_rate,
    health_score,
    last_success, 
    last_failure,
    updated_at
  )
  VALUES (
    target_domain,
    total_posts,
    successful_posts,
    total_posts - successful_posts,
    CASE WHEN total_posts > 0 THEN ROUND((captcha_posts * 100.0 / total_posts), 2) ELSE 0 END,
    CASE WHEN total_posts > 0 THEN ROUND((successful_posts * 100.0 / total_posts), 2) ELSE 100 END,
    CASE WHEN total_posts > 0 THEN GREATEST(0, 100 - (captcha_posts * 10) - ((total_posts - successful_posts) * 5)) ELSE 100 END,
    CASE WHEN NEW.status = 'posted' THEN now() ELSE NULL END,
    CASE WHEN NEW.status = 'failed' THEN now() ELSE NULL END,
    now()
  )
  ON CONFLICT (domain) DO UPDATE SET
    total_attempts = EXCLUDED.total_attempts,
    successful_posts = EXCLUDED.successful_posts,
    failed_posts = EXCLUDED.failed_posts,
    captcha_rate = EXCLUDED.captcha_rate,
    success_rate = EXCLUDED.success_rate,
    health_score = EXCLUDED.health_score,
    last_success = CASE WHEN NEW.status = 'posted' THEN now() ELSE domain_health.last_success END,
    last_failure = CASE WHEN NEW.status = 'failed' THEN now() ELSE domain_health.last_failure END,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_domain_health_trigger
  AFTER INSERT OR UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_domain_health();

-- Function to update account health
CREATE OR REPLACE FUNCTION update_account_health()
RETURNS TRIGGER AS $$
BEGIN
  -- Update account statistics when posts are made
  UPDATE blog_accounts
  SET
    total_posts = total_posts + 1,
    successful_posts = successful_posts + CASE WHEN NEW.status = 'posted' THEN 1 ELSE 0 END,
    failed_posts = failed_posts + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
    captcha_encounters = captcha_encounters + CASE WHEN NEW.status = 'captcha' THEN 1 ELSE 0 END,
    last_used = CASE WHEN NEW.status IN ('posted', 'pending') THEN now() ELSE last_used END,
    last_success = CASE WHEN NEW.status = 'posted' THEN now() ELSE last_success END,
    health_score = GREATEST(0, 
      100 - (captcha_encounters + CASE WHEN NEW.status = 'captcha' THEN 1 ELSE 0 END) * 5
          - (failed_posts + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END) * 2
    )
  WHERE id = NEW.account_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_account_health_trigger
  AFTER INSERT OR UPDATE ON blog_posts
  FOR EACH ROW
  WHEN (NEW.account_id IS NOT NULL)
  EXECUTE FUNCTION update_account_health();

-- Function to reset daily post counts
CREATE OR REPLACE FUNCTION reset_daily_post_counts()
RETURNS void AS $$
BEGIN
  UPDATE blog_accounts
  SET 
    posts_today = 0,
    last_post_date = CURRENT_DATE
  WHERE last_post_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate analytics
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS void AS $$
DECLARE
  current_date date := CURRENT_DATE;
BEGIN
  -- Insert or update daily analytics for each campaign
  INSERT INTO analytics_daily (
    date,
    user_id,
    campaign_id,
    targets_discovered,
    forms_detected,
    forms_vetted,
    posts_attempted,
    posts_successful,
    posts_failed,
    captcha_encounters,
    avg_confidence_score,
    unique_domains,
    items_reviewed,
    approval_rate
  )
  SELECT
    current_date,
    bc.user_id,
    bc.id,
    COALESCE(target_stats.discovered, 0),
    COALESCE(form_stats.detected, 0),
    COALESCE(form_stats.vetted, 0),
    COALESCE(post_stats.attempted, 0),
    COALESCE(post_stats.successful, 0),
    COALESCE(post_stats.failed, 0),
    COALESCE(post_stats.captcha, 0),
    COALESCE(form_stats.avg_confidence, 0),
    COALESCE(post_stats.unique_domains, 0),
    COALESCE(review_stats.reviewed, 0),
    COALESCE(review_stats.approval_rate, 0)
  FROM blog_campaigns bc
  LEFT JOIN (
    SELECT 
      COUNT(*) as discovered
    FROM crawler_targets
    WHERE DATE(discovered_at) = current_date
  ) target_stats ON true
  LEFT JOIN (
    SELECT
      COUNT(*) as detected,
      COUNT(*) FILTER (WHERE status = 'vetted') as vetted,
      AVG(confidence) as avg_confidence
    FROM form_maps
    WHERE DATE(created_at) = current_date
  ) form_stats ON true
  LEFT JOIN (
    SELECT
      bp.campaign_id,
      COUNT(*) as attempted,
      COUNT(*) FILTER (WHERE status = 'posted') as successful,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      COUNT(*) FILTER (WHERE status = 'captcha') as captcha,
      COUNT(DISTINCT split_part(split_part(target_url, '://', 2), '/', 1)) as unique_domains
    FROM blog_posts bp
    WHERE DATE(created_at) = current_date
    GROUP BY campaign_id
  ) post_stats ON post_stats.campaign_id = bc.id
  LEFT JOIN (
    SELECT
      COUNT(*) as reviewed,
      AVG(CASE WHEN action = 'approved' THEN 100 ELSE 0 END) as approval_rate
    FROM review_logs
    WHERE DATE(reviewed_at) = current_date
  ) review_stats ON true
  ON CONFLICT (date, user_id, campaign_id) DO UPDATE SET
    targets_discovered = EXCLUDED.targets_discovered,
    forms_detected = EXCLUDED.forms_detected,
    forms_vetted = EXCLUDED.forms_vetted,
    posts_attempted = EXCLUDED.posts_attempted,
    posts_successful = EXCLUDED.posts_successful,
    posts_failed = EXCLUDED.posts_failed,
    captcha_encounters = EXCLUDED.captcha_encounters,
    avg_confidence_score = EXCLUDED.avg_confidence_score,
    unique_domains = EXCLUDED.unique_domains,
    items_reviewed = EXCLUDED.items_reviewed,
    approval_rate = EXCLUDED.approval_rate;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get comprehensive crawler statistics
CREATE OR REPLACE FUNCTION get_crawler_stats()
RETURNS TABLE(
  total_targets bigint,
  total_forms bigint,
  vetted_forms bigint,
  pending_reviews bigint,
  successful_posts bigint,
  failed_posts bigint,
  captcha_encounters bigint,
  avg_confidence numeric,
  success_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM crawler_targets)::bigint,
    (SELECT COUNT(*) FROM form_maps)::bigint,
    (SELECT COUNT(*) FROM form_maps WHERE status = 'vetted')::bigint,
    (SELECT COUNT(*) FROM form_maps WHERE needs_human_review = true)::bigint,
    (SELECT COUNT(*) FROM blog_posts WHERE status = 'posted')::bigint,
    (SELECT COUNT(*) FROM blog_posts WHERE status = 'failed')::bigint,
    (SELECT COUNT(*) FROM blog_posts WHERE status = 'captcha')::bigint,
    (SELECT COALESCE(AVG(confidence), 0) FROM form_maps),
    (SELECT CASE 
      WHEN COUNT(*) = 0 THEN 0 
      ELSE ROUND((COUNT(*) FILTER (WHERE status = 'posted') * 100.0 / COUNT(*)), 2) 
    END FROM blog_posts WHERE status IN ('posted', 'failed'));
END;
$$ LANGUAGE plpgsql;

-- Function to get top-performing domains
CREATE OR REPLACE FUNCTION get_top_domains(limit_count integer DEFAULT 10)
RETURNS TABLE(
  domain text,
  success_rate numeric,
  total_attempts integer,
  successful_posts integer,
  health_score integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dh.domain,
    dh.success_rate,
    dh.total_attempts,
    dh.successful_posts,
    dh.health_score
  FROM domain_health dh
  WHERE dh.is_blocked = false AND dh.total_attempts >= 3
  ORDER BY dh.success_rate DESC, dh.successful_posts DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get campaign performance
CREATE OR REPLACE FUNCTION get_campaign_performance(campaign_uuid uuid)
RETURNS TABLE(
  campaign_name text,
  total_targets bigint,
  total_forms bigint,
  total_posts bigint,
  successful_posts bigint,
  success_rate numeric,
  avg_post_time interval,
  top_domains text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bc.name,
    (SELECT COUNT(*) FROM crawler_targets ct 
     JOIN form_maps fm ON ct.id = fm.target_id 
     JOIN blog_posts bp ON fm.id = bp.form_id 
     WHERE bp.campaign_id = campaign_uuid)::bigint,
    (SELECT COUNT(*) FROM form_maps fm 
     JOIN blog_posts bp ON fm.id = bp.form_id 
     WHERE bp.campaign_id = campaign_uuid)::bigint,
    (SELECT COUNT(*) FROM blog_posts WHERE campaign_id = campaign_uuid)::bigint,
    (SELECT COUNT(*) FROM blog_posts WHERE campaign_id = campaign_uuid AND status = 'posted')::bigint,
    (SELECT CASE 
      WHEN COUNT(*) = 0 THEN 0 
      ELSE ROUND((COUNT(*) FILTER (WHERE status = 'posted') * 100.0 / COUNT(*)), 2) 
    END FROM blog_posts WHERE campaign_id = campaign_uuid),
    (SELECT AVG(posted_at - created_at) FROM blog_posts 
     WHERE campaign_id = campaign_uuid AND status = 'posted'),
    (SELECT ARRAY_AGG(DISTINCT split_part(split_part(target_url, '://', 2), '/', 1)) 
     FROM blog_posts WHERE campaign_id = campaign_uuid AND status = 'posted' LIMIT 10)
  FROM blog_campaigns bc
  WHERE bc.id = campaign_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep integer DEFAULT 90)
RETURNS void AS $$
BEGIN
  -- Clean up old successful posts (keep failures for analysis)
  DELETE FROM blog_posts 
  WHERE status = 'posted' 
    AND created_at < now() - (days_to_keep || ' days')::interval;
  
  -- Clean up old completed jobs
  DELETE FROM automation_jobs 
  WHERE status IN ('completed', 'failed') 
    AND completed_at < now() - (days_to_keep || ' days')::interval;
  
  -- Clean up old crawler queue items
  DELETE FROM crawler_queue 
  WHERE status IN ('completed', 'failed') 
    AND completed_at < now() - (days_to_keep || ' days')::interval;
  
  -- Clean up old analytics (keep yearly summaries)
  DELETE FROM analytics_daily 
  WHERE date < now() - (days_to_keep || ' days')::interval;
  
  -- Vacuum tables for performance
  PERFORM pg_stat_reset();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA SETUP
-- ============================================================================

-- Insert default content templates
INSERT INTO content_templates (name, template_text, category, variables, tone, length) VALUES
('Professional Insight', 'Great insights about {keyword}! This really helped clarify some concepts I was working on. Thanks for sharing this perspective.', 'professional', ARRAY['keyword'], 'professional', 'medium'),
('Casual Thanks', 'Thanks for this helpful post about {keyword}. Exactly what I was looking for!', 'casual', ARRAY['keyword'], 'casual', 'short'),
('Expert Commentary', 'Excellent breakdown of {keyword}. As someone working in this field, I appreciate the practical examples and real-world applications you mentioned.', 'expert', ARRAY['keyword'], 'expert', 'long'),
('Enthusiastic Response', 'This is amazing! Your explanation of {keyword} is so clear and actionable. Definitely bookmarking this for future reference.', 'enthusiastic', ARRAY['keyword'], 'enthusiastic', 'medium'),
('Question Follow-up', 'Great article on {keyword}! Have you considered writing a follow-up covering {related_topic}? Would love to see your take on that.', 'friendly', ARRAY['keyword', 'related_topic'], 'friendly', 'medium')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all tables were created successfully
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'blog_campaigns', 'crawler_targets', 'form_maps', 'blog_accounts', 
    'automation_jobs', 'blog_posts', 'crawler_queue', 'domain_health',
    'content_templates', 'review_logs', 'analytics_daily', 'keyword_research'
  )
ORDER BY table_name;

-- Verify all indexes were created
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename LIKE 'blog_%' 
  OR tablename LIKE 'crawler_%'
  OR tablename LIKE 'form_%'
  OR tablename LIKE 'automation_%'
  OR tablename LIKE 'domain_%'
ORDER BY tablename, indexname;

-- Test basic functionality
SELECT 'Enhanced Blog Comment Automation Schema installed successfully!' as status;

-- Display summary
SELECT 
  'Total Tables: ' || COUNT(*) as summary
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'blog_campaigns', 'crawler_targets', 'form_maps', 'blog_accounts', 
    'automation_jobs', 'blog_posts', 'crawler_queue', 'domain_health',
    'content_templates', 'review_logs', 'analytics_daily', 'keyword_research'
  );
