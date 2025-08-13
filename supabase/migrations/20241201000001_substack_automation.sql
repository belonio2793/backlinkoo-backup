-- Substack Automation System Database Schema
-- This creates all the necessary tables for the Substack-focused automation

-- Substack campaigns table
CREATE TABLE IF NOT EXISTS substack_campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  target_url text not null,
  keyword text not null,
  status text not null default 'paused' check (status in ('active', 'paused', 'completed')),
  posts_found integer default 0,
  comments_posted integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Substack posts where comments were made
CREATE TABLE IF NOT EXISTS substack_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  campaign_id uuid references substack_campaigns(id) on delete cascade,
  substack_post_url text not null,
  comment_url text,
  comment_content text not null,
  substack_domain text not null,
  substack_title text,
  status text not null check (status in ('posted', 'failed', 'pending')),
  posted_at timestamptz default now(),
  created_at timestamptz default now(),
  UNIQUE(campaign_id, substack_post_url)
);

-- Substack domains we've discovered and can post to
CREATE TABLE IF NOT EXISTS substack_domains (
  id uuid default gen_random_uuid() primary key,
  domain text unique not null,
  name text not null,
  description text,
  post_count integer default 0,
  success_rate numeric(5,2) default 100.00,
  last_posted_at timestamptz,
  added_at timestamptz default now(),
  is_active boolean default true
);

-- Substack automation sessions (for tracking progress)
CREATE TABLE IF NOT EXISTS substack_sessions (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references substack_campaigns(id) on delete cascade,
  status text not null default 'running' check (status in ('running', 'completed', 'failed', 'paused')),
  progress integer default 0,
  current_step text,
  results jsonb,
  error_message text,
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE substack_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE substack_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE substack_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE substack_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for substack_campaigns
CREATE POLICY "Users can manage their own campaigns" ON substack_campaigns
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for substack_posts
CREATE POLICY "Users can manage their own posts" ON substack_posts
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for substack_domains (readable by all, writable by system)
CREATE POLICY "Users can view domains" ON substack_domains
  FOR SELECT USING (true);

CREATE POLICY "System can manage domains" ON substack_domains
  FOR ALL USING (true);

-- RLS Policies for substack_sessions
CREATE POLICY "Users can view sessions for their campaigns" ON substack_sessions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM substack_campaigns
    WHERE substack_campaigns.id = substack_sessions.campaign_id
    AND substack_campaigns.user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_substack_campaigns_user_id ON substack_campaigns(user_id);
CREATE INDEX idx_substack_campaigns_status ON substack_campaigns(status);

CREATE INDEX idx_substack_posts_user_id ON substack_posts(user_id);
CREATE INDEX idx_substack_posts_campaign_id ON substack_posts(campaign_id);
CREATE INDEX idx_substack_posts_domain ON substack_posts(substack_domain);
CREATE INDEX idx_substack_posts_status ON substack_posts(status);

CREATE INDEX idx_substack_domains_domain ON substack_domains(domain);
CREATE INDEX idx_substack_domains_active ON substack_domains(is_active);
CREATE INDEX idx_substack_domains_success_rate ON substack_domains(success_rate);

CREATE INDEX idx_substack_sessions_campaign_id ON substack_sessions(campaign_id);
CREATE INDEX idx_substack_sessions_status ON substack_sessions(status);

-- Function to update campaign stats when posts are added
CREATE OR REPLACE FUNCTION update_substack_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update campaign statistics when posts are updated
  UPDATE substack_campaigns
  SET
    comments_posted = (
      SELECT COUNT(*) FROM substack_posts
      WHERE campaign_id = NEW.campaign_id AND status = 'posted'
    ),
    updated_at = now()
  WHERE id = NEW.campaign_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_substack_campaign_stats_trigger
  AFTER INSERT OR UPDATE ON substack_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_substack_campaign_stats();

-- Function to update domain stats when posts are added
CREATE OR REPLACE FUNCTION update_substack_domain_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert domain stats
  INSERT INTO substack_domains (domain, name, post_count, last_posted_at)
  VALUES (
    NEW.substack_domain,
    CASE 
      WHEN NEW.substack_domain LIKE '%.substack.com' 
      THEN REPLACE(NEW.substack_domain, '.substack.com', '')
      ELSE NEW.substack_domain
    END,
    1,
    CASE WHEN NEW.status = 'posted' THEN now() ELSE NULL END
  )
  ON CONFLICT (domain) DO UPDATE SET
    post_count = substack_domains.post_count + 1,
    last_posted_at = CASE WHEN NEW.status = 'posted' THEN now() ELSE substack_domains.last_posted_at END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_substack_domain_stats_trigger
  AFTER INSERT ON substack_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_substack_domain_stats();

-- Insert some sample Substack domains to get started
INSERT INTO substack_domains (domain, name, description, post_count) VALUES
  ('techcrunch.substack.com', 'TechCrunch', 'Technology news and analysis', 0),
  ('thehustle.substack.com', 'The Hustle', 'Business and entrepreneurship', 0),
  ('morningbrew.substack.com', 'Morning Brew', 'Business news digest', 0),
  ('platformer.substack.com', 'Platformer', 'Technology and social media analysis', 0),
  ('stratechery.substack.com', 'Stratechery', 'Technology strategy and analysis', 0)
ON CONFLICT (domain) DO NOTHING;
