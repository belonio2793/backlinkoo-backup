-- =============================================================================
-- AFFILIATE PROGRAM DATABASE DIAGNOSTIC
-- Check current state and identify missing components
-- =============================================================================

-- Check if affiliate tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename LIKE '%affiliate%'
ORDER BY tablename;

-- Check profiles table structure (if exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing affiliate_profiles table structure (if exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'affiliate_profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for RLS policies on affiliate tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename LIKE '%affiliate%'
ORDER BY tablename, policyname;

-- Check for foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name LIKE '%affiliate%';

-- Check functions related to affiliate
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%affiliate%'
    OR routine_definition LIKE '%affiliate%'
ORDER BY routine_name;

-- Sample data check
SELECT 'affiliate_profiles' as table_name, COUNT(*) as row_count 
FROM public.affiliate_profiles
UNION ALL
SELECT 'affiliate_referrals', COUNT(*) 
FROM public.affiliate_referrals
UNION ALL
SELECT 'affiliate_commissions', COUNT(*) 
FROM public.affiliate_commissions
UNION ALL
SELECT 'affiliate_settings', COUNT(*) 
FROM public.affiliate_settings;

-- Check current app_role enum values
SELECT 
    t.typname,
    e.enumlabel
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'app_role'
ORDER BY e.enumsortorder;

-- Diagnostic summary
SELECT 
    'Database Diagnostic Complete' as status,
    'Check results above for missing components' as next_step;
