-- ==========================================
-- FIX FOR EXISTING POLICY CONFLICTS
-- ==========================================
-- Run this BEFORE running the main setup script if you get policy errors

-- Drop existing policies that might conflict
DO $$ 
DECLARE
    pol record;
    tables_to_clean text[] := ARRAY[
        'campaign_runtime_metrics',
        'user_monthly_link_aggregates', 
        'campaign_link_history',
        'profiles',
        'blog_posts',
        'user_saved_posts',
        'ai_generated_posts',
        'admin_environment_variables',
        'user_audit_log',
        'error_logs',
        'premium_subscriptions',
        'premium_feature_usage',
        'saved_backlink_reports'
    ];
    table_name text;
BEGIN
    FOR table_name IN SELECT unnest(tables_to_clean)
    LOOP
        -- Check if table exists first
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) THEN
            -- Drop all policies for this table
            FOR pol IN 
                SELECT policyname FROM pg_policies 
                WHERE tablename = table_name AND schemaname = 'public'
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, table_name);
                RAISE NOTICE 'Dropped policy % on table %', pol.policyname, table_name;
            END LOOP;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'All existing policies have been cleaned up. You can now run the main setup script.';
END $$;
