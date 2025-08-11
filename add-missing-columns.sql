-- Simple fix for missing columns in automation_campaigns table
-- Run this in your Supabase SQL Editor

-- Add the missing columns
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
  AND column_name IN ('started_at', 'completed_at', 'auto_start')
ORDER BY column_name;
