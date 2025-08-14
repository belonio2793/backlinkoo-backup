-- Create automation schema for link building campaigns
-- Migration: Create automation tables
-- Created: 2025-01-30

-- Campaigns table
CREATE TABLE IF NOT EXISTS automation_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_url TEXT NOT NULL,
  keyword TEXT NOT NULL,
  anchor_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'publishing', 'completed', 'paused', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Generated content table
CREATE TABLE IF NOT EXISTS automation_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE NOT NULL,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('article', 'blog_post', 'reader_friendly')),
  content TEXT NOT NULL,
  word_count INTEGER,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Published links table
CREATE TABLE IF NOT EXISTS automation_published_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES automation_content(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL DEFAULT 'telegraph',
  published_url TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign logs table for tracking progress
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE NOT NULL,
  log_level TEXT NOT NULL DEFAULT 'info' CHECK (log_level IN ('info', 'warning', 'error')),
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_user_id ON automation_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_status ON automation_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_created_at ON automation_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_content_campaign_id ON automation_content(campaign_id);
CREATE INDEX IF NOT EXISTS idx_automation_published_links_campaign_id ON automation_published_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_campaign_id ON automation_logs(campaign_id);

-- Enable RLS
ALTER TABLE automation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_published_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Campaigns: Users can only see their own campaigns
CREATE POLICY "Users can view their own campaigns" ON automation_campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" ON automation_campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON automation_campaigns
  FOR UPDATE USING (auth.uid() = user_id);

-- Content: Users can only see content for their campaigns
CREATE POLICY "Users can view content for their campaigns" ON automation_content
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM automation_campaigns 
      WHERE automation_campaigns.id = automation_content.campaign_id 
      AND automation_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create content" ON automation_content
  FOR INSERT WITH CHECK (true);

-- Published links: Users can only see links for their campaigns
CREATE POLICY "Users can view published links for their campaigns" ON automation_published_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM automation_campaigns 
      WHERE automation_campaigns.id = automation_published_links.campaign_id 
      AND automation_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create published links" ON automation_published_links
  FOR INSERT WITH CHECK (true);

-- Logs: Users can only see logs for their campaigns
CREATE POLICY "Users can view logs for their campaigns" ON automation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM automation_campaigns 
      WHERE automation_campaigns.id = automation_logs.campaign_id 
      AND automation_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create logs" ON automation_logs
  FOR INSERT WITH CHECK (true);

-- Function to update campaign status and timestamp
CREATE OR REPLACE FUNCTION update_campaign_status(
  campaign_uuid UUID,
  new_status TEXT,
  error_msg TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE automation_campaigns 
  SET 
    status = new_status,
    updated_at = NOW(),
    completed_at = CASE WHEN new_status = 'completed' THEN NOW() ELSE completed_at END,
    error_message = error_msg
  WHERE id = campaign_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to log campaign activity
CREATE OR REPLACE FUNCTION log_campaign_activity(
  campaign_uuid UUID,
  level TEXT,
  msg TEXT,
  detail_data JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO automation_logs (campaign_id, log_level, message, details)
  VALUES (campaign_uuid, level, msg, detail_data);
END;
$$ LANGUAGE plpgsql;

-- Function to get campaign summary
CREATE OR REPLACE FUNCTION get_campaign_summary(campaign_uuid UUID)
RETURNS TABLE (
  campaign_id UUID,
  target_url TEXT,
  keyword TEXT,
  anchor_text TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  content_count BIGINT,
  published_count BIGINT,
  published_urls TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.target_url,
    c.keyword,
    c.anchor_text,
    c.status,
    c.created_at,
    COALESCE(content_stats.count, 0) as content_count,
    COALESCE(published_stats.count, 0) as published_count,
    COALESCE(published_stats.urls, ARRAY[]::TEXT[]) as published_urls
  FROM automation_campaigns c
  LEFT JOIN (
    SELECT campaign_id, COUNT(*) as count
    FROM automation_content
    GROUP BY campaign_id
  ) content_stats ON c.id = content_stats.campaign_id
  LEFT JOIN (
    SELECT campaign_id, COUNT(*) as count, ARRAY_AGG(published_url) as urls
    FROM automation_published_links
    GROUP BY campaign_id
  ) published_stats ON c.id = published_stats.campaign_id
  WHERE c.id = campaign_uuid;
END;
$$ LANGUAGE plpgsql;

COMMIT;
