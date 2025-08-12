-- ====================================================================
-- COMPLETE AUTOMATION DATABASE SETUP SCRIPT
-- ====================================================================
-- Run this in your Supabase SQL Editor to set up the entire automation system
-- Project URL: https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql

-- ====================================================================
-- 1. EXTENSIONS AND BASIC SETUP
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. UTILITY FUNCTIONS
-- ====================================================================

-- Create the exec_sql function for dynamic SQL execution
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  row_count int;
BEGIN
  EXECUTE query;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  RETURN json_build_object(
    'success', true,
    'rows_affected', row_count,
    'message', 'Query executed successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = $1
  );
END;
$$;

-- Function to check if a column exists
CREATE OR REPLACE FUNCTION column_exists(table_name text, column_name text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = $1 
    AND column_name = $2
  );
END;
$$;

-- ====================================================================
-- 3. CORE AUTOMATION TABLES
-- ====================================================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS automation_campaign_metrics CASCADE;
DROP TABLE IF EXISTS automation_campaign_logs CASCADE;
DROP TABLE IF EXISTS automation_discovered_links CASCADE;
DROP TABLE IF EXISTS automation_campaigns CASCADE;

-- Create automation_campaigns table with all required columns
CREATE TABLE automation_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic campaign info
  name TEXT NOT NULL,
  description TEXT,
  target_url TEXT NOT NULL,
  engine_type TEXT NOT NULL DEFAULT 'blog-comments',
  
  -- Campaign status and timing
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  
  -- Automation settings
  auto_start BOOLEAN NOT NULL DEFAULT false,
  daily_limit INTEGER NOT NULL DEFAULT 10,
  priority INTEGER NOT NULL DEFAULT 1,
  
  -- Target criteria
  keywords TEXT[] NOT NULL DEFAULT '{}',
  anchor_texts TEXT[] NOT NULL DEFAULT '{}',
  target_domains TEXT[] DEFAULT '{}',
  excluded_domains TEXT[] DEFAULT '{}',
  
  -- Content settings
  comment_template TEXT,
  min_domain_authority INTEGER DEFAULT 20,
  max_links_per_domain INTEGER DEFAULT 1,
  
  -- Progress tracking
  progress DECIMAL(5,2) DEFAULT 0.00,
  links_found INTEGER DEFAULT 0,
  links_created INTEGER DEFAULT 0,
  links_failed INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Error handling
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  
  -- Metadata
  config JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- Create automation_discovered_links table
CREATE TABLE automation_discovered_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES automation_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Link details
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  title TEXT,
  description TEXT,
  
  -- Link quality metrics
  domain_authority INTEGER,
  page_authority INTEGER,
  spam_score INTEGER,
  
  -- Discovery info
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discovery_method TEXT NOT NULL DEFAULT 'automated',
  source_keyword TEXT,
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'discovered' CHECK (status IN ('discovered', 'queued', 'processing', 'completed', 'failed', 'skipped')),
  processed_at TIMESTAMPTZ,
  
  -- Link creation details
  comment_posted BOOLEAN DEFAULT false,
  comment_text TEXT,
  comment_url TEXT,
  anchor_text TEXT,
  
  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  UNIQUE(campaign_id, url)
);

-- Create automation_campaign_logs table
CREATE TABLE automation_campaign_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES automation_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Log details
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  
  -- Context
  operation TEXT,
  component TEXT,
  
  -- Additional data
  data JSONB DEFAULT '{}',
  error_details JSONB,
  
  -- Performance metrics
  duration_ms INTEGER,
  memory_usage INTEGER
);

-- Create automation_campaign_metrics table
CREATE TABLE automation_campaign_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES automation_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Timestamp
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Performance metrics
  links_discovered INTEGER DEFAULT 0,
  links_attempted INTEGER DEFAULT 0,
  links_successful INTEGER DEFAULT 0,
  links_failed INTEGER DEFAULT 0,
  
  -- Quality metrics
  average_da DECIMAL(5,2) DEFAULT 0.00,
  average_pa DECIMAL(5,2) DEFAULT 0.00,
  average_spam_score DECIMAL(5,2) DEFAULT 0.00,
  
  -- Time metrics
  average_processing_time INTEGER DEFAULT 0, -- in milliseconds
  total_processing_time INTEGER DEFAULT 0,
  
  -- Error tracking
  error_rate DECIMAL(5,2) DEFAULT 0.00,
  common_errors JSONB DEFAULT '{}',
  
  -- System metrics
  cpu_usage DECIMAL(5,2) DEFAULT 0.00,
  memory_usage INTEGER DEFAULT 0,
  
  -- Custom metrics
  custom_metrics JSONB DEFAULT '{}',
  
  -- Constraints
  UNIQUE(campaign_id, date)
);

-- ====================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ====================================================================

