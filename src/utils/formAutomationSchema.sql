-- Advanced Form Automation Database Schema
-- Run this in your Supabase SQL Editor to set up the form automation system

-- Table for discovered form URLs from search
CREATE TABLE IF NOT EXISTS discovered_forms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    url text NOT NULL UNIQUE,
    domain text NOT NULL,
    title text,
    snippet text,
    discovery_query text NOT NULL,
    confidence_score integer DEFAULT 0,
    status text DEFAULT 'pending_detection' CHECK (status IN ('pending_detection', 'detected', 'failed_detection')),
    discovered_at timestamptz DEFAULT now(),
    last_checked timestamptz,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    INDEX(domain),
    INDEX(status),
    INDEX(discovered_at)
);

-- Table for form field mappings and structure
CREATE TABLE IF NOT EXISTS form_mappings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    url text NOT NULL,
    domain text NOT NULL,
    form_selector text NOT NULL,
    action_url text,
    method text DEFAULT 'POST',
    fields_mapping jsonb NOT NULL, -- {comment: "selector", name: "selector", email: "selector", website: "selector"}
    hidden_fields jsonb DEFAULT '{}', -- {field_name: "default_value"}
    submit_selector text,
    confidence_score integer DEFAULT 0,
    platform text DEFAULT 'generic' CHECK (platform IN ('wordpress', 'substack', 'medium', 'ghost', 'blogger', 'squarespace', 'generic')),
    status text DEFAULT 'detected' CHECK (status IN ('detected', 'validated', 'validation_failed', 'posting_ready')),
    validation_result jsonb,
    screenshot_path text,
    detected_at timestamptz DEFAULT now(),
    last_validated timestamptz,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(url, form_selector),
    INDEX(domain),
    INDEX(platform),
    INDEX(status),
    INDEX(confidence_score)
);

-- Table for posting accounts (name, email, website combinations)
CREATE TABLE IF NOT EXISTS posting_accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    website text,
    bio text,
    avatar_url text,
    is_active boolean DEFAULT true,
    account_type text DEFAULT 'professional' CHECK (account_type IN ('professional', 'personal', 'brand')),
    created_at timestamptz DEFAULT now(),
    last_used timestamptz,
    success_count integer DEFAULT 0,
    failure_count integer DEFAULT 0,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    INDEX(is_active),
    INDEX(account_type)
);

-- Table for posting results and tracking
CREATE TABLE IF NOT EXISTS posting_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    form_mapping_id uuid REFERENCES form_mappings(id) ON DELETE CASCADE,
    account_id uuid REFERENCES posting_accounts(id) ON DELETE CASCADE,
    comment_content text NOT NULL,
    status text NOT NULL CHECK (status IN ('posted', 'failed', 'pending_moderation', 'captcha_required')),
    error_message text,
    response_data text,
    screenshot_path text,
    time_taken_seconds decimal(5,2),
    posted_at timestamptz DEFAULT now(),
    moderation_approved_at timestamptz,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    INDEX(status),
    INDEX(posted_at),
    INDEX(form_mapping_id)
);

-- Table for automation job queue
CREATE TABLE IF NOT EXISTS automation_jobs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_type text NOT NULL CHECK (job_type IN ('discover_forms', 'detect_structure', 'validate_form', 'post_comment', 'batch_validate', 'batch_post')),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    priority integer DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest priority
    payload jsonb NOT NULL, -- Job-specific data
    result jsonb,
    error_message text,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    scheduled_at timestamptz DEFAULT now(),
    started_at timestamptz,
    completed_at timestamptz,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    INDEX(job_type),
    INDEX(status),
    INDEX(priority),
    INDEX(scheduled_at)
);

-- Table for storing search queries and patterns
CREATE TABLE IF NOT EXISTS discovery_queries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    query text NOT NULL,
    search_patterns jsonb, -- Array of search pattern variations
    target_domains jsonb, -- Array of specific domains to target
    max_results integer DEFAULT 50,
    results_found integer DEFAULT 0,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    INDEX(status),
    INDEX(created_at)
);

