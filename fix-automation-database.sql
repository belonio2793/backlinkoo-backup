-- Emergency Fix for Missing Database Columns
-- Run this SQL in your Supabase SQL Editor immediately

-- Add missing columns to automation_campaigns table
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false NOT NULL;

-- Verify the columns were added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'automation_campaigns'
AND table_schema = 'public'
AND column_name IN ('started_at', 'completed_at', 'auto_start')
ORDER BY ordinal_position;

-- Test that the columns work by attempting a sample update
-- (This will show an error if columns don't exist)
UPDATE automation_campaigns 
SET 
    started_at = NOW(),
    completed_at = NULL,
    auto_start = false
WHERE 1=0; -- This won't update any rows, just tests the columns exist

-- Show current table structure for verification
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'automation_campaigns'
AND table_schema = 'public'
ORDER BY ordinal_position;
