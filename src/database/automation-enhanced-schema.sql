-- Enhanced Automation Database Schema
-- Includes campaigns, target sites, and logging tables

-- =====================================================
-- AUTOMATION CAMPAIGNS TABLE (Updated)
-- =====================================================
CREATE TABLE IF NOT EXISTS automation_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  anchor_texts TEXT[] NOT NULL DEFAULT '{}',
  target_url TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  links_built INTEGER DEFAULT 0,
  available_sites INTEGER DEFAULT 0,
  target_sites_used TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- TARGET SITES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS target_sites (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('blog', 'forum', 'guest_post', 'directory', 'social')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked', 'testing')),
  domain_rating INTEGER,
  last_used TIMESTAMPTZ,
  success_rate INTEGER DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 100),
  total_attempts INTEGER DEFAULT 0,
  successful_submissions INTEGER DEFAULT 0,
  requirements JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUTOMATION LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
  category TEXT NOT NULL CHECK (category IN ('campaign', 'url_discovery', 'article_submission', 'system', 'database', 'api')),
  message TEXT NOT NULL,
  data JSONB,
  campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_stack TEXT,
  session_id TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('development', 'production'))
);

-- =====================================================
-- ARTICLE SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS article_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES automation_campaigns(id) ON DELETE CASCADE,
  target_site_id TEXT NOT NULL REFERENCES target_sites(id) ON DELETE CASCADE,
  article_title TEXT,
  article_content TEXT,
  article_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'published', 'rejected', 'failed')),
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  published_date TIMESTAMPTZ,
  backlink_url TEXT,
  anchor_text TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_automation_campaigns_updated_at ON automation_campaigns;
CREATE TRIGGER update_automation_campaigns_updated_at
    BEFORE UPDATE ON automation_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_target_sites_updated_at ON target_sites;
CREATE TRIGGER update_target_sites_updated_at
    BEFORE UPDATE ON target_sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE automation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own campaigns" ON automation_campaigns;
DROP POLICY IF EXISTS "Users can create their own campaigns" ON automation_campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON automation_campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON automation_campaigns;

DROP POLICY IF EXISTS "Anyone can view target sites" ON target_sites;
DROP POLICY IF EXISTS "Service role can manage target sites" ON target_sites;

DROP POLICY IF EXISTS "Users can view their own logs" ON automation_logs;
DROP POLICY IF EXISTS "Service role can manage logs" ON automation_logs;

DROP POLICY IF EXISTS "Users can view their own submissions" ON article_submissions;
DROP POLICY IF EXISTS "Users can create their own submissions" ON article_submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON article_submissions;

-- Campaign policies
CREATE POLICY "Users can view their own campaigns" ON automation_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" ON automation_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON automation_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON automation_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Target sites policies (readable by all, manageable by service role)
CREATE POLICY "Anyone can view active target sites" ON target_sites
    FOR SELECT USING (status = 'active');

CREATE POLICY "Service role can manage target sites" ON target_sites
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Logs policies (users can view their own, service role can manage all)
CREATE POLICY "Users can view their own logs" ON automation_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage logs" ON automation_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Article submissions policies
CREATE POLICY "Users can view their own submissions" ON article_submissions
    FOR SELECT USING (auth.uid() IN (
        SELECT user_id FROM automation_campaigns WHERE id = campaign_id
    ));

CREATE POLICY "Users can create submissions for their campaigns" ON article_submissions
    FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT user_id FROM automation_campaigns WHERE id = campaign_id
    ));

CREATE POLICY "Users can update their own submissions" ON article_submissions
    FOR UPDATE USING (auth.uid() IN (
        SELECT user_id FROM automation_campaigns WHERE id = campaign_id
    ));

-- =====================================================
-- INDEXES
-- =====================================================

-- Campaign indexes
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_user_id ON automation_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_status ON automation_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_created_at ON automation_campaigns(created_at DESC);

