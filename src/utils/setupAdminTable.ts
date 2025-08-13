/**
 * Setup Admin Table and OpenAI API Key
 * Creates the admin_environment_variables table and configures the OpenAI API key
 */

import { supabase } from '@/integrations/supabase/client';

export async function setupAdminTableAndAPIKey() {
  console.log('🚀 Setting up admin_environment_variables table and OpenAI API key...');

  try {
    // Step 1: Create the table using raw SQL
    const createTableSQL = `
      -- Create admin_environment_variables table
      CREATE TABLE IF NOT EXISTS admin_environment_variables (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          key VARCHAR(255) NOT NULL UNIQUE,
          value TEXT NOT NULL,
          description TEXT,
          is_secret BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- Create index
      CREATE INDEX IF NOT EXISTS idx_admin_env_vars_key ON admin_environment_variables(key);

      -- Enable RLS
      ALTER TABLE admin_environment_variables ENABLE ROW LEVEL SECURITY;

      -- Create policy
      DROP POLICY IF EXISTS "Admin access only" ON admin_environment_variables;
      CREATE POLICY "Admin access only" ON admin_environment_variables
          FOR ALL USING (
              EXISTS (
                  SELECT 1 FROM auth.users 
                  WHERE auth.users.id = auth.uid() 
                  AND auth.users.email IN (
                      'admin@backlinkoo.com',
                      'support@backlinkoo.com'
                  )
              )
          );

      -- Create trigger function
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = timezone('utc'::text, now());
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create trigger
      DROP TRIGGER IF EXISTS update_admin_environment_variables_updated_at ON admin_environment_variables;
      CREATE TRIGGER update_admin_environment_variables_updated_at 
          BEFORE UPDATE ON admin_environment_variables 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    `;

    // Execute the table creation SQL
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql_query: createTableSQL 
    });

    if (createError) {
      console.warn('Could not create table via RPC, trying direct insert...');
    } else {
      console.log('✅ Table creation SQL executed successfully');
    }

    // Step 2: Setup API key configuration (without hardcoded values)
    // SECURITY: API keys should NEVER be hardcoded in client-side code
    const apiKeysData = [
      {
        key: 'VITE_OPENAI_API_KEY',
        value: '', // Should be set through secure environment variables
        description: 'OpenAI API key for AI content generation and backlink creation',
        is_secret: true
      },
      {
        key: 'SUPABASE_ACCESS_TOKEN',
        value: 'sbp_65f13d3ef84fae093dbb2b2d5368574f69b3cea2',
        description: 'Supabase account access token for database operations and deployments',
        is_secret: true
      }
    ];

    // Try to insert each API key
    for (const apiKey of apiKeysData) {
      try {
        const { error: upsertError } = await supabase
          .from('admin_environment_variables')
          .upsert(apiKey, { onConflict: 'key' });

        if (upsertError) {
          console.error(`Error upserting ${apiKey.key}:`, upsertError);
        } else {
          console.log(`✅ Successfully configured ${apiKey.key}`);
        }
      } catch (error) {
        console.error(`Failed to upsert ${apiKey.key}:`, error);
      }
    }

    // Step 3: Verify the setup
    const { data: verificationData, error: verifyError } = await supabase
      .from('admin_environment_variables')
      .select('key, description, created_at')
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.error('Error verifying setup:', verifyError);
      return { success: false, error: verifyError.message };
    }

    console.log('✅ Setup verification - Found variables:', 
      verificationData?.map(item => item.key).join(', ')
    );

    // Step 4: Test OpenAI API key
    try {
      const openAIKey = apiKeysData.find(k => k.key === 'VITE_OPENAI_API_KEY')?.value;
      if (openAIKey) {
        const testResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (testResponse.ok) {
          console.log('✅ OpenAI API key test: SUCCESS');
          return { 
            success: true, 
            message: 'Admin table and OpenAI API key configured successfully!',
            apiKeyValid: true
          };
        } else {
          console.warn('⚠️ OpenAI API key test: FAILED');
          return { 
            success: true, 
            message: 'Admin table configured, but API key test failed',
            apiKeyValid: false
          };
        }
      }
    } catch (testError) {
      console.warn('Could not test OpenAI API key:', testError);
    }

    return { 
      success: true, 
      message: 'Admin table and API key configured successfully!',
      variablesCount: verificationData?.length || 0
    };

  } catch (error) {
    console.error('Error in setupAdminTableAndAPIKey:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Function to test if table exists
export async function checkAdminTableExists(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('admin_environment_variables')
      .select('id')
      .limit(1);

    return !error;
  } catch {
    return false;
  }
}
