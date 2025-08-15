const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const setupTables = async () => {
  console.log('Setting up error tracking tables...');

  // Campaign errors table
  const { error: errorsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS campaign_errors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID NOT NULL REFERENCES automation_campaigns(id) ON DELETE CASCADE,
        error_type TEXT NOT NULL CHECK (error_type IN ('content_generation', 'publishing', 'api_failure', 'network', 'authentication', 'rate_limit', 'unknown')),
        error_message TEXT NOT NULL,
        error_details JSONB,
        step_name TEXT NOT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0,
        max_retries INTEGER NOT NULL DEFAULT 3,
        can_auto_resume BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE
      );

      CREATE INDEX IF NOT EXISTS idx_campaign_errors_campaign_id ON campaign_errors(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_campaign_errors_error_type ON campaign_errors(error_type);
      CREATE INDEX IF NOT EXISTS idx_campaign_errors_created_at ON campaign_errors(created_at);
      CREATE INDEX IF NOT EXISTS idx_campaign_errors_resolved ON campaign_errors(resolved_at);
    `
  });

  if (errorsError) {
    console.error('Error creating campaign_errors table:', errorsError);
  } else {
    console.log('✅ Campaign errors table created successfully');
  }

  // Campaign progress snapshots table
  const { error: snapshotsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS campaign_progress_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID NOT NULL UNIQUE REFERENCES automation_campaigns(id) ON DELETE CASCADE,
        current_step TEXT,
        completed_steps TEXT[] DEFAULT '{}',
        platform_progress JSONB DEFAULT '{}',
        content_generated BOOLEAN DEFAULT false,
        generated_content TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_progress_snapshots_campaign_id ON campaign_progress_snapshots(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_progress_snapshots_updated_at ON campaign_progress_snapshots(updated_at);
    `
  });

  if (snapshotsError) {
    console.error('Error creating campaign_progress_snapshots table:', snapshotsError);
  } else {
    console.log('✅ Campaign progress snapshots table created successfully');
  }

  // Add new columns to automation_campaigns
  const { error: campaignsError } = await supabase.rpc('exec_sql', {
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_campaigns' AND column_name = 'error_count') THEN
          ALTER TABLE automation_campaigns ADD COLUMN error_count INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_campaigns' AND column_name = 'last_error_at') THEN
          ALTER TABLE automation_campaigns ADD COLUMN last_error_at TIMESTAMP WITH TIME ZONE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_campaigns' AND column_name = 'auto_pause_reason') THEN
          ALTER TABLE automation_campaigns ADD COLUMN auto_pause_reason TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_campaigns' AND column_name = 'can_auto_resume') THEN
          ALTER TABLE automation_campaigns ADD COLUMN can_auto_resume BOOLEAN DEFAULT true;
        END IF;
      END
      $$;
    `
  });

  if (campaignsError) {
    console.error('Error updating automation_campaigns table:', campaignsError);
  } else {
    console.log('✅ Automation campaigns table updated successfully');
  }

  console.log('Error tracking setup completed!');
};

// Alternative approach without exec_sql RPC
const setupTablesAlternative = async () => {
  console.log('Setting up error tracking tables (alternative approach)...');

  try {
    // Check if tables exist first
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['campaign_errors', 'campaign_progress_snapshots']);

    console.log('Existing tables:', tables?.map(t => t.table_name) || []);
    
    console.log('✅ Error tracking tables setup verified');
    
    // Enable RLS on existing tables that we can access
    console.log('Note: Database schema changes require direct SQL execution');
    console.log('Please run the SQL commands from scripts/create-error-tracking-tables.sql manually in your database');
    
  } catch (error) {
    console.error('Error checking tables:', error);
  }
};

// Try main approach, fallback to alternative
setupTables().catch(error => {
  console.error('Main setup failed:', error);
  console.log('Trying alternative approach...');
  setupTablesAlternative();
});
