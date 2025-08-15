-- ========================================
-- SUPABASE SCHEMA FIX - Complete Database Setup
-- Copy and paste this entire script into Supabase SQL Editor
-- ========================================

-- 1. Create campaigns table (if not exists)
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  anchor_texts TEXT[] NOT NULL DEFAULT '{}',
  target_url TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  published_urls TEXT[] DEFAULT '{}'
);

-- 2. Create automation_campaigns table (alternative naming)
CREATE TABLE IF NOT EXISTS public.automation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  anchor_texts TEXT[] NOT NULL DEFAULT '{}',
  target_url TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  published_urls TEXT[] DEFAULT '{}'
);

-- 3. Create published_blog_posts table (MISSING TABLE from errors)
CREATE TABLE IF NOT EXISTS public.published_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  published_url TEXT NOT NULL,
  platform TEXT DEFAULT 'Telegraph.ph',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_trial_post BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_url TEXT,
  slug TEXT UNIQUE
);

-- 4. Create published_links table
CREATE TABLE IF NOT EXISTS public.published_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  url TEXT NOT NULL,
  platform TEXT DEFAULT 'Telegraph.ph',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create automation_published_links table (alternative naming)
CREATE TABLE IF NOT EXISTS public.automation_published_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  published_url TEXT NOT NULL,
  platform TEXT DEFAULT 'Telegraph.ph',
  title TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create activity_logs table (MISSING TABLE from errors)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_published_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CREATE RLS POLICIES
-- ========================================

-- Policies for campaigns table
DROP POLICY IF EXISTS "Users can access their own campaigns" ON public.campaigns;
CREATE POLICY "Users can access their own campaigns" ON public.campaigns
  FOR ALL USING (auth.uid() = user_id);

-- Policies for automation_campaigns table
DROP POLICY IF EXISTS "Users can access their own automation campaigns" ON public.automation_campaigns;
CREATE POLICY "Users can access their own automation campaigns" ON public.automation_campaigns
  FOR ALL USING (auth.uid() = user_id);

-- Policies for published_blog_posts table
DROP POLICY IF EXISTS "Users can access their campaign blog posts" ON public.published_blog_posts;
CREATE POLICY "Users can access their campaign blog posts" ON public.published_blog_posts
  FOR ALL USING (
    auth.uid() = user_id OR
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE user_id = auth.uid()
      UNION
      SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
    )
  );

-- Policies for published_links table
DROP POLICY IF EXISTS "Users can access their campaign links" ON public.published_links;
CREATE POLICY "Users can access their campaign links" ON public.published_links
  FOR ALL USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE user_id = auth.uid()
      UNION
      SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
    )
  );

-- Policies for automation_published_links table
DROP POLICY IF EXISTS "Users can access their automation links" ON public.automation_published_links;
CREATE POLICY "Users can access their automation links" ON public.automation_published_links
  FOR ALL USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE user_id = auth.uid()
      UNION
      SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
    )
  );

-- Policies for activity_logs table
DROP POLICY IF EXISTS "Users can access their campaign logs" ON public.activity_logs;
CREATE POLICY "Users can access their campaign logs" ON public.activity_logs
  FOR ALL USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE user_id = auth.uid()
      UNION
      SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
    )
  );

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Indexes for campaigns tables
CREATE INDEX IF NOT EXISTS campaigns_user_id_idx ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS automation_campaigns_user_id_idx ON public.automation_campaigns(user_id);
CREATE INDEX IF NOT EXISTS automation_campaigns_status_idx ON public.automation_campaigns(status);

-- Indexes for published_blog_posts table
CREATE INDEX IF NOT EXISTS published_blog_posts_campaign_id_idx ON public.published_blog_posts(campaign_id);
CREATE INDEX IF NOT EXISTS published_blog_posts_user_id_idx ON public.published_blog_posts(user_id);
CREATE INDEX IF NOT EXISTS published_blog_posts_trial_idx ON public.published_blog_posts(is_trial_post, expires_at);
CREATE INDEX IF NOT EXISTS published_blog_posts_slug_idx ON public.published_blog_posts(slug);

-- Indexes for links tables
CREATE INDEX IF NOT EXISTS published_links_campaign_id_idx ON public.published_links(campaign_id);
CREATE INDEX IF NOT EXISTS automation_published_links_campaign_id_idx ON public.automation_published_links(campaign_id);

-- Indexes for activity_logs table
CREATE INDEX IF NOT EXISTS activity_logs_campaign_id_idx ON public.activity_logs(campaign_id);
CREATE INDEX IF NOT EXISTS activity_logs_timestamp_idx ON public.activity_logs(timestamp);

-- ========================================
-- INSERT SAMPLE DATA (OPTIONAL)
-- ========================================

-- Uncomment the following if you want to insert some test data:
/*
INSERT INTO public.campaigns (name, keywords, anchor_texts, target_url, user_id, status) 
VALUES (
  'Test Campaign',
  ARRAY['digital marketing'],
  ARRAY['marketing services'],
  'https://example.com',
  auth.uid(),
  'draft'
) ON CONFLICT DO NOTHING;
*/

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check that all tables were created successfully
SELECT 
  schemaname,
  tablename,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'campaigns',
    'automation_campaigns',
    'published_blog_posts',
    'published_links',
    'automation_published_links',
    'activity_logs'
  )
ORDER BY tablename;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema fix completed successfully!';
  RAISE NOTICE '✅ All required tables have been created';
  RAISE NOTICE '✅ RLS policies have been set up';
  RAISE NOTICE '✅ Performance indexes have been added';
  RAISE NOTICE '🚀 Campaign resume functionality should now work';
END $$;