-- Table for tracking form automation performance
CREATE TABLE IF NOT EXISTS automation_analytics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    forms_discovered integer DEFAULT 0,
    forms_validated integer DEFAULT 0,
    comments_posted integer DEFAULT 0,
    success_rate decimal(5,2) DEFAULT 0,
    avg_confidence_score decimal(5,2) DEFAULT 0,
    top_platforms jsonb, -- Array of {platform: string, count: number}
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(date, user_id),
    INDEX(date)
);

-- Enable Row Level Security
ALTER TABLE discovered_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discovered_forms
CREATE POLICY "Users can view their own discovered forms" ON discovered_forms
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create discovered forms" ON discovered_forms
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their discovered forms" ON discovered_forms
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their discovered forms" ON discovered_forms
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for form_mappings
CREATE POLICY "Users can view their own form mappings" ON form_mappings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create form mappings" ON form_mappings
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their form mappings" ON form_mappings
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their form mappings" ON form_mappings
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for posting_accounts
CREATE POLICY "Users can view their own posting accounts" ON posting_accounts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create posting accounts" ON posting_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their posting accounts" ON posting_accounts
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their posting accounts" ON posting_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for posting_results
CREATE POLICY "Users can view their own posting results" ON posting_results
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create posting results" ON posting_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their posting results" ON posting_results
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for automation_jobs
CREATE POLICY "Users can view their own automation jobs" ON automation_jobs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create automation jobs" ON automation_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their automation jobs" ON automation_jobs
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for discovery_queries
CREATE POLICY "Users can view their own discovery queries" ON discovery_queries
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create discovery queries" ON discovery_queries
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their discovery queries" ON discovery_queries
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for automation_analytics
CREATE POLICY "Users can view their own automation analytics" ON automation_analytics
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create automation analytics" ON automation_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their automation analytics" ON automation_analytics
    FOR UPDATE USING (auth.uid() = user_id);

-- Functions for automation analytics
CREATE OR REPLACE FUNCTION update_automation_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily analytics when posting results change
    INSERT INTO automation_analytics (date, user_id, comments_posted)
    VALUES (CURRENT_DATE, NEW.user_id, 1)
    ON CONFLICT (date, user_id) 
    DO UPDATE SET 
        comments_posted = automation_analytics.comments_posted + 1,
        success_rate = (
            SELECT COUNT(*) FILTER (WHERE status = 'posted') * 100.0 / COUNT(*)
            FROM posting_results 
            WHERE user_id = NEW.user_id 
            AND posted_at::date = CURRENT_DATE
        );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_automation_analytics_trigger
    AFTER INSERT ON posting_results
    FOR EACH ROW
    EXECUTE FUNCTION update_automation_analytics();

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_automation_data()
RETURNS void AS $$
BEGIN
    -- Delete old job records (older than 30 days)
    DELETE FROM automation_jobs 
    WHERE completed_at < NOW() - INTERVAL '30 days'
    AND status IN ('completed', 'failed', 'cancelled');
    
    -- Delete old posting results (older than 90 days) except successful ones
    DELETE FROM posting_results 
    WHERE posted_at < NOW() - INTERVAL '90 days'
    AND status != 'posted';
    
    -- Delete old analytics (older than 1 year)
    DELETE FROM automation_analytics 
    WHERE date < CURRENT_DATE - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discovered_forms_user_status ON discovered_forms(user_id, status);
CREATE INDEX IF NOT EXISTS idx_form_mappings_user_platform ON form_mappings(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_posting_results_user_date ON posting_results(user_id, posted_at);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_user_priority ON automation_jobs(user_id, priority, status);

-- Verify tables were created
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'discovered_forms', 
    'form_mappings', 
    'posting_accounts', 
    'posting_results', 
    'automation_jobs', 
    'discovery_queries', 
    'automation_analytics'
)
ORDER BY table_name;
