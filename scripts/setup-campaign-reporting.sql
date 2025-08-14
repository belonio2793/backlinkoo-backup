-- Campaign Reporting System Database Setup
-- Creates tables needed for the live campaign management and reporting system

-- Campaign Published Links Table
CREATE TABLE IF NOT EXISTS campaign_published_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    platform TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    word_count INTEGER NOT NULL DEFAULT 0,
    anchor_text_used TEXT NOT NULL,
    target_url TEXT NOT NULL,
    keyword_used TEXT NOT NULL,
    
    -- Performance metrics
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    ctr DECIMAL(5,2) DEFAULT 0.00,
    domain_authority INTEGER DEFAULT 85,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'indexed', 'removed', 'error')),
    last_checked TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT,
    
    -- SEO metrics
    backlink_value DECIMAL(10,2) DEFAULT 0.00,
    estimated_traffic DECIMAL(10,2) DEFAULT 0.00,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Reports Table
CREATE TABLE IF NOT EXISTS campaign_reports (
    id TEXT PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    report_name TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    report_type TEXT NOT NULL CHECK (report_type IN ('summary', 'detailed', 'performance', 'links')),
    report_data JSONB NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to automation_campaigns if they don't exist
DO $$ 
BEGIN
    -- Add execution_progress column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'execution_progress'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN execution_progress JSONB;
    END IF;

    -- Add published_articles column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'published_articles'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN published_articles JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add current_platform column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'current_platform'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN current_platform TEXT;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_published_links_campaign_id ON campaign_published_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_published_links_published_at ON campaign_published_links(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_published_links_status ON campaign_published_links(status);
CREATE INDEX IF NOT EXISTS idx_campaign_published_links_platform ON campaign_published_links(platform);

CREATE INDEX IF NOT EXISTS idx_campaign_reports_campaign_id ON campaign_reports(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_user_id ON campaign_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_generated_at ON campaign_reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_type ON campaign_reports(report_type);

-- Row Level Security (RLS)
ALTER TABLE campaign_published_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_published_links
CREATE POLICY "Users can view their own published links" ON campaign_published_links
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM automation_campaigns WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert published links for their campaigns" ON campaign_published_links
    FOR INSERT WITH CHECK (
        campaign_id IN (
            SELECT id FROM automation_campaigns WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own published links" ON campaign_published_links
    FOR UPDATE USING (
        campaign_id IN (
            SELECT id FROM automation_campaigns WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own published links" ON campaign_published_links
    FOR DELETE USING (
        campaign_id IN (
            SELECT id FROM automation_campaigns WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for campaign_reports
CREATE POLICY "Users can view their own reports" ON campaign_reports
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reports" ON campaign_reports
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reports" ON campaign_reports
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reports" ON campaign_reports
    FOR DELETE USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_campaign_published_links_updated_at ON campaign_published_links;
CREATE TRIGGER update_campaign_published_links_updated_at
    BEFORE UPDATE ON campaign_published_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaign_reports_updated_at ON campaign_reports;
CREATE TRIGGER update_campaign_reports_updated_at
    BEFORE UPDATE ON campaign_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON campaign_published_links TO authenticated;
GRANT ALL ON campaign_reports TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Campaign reporting system tables created successfully!';
    RAISE NOTICE 'Tables: campaign_published_links, campaign_reports';
    RAISE NOTICE 'Added columns: execution_progress, published_articles, current_platform to automation_campaigns';
    RAISE NOTICE 'RLS policies and indexes created';
END $$;
