/**
 * Emergency Schema Fix for Campaign Creation Error
 * 
 * Fixes the "expected JSON array" error by adding missing columns
 * to the automation_campaigns table that the code expects.
 */

import { supabase } from './src/integrations/supabase/client.js';

const SCHEMA_FIX_SQL = `
-- Fix automation_campaigns table schema to match application expectations
-- Add missing columns: links_built, available_sites, target_sites_used, published_articles

DO $$ 
BEGIN
    -- Add links_built column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'links_built') THEN
        ALTER TABLE automation_campaigns ADD COLUMN links_built INTEGER DEFAULT 0;
        RAISE NOTICE 'Added links_built column';
    ELSE
        RAISE NOTICE 'links_built column already exists';
    END IF;

    -- Add available_sites column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'available_sites') THEN
        ALTER TABLE automation_campaigns ADD COLUMN available_sites INTEGER DEFAULT 0;
        RAISE NOTICE 'Added available_sites column';
    ELSE
        RAISE NOTICE 'available_sites column already exists';
    END IF;

    -- Add target_sites_used column (TEXT array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'target_sites_used') THEN
        ALTER TABLE automation_campaigns ADD COLUMN target_sites_used TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added target_sites_used column';
    ELSE
        RAISE NOTICE 'target_sites_used column already exists';
    END IF;

    -- Add published_articles column (JSONB array for article data)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'published_articles') THEN
        ALTER TABLE automation_campaigns ADD COLUMN published_articles JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added published_articles column';
    ELSE
        RAISE NOTICE 'published_articles column already exists';
    END IF;

    -- Add started_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'started_at') THEN
        ALTER TABLE automation_campaigns ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added started_at column';
    ELSE
        RAISE NOTICE 'started_at column already exists';
    END IF;

    -- Add current_platform column for tracking current execution platform
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'current_platform') THEN
        ALTER TABLE automation_campaigns ADD COLUMN current_platform TEXT;
        RAISE NOTICE 'Added current_platform column';
    ELSE
        RAISE NOTICE 'current_platform column already exists';
    END IF;

    -- Add execution_progress column for tracking progress data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'execution_progress') THEN
        ALTER TABLE automation_campaigns ADD COLUMN execution_progress JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added execution_progress column';
    ELSE
        RAISE NOTICE 'execution_progress column already exists';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_links_built ON automation_campaigns(links_built);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_available_sites ON automation_campaigns(available_sites);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_started_at ON automation_campaigns(started_at);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_current_platform ON automation_campaigns(current_platform);

-- Update existing records to have proper default values
UPDATE automation_campaigns 
SET 
    links_built = COALESCE(links_built, 0),
    available_sites = COALESCE(available_sites, 0),
    target_sites_used = COALESCE(target_sites_used, '{}'),
    published_articles = COALESCE(published_articles, '[]'::jsonb),
    execution_progress = COALESCE(execution_progress, '{}'::jsonb)
WHERE 
    links_built IS NULL OR 
    available_sites IS NULL OR 
    target_sites_used IS NULL OR 
    published_articles IS NULL OR
    execution_progress IS NULL;

-- Verify the schema fix
SELECT 
    'automation_campaigns table schema verification:' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns';

-- Show the new columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
  AND column_name IN ('links_built', 'available_sites', 'target_sites_used', 'published_articles', 'started_at', 'current_platform', 'execution_progress')
ORDER BY column_name;
`;

async function fixCampaignSchema() {
  console.log('🔧 Fixing automation_campaigns schema...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: SCHEMA_FIX_SQL 
    });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Schema fix completed successfully!');
    console.log('📊 Result:', data);
    
    // Test the fix by checking column existence
    console.log('\n🔍 Verifying schema fix...');
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'automation_campaigns')
      .in('column_name', ['links_built', 'available_sites', 'target_sites_used', 'published_articles', 'started_at']);
    
    if (columnError) {
      console.warn('⚠️ Could not verify columns:', columnError.message);
    } else {
      console.log('✅ Verified columns:', columns);
    }
    
    console.log('\n🎯 Campaign creation should now work properly!');
    console.log('💡 Try creating a campaign again to test the fix.');
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error);
    console.error('💡 You may need to run the SQL manually in Supabase dashboard');
    
    console.log('\n📋 Manual SQL to run in Supabase SQL Editor:');
    console.log('=====================================');
    console.log(SCHEMA_FIX_SQL);
    console.log('=====================================');
  }
}

// Run the fix
fixCampaignSchema().catch(console.error);
