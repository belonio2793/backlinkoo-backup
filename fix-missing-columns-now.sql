-- IMMEDIATE FIX: Add missing columns to automation_campaigns table
-- Copy and run this in your Supabase SQL Editor

ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false NOT NULL;

-- Verify the columns were added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'automation_campaigns'
AND column_name IN ('started_at', 'completed_at', 'auto_start')
ORDER BY column_name;
