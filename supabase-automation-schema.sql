-- ========================================
-- AUTOMATION SERVICE SCHEMA - Completely Separate from Blog Service
-- Copy and paste this entire script into Supabase SQL Editor
-- ========================================

-- IMPORTANT: This is for the /automation service only
-- The /blog service uses different tables (blog_posts, published_blog_posts, etc.)
-- These automation tables are completely separate and independent

-- ========================================
-- 1. AUTOMATION CAMPAIGNS TABLE
-- Core table for managing automation campaigns
-- ========================================
CREATE TABLE IF NOT EXISTS public.automation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  anchor_texts TEXT[] NOT NULL DEFAULT '{}',
  target_url TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Automation-specific fields
  total_platforms INTEGER DEFAULT 3,
  completed_platforms INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Configuration
  auto_pause_on_error BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,
  retry_count INTEGER DEFAULT 0
);

-- ========================================
-- 2. AUTOMATION CONTENT TABLE  
-- Stores generated content for automation campaigns
-- ========================================
CREATE TABLE IF NOT EXISTS public.automation_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.automation_campaigns(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_keyword TEXT,
  anchor_text TEXT,
  backlink_url TEXT,
  content_type TEXT DEFAULT 'blog_post',
  word_count INTEGER DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- AI generation metadata
  ai_model TEXT DEFAULT 'gpt-3.5-turbo',
  prompt_used TEXT,
  generation_time_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. AUTOMATION PUBLISHED LINKS TABLE
-- Tracks all published links from automation campaigns
-- ========================================
CREATE TABLE IF NOT EXISTS public.automation_published_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.automation_campaigns(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.automation_content(id) ON DELETE SET NULL,
  platform TEXT NOT NULL DEFAULT 'Telegraph.ph',
  published_url TEXT NOT NULL,
  
  -- Publishing metadata
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'pending')),
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'failed')),
  validation_checked_at TIMESTAMP WITH TIME ZONE,
  
  -- Performance tracking
  click_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. AUTOMATION LOGS TABLE
-- Activity logs for automation campaigns
-- ========================================
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.automation_campaigns(id) ON DELETE CASCADE NOT NULL,
  log_level TEXT DEFAULT 'info' CHECK (log_level IN ('info', 'warning', 'error', 'debug')),
  message TEXT NOT NULL,
  details JSONB,
  
  -- Log metadata
  step_name TEXT,
  error_code TEXT,
  execution_time_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 5. AUTOMATION PLATFORMS TABLE
-- Available platforms for automation publishing
-- ========================================
CREATE TABLE IF NOT EXISTS public.automation_platforms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  base_url TEXT,
  
  -- Platform configuration
  api_endpoint TEXT,
  required_fields JSONB DEFAULT '{}',
  rate_limit_per_hour INTEGER DEFAULT 10,
  
  -- Platform metadata
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  total_publishes INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 6. AUTOMATION CAMPAIGN PLATFORMS TABLE
-- Junction table for campaign-platform relationships
-- ========================================
CREATE TABLE IF NOT EXISTS public.automation_campaign_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.automation_campaigns(id) ON DELETE CASCADE NOT NULL,
  platform_id TEXT REFERENCES public.automation_platforms(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped')),
  published_url TEXT,
  
  -- Execution metadata
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(campaign_id, platform_id)
);

-- ========================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE public.automation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_published_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_campaign_platforms ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CREATE RLS POLICIES - User Data Isolation
-- ========================================

-- Policies for automation_campaigns
DROP POLICY IF EXISTS "Users can manage their own automation campaigns" ON public.automation_campaigns;
CREATE POLICY "Users can manage their own automation campaigns" ON public.automation_campaigns
  FOR ALL USING (auth.uid() = user_id);

-- Policies for automation_content  
DROP POLICY IF EXISTS "Users can access their campaign content" ON public.automation_content;
CREATE POLICY "Users can access their campaign content" ON public.automation_content
  FOR ALL USING (
    campaign_id IN (
      SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
    )
  );

-- Policies for automation_published_links
DROP POLICY IF EXISTS "Users can access their published links" ON public.automation_published_links;
CREATE POLICY "Users can access their published links" ON public.automation_published_links
  FOR ALL USING (
    campaign_id IN (
      SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
    )
  );

-- Policies for automation_logs
DROP POLICY IF EXISTS "Users can access their campaign logs" ON public.automation_logs;
CREATE POLICY "Users can access their campaign logs" ON public.automation_logs
  FOR ALL USING (
    campaign_id IN (
      SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
    )
  );

-- Policies for automation_platforms (read-only for all authenticated users)
DROP POLICY IF EXISTS "Authenticated users can read platforms" ON public.automation_platforms;
CREATE POLICY "Authenticated users can read platforms" ON public.automation_platforms
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for automation_campaign_platforms
DROP POLICY IF EXISTS "Users can access their campaign platforms" ON public.automation_campaign_platforms;
CREATE POLICY "Users can access their campaign platforms" ON public.automation_campaign_platforms
  FOR ALL USING (
    campaign_id IN (
      SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
    )
  );

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Indexes for automation_campaigns
CREATE INDEX IF NOT EXISTS automation_campaigns_user_id_idx ON public.automation_campaigns(user_id);
CREATE INDEX IF NOT EXISTS automation_campaigns_status_idx ON public.automation_campaigns(status);
CREATE INDEX IF NOT EXISTS automation_campaigns_created_at_idx ON public.automation_campaigns(created_at);

