#!/usr/bin/env node

/**
 * Setup Platform Testing Schema
 * Creates database tables for platform testing results and blacklisting
 */

const { createClient } = require('@supabase/supabase-js');

async function setupPlatformTestingSchema() {
  console.log('🛠️ Setting up platform testing database schema...');

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Create platform_test_results table
    console.log('📊 Creating platform_test_results table...');
    
    const { error: testResultsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS platform_test_results (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          platform_id TEXT NOT NULL,
          platform_name TEXT NOT NULL,
          domain TEXT NOT NULL,
          is_working BOOLEAN NOT NULL DEFAULT false,
          response_time INTEGER DEFAULT 0,
          error_message TEXT,
          published_url TEXT,
          status_code INTEGER,
          test_keyword TEXT,
          test_anchor_text TEXT,
          test_target_url TEXT,
          tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_platform_test_results_platform_id ON platform_test_results(platform_id);
        CREATE INDEX IF NOT EXISTS idx_platform_test_results_is_working ON platform_test_results(is_working);
        CREATE INDEX IF NOT EXISTS idx_platform_test_results_tested_at ON platform_test_results(tested_at);
        CREATE INDEX IF NOT EXISTS idx_platform_test_results_domain ON platform_test_results(domain);

        -- Add comments
        COMMENT ON TABLE platform_test_results IS 'Stores results from platform testing campaigns';
        COMMENT ON COLUMN platform_test_results.is_working IS 'Whether the platform successfully published content';
        COMMENT ON COLUMN platform_test_results.response_time IS 'Response time in milliseconds';
        COMMENT ON COLUMN platform_test_results.status_code IS 'HTTP status code from verification request';
      `
    });

    if (testResultsError) {
      console.error('❌ Error creating platform_test_results table:', testResultsError);
    } else {
      console.log('✅ platform_test_results table created successfully');
    }

    // Step 2: Create platform_blacklist table
    console.log('🚫 Creating platform_blacklist table...');
    
    const { error: blacklistError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS platform_blacklist (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          platform_id TEXT NOT NULL UNIQUE,
          domain TEXT NOT NULL,
          reason TEXT NOT NULL,
          failure_count INTEGER DEFAULT 1,
          last_failure TIMESTAMP WITH TIME ZONE NOT NULL,
          blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_platform_blacklist_platform_id ON platform_blacklist(platform_id);
        CREATE INDEX IF NOT EXISTS idx_platform_blacklist_is_active ON platform_blacklist(is_active);
        CREATE INDEX IF NOT EXISTS idx_platform_blacklist_domain ON platform_blacklist(domain);
        CREATE INDEX IF NOT EXISTS idx_platform_blacklist_blacklisted_at ON platform_blacklist(blacklisted_at);

        -- Add comments
        COMMENT ON TABLE platform_blacklist IS 'Tracks platforms that failed testing and should be excluded from campaigns';
        COMMENT ON COLUMN platform_blacklist.platform_id IS 'Unique identifier for the platform';
        COMMENT ON COLUMN platform_blacklist.failure_count IS 'Number of consecutive failures';
        COMMENT ON COLUMN platform_blacklist.is_active IS 'Whether the blacklist entry is still active';
      `
    });

    if (blacklistError) {
      console.error('❌ Error creating platform_blacklist table:', blacklistError);
    } else {
      console.log('✅ platform_blacklist table created successfully');
    }

    // Step 3: Create platform_stats view for easy querying
    console.log('📈 Creating platform_stats view...');
    
    const { error: viewError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE VIEW platform_stats AS
        SELECT 
          ptr.platform_id,
          ptr.platform_name,
          ptr.domain,
          COUNT(*) as total_tests,
          COUNT(*) FILTER (WHERE ptr.is_working = true) as successful_tests,
          COUNT(*) FILTER (WHERE ptr.is_working = false) as failed_tests,
          ROUND(
            (COUNT(*) FILTER (WHERE ptr.is_working = true)::FLOAT / COUNT(*)) * 100, 
            2
          ) as success_rate,
          AVG(ptr.response_time) FILTER (WHERE ptr.is_working = true) as avg_response_time,
          MAX(ptr.tested_at) as last_tested,
          pb.is_active as is_blacklisted
        FROM platform_test_results ptr
        LEFT JOIN platform_blacklist pb ON ptr.platform_id = pb.platform_id
        GROUP BY ptr.platform_id, ptr.platform_name, ptr.domain, pb.is_active
        ORDER BY success_rate DESC, avg_response_time ASC;

        COMMENT ON VIEW platform_stats IS 'Aggregated statistics for platform testing results';
      `
    });

    if (viewError) {
      console.error('❌ Error creating platform_stats view:', viewError);
    } else {
      console.log('✅ platform_stats view created successfully');
    }

    // Step 4: Create function to automatically blacklist failed platforms
    console.log('🔧 Creating auto-blacklist function...');
    
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION auto_blacklist_failed_platforms()
        RETURNS TRIGGER AS $$
        BEGIN
          -- If the platform test failed, check if it should be blacklisted
          IF NEW.is_working = false THEN
            -- Count recent failures (last 3 tests)
            DECLARE
              recent_failures INTEGER;
            BEGIN
              SELECT COUNT(*) INTO recent_failures
              FROM (
                SELECT is_working 
                FROM platform_test_results 
                WHERE platform_id = NEW.platform_id 
                ORDER BY tested_at DESC 
                LIMIT 3
              ) recent_tests
              WHERE is_working = false;

              -- If 3 consecutive failures, blacklist the platform
              IF recent_failures >= 3 THEN
                INSERT INTO platform_blacklist (
                  platform_id, 
                  domain, 
                  reason, 
                  failure_count, 
                  last_failure
                ) VALUES (
                  NEW.platform_id,
                  NEW.domain,
                  COALESCE(NEW.error_message, 'Consecutive test failures'),
                  recent_failures,
                  NEW.tested_at
                )
                ON CONFLICT (platform_id) 
                DO UPDATE SET 
                  failure_count = EXCLUDED.failure_count,
                  last_failure = EXCLUDED.last_failure,
                  reason = EXCLUDED.reason,
                  is_active = true,
                  updated_at = NOW();
              END IF;
            END;
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger
        DROP TRIGGER IF EXISTS trigger_auto_blacklist ON platform_test_results;
        CREATE TRIGGER trigger_auto_blacklist
          AFTER INSERT ON platform_test_results
          FOR EACH ROW
          EXECUTE FUNCTION auto_blacklist_failed_platforms();

        COMMENT ON FUNCTION auto_blacklist_failed_platforms() IS 'Automatically blacklists platforms after 3 consecutive failures';
      `
    });

    if (functionError) {
      console.error('❌ Error creating auto-blacklist function:', functionError);
    } else {
      console.log('✅ Auto-blacklist function and trigger created successfully');
    }

    // Step 5: Set up RLS policies
    console.log('🔒 Setting up Row Level Security policies...');
    
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS on both tables
        ALTER TABLE platform_test_results ENABLE ROW LEVEL SECURITY;
        ALTER TABLE platform_blacklist ENABLE ROW LEVEL SECURITY;

        -- Allow all operations for authenticated users (admin access)
        CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON platform_test_results
          FOR ALL USING (auth.role() = 'authenticated');

        CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON platform_blacklist
          FOR ALL USING (auth.role() = 'authenticated');

        -- Allow read access for anonymous users (for public stats)
        CREATE POLICY IF NOT EXISTS "Allow read for anonymous" ON platform_test_results
          FOR SELECT USING (true);

        CREATE POLICY IF NOT EXISTS "Allow read for anonymous" ON platform_blacklist
          FOR SELECT USING (true);
      `
    });

    if (rlsError) {
      console.error('❌ Error setting up RLS policies:', rlsError);
    } else {
      console.log('✅ Row Level Security policies configured successfully');
    }

    // Step 6: Insert sample test data
    console.log('📝 Inserting sample test data...');
    
    const sampleResults = [
      {
        platform_id: 'telegraph',
        platform_name: 'Telegraph.ph',
        domain: 'telegra.ph',
        is_working: true,
        response_time: 1250,
        published_url: 'https://telegra.ph/Sample-Test-12-28',
        status_code: 200,
        test_keyword: 'sample test',
        test_anchor_text: 'test link',
        test_target_url: 'https://example.com'
      },
      {
        platform_id: 'writeas',
        platform_name: 'Write.as',
        domain: 'write.as',
        is_working: true,
        response_time: 2100,
        published_url: 'https://write.as/sample-test',
        status_code: 200,
        test_keyword: 'sample test',
        test_anchor_text: 'test link',
        test_target_url: 'https://example.com'
      },
      {
        platform_id: 'medium',
        platform_name: 'Medium.com',
        domain: 'medium.com',
        is_working: false,
        response_time: 0,
        error_message: 'Medium publishing not implemented - requires OAuth authentication',
        test_keyword: 'sample test',
        test_anchor_text: 'test link',
        test_target_url: 'https://example.com'
      }
    ];

    const { error: sampleError } = await supabase
      .from('platform_test_results')
      .insert(sampleResults);

    if (sampleError) {
      console.warn('⚠️ Could not insert sample data (table might not exist yet):', sampleError.message);
    } else {
      console.log('✅ Sample test data inserted successfully');
    }

    console.log('\n🎉 Platform testing schema setup completed successfully!');
    console.log('\n📊 Created tables:');
    console.log('  • platform_test_results - Stores test results from platform verification');
    console.log('  • platform_blacklist - Tracks failed/blacklisted platforms');
    console.log('  • platform_stats (view) - Aggregated platform statistics');
    console.log('\n🔧 Created functions:');
    console.log('  • auto_blacklist_failed_platforms() - Auto-blacklists after 3 failures');
    console.log('\n🔒 Security:');
    console.log('  • Row Level Security enabled on all tables');
    console.log('  • Authenticated users have full access');
    console.log('  • Anonymous users have read-only access for public stats');

    return true;

  } catch (error) {
    console.error('❌ Schema setup failed:', error);
    return false;
  }
}

// Helper function to check if tables exist
async function checkTablesExist() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('platform_test_results', 'platform_blacklist');
      `
    });

    if (error) {
      console.error('Error checking tables:', error);
      return false;
    }

    const tableNames = data.map(row => row.table_name);
    console.log('📋 Existing tables:', tableNames);
    
    return tableNames.includes('platform_test_results') && tableNames.includes('platform_blacklist');
  } catch (error) {
    console.error('Error checking table existence:', error);
    return false;
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupPlatformTestingSchema().then(success => {
    if (success) {
      console.log('\n✅ Platform testing database schema ready!');
      console.log('You can now run platform tests and track results.');
    } else {
      console.log('\n❌ Schema setup failed. Please check the errors above.');
      process.exit(1);
    }
  });
}

module.exports = { 
  setupPlatformTestingSchema,
  checkTablesExist
};
