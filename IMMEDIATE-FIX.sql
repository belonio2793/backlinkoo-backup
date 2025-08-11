-- ===================================================================
-- IMMEDIATE FIX: Add missing columns to automation_campaigns table
-- ===================================================================
-- Copy and paste this into Supabase SQL Editor and run it

-- Add started_at column
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;

-- Add completed_at column  
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

-- Add auto_start column
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;

-- Verify the columns were added
SELECT 'All missing columns have been added successfully!' as result;

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
AND table_schema = 'public'
AND column_name IN ('started_at', 'completed_at', 'auto_start')
ORDER BY column_name;
