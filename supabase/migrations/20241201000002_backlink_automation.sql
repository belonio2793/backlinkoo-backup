-- General Backlink Automation System Database Schema
-- This creates tables for multi-platform backlink automation

-- Backlink campaigns table (general for all platforms)
CREATE TABLE IF NOT EXISTS backlink_campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  target_url text not null,
  keyword text not null,
  anchor_text text not null,
  target_platform text not null, -- 'substack', 'medium', 'reddit', etc.
  status text not null default 'paused' check (status in ('active', 'paused', 'completed')),
  links_found integer default 0,
  links_posted integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Backlink posts where comments/links were posted
CREATE TABLE IF NOT EXISTS backlink_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  campaign_id uuid references backlink_campaigns(id) on delete cascade,
  target_platform text not null,
  post_url text not null,
  live_url text,
  comment_content text not null,
  domain text not null,
  post_title text,
  status text not null check (status in ('posted', 'failed', 'pending')),
  posted_at timestamptz default now(),
  created_at timestamptz default now(),
  UNIQUE(campaign_id, post_url)
);

-- Platform targets and domains we've discovered
CREATE TABLE IF NOT EXISTS platform_domains (
  id uuid default gen_random_uuid() primary key,
  platform text not null, -- 'substack', 'medium', etc.
  domain text not null,
  name text not null,
  description text,
  post_count integer default 0,
  success_rate numeric(5,2) default 100.00,
  last_posted_at timestamptz,
  added_at timestamptz default now(),
  is_active boolean default true,
  UNIQUE(platform, domain)
);

-- Automation sessions for tracking progress
CREATE TABLE IF NOT EXISTS automation_sessions (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references backlink_campaigns(id) on delete cascade,
  platform text not null,
  status text not null default 'running' check (status in ('running', 'completed', 'failed', 'paused')),
  progress integer default 0,
  current_step text,
  results jsonb,
  error_message text,
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- AI-generated content log for tracking what we've generated
CREATE TABLE IF NOT EXISTS ai_content_log (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references backlink_campaigns(id) on delete cascade,
  prompt_used text not null,
  generated_content text not null,
  keyword text not null,
  anchor_text text not null,
  target_url text not null,
  platform text not null,
  created_at timestamptz default now()
);

-- Enable RLS
ALTER TABLE backlink_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlink_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_content_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for backlink_campaigns
CREATE POLICY "Users can manage their own campaigns" ON backlink_campaigns
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for backlink_posts
CREATE POLICY "Users can manage their own posts" ON backlink_posts
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for platform_domains (readable by all, writable by system)
CREATE POLICY "Users can view domains" ON platform_domains
  FOR SELECT USING (true);

CREATE POLICY "System can manage domains" ON platform_domains
  FOR ALL USING (true);

-- RLS Policies for automation_sessions
CREATE POLICY "Users can view sessions for their campaigns" ON automation_sessions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM backlink_campaigns
    WHERE backlink_campaigns.id = automation_sessions.campaign_id
    AND backlink_campaigns.user_id = auth.uid()
  ));

-- RLS Policies for ai_content_log
CREATE POLICY "Users can view their own AI content" ON ai_content_log
  FOR ALL USING (EXISTS (
    SELECT 1 FROM backlink_campaigns
    WHERE backlink_campaigns.id = ai_content_log.campaign_id
    AND backlink_campaigns.user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_backlink_campaigns_user_id ON backlink_campaigns(user_id);
CREATE INDEX idx_backlink_campaigns_status ON backlink_campaigns(status);
CREATE INDEX idx_backlink_campaigns_platform ON backlink_campaigns(target_platform);

CREATE INDEX idx_backlink_posts_user_id ON backlink_posts(user_id);
CREATE INDEX idx_backlink_posts_campaign_id ON backlink_posts(campaign_id);
CREATE INDEX idx_backlink_posts_platform ON backlink_posts(target_platform);
CREATE INDEX idx_backlink_posts_domain ON backlink_posts(domain);
CREATE INDEX idx_backlink_posts_status ON backlink_posts(status);

CREATE INDEX idx_platform_domains_platform ON platform_domains(platform);
CREATE INDEX idx_platform_domains_active ON platform_domains(is_active);
CREATE INDEX idx_platform_domains_success_rate ON platform_domains(success_rate);

CREATE INDEX idx_automation_sessions_campaign_id ON automation_sessions(campaign_id);
CREATE INDEX idx_automation_sessions_status ON automation_sessions(status);
CREATE INDEX idx_automation_sessions_platform ON automation_sessions(platform);

CREATE INDEX idx_ai_content_log_campaign_id ON ai_content_log(campaign_id);
CREATE INDEX idx_ai_content_log_platform ON ai_content_log(platform);
CREATE INDEX idx_ai_content_log_created_at ON ai_content_log(created_at);

-- Function to update campaign stats when posts are added
CREATE OR REPLACE FUNCTION update_backlink_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update campaign statistics when posts are updated
  UPDATE backlink_campaigns
  SET
    links_posted = (
      SELECT COUNT(*) FROM backlink_posts
      WHERE campaign_id = NEW.campaign_id AND status = 'posted'
    ),
    updated_at = now()
  WHERE id = NEW.campaign_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_backlink_campaign_stats_trigger
  AFTER INSERT OR UPDATE ON backlink_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_backlink_campaign_stats();

-- Function to update platform domain stats when posts are added
CREATE OR REPLACE FUNCTION update_platform_domain_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert domain stats
  INSERT INTO platform_domains (platform, domain, name, post_count, last_posted_at)
  VALUES (
    NEW.target_platform,
    NEW.domain,
    CASE 
      WHEN NEW.target_platform = 'substack' AND NEW.domain LIKE '%.substack.com' 
      THEN REPLACE(NEW.domain, '.substack.com', '')
      ELSE NEW.domain
    END,
    1,
    CASE WHEN NEW.status = 'posted' THEN now() ELSE NULL END
  )
  ON CONFLICT (platform, domain) DO UPDATE SET
    post_count = platform_domains.post_count + 1,
    last_posted_at = CASE WHEN NEW.status = 'posted' THEN now() ELSE platform_domains.last_posted_at END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_platform_domain_stats_trigger
  AFTER INSERT ON backlink_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_domain_stats();

-- Insert some sample platform domains to get started
INSERT INTO platform_domains (platform, domain, name, description, post_count) VALUES
  ('substack', 'techcrunch.substack.com', 'TechCrunch', 'Technology news and analysis', 0),
  ('substack', 'thehustle.substack.com', 'The Hustle', 'Business and entrepreneurship', 0),
  ('substack', 'morningbrew.substack.com', 'Morning Brew', 'Business news digest', 0),
  ('substack', 'platformer.substack.com', 'Platformer', 'Technology and social media analysis', 0),
  ('substack', 'stratechery.substack.com', 'Stratechery', 'Technology strategy and analysis', 0),
  ('medium', 'towardsdatascience.com', 'Towards Data Science', 'Data science and analytics', 0),
  ('medium', 'uxdesign.cc', 'UX Design', 'User experience design', 0),
  ('medium', 'freecodecamp.org', 'freeCodeCamp', 'Programming and development', 0)
ON CONFLICT (platform, domain) DO NOTHING;
