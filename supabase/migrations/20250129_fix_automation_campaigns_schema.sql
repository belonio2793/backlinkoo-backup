-- Fix automation_campaigns table schema to match application expectations
-- Add missing columns: links_built, available_sites, target_sites_used, published_articles

DO $$ 
BEGIN
    -- Add links_built column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'links_built') THEN
        ALTER TABLE automation_campaigns ADD COLUMN links_built INTEGER DEFAULT 0;
    END IF;

    -- Add available_sites column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'available_sites') THEN
        ALTER TABLE automation_campaigns ADD COLUMN available_sites INTEGER DEFAULT 0;
    END IF;

    -- Add target_sites_used column (JSON array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'target_sites_used') THEN
        ALTER TABLE automation_campaigns ADD COLUMN target_sites_used TEXT[] DEFAULT '{}';
    END IF;

    -- Add published_articles column (JSON array for article data)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'published_articles') THEN
        ALTER TABLE automation_campaigns ADD COLUMN published_articles JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add started_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'started_at') THEN
        ALTER TABLE automation_campaigns ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add current_platform column for tracking current execution platform
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'current_platform') THEN
        ALTER TABLE automation_campaigns ADD COLUMN current_platform TEXT;
    END IF;

    -- Add execution_progress column for tracking progress data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'execution_progress') THEN
        ALTER TABLE automation_campaigns ADD COLUMN execution_progress JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_links_built ON automation_campaigns(links_built);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_available_sites ON automation_campaigns(available_sites);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_started_at ON automation_campaigns(started_at);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_current_platform ON automation_campaigns(current_platform);

-- Update existing records to have proper default values
UPDATE automation_campaigns 
SET 
    links_built = COALESCE(links_built, 0),
    available_sites = COALESCE(available_sites, 0),
    target_sites_used = COALESCE(target_sites_used, '{}'),
    published_articles = COALESCE(published_articles, '[]'::jsonb),
    execution_progress = COALESCE(execution_progress, '{}'::jsonb)
WHERE 
    links_built IS NULL OR 
    available_sites IS NULL OR 
    target_sites_used IS NULL OR 
    published_articles IS NULL OR
    execution_progress IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN automation_campaigns.links_built IS 'Number of links successfully built for this campaign';
COMMENT ON COLUMN automation_campaigns.available_sites IS 'Number of available sites/platforms for this campaign';
COMMENT ON COLUMN automation_campaigns.target_sites_used IS 'Array of domain names that have been used for this campaign';
COMMENT ON COLUMN automation_campaigns.published_articles IS 'JSON array containing details of published articles';
COMMENT ON COLUMN automation_campaigns.current_platform IS 'Currently active platform for campaign execution';
COMMENT ON COLUMN automation_campaigns.execution_progress IS 'JSON object containing execution progress data';
