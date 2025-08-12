-- ============================================================================
-- URGENT: Fix Missing Columns in automation_campaigns Table
-- Copy this entire script and run it in your Supabase SQL Editor
-- ============================================================================

-- Add the missing columns to automation_campaigns table
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_started_at ON automation_campaigns(started_at);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_completed_at ON automation_campaigns(completed_at);

-- Update existing active campaigns to have started_at timestamps
UPDATE automation_campaigns 
SET started_at = COALESCE(started_at, created_at)
WHERE status = 'active' AND started_at IS NULL;

-- Verify the columns were added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
AND column_name IN ('started_at', 'completed_at', 'auto_start')
ORDER BY column_name;

-- Test query to confirm columns work
SELECT COUNT(*) as total_campaigns, 
       COUNT(started_at) as campaigns_with_started_at,
       COUNT(completed_at) as campaigns_with_completed_at,
       COUNT(CASE WHEN auto_start = true THEN 1 END) as auto_start_campaigns
FROM automation_campaigns;