-- Indexes for automation_content
CREATE INDEX IF NOT EXISTS automation_content_campaign_id_idx ON public.automation_content(campaign_id);
CREATE INDEX IF NOT EXISTS automation_content_generated_at_idx ON public.automation_content(generated_at);

-- Indexes for automation_published_links
CREATE INDEX IF NOT EXISTS automation_published_links_campaign_id_idx ON public.automation_published_links(campaign_id);
CREATE INDEX IF NOT EXISTS automation_published_links_platform_idx ON public.automation_published_links(platform);
CREATE INDEX IF NOT EXISTS automation_published_links_status_idx ON public.automation_published_links(status);
CREATE INDEX IF NOT EXISTS automation_published_links_published_at_idx ON public.automation_published_links(published_at);

-- Indexes for automation_logs
CREATE INDEX IF NOT EXISTS automation_logs_campaign_id_idx ON public.automation_logs(campaign_id);
CREATE INDEX IF NOT EXISTS automation_logs_log_level_idx ON public.automation_logs(log_level);
CREATE INDEX IF NOT EXISTS automation_logs_created_at_idx ON public.automation_logs(created_at);

-- Indexes for automation_campaign_platforms
CREATE INDEX IF NOT EXISTS automation_campaign_platforms_campaign_id_idx ON public.automation_campaign_platforms(campaign_id);
CREATE INDEX IF NOT EXISTS automation_campaign_platforms_platform_id_idx ON public.automation_campaign_platforms(platform_id);
CREATE INDEX IF NOT EXISTS automation_campaign_platforms_status_idx ON public.automation_campaign_platforms(status);

-- ========================================
-- INSERT DEFAULT PLATFORMS DATA
-- ========================================
INSERT INTO public.automation_platforms (id, name, description, is_active, base_url, rate_limit_per_hour) VALUES
  ('telegraph', 'Telegraph.ph', 'Anonymous publishing platform for instant content publication', true, 'https://telegra.ph', 20),
  ('medium', 'Medium', 'Professional publishing platform for thought leadership content', false, 'https://medium.com', 5),
  ('dev-to', 'Dev.to', 'Developer community platform for technical content', false, 'https://dev.to', 10)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ========================================
-- CREATE USEFUL VIEWS
-- ========================================

-- View for campaign overview with stats
CREATE OR REPLACE VIEW public.automation_campaign_overview AS
SELECT 
  c.id,
  c.name,
  c.keywords,
  c.anchor_texts,
  c.target_url,
  c.status,
  c.created_at,
  c.completed_at,
  c.user_id,
  
  -- Content stats
  COUNT(DISTINCT ac.id) as total_content_pieces,
  
  -- Publishing stats  
  COUNT(DISTINCT apl.id) as total_published_links,
  COUNT(DISTINCT CASE WHEN apl.status = 'active' THEN apl.id END) as active_links,
  
  -- Platform stats
  COUNT(DISTINCT acp.platform_id) as total_platforms_used,
  COUNT(DISTINCT CASE WHEN acp.status = 'completed' THEN acp.platform_id END) as completed_platforms,
  
  -- Log stats
  COUNT(DISTINCT CASE WHEN al.log_level = 'error' THEN al.id END) as error_count,
  COUNT(DISTINCT CASE WHEN al.log_level = 'warning' THEN al.id END) as warning_count

FROM public.automation_campaigns c
LEFT JOIN public.automation_content ac ON c.id = ac.campaign_id  
LEFT JOIN public.automation_published_links apl ON c.id = apl.campaign_id
LEFT JOIN public.automation_campaign_platforms acp ON c.id = acp.campaign_id
LEFT JOIN public.automation_logs al ON c.id = al.campaign_id
GROUP BY c.id, c.name, c.keywords, c.anchor_texts, c.target_url, c.status, c.created_at, c.completed_at, c.user_id;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check that all automation tables were created successfully
SELECT 
  schemaname,
  tablename,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'automation_%'
ORDER BY tablename;

-- Check automation RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename LIKE 'automation_%'
ORDER BY tablename, policyname;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ AUTOMATION SERVICE SCHEMA SETUP COMPLETE!';
  RAISE NOTICE '📊 Created Tables:';
  RAISE NOTICE '   - automation_campaigns (main campaign management)';
  RAISE NOTICE '   - automation_content (AI-generated content)';  
  RAISE NOTICE '   - automation_published_links (published URLs)';
  RAISE NOTICE '   - automation_logs (activity tracking)';
  RAISE NOTICE '   - automation_platforms (available platforms)';
  RAISE NOTICE '   - automation_campaign_platforms (campaign-platform junction)';
  RAISE NOTICE '🔒 RLS Policies: User data isolation enabled';
  RAISE NOTICE '⚡ Performance: Indexes created for fast queries';
  RAISE NOTICE '📋 Default Data: Telegraph.ph platform configured';
  RAISE NOTICE '🚀 Automation service ready for production use!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NOTE: This is completely separate from the blog service schema';
  RAISE NOTICE '   Blog service uses: blog_posts, published_blog_posts, etc.';
  RAISE NOTICE '   Automation service uses: automation_* tables only';
END $$;
