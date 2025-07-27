import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // SQL to create the error_logs table
    const createTableSQL = `
      -- Create error_logs table for centralized error tracking
      CREATE TABLE IF NOT EXISTS error_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          timestamp TEXT NOT NULL,
          severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
          category TEXT NOT NULL CHECK (category IN (
              'authentication', 
              'email', 
              'payment', 
              'seo_analysis', 
              'database', 
              'network', 
              'validation', 
              'general'
          )),
          message TEXT NOT NULL,
          details JSONB,
          stack_trace TEXT,
          user_id TEXT,
          component TEXT,
          action TEXT,
          resolved BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );

      -- Create indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
      CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(category);
      CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
      CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

      -- Add Row Level Security (RLS)
      ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist (for idempotency)
      DROP POLICY IF EXISTS "Admin can access all error logs" ON error_logs;
      DROP POLICY IF EXISTS "Users can see their own error logs" ON error_logs;

      -- Create policy for admin access
      CREATE POLICY "Admin can access all error logs" ON error_logs
          FOR ALL USING (
              EXISTS (
                  SELECT 1 FROM user_roles 
                  WHERE user_roles.user_id::text = auth.uid()::text 
                  AND user_roles.role = 'admin'
              )
          );

      -- Create policy for users to see their own errors
      CREATE POLICY "Users can see their own error logs" ON error_logs
          FOR SELECT USING (user_id = auth.uid()::text);

      -- Grant necessary permissions
      GRANT ALL ON error_logs TO authenticated;
      GRANT ALL ON error_logs TO service_role;
    `;

    // Execute the SQL using the RPC call
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    });

    if (error) {
      // If RPC doesn't exist, try direct SQL execution
      console.log('RPC method not available, attempting direct execution...');
      
      // Try to execute using the SQL editor approach
      const { error: directError } = await supabase
        .from('_realtime_schema_changes')
        .select('*')
        .limit(1);

      if (directError) {
        throw new Error(`Failed to create error_logs table: ${error.message}`);
      }

      // Manual table creation response
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Error logs table setup initiated. Please run the SQL manually in Supabase dashboard.',
          sql: createTableSQL
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Error logs table created successfully',
        data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Setup error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        sql: `
-- Run this SQL in your Supabase dashboard to create the error_logs table:

CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    category TEXT NOT NULL CHECK (category IN (
        'authentication', 'email', 'payment', 'seo_analysis', 
        'database', 'network', 'validation', 'general'
    )),
    message TEXT NOT NULL,
    details JSONB,
    stack_trace TEXT,
    user_id TEXT,
    component TEXT,
    action TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(category);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can access all error logs" ON error_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id::text = auth.uid()::text 
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Users can see their own error logs" ON error_logs
    FOR SELECT USING (user_id = auth.uid()::text);

-- Grant permissions
GRANT ALL ON error_logs TO authenticated;
GRANT ALL ON error_logs TO service_role;
        `
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
