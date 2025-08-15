-- Migration: Add published_at column to automation_published_links table
-- This fixes the issue where published links aren't being saved because the column is missing

-- Add published_at column if it doesn't exist
ALTER TABLE automation_published_links 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for performance on published_at field since it's used for sorting
CREATE INDEX IF NOT EXISTS idx_automation_published_links_published_at 
ON automation_published_links(published_at DESC);

-- Update existing records to have published_at set to created_at if null
UPDATE automation_published_links 
SET published_at = created_at 
WHERE published_at IS NULL;

-- Add comment to document the purpose
COMMENT ON COLUMN automation_published_links.published_at IS 'Timestamp when the link was published to the platform';
