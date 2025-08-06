import { supabase } from '@/integrations/supabase/client';

/**
 * Execute SQL using Supabase client
 * This will attempt different methods to execute SQL based on available permissions
 */
export async function executeSQL(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Method 1: Try using a custom SQL execution function (if it exists)
    try {
      const { error } = await supabase.rpc('execute_sql', { query: sql });
      if (!error) {
        return { success: true };
      }
      console.warn('execute_sql RPC failed:', error.message);
    } catch (e) {
      console.warn('execute_sql RPC not available');
    }

    // Method 2: Try using exec_sql function (if it exists)
    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (!error) {
        return { success: true };
      }
      console.warn('exec_sql RPC failed:', error.message);
    } catch (e) {
      console.warn('exec_sql RPC not available');
    }

    // Method 3: Try direct table creation using schema operations
    if (sql.includes('CREATE TABLE')) {
      console.log('⚠️ Cannot execute CREATE TABLE directly through client');
      return { 
        success: false, 
        error: 'Table creation requires admin access. Please run the SQL manually in Supabase dashboard.' 
      };
    }

    return { 
      success: false, 
      error: 'No SQL execution method available' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Test if we can create the saved_backlink_reports table
 */
export async function testTableCreation(): Promise<void> {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.saved_backlink_reports (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        keyword VARCHAR(255) NOT NULL,
        anchor_text VARCHAR(255) NOT NULL,
        destination_url TEXT NOT NULL,
        report_data JSONB NOT NULL,
        report_summary JSONB,
        total_urls INTEGER DEFAULT 0,
        verified_backlinks INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );
  `;

  console.log('🧪 Testing table creation...');
  const result = await executeSQL(createTableSQL);
  
  if (result.success) {
    console.log('✅ Table creation test successful');
  } else {
    console.log('❌ Table creation test failed:', result.error);
    console.log('📋 SQL to run manually:');
    console.log(createTableSQL);
  }
}
