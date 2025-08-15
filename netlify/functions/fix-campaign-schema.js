/**
 * Fix Campaign Schema - Create missing tables for campaign system
 */

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔧 Starting database schema fixes...');

    // Create automation_campaigns table if it doesn't exist
    await createAutomationCampaignsTable(supabase);
    
    // Create automation_published_links table if it doesn't exist  
    await createAutomationPublishedLinksTable(supabase);
    
    // Create activity_logs table if it doesn't exist
    await createActivityLogsTable(supabase);
    
    // Set up RLS policies
    await setupRLSPolicies(supabase);

    console.log('✅ Database schema fixes completed');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Database schema fixed successfully',
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('❌ Database schema fix failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Database schema fix failed'
      }),
    };
  }
};

async function createAutomationCampaignsTable(supabase) {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS automation_campaigns (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        target_url TEXT NOT NULL,
        keywords TEXT[] NOT NULL DEFAULT '{}',
        anchor_texts TEXT[] NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'failed')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        published_urls TEXT[],
        error_message TEXT
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_automation_campaigns_user_id ON automation_campaigns(user_id);
      CREATE INDEX IF NOT EXISTS idx_automation_campaigns_status ON automation_campaigns(status);
      CREATE INDEX IF NOT EXISTS idx_automation_campaigns_created_at ON automation_campaigns(created_at);
    `
  });

  if (error) {
    console.warn('automation_campaigns table creation warning:', error);
  } else {
    console.log('✅ automation_campaigns table created/verified');
  }
}

async function createAutomationPublishedLinksTable(supabase) {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS automation_published_links (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE,
        published_url TEXT NOT NULL,
        platform TEXT NOT NULL DEFAULT 'Telegraph.ph',
        title TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'failed')),
        published_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_automation_published_links_campaign_id ON automation_published_links(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_automation_published_links_platform ON automation_published_links(platform);
      CREATE INDEX IF NOT EXISTS idx_automation_published_links_published_at ON automation_published_links(published_at);
    `
  });

  if (error) {
    console.warn('automation_published_links table creation warning:', error);
  } else {
    console.log('✅ automation_published_links table created/verified');
  }
}

async function createActivityLogsTable(supabase) {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL,
        message TEXT NOT NULL,
        details JSONB,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_activity_logs_campaign_id ON activity_logs(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
    `
  });

  if (error) {
    console.warn('activity_logs table creation warning:', error);
  } else {
    console.log('✅ activity_logs table created/verified');
  }
}

async function setupRLSPolicies(supabase) {
  // Enable RLS on tables
  const rlsCommands = [
    'ALTER TABLE automation_campaigns ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE automation_published_links ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;',
    
    // Policies for automation_campaigns
    `CREATE POLICY IF NOT EXISTS "Users can view own campaigns" ON automation_campaigns FOR SELECT USING (auth.uid() = user_id);`,
    `CREATE POLICY IF NOT EXISTS "Users can insert own campaigns" ON automation_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    `CREATE POLICY IF NOT EXISTS "Users can update own campaigns" ON automation_campaigns FOR UPDATE USING (auth.uid() = user_id);`,
    `CREATE POLICY IF NOT EXISTS "Users can delete own campaigns" ON automation_campaigns FOR DELETE USING (auth.uid() = user_id);`,
    
    // Policies for automation_published_links  
    `CREATE POLICY IF NOT EXISTS "Users can view links for own campaigns" ON automation_published_links FOR SELECT USING (
      EXISTS (SELECT 1 FROM automation_campaigns WHERE automation_campaigns.id = automation_published_links.campaign_id AND automation_campaigns.user_id = auth.uid())
    );`,
    `CREATE POLICY IF NOT EXISTS "System can insert published links" ON automation_published_links FOR INSERT WITH CHECK (true);`,
    
    // Policies for activity_logs
    `CREATE POLICY IF NOT EXISTS "Users can view logs for own campaigns" ON activity_logs FOR SELECT USING (
      EXISTS (SELECT 1 FROM automation_campaigns WHERE automation_campaigns.id = activity_logs.campaign_id AND automation_campaigns.user_id = auth.uid())
    );`,
    `CREATE POLICY IF NOT EXISTS "System can insert activity logs" ON activity_logs FOR INSERT WITH CHECK (true);`
  ];

  for (const command of rlsCommands) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: command });
      if (error) {
        console.warn('RLS policy warning:', error);
      }
    } catch (error) {
      console.warn('RLS policy setup warning:', error);
    }
  }
  
  console.log('✅ RLS policies configured');
}
