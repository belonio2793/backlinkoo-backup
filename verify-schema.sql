-- ===================================================================
-- VERIFY IF SQL COMMANDS WERE EXECUTED SUCCESSFULLY
-- ===================================================================
-- Run this in Supabase SQL Editor to check if columns were added

-- Check 1: Verify automation_campaigns table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check 2: Specifically look for the started_at column
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'automation_campaigns' 
            AND column_name = 'started_at'
        ) THEN '✅ started_at column EXISTS'
        ELSE '❌ started_at column MISSING'
    END as started_at_status;

-- Check 3: Test if we can query the started_at column
SELECT 
    id, 
    name, 
    status, 
    started_at, 
    created_at
FROM automation_campaigns 
LIMIT 3;

-- Check 4: Verify indexes were created
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'automation_campaigns'
AND indexname LIKE '%started_at%';
