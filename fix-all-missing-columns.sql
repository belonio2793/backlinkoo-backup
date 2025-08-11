-- ===================================================================
-- FIX ALL MISSING COLUMNS IN automation_campaigns TABLE
-- ===================================================================
-- This fixes the specific error and adds other commonly needed columns

-- Add completed_at column (fixes the current error)
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

-- Add other commonly referenced columns
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;

-- Add first_started for tracking when campaign was first activated
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS first_started TIMESTAMPTZ NULL;

-- Add paused_at for tracking when campaign was paused
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_completed_at 
ON automation_campaigns(completed_at) WHERE completed_at IS NOT NULL;

-- Verify all columns were added successfully
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
AND table_schema = 'public'
AND column_name IN ('started_at', 'completed_at', 'auto_start', 'first_started', 'paused_at')
ORDER BY column_name;

-- Test query to ensure columns work
SELECT 
    COUNT(*) as total_campaigns,
    COUNT(started_at) as campaigns_with_start_date,
    COUNT(completed_at) as campaigns_with_completion_date
FROM automation_campaigns;
