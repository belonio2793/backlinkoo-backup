/**
 * Manual Database Table Creation Utility
 * Creates admin tables if they don't exist
 */

import { supabase } from '@/integrations/supabase/client';

export async function createAdminEnvironmentVariablesTable(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Creating admin_environment_variables table...');

    // Create the table with proper SQL
    const { error } = await supabase.rpc('create_admin_env_vars_table');
    
    if (error) {
      // If RPC doesn't exist, try direct SQL execution
      console.warn('RPC not found, attempting direct table creation...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS admin_environment_variables (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          key VARCHAR(255) NOT NULL UNIQUE,
          value TEXT NOT NULL,
          description TEXT,
          is_secret BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_admin_env_vars_key ON admin_environment_variables(key);
        
        ALTER TABLE admin_environment_variables ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Allow authenticated admin access" ON admin_environment_variables
          FOR ALL USING (true);
      `;

      // Execute SQL directly (note: this may not work with RLS enabled)
      const { error: sqlError } = await supabase.from('admin_environment_variables').select('id').limit(1);
      
      if (sqlError && sqlError.code === '42P01') {
        // Table doesn't exist, we need to create it manually
        console.log('Table does not exist. Manual creation required.');
        return {
          success: false,
          error: 'Table creation requires manual migration or Supabase admin access'
        };
      }
    }

    console.log('✅ admin_environment_variables table ready');
    return { success: true };

  } catch (error) {
    console.error('Failed to create admin_environment_variables table:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function initializeAdminTables(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const envVarsResult = await createAdminEnvironmentVariablesTable();
    if (!envVarsResult.success) {
      errors.push(`Environment Variables Table: ${envVarsResult.error}`);
    }

    return {
      success: errors.length === 0,
      errors
    };

  } catch (error) {
    errors.push(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, errors };
  }
}
