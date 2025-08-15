-- ========================================
-- MINIMAL AUTOMATION SCHEMA - Step by Step
-- Run this in Supabase SQL Editor
-- ========================================

-- Step 1: Create automation_campaigns table ONLY
CREATE TABLE IF NOT EXISTS public.automation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  anchor_texts TEXT[] NOT NULL DEFAULT '{}',
  target_url TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Verify automation_campaigns was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'automation_campaigns'
  ) THEN
    RAISE NOTICE '✅ automation_campaigns table created successfully';
  ELSE
    RAISE EXCEPTION '❌ automation_campaigns table creation failed';
  END IF;
END $$;

-- Step 2: Create automation_published_links table ONLY  
CREATE TABLE IF NOT EXISTS public.automation_published_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  published_url TEXT NOT NULL,
  platform TEXT DEFAULT 'telegraph',
  status TEXT DEFAULT 'active',
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verify automation_published_links was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'automation_published_links'
  ) THEN
    RAISE NOTICE '✅ automation_published_links table created successfully';
  ELSE
    RAISE EXCEPTION '❌ automation_published_links table creation failed';
  END IF;
END $$;

-- Step 3: Create automation_logs table ONLY
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  log_level TEXT DEFAULT 'info',
  message TEXT NOT NULL,
  step_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verify automation_logs was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'automation_logs'
  ) THEN
    RAISE NOTICE '✅ automation_logs table created successfully';
  ELSE
    RAISE EXCEPTION '❌ automation_logs table creation failed';
  END IF;
END $$;

-- Step 4: Enable RLS on automation tables
ALTER TABLE public.automation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_published_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

RAISE NOTICE '✅ RLS enabled on automation tables';

-- Step 5: Create basic RLS policies
CREATE POLICY "automation_campaigns_user_access" ON public.automation_campaigns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "automation_links_user_access" ON public.automation_published_links
  FOR ALL USING (
    campaign_id IN (
      SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "automation_logs_user_access" ON public.automation_logs
  FOR ALL USING (
    campaign_id IN (
      SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
    )
  );

RAISE NOTICE '✅ RLS policies created for automation tables';

-- Step 6: Create essential indexes ONLY
CREATE INDEX IF NOT EXISTS automation_campaigns_user_id_idx ON public.automation_campaigns(user_id);
CREATE INDEX IF NOT EXISTS automation_campaigns_status_idx ON public.automation_campaigns(status);
CREATE INDEX IF NOT EXISTS automation_published_links_campaign_id_idx ON public.automation_published_links(campaign_id);
CREATE INDEX IF NOT EXISTS automation_logs_campaign_id_idx ON public.automation_logs(campaign_id);

RAISE NOTICE '✅ Essential indexes created';

-- Final verification
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('automation_campaigns', 'automation_published_links', 'automation_logs');
  
  IF table_count = 3 THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 AUTOMATION SCHEMA SETUP COMPLETE!';
    RAISE NOTICE '✅ Created 3 essential automation tables';
    RAISE NOTICE '✅ RLS and policies configured';
    RAISE NOTICE '✅ Essential indexes created';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Campaign resume should now work!';
    RAISE NOTICE '';
  ELSE
    RAISE EXCEPTION '❌ Expected 3 tables, found %', table_count;
  END IF;
END $$;
