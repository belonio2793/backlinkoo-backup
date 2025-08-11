-- ===================================================================
-- ADD MISSING COLUMNS TO AUTOMATION_CAMPAIGNS TABLE
-- ===================================================================
-- This script adds all missing columns that the application expects

-- Add the missing started_at column
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;

-- Add other columns that might be missing based on the application code
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

-- Add auto_start column if it doesn't exist
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;

-- Add first_started column for historical tracking
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS first_started TIMESTAMPTZ NULL;

-- Add paused_at column for pause tracking
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ NULL;

-- Add archived column for soft deletion
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Add archived_at timestamp
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

-- Add archive_reason for tracking why campaigns were archived
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS archive_reason TEXT NULL;

-- Add scheduled_at for future campaign starts
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ NULL;

-- Add description field
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS description TEXT NULL;

-- Add configuration JSONB field for additional settings
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS configuration JSONB DEFAULT '{}';

-- Create index for performance on started_at
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_started_at 
ON automation_campaigns(started_at);

-- Create index for archived campaigns
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_archived 
ON automation_campaigns(archived) WHERE archived = false;

-- Create index for scheduled campaigns
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_scheduled 
ON automation_campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Update any existing active campaigns to have started_at if null
UPDATE automation_campaigns 
SET started_at = COALESCE(started_at, created_at)
WHERE status = 'active' AND started_at IS NULL;

-- Success message
SELECT 'Missing columns added successfully to automation_campaigns table' as result;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
AND table_schema = 'public'
ORDER BY ordinal_position;
