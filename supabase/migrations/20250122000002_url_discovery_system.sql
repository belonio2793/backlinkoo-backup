-- URL Discovery and Management System Database Schema
-- This migration creates tables for the recursive self-learning URL discovery system

-- 1. Discovered URLs Table (Collaborative Database)
CREATE TABLE IF NOT EXISTS discovered_urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT UNIQUE NOT NULL,
    domain TEXT NOT NULL,
    link_type TEXT CHECK (link_type IN ('blog_comment', 'web2_platform', 'forum_profile', 'social_profile', 'guest_post', 'resource_page', 'directory_listing')) NOT NULL,
    
    -- Discovery metadata
    discovered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    discovery_method TEXT CHECK (discovery_method IN ('recursive_crawler', 'user_submission', 'ai_discovery', 'competitor_analysis', 'manual_verification')) DEFAULT 'recursive_crawler',
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Quality metrics
    domain_authority INTEGER CHECK (domain_authority >= 0 AND domain_authority <= 100),
    page_authority INTEGER CHECK (page_authority >= 0 AND page_authority <= 100),
    spam_score INTEGER CHECK (spam_score >= 0 AND spam_score <= 100),
    traffic_estimate TEXT,
    
    -- Status and validation
    status TEXT CHECK (status IN ('pending', 'verified', 'working', 'broken', 'blacklisted', 'rate_limited')) DEFAULT 'pending',
    last_verified TIMESTAMP WITH TIME ZONE,
    verification_attempts INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Posting requirements
    requires_registration BOOLEAN DEFAULT false,
    requires_moderation BOOLEAN DEFAULT false,
    min_content_length INTEGER DEFAULT 100,
    max_links_per_post INTEGER DEFAULT 1,
    posting_frequency_limit TEXT, -- e.g., "1_per_day", "5_per_week"
    
    -- Community validation
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    reports INTEGER DEFAULT 0,
    last_successful_post TIMESTAMP WITH TIME ZONE,
    
    -- Technical metadata
    posting_method TEXT CHECK (posting_method IN ('api', 'form_submission', 'content_generation', 'manual_review')) DEFAULT 'form_submission',
    captcha_required BOOLEAN DEFAULT false,
    ip_restrictions BOOLEAN DEFAULT false,
    user_agent_detection BOOLEAN DEFAULT false,
    
    -- Auto-cleaning metadata
    auto_clean_score INTEGER DEFAULT 0, -- Higher score = more likely to be cleaned
    last_auto_check TIMESTAMP WITH TIME ZONE DEFAULT now(),
    consecutive_failures INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Additional metadata as JSONB
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. URL Discovery Queue (For Recursive Learning)
CREATE TABLE IF NOT EXISTS url_discovery_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_keywords TEXT[] NOT NULL,
    link_types TEXT[] NOT NULL,
    discovery_depth INTEGER DEFAULT 1 CHECK (discovery_depth >= 1 AND discovery_depth <= 5),
    
    -- Queue status
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
    priority INTEGER DEFAULT 0, -- Higher priority processed first
    
    -- Processing details
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    processed_by TEXT, -- System identifier
    
    -- Results
    urls_discovered INTEGER DEFAULT 0,
    urls_verified INTEGER DEFAULT 0,
    urls_added INTEGER DEFAULT 0,
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Request metadata
    requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    discovery_config JSONB DEFAULT '{}'::jsonb
);

-- 3. URL Verification Results (Track Success/Failure)
CREATE TABLE IF NOT EXISTS url_verification_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_id UUID REFERENCES discovered_urls(id) ON DELETE CASCADE,
    
    -- Verification details
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verification_method TEXT CHECK (verification_method IN ('automated', 'manual', 'user_report')) DEFAULT 'automated',
    
    -- Results
    is_working BOOLEAN NOT NULL,
    response_time INTEGER, -- milliseconds
    http_status_code INTEGER,
    
    -- Detailed results
    posting_successful BOOLEAN,
    link_published BOOLEAN,
    link_indexed BOOLEAN,
    
    -- Error details
    error_type TEXT,
    error_message TEXT,
    
    -- Quality assessment
    content_quality_score INTEGER CHECK (content_quality_score >= 0 AND content_quality_score <= 100),
    relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),
    
    verification_metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. User URL Contributions (Track User Contributions)
