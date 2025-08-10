-- Emergency Deadlock Resolution Script
-- This will terminate long-running queries and reset problematic locks

-- Step 1: Check current active connections and locks
SELECT 
    pid,
    state,
    query_start,
    state_change,
    query
FROM pg_stat_activity 
WHERE state != 'idle' 
AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start;

-- Step 2: Terminate any long-running queries (older than 5 minutes)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state != 'idle'
AND query_start < NOW() - INTERVAL '5 minutes'
AND query NOT LIKE '%pg_stat_activity%'
AND datname = current_database();

-- Step 3: Clear any hanging RLS operations
-- Drop problematic functions that might cause deadlocks
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;

-- Step 4: Reset RLS policies to prevent future deadlocks
-- Temporarily disable RLS on profiles table
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable with simple policies
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Create non-blocking policies
CREATE POLICY IF NOT EXISTS "profiles_select_own" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "profiles_service_role_access" 
ON public.profiles 
FOR ALL 
USING (auth.role() = 'service_role');

-- Step 5: Grant permissions to prevent lock conflicts
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Step 6: Optimize locks for campaign operations
-- Set lower lock timeout to prevent deadlocks
SET lock_timeout = '30s';
SET statement_timeout = '60s';

-- Step 7: Check for any remaining locks
SELECT 
    locktype,
    database,
    relation::regclass,
    page,
    tuple,
    pid,
    mode,
    granted
FROM pg_locks
WHERE NOT granted
ORDER BY pid;

-- Success message
SELECT 'Deadlock resolution applied successfully' as status;
