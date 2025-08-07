import { createClient } from '@supabase/supabase-js';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Missing Supabase configuration',
          details: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set'
        })
      };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log('Creating affiliate tables...');

    // Step 1: Create affiliate_programs table
    const createTableSql = `
    CREATE TABLE IF NOT EXISTS affiliate_programs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        affiliate_code VARCHAR(50) UNIQUE NOT NULL,
        custom_id VARCHAR(8) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        commission_rate DECIMAL(3,2) DEFAULT 0.50 CHECK (commission_rate >= 0 AND commission_rate <= 1),
        total_earnings DECIMAL(10,2) DEFAULT 0.00,
        total_paid DECIMAL(10,2) DEFAULT 0.00,
        pending_earnings DECIMAL(10,2) DEFAULT 0.00,
        referral_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_affiliate_programs_user_id ON affiliate_programs(user_id);
    CREATE INDEX IF NOT EXISTS idx_affiliate_programs_affiliate_code ON affiliate_programs(affiliate_code);
    CREATE INDEX IF NOT EXISTS idx_affiliate_programs_custom_id ON affiliate_programs(custom_id);

    -- Enable RLS
    ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own affiliate programs" ON affiliate_programs;
    DROP POLICY IF EXISTS "Users can create their own affiliate programs" ON affiliate_programs;
    DROP POLICY IF EXISTS "Users can update their own affiliate programs" ON affiliate_programs;

    -- Create RLS policies
    CREATE POLICY "Users can view their own affiliate programs" ON affiliate_programs
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can create their own affiliate programs" ON affiliate_programs
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own affiliate programs" ON affiliate_programs
        FOR UPDATE USING (auth.uid() = user_id);
    `;

    // Execute the SQL using raw SQL query
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: createTableSql 
    });

    if (error) {
      console.error('Database error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Database error',
          details: error.message,
          hint: error.hint
        })
      };
    }

    // Test table creation
    const { data: testData, error: testError } = await supabase
      .from('affiliate_programs')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('Table verification failed:', testError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Table verification failed',
          details: testError.message
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Affiliate tables created successfully',
        data: data
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Function error',
        details: error.message || error.toString()
      })
    };
  }
};