CREATE TABLE IF NOT EXISTS user_url_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    url_id UUID REFERENCES discovered_urls(id) ON DELETE CASCADE,
    
    -- Contribution type
    contribution_type TEXT CHECK (contribution_type IN ('discovery', 'verification', 'upvote', 'downvote', 'report', 'improvement')) NOT NULL,
    
    -- Contribution details
    contributed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    contribution_data JSONB DEFAULT '{}'::jsonb,
    
    -- Rewards/Points (for gamification)
    points_awarded INTEGER DEFAULT 0,
    
    UNIQUE(user_id, url_id, contribution_type)
);

-- 5. URL Discovery Sessions (Track Discovery Performance)
CREATE TABLE IF NOT EXISTS url_discovery_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_name TEXT NOT NULL,
    
    -- Session configuration
    target_keywords TEXT[] NOT NULL,
    target_link_types TEXT[] NOT NULL,
    discovery_algorithms TEXT[] DEFAULT '{"recursive_crawler", "competitor_analysis", "ai_discovery"}',
    
    -- Session status
    status TEXT CHECK (status IN ('running', 'paused', 'completed', 'failed')) DEFAULT 'running',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Performance metrics
    total_urls_discovered INTEGER DEFAULT 0,
    verified_urls INTEGER DEFAULT 0,
    working_urls INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Resource usage
    api_calls_used INTEGER DEFAULT 0,
    processing_time_seconds INTEGER DEFAULT 0,
    
    session_config JSONB DEFAULT '{}'::jsonb,
    session_results JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discovered_urls_domain ON discovered_urls(domain);
CREATE INDEX IF NOT EXISTS idx_discovered_urls_link_type ON discovered_urls(link_type);
CREATE INDEX IF NOT EXISTS idx_discovered_urls_status ON discovered_urls(status);
CREATE INDEX IF NOT EXISTS idx_discovered_urls_domain_authority ON discovered_urls(domain_authority);
CREATE INDEX IF NOT EXISTS idx_discovered_urls_discovered_by ON discovered_urls(discovered_by);
CREATE INDEX IF NOT EXISTS idx_discovered_urls_last_verified ON discovered_urls(last_verified);
CREATE INDEX IF NOT EXISTS idx_discovered_urls_auto_clean_score ON discovered_urls(auto_clean_score);

CREATE INDEX IF NOT EXISTS idx_url_discovery_queue_status ON url_discovery_queue(status);
CREATE INDEX IF NOT EXISTS idx_url_discovery_queue_priority ON url_discovery_queue(priority);
CREATE INDEX IF NOT EXISTS idx_url_discovery_queue_requested_by ON url_discovery_queue(requested_by);

CREATE INDEX IF NOT EXISTS idx_url_verification_results_url_id ON url_verification_results(url_id);
CREATE INDEX IF NOT EXISTS idx_url_verification_results_verified_at ON url_verification_results(verified_at);

CREATE INDEX IF NOT EXISTS idx_user_url_contributions_user_id ON user_url_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_url_contributions_url_id ON user_url_contributions(url_id);

-- Create updated_at trigger for discovered_urls
CREATE TRIGGER update_discovered_urls_updated_at 
    BEFORE UPDATE ON discovered_urls 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Policies
ALTER TABLE discovered_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_discovery_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_verification_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_url_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_discovery_sessions ENABLE ROW LEVEL SECURITY;

-- Discovered URLs: All users can view, authenticated users can contribute
CREATE POLICY "Anyone can view discovered URLs" ON discovered_urls
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert URLs" ON discovered_urls
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update URLs they discovered" ON discovered_urls
    FOR UPDATE USING (auth.uid() = discovered_by OR public.get_current_user_role() = 'admin');

-- URL Discovery Queue: Users can view their requests and admins can view all
CREATE POLICY "Users can view their discovery requests" ON url_discovery_queue
    FOR SELECT USING (auth.uid() = requested_by OR public.get_current_user_role() = 'admin');

