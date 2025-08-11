-- ===================================================================
-- FIX: Add missing completed_at column to automation_campaigns table
-- ===================================================================

-- Add the missing completed_at column
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

-- Verify the column was added
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'automation_campaigns' 
            AND column_name = 'completed_at'
        ) THEN '✅ completed_at column added successfully'
        ELSE '❌ completed_at column still missing'
    END as result;
