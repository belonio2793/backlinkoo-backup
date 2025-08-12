-- Fix for Missing Columns: started_at, completed_at, auto_start
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql/templates

ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;

-- Verify fix
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
AND column_name IN ('started_at', 'completed_at', 'auto_start');
