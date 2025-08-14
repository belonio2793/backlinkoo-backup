-- 🚨 EMERGENCY AUTOMATION SCHEMA FIX
-- Run this immediately in Supabase SQL Editor to fix automation_campaigns table

-- Step 1: Create the automation_campaigns table if it doesn't exist
CREATE TABLE IF NOT EXISTS automation_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_url TEXT NOT NULL,
    engine_type TEXT DEFAULT 'guest_posting',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'error')),
    keywords TEXT[] NOT NULL DEFAULT '{}',
    anchor_texts TEXT[] NOT NULL DEFAULT '{}',
    target_sites_used TEXT[] DEFAULT '{}',
    published_articles JSONB DEFAULT '[]'::jsonb,
    links_built INTEGER DEFAULT 0,
    available_sites INTEGER DEFAULT 0,
    daily_limit INTEGER DEFAULT 10,
    current_platform TEXT,
    execution_progress JSONB DEFAULT '{}'::jsonb,
    auto_start BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Step 2: Add missing columns if table already exists
DO $$
BEGIN
    -- Add started_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'started_at'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN started_at TIMESTAMPTZ;
        RAISE NOTICE 'Added started_at column';
    END IF;

    -- Add completed_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN completed_at TIMESTAMPTZ;
        RAISE NOTICE 'Added completed_at column';
    END IF;

    -- Add auto_start column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'auto_start'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN auto_start BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added auto_start column';
    END IF;

    -- Add keywords column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'keywords'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN keywords TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added keywords column';
    END IF;

    -- Add anchor_texts column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'anchor_texts'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN anchor_texts TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added anchor_texts column';
    END IF;

    -- Add target_sites_used column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'target_sites_used'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN target_sites_used TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added target_sites_used column';
    END IF;

    -- Add published_articles column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'published_articles'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN published_articles JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added published_articles column';
    END IF;

    -- Add links_built column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'links_built'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN links_built INTEGER DEFAULT 0;
        RAISE NOTICE 'Added links_built column';
    END IF;

    -- Add available_sites column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'available_sites'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN available_sites INTEGER DEFAULT 0;
        RAISE NOTICE 'Added available_sites column';
    END IF;

    -- Add current_platform column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'current_platform'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN current_platform TEXT;
        RAISE NOTICE 'Added current_platform column';
    END IF;

    -- Add execution_progress column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'execution_progress'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN execution_progress JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added execution_progress column';
    END IF;

    -- Add engine_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'engine_type'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN engine_type TEXT DEFAULT 'guest_posting';
        RAISE NOTICE 'Added engine_type column';
    END IF;

    -- Add daily_limit column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'daily_limit'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN daily_limit INTEGER DEFAULT 10;
        RAISE NOTICE 'Added daily_limit column';
    END IF;

END $$;

-- Step 3: Create exec_sql function for application usage (drop existing first)
DROP FUNCTION IF EXISTS exec_sql(text);
DROP FUNCTION IF EXISTS public.exec_sql(text);

CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
RETURNS TABLE(result TEXT) AS $$
BEGIN
    RETURN QUERY EXECUTE query;
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT SQLSTATE || ': ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO anon;

-- Step 4: Enable Row Level Security
ALTER TABLE automation_campaigns ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
DROP POLICY IF EXISTS "Users can view their own campaigns" ON automation_campaigns;
DROP POLICY IF EXISTS "Users can create their own campaigns" ON automation_campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON automation_campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON automation_campaigns;

CREATE POLICY "Users can view their own campaigns" ON automation_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" ON automation_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON automation_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON automation_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Step 6: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_user_id ON automation_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_status ON automation_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_created_at ON automation_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_started_at ON automation_campaigns(started_at);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_completed_at ON automation_campaigns(completed_at);

-- Step 7: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_automation_campaigns_updated_at ON automation_campaigns;
CREATE TRIGGER update_automation_campaigns_updated_at
    BEFORE UPDATE ON automation_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Verification
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'automation_campaigns'
    AND column_name IN (
        'started_at', 'completed_at', 'auto_start', 'keywords', 
        'anchor_texts', 'target_sites_used', 'published_articles',
        'links_built', 'available_sites', 'current_platform',
        'execution_progress', 'engine_type', 'daily_limit'
    );
    
    RAISE NOTICE '✅ AUTOMATION SCHEMA FIX COMPLETE: % required columns verified', col_count;
    
    IF col_count >= 13 THEN
        RAISE NOTICE '🎉 SUCCESS: All automation_campaigns columns are now available!';
    ELSE
        RAISE NOTICE '⚠️ WARNING: Only % out of 13 required columns found', col_count;
    END IF;
END $$;

-- Final verification query - uncomment to test
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'automation_campaigns' 
-- ORDER BY column_name;
