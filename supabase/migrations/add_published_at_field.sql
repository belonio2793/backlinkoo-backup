-- Add published_at field to automation_published_links table
-- This field is expected by the UI to show when links were published

ALTER TABLE automation_published_links 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing records to have published_at same as created_at
UPDATE automation_published_links 
SET published_at = created_at 
WHERE published_at IS NULL;

-- Create index for performance on published_at field since it's used for sorting
CREATE INDEX IF NOT EXISTS idx_automation_published_links_published_at 
ON automation_published_links(published_at DESC);

-- Verify the changes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'automation_published_links' 
        AND column_name = 'published_at'
    ) THEN
        RAISE NOTICE '✅ published_at field added successfully to automation_published_links table';
    ELSE
        RAISE NOTICE '⚠️ Failed to add published_at field';
    END IF;
END $$;