-- Target sites indexes
CREATE INDEX IF NOT EXISTS idx_target_sites_domain ON target_sites(domain);
CREATE INDEX IF NOT EXISTS idx_target_sites_status ON target_sites(status);
CREATE INDEX IF NOT EXISTS idx_target_sites_type ON target_sites(type);
CREATE INDEX IF NOT EXISTS idx_target_sites_success_rate ON target_sites(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_target_sites_domain_rating ON target_sites(domain_rating DESC);

-- Logs indexes
CREATE INDEX IF NOT EXISTS idx_automation_logs_timestamp ON automation_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_automation_logs_level ON automation_logs(level);
CREATE INDEX IF NOT EXISTS idx_automation_logs_category ON automation_logs(category);
CREATE INDEX IF NOT EXISTS idx_automation_logs_campaign_id ON automation_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_user_id ON automation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_session_id ON automation_logs(session_id);

-- Article submissions indexes
CREATE INDEX IF NOT EXISTS idx_article_submissions_campaign_id ON article_submissions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_article_submissions_target_site_id ON article_submissions(target_site_id);
CREATE INDEX IF NOT EXISTS idx_article_submissions_status ON article_submissions(status);
CREATE INDEX IF NOT EXISTS idx_article_submissions_submission_date ON article_submissions(submission_date DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get campaign statistics
CREATE OR REPLACE FUNCTION get_campaign_stats(campaign_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_submissions', COUNT(*),
        'published', COUNT(*) FILTER (WHERE status = 'published'),
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
        'success_rate', CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE status = 'published')::FLOAT / COUNT(*)) * 100, 2)
            ELSE 0 
        END
    ) INTO result
    FROM article_submissions
    WHERE campaign_id = campaign_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update target site stats
CREATE OR REPLACE FUNCTION update_target_site_stats(site_text_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE target_sites SET
        total_attempts = (
            SELECT COUNT(*) FROM article_submissions 
            WHERE target_site_id = site_text_id
        ),
        successful_submissions = (
            SELECT COUNT(*) FROM article_submissions 
            WHERE target_site_id = site_text_id AND status = 'published'
        )
    WHERE id = site_text_id;
    
    -- Update success rate
    UPDATE target_sites SET
        success_rate = CASE 
            WHEN total_attempts > 0 THEN 
                ROUND((successful_submissions::FLOAT / total_attempts) * 100)
            ELSE 0 
        END
    WHERE id = site_text_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SAMPLE DATA (for development/testing)
-- =====================================================

-- Insert default target sites if table is empty
INSERT INTO target_sites (id, domain, url, type, status, domain_rating, success_rate, requirements, metadata)
SELECT * FROM (VALUES
    ('site_medium', 'medium.com', 'https://medium.com', 'blog', 'active', 96, 85, 
     '{"min_word_count": 300, "topics": ["technology", "business", "marketing"], "approval_process": false, "registration_required": true}',
     '{"submission_guidelines": "Submit via Medium Partner Program", "response_time_hours": 24, "notes": "High-quality content required"}'),
    ('site_dev_to', 'dev.to', 'https://dev.to', 'blog', 'active', 89, 90,
     '{"min_word_count": 250, "topics": ["programming", "web development", "technology"], "approval_process": false, "registration_required": true}',
     '{"submission_guidelines": "Tech-focused content only", "response_time_hours": 2, "notes": "Developer community"}'),
    ('site_hashnode', 'hashnode.com', 'https://hashnode.com', 'blog', 'active', 82, 88,
     '{"min_word_count": 400, "topics": ["blockchain", "web3", "programming"], "approval_process": false, "registration_required": true}',
     '{"submission_guidelines": "Developer-focused content", "response_time_hours": 4, "notes": "Blockchain and web dev community"}'),
    ('site_substack', 'substack.com', 'https://substack.com', 'blog', 'active', 91, 75,
     '{"min_word_count": 500, "topics": ["business", "finance", "politics", "culture"], "approval_process": true, "registration_required": true}',
     '{"submission_guidelines": "Newsletter-style content", "response_time_hours": 72, "notes": "Requires newsletter format"}'),
    ('site_hackernoon', 'hackernoon.com', 'https://hackernoon.com', 'blog', 'active', 84, 70,
     '{"min_word_count": 600, "topics": ["technology", "startups", "programming"], "approval_process": true, "registration_required": true}',
     '{"submission_guidelines": "Submit via their contributor program", "response_time_hours": 120, "notes": "Editorial review required"}')
) AS v(id, domain, url, type, status, domain_rating, success_rate, requirements, metadata)
WHERE NOT EXISTS (SELECT 1 FROM target_sites LIMIT 1);
