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
    // Use the correct Supabase credentials
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dfhanacsmsvvkpunurnp.supabase.co';
    const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0NDE1MDIsImV4cCI6MjA0NzAxNzUwMn0.ZAdh-eSGl1t9K5cggz7wVxWjbj9JqV3xNLAEqEd7Kkk';

    console.log('Using Supabase URL:', SUPABASE_URL);

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Check if table already exists first
    console.log('Checking if affiliate_programs table exists...');
    const { data: existsData, error: existsError } = await supabase
      .from('affiliate_programs')
      .select('id')
      .limit(1);

    if (!existsError) {
      console.log('Table already exists');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Affiliate table already exists',
          tableExists: true
        })
      };
    }

    if (existsError.code !== '42P01') {
      console.error('Unexpected error checking table:', existsError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to check table existence',
          details: existsError.message
        })
      };
    }

    console.log('Table does not exist, attempting to create...');

    // Try to use the migration SQL content directly
    // Since we can't use custom RPC functions, we'll return instructions instead
    console.log('Cannot create table directly - RPC exec_sql not available');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Table creation requires manual migration. Please run the SQL migration file.',
        instructions: 'Run the SQL from supabase/migrations/20241223000000_create_affiliate_tables_final.sql',
        tableExists: false
      })
    };

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