-- Campaigns table indexes
CREATE INDEX idx_campaigns_user_id ON automation_campaigns(user_id);
CREATE INDEX idx_campaigns_status ON automation_campaigns(status);
CREATE INDEX idx_campaigns_engine_type ON automation_campaigns(engine_type);
CREATE INDEX idx_campaigns_created_at ON automation_campaigns(created_at);
CREATE INDEX idx_campaigns_updated_at ON automation_campaigns(updated_at);
CREATE INDEX idx_campaigns_auto_start ON automation_campaigns(auto_start);

-- Discovered links indexes
CREATE INDEX idx_links_campaign_id ON automation_discovered_links(campaign_id);
CREATE INDEX idx_links_user_id ON automation_discovered_links(user_id);
CREATE INDEX idx_links_status ON automation_discovered_links(status);
CREATE INDEX idx_links_domain ON automation_discovered_links(domain);
CREATE INDEX idx_links_discovered_at ON automation_discovered_links(discovered_at);
CREATE INDEX idx_links_processed_at ON automation_discovered_links(processed_at);

-- Logs indexes
CREATE INDEX idx_logs_campaign_id ON automation_campaign_logs(campaign_id);
CREATE INDEX idx_logs_timestamp ON automation_campaign_logs(timestamp);
CREATE INDEX idx_logs_level ON automation_campaign_logs(level);
CREATE INDEX idx_logs_operation ON automation_campaign_logs(operation);

-- Metrics indexes
CREATE INDEX idx_metrics_campaign_id ON automation_campaign_metrics(campaign_id);
CREATE INDEX idx_metrics_date ON automation_campaign_metrics(date);
CREATE INDEX idx_metrics_recorded_at ON automation_campaign_metrics(recorded_at);

-- ====================================================================
-- 5. TRIGGERS FOR AUTOMATIC UPDATES
-- ====================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to campaigns
CREATE TRIGGER trigger_campaigns_updated_at
  BEFORE UPDATE ON automation_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update campaign progress
CREATE OR REPLACE FUNCTION update_campaign_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_links INTEGER;
  completed_links INTEGER;
  failed_links INTEGER;
  new_progress DECIMAL(5,2);
  new_success_rate DECIMAL(5,2);
BEGIN
  -- Count total and completed links for this campaign
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed')
  INTO total_links, completed_links, failed_links
  FROM automation_discovered_links 
  WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id);
  
  -- Calculate progress (completed + failed / total)
  IF total_links > 0 THEN
    new_progress = ROUND(((completed_links + failed_links)::DECIMAL / total_links) * 100, 2);
  ELSE
    new_progress = 0.00;
  END IF;
  
  -- Calculate success rate
  IF (completed_links + failed_links) > 0 THEN
    new_success_rate = ROUND((completed_links::DECIMAL / (completed_links + failed_links)) * 100, 2);
  ELSE
    new_success_rate = 0.00;
  END IF;
  
  -- Update the campaign
  UPDATE automation_campaigns 
  SET 
    links_found = total_links,
    links_created = completed_links,
    links_failed = failed_links,
    progress = new_progress,
    success_rate = new_success_rate,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add progress update triggers
CREATE TRIGGER trigger_update_campaign_progress_insert
  AFTER INSERT ON automation_discovered_links
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_progress();

CREATE TRIGGER trigger_update_campaign_progress_update
  AFTER UPDATE ON automation_discovered_links
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_progress();

CREATE TRIGGER trigger_update_campaign_progress_delete
  AFTER DELETE ON automation_discovered_links
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_progress();

-- ====================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE automation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_discovered_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_campaign_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_campaign_metrics ENABLE ROW LEVEL SECURITY;

-- Campaigns RLS policies
CREATE POLICY "Users can view their own campaigns"
  ON automation_campaigns
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns"
  ON automation_campaigns
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON automation_campaigns
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON automation_campaigns
  FOR DELETE
  USING (auth.uid() = user_id);

-- Discovered links RLS policies
CREATE POLICY "Users can view their own discovered links"
  ON automation_discovered_links
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create discovered links for their campaigns"
  ON automation_discovered_links
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM automation_campaigns 
      WHERE id = campaign_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own discovered links"
  ON automation_discovered_links
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discovered links"
  ON automation_discovered_links
  FOR DELETE
  USING (auth.uid() = user_id);

-- Logs RLS policies
CREATE POLICY "Users can view their own campaign logs"
  ON automation_campaign_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create logs for user campaigns"
  ON automation_campaign_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM automation_campaigns 
      WHERE id = campaign_id AND user_id = auth.uid()
    )
  );

-- Metrics RLS policies
CREATE POLICY "Users can view their own campaign metrics"
  ON automation_campaign_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create metrics for user campaigns"
  ON automation_campaign_metrics
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM automation_campaigns 
      WHERE id = campaign_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can update metrics for user campaigns"
  ON automation_campaign_metrics
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- 7. UTILITY FUNCTIONS FOR AUTOMATION
-- ====================================================================

