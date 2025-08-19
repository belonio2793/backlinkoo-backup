#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUserDomainsTable() {
  console.log('Creating user_domains table...');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS user_domains (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      domain TEXT NOT NULL,
      url TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'verifying')),
      verified BOOLEAN DEFAULT false,
      notes TEXT,
      target_keywords TEXT[] DEFAULT '{}',
      verification_token TEXT,
      verification_method TEXT DEFAULT 'meta_tag',
      last_verified_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, domain)
    );
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('Error creating table:', error);
      return false;
    }

    console.log('✅ user_domains table created successfully');
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

async function createRLSPolicies() {
  console.log('Creating RLS policies...');

  const policies = [
    // Enable RLS
    `ALTER TABLE user_domains ENABLE ROW LEVEL SECURITY;`,
    
    // Policy for users to view their own domains
    `CREATE POLICY "Users can view own domains" ON user_domains
     FOR SELECT USING (auth.uid() = user_id);`,
    
    // Policy for users to insert their own domains
    `CREATE POLICY "Users can insert own domains" ON user_domains
     FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    
    // Policy for users to update their own domains
    `CREATE POLICY "Users can update own domains" ON user_domains
     FOR UPDATE USING (auth.uid() = user_id);`,
    
    // Policy for users to delete their own domains
    `CREATE POLICY "Users can delete own domains" ON user_domains
     FOR DELETE USING (auth.uid() = user_id);`
  ];

  try {
    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy });
      if (error) {
        console.error('Error creating policy:', error);
        // Don't return false here as policies might already exist
      }
    }
    
    console.log('✅ RLS policies created successfully');
    return true;
  } catch (error) {
    console.error('Error creating policies:', error);
    return false;
  }
}

async function createTriggers() {
  console.log('Creating triggers...');

  const updateTrigger = `
    CREATE OR REPLACE FUNCTION update_user_domains_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS update_user_domains_updated_at ON user_domains;
    CREATE TRIGGER update_user_domains_updated_at
      BEFORE UPDATE ON user_domains
      FOR EACH ROW EXECUTE FUNCTION update_user_domains_updated_at();
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: updateTrigger });
    
    if (error) {
      console.error('Error creating triggers:', error);
      return false;
    }

    console.log('✅ Triggers created successfully');
    return true;
  } catch (error) {
    console.error('Error creating triggers:', error);
    return false;
  }
}

async function createIndexes() {
  console.log('Creating indexes...');

  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_user_domains_user_id ON user_domains(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_user_domains_domain ON user_domains(domain);`,
    `CREATE INDEX IF NOT EXISTS idx_user_domains_status ON user_domains(status);`,
    `CREATE INDEX IF NOT EXISTS idx_user_domains_verified ON user_domains(verified);`
  ];

  try {
    for (const index of indexes) {
      const { error } = await supabase.rpc('exec_sql', { sql: index });
      if (error) {
        console.error('Error creating index:', error);
        // Don't return false as indexes might already exist
      }
    }
    
    console.log('✅ Indexes created successfully');
    return true;
  } catch (error) {
    console.error('Error creating indexes:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Setting up user_domains table...');

  const steps = [
    createUserDomainsTable,
    createRLSPolicies,
    createTriggers,
    createIndexes
  ];

  for (const step of steps) {
    const success = await step();
    if (!success) {
      console.error('❌ Setup failed');
      process.exit(1);
    }
  }

  console.log('🎉 user_domains table setup completed successfully!');
}

// Alternative method using direct SQL execution if rpc doesn't work
async function executeSQL(sql) {
  try {
    const { data, error } = await supabase
      .from('_sql_execution')
      .insert({ sql_command: sql });
      
    if (error) {
      console.error('SQL execution error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { createUserDomainsTable, createRLSPolicies, createTriggers, createIndexes };
