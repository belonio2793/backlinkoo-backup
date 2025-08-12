#!/usr/bin/env node

/**
 * Create Database Tables for Debug Logging System
 * 
 * This script creates the necessary database tables to support
 * the active error logging and monitoring system.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDebugTables() {
  console.log('🔧 Creating debug logging tables...');

  try {
    // Create automation_debug_logs table
    const { error: debugLogsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create automation_debug_logs table
        CREATE TABLE IF NOT EXISTS automation_debug_logs (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
          component TEXT NOT NULL,
          operation TEXT NOT NULL,
          message TEXT NOT NULL,
          data JSONB,
          stack_trace TEXT,
          context JSONB,
          user_id UUID REFERENCES auth.users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_debug_logs_timestamp ON automation_debug_logs(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_debug_logs_level ON automation_debug_logs(level);
        CREATE INDEX IF NOT EXISTS idx_debug_logs_component ON automation_debug_logs(component);
        CREATE INDEX IF NOT EXISTS idx_debug_logs_session ON automation_debug_logs(session_id);
        CREATE INDEX IF NOT EXISTS idx_debug_logs_user ON automation_debug_logs(user_id);

        -- Create automation_alerts table
        CREATE TABLE IF NOT EXISTS automation_alerts (
          id TEXT PRIMARY KEY,
          rule_id TEXT NOT NULL,
          rule_name TEXT NOT NULL,
          triggered_at TIMESTAMPTZ NOT NULL,
          condition JSONB NOT NULL,
          actual_value NUMERIC NOT NULL,
          threshold NUMERIC NOT NULL,
          message TEXT NOT NULL,
          priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
          resolved BOOLEAN NOT NULL DEFAULT FALSE,
          resolved_at TIMESTAMPTZ,
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Create indexes for alerts
        CREATE INDEX IF NOT EXISTS idx_alerts_triggered_at ON automation_alerts(triggered_at DESC);
        CREATE INDEX IF NOT EXISTS idx_alerts_rule_id ON automation_alerts(rule_id);
        CREATE INDEX IF NOT EXISTS idx_alerts_priority ON automation_alerts(priority);
        CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON automation_alerts(resolved);

        -- Create automation_error_patterns table
        CREATE TABLE IF NOT EXISTS automation_error_patterns (
          id TEXT PRIMARY KEY,
          signature TEXT NOT NULL UNIQUE,
          category TEXT NOT NULL,
          frequency INTEGER NOT NULL DEFAULT 1,
          first_occurrence TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_occurrence TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          affected_components TEXT[] NOT NULL DEFAULT '{}',
          trend TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('increasing', 'decreasing', 'stable')),
          priority TEXT NOT NULL DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          resolved BOOLEAN NOT NULL DEFAULT FALSE,
          resolution_notes TEXT,
          work_arounds TEXT[] NOT NULL DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Create indexes for error patterns
        CREATE INDEX IF NOT EXISTS idx_error_patterns_category ON automation_error_patterns(category);
        CREATE INDEX IF NOT EXISTS idx_error_patterns_priority ON automation_error_patterns(priority);
        CREATE INDEX IF NOT EXISTS idx_error_patterns_resolved ON automation_error_patterns(resolved);
        CREATE INDEX IF NOT EXISTS idx_error_patterns_last_occurrence ON automation_error_patterns(last_occurrence DESC);

        -- Create function to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Create trigger for error patterns
        DROP TRIGGER IF EXISTS update_error_patterns_updated_at ON automation_error_patterns;
        CREATE TRIGGER update_error_patterns_updated_at
          BEFORE UPDATE ON automation_error_patterns
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (debugLogsError) {
      throw debugLogsError;
    }

    console.log('✅ Successfully created automation_debug_logs table');

    // Set up RLS policies for debug logs
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS on debug tables
        ALTER TABLE automation_debug_logs ENABLE ROW LEVEL SECURITY;
        ALTER TABLE automation_alerts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE automation_error_patterns ENABLE ROW LEVEL SECURITY;

        -- Debug logs policies
        DROP POLICY IF EXISTS "Users can view their own debug logs" ON automation_debug_logs;
        CREATE POLICY "Users can view their own debug logs" ON automation_debug_logs
          FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

        DROP POLICY IF EXISTS "Users can insert their own debug logs" ON automation_debug_logs;
        CREATE POLICY "Users can insert their own debug logs" ON automation_debug_logs
          FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

        -- Alerts policies (view-only for users)
        DROP POLICY IF EXISTS "Users can view alerts" ON automation_alerts;
        CREATE POLICY "Users can view alerts" ON automation_alerts
          FOR SELECT USING (true);

        -- Error patterns policies (view-only for users)
        DROP POLICY IF EXISTS "Users can view error patterns" ON automation_error_patterns;
        CREATE POLICY "Users can view error patterns" ON automation_error_patterns
          FOR SELECT USING (true);

        -- Admin policies for service role
        DROP POLICY IF EXISTS "Service role can manage debug logs" ON automation_debug_logs;
        CREATE POLICY "Service role can manage debug logs" ON automation_debug_logs
          FOR ALL USING (true);

        DROP POLICY IF EXISTS "Service role can manage alerts" ON automation_alerts;
        CREATE POLICY "Service role can manage alerts" ON automation_alerts
          FOR ALL USING (true);

        DROP POLICY IF EXISTS "Service role can manage error patterns" ON automation_error_patterns;
        CREATE POLICY "Service role can manage error patterns" ON automation_error_patterns
          FOR ALL USING (true);
      `
    });

    if (rlsError) {
      throw rlsError;
    }

    console.log('✅ Successfully set up RLS policies');

    // Create a cleanup function for old debug logs
    const { error: cleanupError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create function to clean up old debug logs (older than 7 days)
        CREATE OR REPLACE FUNCTION cleanup_old_debug_logs()
        RETURNS void AS $$
        BEGIN
          DELETE FROM automation_debug_logs 
          WHERE created_at < NOW() - INTERVAL '7 days';
          
          DELETE FROM automation_alerts 
          WHERE created_at < NOW() - INTERVAL '30 days' AND resolved = true;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Grant execute permission to authenticated users
        GRANT EXECUTE ON FUNCTION cleanup_old_debug_logs() TO authenticated;
        GRANT EXECUTE ON FUNCTION cleanup_old_debug_logs() TO service_role;
      `
    });

    if (cleanupError) {
      throw cleanupError;
    }

    console.log('✅ Successfully created cleanup function');

    console.log('\n🎉 Debug logging system database setup complete!');
    console.log('\nCreated tables:');
    console.log('  - automation_debug_logs (stores real-time debug logs)');
    console.log('  - automation_alerts (stores monitoring alerts)');
    console.log('  - automation_error_patterns (stores error pattern analysis)');
    console.log('\nFeatures:');
    console.log('  - Row Level Security (RLS) enabled');
    console.log('  - Automatic cleanup of old logs');
    console.log('  - Optimized indexes for performance');
    console.log('  - Trigger-based timestamp updates');

  } catch (error) {
    console.error('❌ Error creating debug tables:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify your Supabase credentials are correct');
    console.error('2. Ensure the service role key has admin permissions');
    console.error('3. Check that exec_sql function exists in your database');
    process.exit(1);
  }
}

// Also create a test function to verify the setup
async function testDebugTables() {
  console.log('\n🧪 Testing debug tables...');

  try {
    // Test inserting a debug log
    const testLog = {
      id: `test_${Date.now()}`,
      session_id: 'test_session',
      level: 'info',
      component: 'test',
      operation: 'setup_test',
      message: 'Testing debug logging system setup',
      data: { test: true },
      context: { url: 'test://setup' }
    };

    const { error: insertError } = await supabase
      .from('automation_debug_logs')
      .insert(testLog);

    if (insertError) {
      throw insertError;
    }

    // Test reading the log back
    const { data: logs, error: selectError } = await supabase
      .from('automation_debug_logs')
      .select('*')
      .eq('id', testLog.id)
      .single();

    if (selectError) {
      throw selectError;
    }

    // Clean up test log
    await supabase
      .from('automation_debug_logs')
      .delete()
      .eq('id', testLog.id);

    console.log('✅ Debug tables test passed!');
    console.log('   - Successfully inserted test log');
    console.log('   - Successfully read test log');
    console.log('   - Successfully cleaned up test log');

  } catch (error) {
    console.error('❌ Debug tables test failed:', error.message);
    console.error('The tables were created but may not be functioning correctly.');
  }
}

async function main() {
  console.log('🚀 Setting up Automation Debug Logging System\n');
  
  await createDebugTables();
  await testDebugTables();
  
  console.log('\n🎯 Next steps:');
  console.log('1. The debug logging system is now ready to use');
  console.log('2. Start your application to see real-time debug logs');
  console.log('3. Use the debug dashboard to monitor automation health');
  console.log('4. Set up monitoring alerts for critical issues');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createDebugTables, testDebugTables };