CREATE POLICY "Authenticated users can request discovery" ON url_discovery_queue
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- URL Verification Results: All users can view, authenticated users can contribute
CREATE POLICY "Anyone can view verification results" ON url_verification_results
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add verification results" ON url_verification_results
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- User Contributions: Users can view all, manage their own
CREATE POLICY "Anyone can view contributions" ON user_url_contributions
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own contributions" ON user_url_contributions
    FOR ALL USING (auth.uid() = user_id);

-- Discovery Sessions: Users can view all, authenticated users can create
CREATE POLICY "Anyone can view discovery sessions" ON url_discovery_sessions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create sessions" ON url_discovery_sessions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Helper functions for URL management
CREATE OR REPLACE FUNCTION get_url_quality_score(url_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    quality_score INTEGER;
    url_record discovered_urls%ROWTYPE;
BEGIN
    SELECT * INTO url_record FROM discovered_urls WHERE id = url_uuid;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Calculate quality score based on multiple factors
    quality_score := 0;
    
    -- Domain authority contribution (40% weight)
    quality_score := quality_score + COALESCE(url_record.domain_authority, 0) * 0.4;
    
    -- Success rate contribution (30% weight)
    quality_score := quality_score + COALESCE(url_record.success_rate, 0) * 0.3;
    
    -- Community validation (20% weight)
    IF (url_record.upvotes + url_record.downvotes) > 0 THEN
        quality_score := quality_score + (url_record.upvotes::DECIMAL / (url_record.upvotes + url_record.downvotes)) * 100 * 0.2;
    END IF;
    
    -- Spam score penalty (10% weight)
    quality_score := quality_score - COALESCE(url_record.spam_score, 0) * 0.1;
    
    -- Reports penalty
    quality_score := quality_score - (url_record.reports * 5);
    
    RETURN GREATEST(0, LEAST(100, quality_score::INTEGER));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-clean URLs based on performance
CREATE OR REPLACE FUNCTION auto_clean_urls()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER := 0;
BEGIN
    -- Mark URLs for auto-cleaning based on poor performance
    UPDATE discovered_urls 
    SET 
        status = 'blacklisted',
        auto_clean_score = 100
    WHERE 
        consecutive_failures >= 5 
        OR reports >= 3
        OR (spam_score > 80 AND domain_authority < 20)
        OR (last_verified < NOW() - INTERVAL '30 days' AND verification_attempts >= 3);
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get discovery statistics
CREATE OR REPLACE FUNCTION get_discovery_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_urls', (SELECT COUNT(*) FROM discovered_urls),
        'verified_urls', (SELECT COUNT(*) FROM discovered_urls WHERE status = 'verified'),
        'working_urls', (SELECT COUNT(*) FROM discovered_urls WHERE status = 'working'),
        'by_type', (
            SELECT json_object_agg(link_type, count)
            FROM (
                SELECT link_type, COUNT(*) as count
                FROM discovered_urls
                WHERE status IN ('verified', 'working')
                GROUP BY link_type
            ) type_counts
        ),
        'top_domains', (
            SELECT json_agg(
                json_build_object(
                    'domain', domain,
                    'count', count,
                    'avg_authority', avg_authority
                )
            )
            FROM (
                SELECT 
                    domain, 
                    COUNT(*) as count,
                    AVG(domain_authority) as avg_authority
                FROM discovered_urls
                WHERE status IN ('verified', 'working')
                GROUP BY domain
                ORDER BY count DESC
                LIMIT 10
            ) top_domains
        ),
        'discovery_performance', (
            SELECT json_build_object(
                'avg_success_rate', AVG(success_rate),
                'total_verifications', SUM(verification_attempts),
                'last_discovery', MAX(discovered_at)
            )
            FROM discovered_urls
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE discovered_urls IS 'Collaborative database of discovered URLs for link building';
COMMENT ON TABLE url_discovery_queue IS 'Queue for processing recursive URL discovery requests';
COMMENT ON TABLE url_verification_results IS 'Results of URL verification attempts';
COMMENT ON TABLE user_url_contributions IS 'Track user contributions to URL discovery and validation';
COMMENT ON TABLE url_discovery_sessions IS 'Track discovery session performance and results';