-- Function to create a new campaign with validation
CREATE OR REPLACE FUNCTION create_automation_campaign(
  p_name TEXT,
  p_target_url TEXT,
  p_engine_type TEXT DEFAULT 'blog-comments',
  p_keywords TEXT[] DEFAULT '{}',
  p_anchor_texts TEXT[] DEFAULT '{}',
  p_auto_start BOOLEAN DEFAULT false,
  p_daily_limit INTEGER DEFAULT 10
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  campaign_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Validate inputs
  IF p_name IS NULL OR LENGTH(TRIM(p_name)) = 0 THEN
    RAISE EXCEPTION 'Campaign name is required';
  END IF;
  
  IF p_target_url IS NULL OR LENGTH(TRIM(p_target_url)) = 0 THEN
    RAISE EXCEPTION 'Target URL is required';
  END IF;
  
  -- Create the campaign
  INSERT INTO automation_campaigns (
    user_id,
    name,
    target_url,
    engine_type,
    keywords,
    anchor_texts,
    auto_start,
    daily_limit,
    status
  ) VALUES (
    current_user_id,
    TRIM(p_name),
    TRIM(p_target_url),
    p_engine_type,
    p_keywords,
    p_anchor_texts,
    p_auto_start,
    p_daily_limit,
    CASE WHEN p_auto_start THEN 'active' ELSE 'draft' END
  ) RETURNING id INTO campaign_id;
  
  -- Log the creation
  INSERT INTO automation_campaign_logs (
    campaign_id,
    user_id,
    level,
    message,
    operation
  ) VALUES (
    campaign_id,
    current_user_id,
    'info',
    'Campaign created: ' || p_name,
    'create_campaign'
  );
  
  RETURN campaign_id;
END;
$$;

-- Function to get campaign statistics
CREATE OR REPLACE FUNCTION get_campaign_stats(p_campaign_id UUID DEFAULT NULL)
RETURNS TABLE (
  campaign_id UUID,
  campaign_name TEXT,
  total_links INTEGER,
  completed_links INTEGER,
  failed_links INTEGER,
  success_rate DECIMAL,
  avg_processing_time INTERVAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.links_found,
    c.links_created,
    c.links_failed,
    c.success_rate,
    INTERVAL '1 second' * COALESCE(
      (SELECT AVG(duration_ms) FROM automation_campaign_logs 
       WHERE campaign_id = c.id AND duration_ms IS NOT NULL), 
      0
    ) / 1000
  FROM automation_campaigns c
  WHERE (p_campaign_id IS NULL OR c.id = p_campaign_id)
    AND c.user_id = auth.uid();
END;
$$;

-- Function to cleanup old logs (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM automation_campaign_logs 
  WHERE timestamp < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- ====================================================================
-- 8. SAMPLE DATA (OPTIONAL)
-- ====================================================================

-- Insert sample campaign for testing (uncomment if needed)
/*
INSERT INTO automation_campaigns (
  user_id,
  name,
  target_url,
  engine_type,
  keywords,
  anchor_texts,
  status,
  daily_limit
) VALUES (
  auth.uid(),
  'Sample Blog Campaign',
  'https://example.com',
  'blog-comments',
  ARRAY['seo', 'backlinks', 'marketing'],
  ARRAY['learn more', 'click here', 'best tool'],
  'draft',
  5
);
*/

-- ====================================================================
-- 9. VERIFICATION QUERIES
-- ====================================================================

-- Verify tables exist
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'automation_%'
ORDER BY tablename;

-- Verify columns exist
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'automation_campaigns',
    'automation_discovered_links', 
    'automation_campaign_logs',
    'automation_campaign_metrics'
  )
ORDER BY table_name, ordinal_position;

-- Verify RLS policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'automation_%'
ORDER BY tablename, policyname;

-- Test the exec_sql function
SELECT exec_sql('SELECT COUNT(*) FROM automation_campaigns;');

-- Test campaign creation function
-- SELECT create_automation_campaign('Test Campaign', 'https://test.com', 'blog-comments', ARRAY['test'], ARRAY['test']);

-- ====================================================================
-- SETUP COMPLETE!
-- ====================================================================

-- Final verification
DO $$
DECLARE
  table_count INTEGER;
  function_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename LIKE 'automation_%';
  
  -- Count functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('exec_sql', 'create_automation_campaign', 'get_campaign_stats', 'cleanup_old_logs');
  
  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename LIKE 'automation_%';
  
  RAISE NOTICE '====================================================================';
  RAISE NOTICE 'AUTOMATION DATABASE SETUP COMPLETE!';
  RAISE NOTICE '====================================================================';
  RAISE NOTICE 'Tables created: %', table_count;
  RAISE NOTICE 'Functions created: %', function_count;
  RAISE NOTICE 'RLS policies created: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Your automation system is now ready to use!';
  RAISE NOTICE 'Visit your application to start creating campaigns.';
  RAISE NOTICE '====================================================================';
END $$;
