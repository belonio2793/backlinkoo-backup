-- Fix link_opportunities table to ensure it has all needed columns
-- First check if we need to add any missing columns

-- Add relevance_score column if it doesn't exist (for compatibility)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'link_opportunities' 
        AND column_name = 'relevance_score'
    ) THEN
        ALTER TABLE link_opportunities 
        ADD COLUMN relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100);
    END IF;
END $$;

-- Add keyword column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'link_opportunities' 
        AND column_name = 'keyword'
    ) THEN
        ALTER TABLE link_opportunities 
        ADD COLUMN keyword TEXT;
    END IF;
END $$;

-- Add discovery_method column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'link_opportunities' 
        AND column_name = 'discovery_method'
    ) THEN
        ALTER TABLE link_opportunities 
        ADD COLUMN discovery_method TEXT;
    END IF;
END $$;

-- Ensure the authority_score column exists and has proper constraints
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'link_opportunities' 
        AND column_name = 'authority_score'
    ) THEN
        ALTER TABLE link_opportunities 
        ADD COLUMN authority_score INTEGER CHECK (authority_score >= 0 AND authority_score <= 100);
    END IF;
END $$;

-- Update any indexes that might be missing
CREATE INDEX IF NOT EXISTS idx_link_opportunities_authority_score ON link_opportunities(authority_score);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_discovery_method ON link_opportunities(discovery_method);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_keyword ON link_opportunities(keyword);

-- Add comment to clarify the table purpose
COMMENT ON TABLE link_opportunities IS 'Stores discovered link building opportunities for campaigns';
COMMENT ON COLUMN link_opportunities.authority_score IS 'Domain authority score (0-100)';
COMMENT ON COLUMN link_opportunities.relevance_score IS 'Content relevance score (0-100)';
COMMENT ON COLUMN link_opportunities.discovery_method IS 'Method used to discover this opportunity';
