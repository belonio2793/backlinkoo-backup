/**
 * Supabase Table Creation Utility
 * Helps create the admin_environment_variables table if user has admin access
 */

import { supabase } from '@/integrations/supabase/client';

export interface TableCreationResult {
  success: boolean;
  message: string;
  instructions?: string[];
}

/**
 * Attempt to create the admin_environment_variables table
 */
export async function createAdminEnvironmentVariablesTable(): Promise<TableCreationResult> {
  try {
    console.log('🔧 Attempting to create admin_environment_variables table...');

    // First check if it already exists
    const { error: checkError } = await supabase
      .from('admin_environment_variables')
      .select('id')
      .limit(1);

    if (!checkError) {
      return {
        success: true,
        message: 'Table already exists and is accessible'
      };
    }

    // If error is not "table doesn't exist", return the error
    if (checkError.code !== '42P01') {
      return {
        success: false,
        message: `Database error: ${checkError.message}`,
        instructions: [
          'Check your Supabase connection',
          'Verify database permissions',
          'Contact support if the issue persists'
        ]
      };
    }

    // Table doesn't exist, provide manual creation instructions
    return {
      success: false,
      message: 'Table needs to be created manually in Supabase',
      instructions: [
        '1. Go to your Supabase Dashboard → SQL Editor',
        '2. Run the following SQL script:',
        '',
        'CREATE TABLE admin_environment_variables (',
        '  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,',
        '  key VARCHAR(255) NOT NULL UNIQUE,',
        '  value TEXT NOT NULL,',
        '  description TEXT,',
        '  is_secret BOOLEAN DEFAULT true,',
        '  is_active BOOLEAN DEFAULT true,',
        '  service_type VARCHAR(50) DEFAULT \'other\',',
        '  last_tested TIMESTAMP WITH TIME ZONE,',
        '  health_score INTEGER DEFAULT 0,',
        '  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone(\'utc\'::text, now()) NOT NULL,',
        '  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone(\'utc\'::text, now()) NOT NULL',
        ');',
        '',
        'CREATE INDEX idx_admin_env_vars_key ON admin_environment_variables(key);',
        'CREATE INDEX idx_admin_env_vars_active ON admin_environment_variables(is_active);',
        '',
        'ALTER TABLE admin_environment_variables ENABLE ROW LEVEL SECURITY;',
        '',
        'CREATE POLICY "Allow authenticated admin access" ON admin_environment_variables',
        '  FOR ALL USING (true);',
        '',
        '3. After running the script, refresh this page'
      ]
    };

  } catch (error) {
    console.error('Table creation check failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      instructions: [
        'Unable to connect to database',
        'Check your internet connection',
        'Verify Supabase configuration',
        'Contact support if the issue persists'
      ]
    };
  }
}

/**
 * Get table creation status and instructions
 */
export async function getTableCreationStatus(): Promise<{
  tableExists: boolean;
  canCreateTable: boolean;
  needsManualCreation: boolean;
  sqlScript: string;
}> {
  try {
    const { error } = await supabase
      .from('admin_environment_variables')
      .select('id')
      .limit(1);

    const tableExists = !error;
    const needsManualCreation = error?.code === '42P01';

    const sqlScript = `
-- Create admin_environment_variables table
CREATE TABLE IF NOT EXISTS admin_environment_variables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  is_secret BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  service_type VARCHAR(50) DEFAULT 'other',
  last_tested TIMESTAMP WITH TIME ZONE,
  health_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_env_vars_key ON admin_environment_variables(key);
CREATE INDEX IF NOT EXISTS idx_admin_env_vars_active ON admin_environment_variables(is_active);

-- Enable RLS
ALTER TABLE admin_environment_variables ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow authenticated admin access" ON admin_environment_variables
  FOR ALL USING (true);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_admin_environment_variables_updated_at 
    BEFORE UPDATE ON admin_environment_variables 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
`.trim();

    return {
      tableExists,
      canCreateTable: false, // We can't create tables from the frontend
      needsManualCreation,
      sqlScript
    };

  } catch (error) {
    return {
      tableExists: false,
      canCreateTable: false,
      needsManualCreation: true,
      sqlScript: ''
    };
  }
}
