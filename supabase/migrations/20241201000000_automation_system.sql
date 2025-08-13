-- Blog Comment Automation System Database Schema
-- This creates all the necessary tables for the working automation system

-- Blog campaigns table
CREATE TABLE IF NOT EXISTS blog_campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  target_url text not null,
  keyword text not null,
  anchor_text text,
  status text not null default 'paused' check (status in ('active', 'paused', 'completed')),
  automation_enabled boolean default false,
  max_posts_per_domain integer default 1,
  links_found integer default 0,
  links_posted integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Blog targets discovered by crawler
CREATE TABLE IF NOT EXISTS blog_targets (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references blog_campaigns(id) on delete cascade,
  url text not null,
  domain text not null,
  title text,
  has_comment_form boolean default false,
  form_selector text,
  confidence_score integer default 0,
  discovered_at timestamptz default now(),
  status text default 'discovered' check (status in ('discovered', 'analyzed', 'validated', 'posted', 'failed')),
  UNIQUE(campaign_id, url)
);

-- Comment forms detected and validated
CREATE TABLE IF NOT EXISTS comment_forms (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references blog_campaigns(id) on delete cascade,
  url text not null,
  domain text not null,
  platform text default 'unknown',
  form_selector text not null,
  form_action text,
  form_method text default 'POST',
  field_mappings jsonb not null default '{}',
  hidden_fields jsonb not null default '{}',
  submit_selector text,
  confidence_score integer not null default 0,
  requires_captcha boolean default false,
  page_title text,
  detected_at timestamptz default now(),
  status text default 'detected' check (status in ('detected', 'validated', 'blocked', 'needs_review')),
  last_posted_at timestamptz,
  UNIQUE(url)
);

-- Posting accounts for automation
CREATE TABLE IF NOT EXISTS posting_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  website text,
  platform text default 'generic',
  is_active boolean default true,
  health_score integer default 100,
  last_used timestamptz,
  created_at timestamptz default now(),
  UNIQUE(user_id, email)
);

-- Posting results and tracking
CREATE TABLE IF NOT EXISTS posting_results (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references blog_campaigns(id) on delete cascade,
  form_id uuid references comment_forms(id),
  account_id uuid references posting_accounts(id),
  target_url text not null,
  comment_content text not null,
  status text not null check (status in ('posted', 'failed', 'pending', 'captcha', 'moderation')),
  error_message text,
  response_data text,
  screenshot_url text,
  live_url text,
  posted_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Automation jobs queue
CREATE TABLE IF NOT EXISTS automation_jobs (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references blog_campaigns(id) on delete cascade,
  job_type text not null check (job_type in ('discover', 'detect', 'post', 'validate')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  payload jsonb,
  result jsonb,
  progress integer default 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS
ALTER TABLE blog_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own campaigns" ON blog_campaigns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view targets for their campaigns" ON blog_targets
  FOR ALL USING (EXISTS (
    SELECT 1 FROM blog_campaigns
    WHERE blog_campaigns.id = blog_targets.campaign_id
    AND blog_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can view forms for their campaigns" ON comment_forms
  FOR ALL USING (EXISTS (
    SELECT 1 FROM blog_campaigns
    WHERE blog_campaigns.id = comment_forms.campaign_id
    AND blog_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their own posting accounts" ON posting_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view results for their campaigns" ON posting_results
  FOR ALL USING (EXISTS (
    SELECT 1 FROM blog_campaigns
    WHERE blog_campaigns.id = posting_results.campaign_id
    AND blog_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can view jobs for their campaigns" ON automation_jobs
  FOR ALL USING (EXISTS (
    SELECT 1 FROM blog_campaigns
    WHERE blog_campaigns.id = automation_jobs.campaign_id
    AND blog_campaigns.user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_blog_campaigns_user_id ON blog_campaigns(user_id);
CREATE INDEX idx_blog_campaigns_status ON blog_campaigns(status);

CREATE INDEX idx_blog_targets_campaign_id ON blog_targets(campaign_id);
CREATE INDEX idx_blog_targets_domain ON blog_targets(domain);
CREATE INDEX idx_blog_targets_status ON blog_targets(status);

CREATE INDEX idx_comment_forms_campaign_id ON comment_forms(campaign_id);
CREATE INDEX idx_comment_forms_domain ON comment_forms(domain);
CREATE INDEX idx_comment_forms_status ON comment_forms(status);
CREATE INDEX idx_comment_forms_confidence ON comment_forms(confidence_score);

CREATE INDEX idx_posting_accounts_user_id ON posting_accounts(user_id);
CREATE INDEX idx_posting_accounts_active ON posting_accounts(is_active);

CREATE INDEX idx_posting_results_campaign_id ON posting_results(campaign_id);
CREATE INDEX idx_posting_results_status ON posting_results(status);
CREATE INDEX idx_posting_results_posted_at ON posting_results(posted_at);

CREATE INDEX idx_automation_jobs_campaign_id ON automation_jobs(campaign_id);
CREATE INDEX idx_automation_jobs_status ON automation_jobs(status);
CREATE INDEX idx_automation_jobs_created_at ON automation_jobs(created_at);

-- Function to increment campaign post count
CREATE OR REPLACE FUNCTION increment_campaign_posts(campaign_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE blog_campaigns
  SET links_posted = links_posted + 1,
      updated_at = now()
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('automation-assets', 'automation-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for automation assets
CREATE POLICY "Public read access for automation assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'automation-assets');

CREATE POLICY "Authenticated users can upload automation assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'automation-assets' AND auth.role() = 'authenticated');
