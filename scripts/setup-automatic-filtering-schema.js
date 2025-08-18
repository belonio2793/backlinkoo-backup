#!/usr/bin/env node

/**
 * Setup Automatic Filtering Schema
 * Creates database tables for real-time platform filtering and monitoring
 */

const { createClient } = require('@supabase/supabase-js');

async function setupAutomaticFilteringSchema() {
  console.log('🔧 Setting up automatic platform filtering database schema...');

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Create publishing_attempts table
    console.log('📝 Creating publishing_attempts table...');
    
    const { error: attemptsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS publishing_attempts (
          id TEXT PRIMARY KEY,
          campaign_id TEXT NOT NULL,
          platform_id TEXT NOT NULL,
          platform_name TEXT NOT NULL,
          domain TEXT NOT NULL,
          target_url TEXT NOT NULL,
          keyword TEXT,
          anchor_text TEXT,
          status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'timeout', 'error')),
          error_message TEXT,
          response_time INTEGER,
          published_url TEXT,
          attempted_at TIMESTAMP WITH TIME ZONE NOT NULL,
          completed_at TIMESTAMP WITH TIME ZONE,
          retry_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_publishing_attempts_platform_id ON publishing_attempts(platform_id);
        CREATE INDEX IF NOT EXISTS idx_publishing_attempts_campaign_id ON publishing_attempts(campaign_id);
        CREATE INDEX IF NOT EXISTS idx_publishing_attempts_status ON publishing_attempts(status);
        CREATE INDEX IF NOT EXISTS idx_publishing_attempts_attempted_at ON publishing_attempts(attempted_at);
        CREATE INDEX IF NOT EXISTS idx_publishing_attempts_domain ON publishing_attempts(domain);

        -- Add comments
        COMMENT ON TABLE publishing_attempts IS 'Tracks all publishing attempts for automatic filtering';
        COMMENT ON COLUMN publishing_attempts.status IS 'Status of the publishing attempt';
        COMMENT ON COLUMN publishing_attempts.response_time IS 'Time taken for the publishing attempt in milliseconds';
        COMMENT ON COLUMN publishing_attempts.retry_count IS 'Number of retry attempts made';
      `
    });

    if (attemptsError) {
      console.error('❌ Error creating publishing_attempts table:', attemptsError);
    } else {
      console.log('✅ publishing_attempts table created successfully');
    }

    // Step 2: Create platform_temporary_disables table
    console.log('⏸️ Creating platform_temporary_disables table...');
    
    const { error: disablesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS platform_temporary_disables (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          platform_id TEXT NOT NULL,
          domain TEXT NOT NULL,
          reason TEXT NOT NULL,
          disabled_until TIMESTAMP WITH TIME ZONE NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_platform_temporary_disables_platform_id ON platform_temporary_disables(platform_id);
        CREATE INDEX IF NOT EXISTS idx_platform_temporary_disables_is_active ON platform_temporary_disables(is_active);
        CREATE INDEX IF NOT EXISTS idx_platform_temporary_disables_disabled_until ON platform_temporary_disables(disabled_until);

        -- Add comments
        COMMENT ON TABLE platform_temporary_disables IS 'Platforms temporarily disabled due to failures';
        COMMENT ON COLUMN platform_temporary_disables.disabled_until IS 'When the platform will be re-enabled';
      `
    });

    if (disablesError) {
      console.error('❌ Error creating platform_temporary_disables table:', disablesError);
    } else {
      console.log('✅ platform_temporary_disables table created successfully');
    }

    // Step 3: Create platform_reliability_scores table
    console.log('📊 Creating platform_reliability_scores table...');
    
    const { error: reliabilityError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS platform_reliability_scores (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          platform_id TEXT NOT NULL UNIQUE,
          domain TEXT NOT NULL,
          reliability_score INTEGER NOT NULL CHECK (reliability_score >= 0 AND reliability_score <= 100),
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_platform_reliability_scores_platform_id ON platform_reliability_scores(platform_id);
        CREATE INDEX IF NOT EXISTS idx_platform_reliability_scores_score ON platform_reliability_scores(reliability_score);

        -- Add comments
        COMMENT ON TABLE platform_reliability_scores IS 'Reliability scores for platforms based on performance';
        COMMENT ON COLUMN platform_reliability_scores.reliability_score IS 'Score from 0-100, higher is more reliable';
      `
    });

    if (reliabilityError) {
      console.error('❌ Error creating platform_reliability_scores table:', reliabilityError);
    } else {
      console.log('✅ platform_reliability_scores table created successfully');
    }

    // Step 4: Create platform_filtering_log table
    console.log('📜 Creating platform_filtering_log table...');
    
    const { error: logError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS platform_filtering_log (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          platform_id TEXT NOT NULL,
          platform_name TEXT NOT NULL,
          domain TEXT NOT NULL,
          action TEXT NOT NULL CHECK (action IN ('blacklist', 'temporary_disable', 'mark_unreliable')),
          reason TEXT NOT NULL,
          campaign_id TEXT,
          failed_attempt_id TEXT,
          error_message TEXT,
          filtered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_platform_filtering_log_platform_id ON platform_filtering_log(platform_id);
        CREATE INDEX IF NOT EXISTS idx_platform_filtering_log_action ON platform_filtering_log(action);
        CREATE INDEX IF NOT EXISTS idx_platform_filtering_log_filtered_at ON platform_filtering_log(filtered_at);

        -- Add comments
        COMMENT ON TABLE platform_filtering_log IS 'Audit log of all automatic filtering actions';
        COMMENT ON COLUMN platform_filtering_log.action IS 'Type of filtering action taken';
      `
    });

    if (logError) {
      console.error('❌ Error creating platform_filtering_log table:', logError);
    } else {
      console.log('✅ platform_filtering_log table created successfully');
    }

    // Step 5: Update platform_blacklist table with auto-filtering columns
    console.log('🔄 Updating platform_blacklist table...');
    
    const { error: blacklistUpdateError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add auto-filtering columns to existing blacklist table
        ALTER TABLE platform_blacklist 
        ADD COLUMN IF NOT EXISTS auto_filtered BOOLEAN DEFAULT false;
        
        ALTER TABLE platform_blacklist 
        ADD COLUMN IF NOT EXISTS filter_rule TEXT;

        -- Add comments
        COMMENT ON COLUMN platform_blacklist.auto_filtered IS 'Whether this was automatically blacklisted';
        COMMENT ON COLUMN platform_blacklist.filter_rule IS 'Which filtering rule triggered the blacklist';
      `
    });

    if (blacklistUpdateError) {
      console.error('❌ Error updating platform_blacklist table:', blacklistUpdateError);
    } else {
      console.log('✅ platform_blacklist table updated successfully');
    }

    // Step 6: Create automatic filtering views
    console.log('📈 Creating filtering statistics views...');
    
    const { error: viewsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Platform performance view
        CREATE OR REPLACE VIEW platform_performance AS
        SELECT 
          pa.platform_id,
          pa.platform_name,
          pa.domain,
          COUNT(*) as total_attempts,
          COUNT(*) FILTER (WHERE pa.status = 'success') as successful_attempts,
          COUNT(*) FILTER (WHERE pa.status IN ('failed', 'timeout', 'error')) as failed_attempts,
          ROUND(
            (COUNT(*) FILTER (WHERE pa.status = 'success')::FLOAT / COUNT(*)) * 100, 
            2
          ) as success_rate,
          AVG(pa.response_time) FILTER (WHERE pa.status = 'success') as avg_response_time,
          MAX(pa.attempted_at) as last_attempt,
          pb.is_active as is_blacklisted,
          ptd.disabled_until,
          prs.reliability_score
        FROM publishing_attempts pa
        LEFT JOIN platform_blacklist pb ON pa.platform_id = pb.platform_id AND pb.is_active = true
        LEFT JOIN platform_temporary_disables ptd ON pa.platform_id = ptd.platform_id 
          AND ptd.is_active = true AND ptd.disabled_until > NOW()
        LEFT JOIN platform_reliability_scores prs ON pa.platform_id = prs.platform_id
        WHERE pa.attempted_at >= NOW() - INTERVAL '7 days'
        GROUP BY pa.platform_id, pa.platform_name, pa.domain, pb.is_active, ptd.disabled_until, prs.reliability_score
        ORDER BY success_rate DESC, avg_response_time ASC;

        -- Filtering actions summary view
        CREATE OR REPLACE VIEW filtering_actions_summary AS
        SELECT 
          action,
          COUNT(*) as action_count,
          COUNT(DISTINCT platform_id) as unique_platforms,
          MIN(filtered_at) as first_action,
          MAX(filtered_at) as last_action
        FROM platform_filtering_log
        WHERE filtered_at >= NOW() - INTERVAL '30 days'
        GROUP BY action
        ORDER BY action_count DESC;

        -- Platform health dashboard view
        CREATE OR REPLACE VIEW platform_health_dashboard AS
        SELECT 
          pp.platform_id,
          pp.platform_name,
          pp.domain,
          pp.total_attempts,
          pp.success_rate,
          pp.avg_response_time,
          CASE 
            WHEN pp.is_blacklisted = true THEN 'blacklisted'
            WHEN pp.disabled_until IS NOT NULL THEN 'temporarily_disabled'
            WHEN pp.success_rate < 50 THEN 'unreliable'
            WHEN pp.success_rate >= 90 THEN 'excellent'
            WHEN pp.success_rate >= 75 THEN 'good'
            ELSE 'fair'
          END as health_status,
          pp.last_attempt
        FROM platform_performance pp
        WHERE pp.total_attempts >= 3;

        COMMENT ON VIEW platform_performance IS 'Comprehensive platform performance metrics';
        COMMENT ON VIEW filtering_actions_summary IS 'Summary of filtering actions taken';
        COMMENT ON VIEW platform_health_dashboard IS 'Overall platform health status';
      `
    });

    if (viewsError) {
      console.error('❌ Error creating filtering views:', viewsError);
    } else {
      console.log('✅ Filtering statistics views created successfully');
    }

    // Step 7: Create automatic cleanup function
    console.log('🧹 Creating automatic cleanup function...');
    
    const { error: cleanupError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION cleanup_old_publishing_attempts()
        RETURNS INTEGER AS $$
        DECLARE
          deleted_count INTEGER;
        BEGIN
          -- Delete publishing attempts older than 30 days
          DELETE FROM publishing_attempts 
          WHERE attempted_at < NOW() - INTERVAL '30 days';
          
          GET DIAGNOSTICS deleted_count = ROW_COUNT;
          
          -- Re-enable platforms that have been temporarily disabled past their time
          UPDATE platform_temporary_disables 
          SET is_active = false 
          WHERE disabled_until <= NOW() AND is_active = true;
          
          RETURN deleted_count;
        END;
        $$ LANGUAGE plpgsql;

        COMMENT ON FUNCTION cleanup_old_publishing_attempts() IS 'Cleans up old publishing attempts and expired temporary disables';
      `
    });

    if (cleanupError) {
      console.error('❌ Error creating cleanup function:', cleanupError);
    } else {
      console.log('✅ Automatic cleanup function created successfully');
    }

    // Step 8: Set up RLS policies
    console.log('🔒 Setting up Row Level Security policies...');
    
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS on new tables
        ALTER TABLE publishing_attempts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE platform_temporary_disables ENABLE ROW LEVEL SECURITY;
        ALTER TABLE platform_reliability_scores ENABLE ROW LEVEL SECURITY;
        ALTER TABLE platform_filtering_log ENABLE ROW LEVEL SECURITY;

        -- Allow all operations for authenticated users (admin access)
        CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON publishing_attempts
          FOR ALL USING (auth.role() = 'authenticated');

        CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON platform_temporary_disables
          FOR ALL USING (auth.role() = 'authenticated');

        CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON platform_reliability_scores
          FOR ALL USING (auth.role() = 'authenticated');

        CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON platform_filtering_log
          FOR ALL USING (auth.role() = 'authenticated');

        -- Allow read access for anonymous users (for public stats)
        CREATE POLICY IF NOT EXISTS "Allow read for anonymous" ON publishing_attempts
          FOR SELECT USING (true);

        CREATE POLICY IF NOT EXISTS "Allow read for anonymous" ON platform_filtering_log
          FOR SELECT USING (true);
      `
    });

    if (rlsError) {
      console.error('❌ Error setting up RLS policies:', rlsError);
    } else {
      console.log('✅ Row Level Security policies configured successfully');
    }

    // Step 9: Insert sample data
    console.log('📝 Inserting sample filtering data...');
    
    const sampleAttempts = [
      {
        id: 'attempt_sample_1',
        campaign_id: 'campaign_test_1',
        platform_id: 'telegraph',
        platform_name: 'Telegraph.ph',
        domain: 'telegra.ph',
        target_url: 'https://example.com',
        keyword: 'test keyword',
        anchor_text: 'test link',
        status: 'success',
        response_time: 1250,
        published_url: 'https://telegra.ph/Test-Sample-12-28',
        attempted_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      },
      {
        id: 'attempt_sample_2',
        campaign_id: 'campaign_test_1',
        platform_id: 'medium',
        platform_name: 'Medium.com',
        domain: 'medium.com',
        target_url: 'https://example.com',
        keyword: 'test keyword',
        anchor_text: 'test link',
        status: 'failed',
        error_message: 'Authentication required - OAuth not configured',
        attempted_at: new Date(Date.now() - 60000).toISOString(),
        completed_at: new Date().toISOString()
      }
    ];

    const { error: sampleError } = await supabase
      .from('publishing_attempts')
      .insert(sampleAttempts);

    if (sampleError) {
      console.warn('⚠️ Could not insert sample data:', sampleError.message);
    } else {
      console.log('✅ Sample filtering data inserted successfully');
    }

    console.log('\n🎉 Automatic platform filtering schema setup completed successfully!');
    console.log('\n📊 Created tables:');
    console.log('  • publishing_attempts - Tracks all publishing attempts');
    console.log('  • platform_temporary_disables - Temporarily disabled platforms');
    console.log('  • platform_reliability_scores - Platform reliability tracking');
    console.log('  • platform_filtering_log - Audit log of filtering actions');
    console.log('\n📈 Created views:');
    console.log('  • platform_performance - Performance metrics per platform');
    console.log('  • filtering_actions_summary - Summary of filtering actions');
    console.log('  • platform_health_dashboard - Overall platform health');
    console.log('\n🔧 Created functions:');
    console.log('  • cleanup_old_publishing_attempts() - Automatic cleanup');
    console.log('\n🔒 Security:');
    console.log('  • Row Level Security enabled on all tables');
    console.log('  • Authenticated users have full access');
    console.log('  • Anonymous users have read-only access for public stats');

    return true;

  } catch (error) {
    console.error('❌ Automatic filtering schema setup failed:', error);
    return false;
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupAutomaticFilteringSchema().then(success => {
    if (success) {
      console.log('\n✅ Automatic platform filtering database schema ready!');
      console.log('The system will now automatically filter failed platforms in real-time.');
    } else {
      console.log('\n❌ Schema setup failed. Please check the errors above.');
      process.exit(1);
    }
  });
}

module.exports = { 
  setupAutomaticFilteringSchema
};
