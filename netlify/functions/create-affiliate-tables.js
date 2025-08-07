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
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bclhqtjxaaxdvlnubhhd.supabase.co';
    const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbGhxdGp4YWF4ZHZsbnViaGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5MDU1OTUsImV4cCI6MjA0ODQ4MTU5NX0.v2BI2WiXVnobWh76v6_RW3PUqcdZSNJCjEiw6gOjKJQ';

    console.log('Using Supabase URL:', SUPABASE_URL);

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Use a direct SQL approach - execute each statement separately
    const statements = [
      `CREATE TABLE IF NOT EXISTS affiliate_programs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        affiliate_code VARCHAR(50) UNIQUE NOT NULL,
        custom_id VARCHAR(8) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        commission_rate DECIMAL(3,2) DEFAULT 0.50,
        total_earnings DECIMAL(10,2) DEFAULT 0.00,
        total_paid DECIMAL(10,2) DEFAULT 0.00,
        pending_earnings DECIMAL(10,2) DEFAULT 0.00,
        referral_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      `ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY`,
      `CREATE POLICY "affiliate_programs_user_access" ON affiliate_programs FOR ALL USING (true)`
    ];

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          console.warn('SQL statement warning:', error.message);
        }
      } catch (err) {
        console.warn('SQL execution warning:', err.message);
      }
    }

    // Test table creation
    const { data: testData, error: testError } = await supabase
      .from('affiliate_programs')
      .select('id')
      .limit(1);

    if (testError && !testError.message.includes('does not exist')) {
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
        message: 'Affiliate table setup completed',
        tableExists: !testError
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
