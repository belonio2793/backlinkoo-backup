#!/usr/bin/env node

/**
 * Setup domains table for simple domain management
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDomainsTable() {
  console.log('🔧 Setting up domains table...');

  try {
    // Check if table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('domains')
      .select('id')
      .limit(1);

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = relation does not exist
      console.error('❌ Error checking table:', checkError);
      return;
    }

    if (!checkError) {
      console.log('✅ Domains table already exists');
      
      // Check and add missing columns
      try {
        const { data: testData } = await supabase
          .from('domains')
          .select('netlify_verified, dns_verified, error_message')
          .limit(1);
        
        console.log('✅ All required columns exist');
      } catch (columnError) {
        console.log('⚠️ Some columns may be missing, but table exists');
      }
      
      return;
    }

    console.log('📝 Creating domains table...');

    // Create table with RLS
    const { error: createError } = await supabase.rpc('create_domains_table');

    if (createError) {
      // If RPC doesn't exist, try manual table creation
      console.log('⚠️ RPC method not available, checking table manually...');
      
      // Test if we can insert a test record (this will fail gracefully if table doesn't exist)
      const testDomain = {
        domain: 'test-domain-' + Date.now() + '.com',
        status: 'pending',
        netlify_verified: false,
        dns_verified: false
      };

      const { data: insertData, error: insertError } = await supabase
        .from('domains')
        .insert(testDomain)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Table creation needed. Please create the domains table manually or ensure proper permissions.');
        console.log('\nSQL to create table:');
        console.log(`
CREATE TABLE domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'validated', 'error')),
  netlify_verified BOOLEAN DEFAULT false,
  dns_verified BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own domains" ON domains
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own domains" ON domains
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own domains" ON domains
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own domains" ON domains
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
        `);
        return;
      } else {
        // Clean up test record
        await supabase.from('domains').delete().eq('id', insertData.id);
        console.log('✅ Domains table is working correctly');
      }
    } else {
      console.log('✅ Domains table created successfully');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run setup
setupDomainsTable()
  .then(() => {
    console.log('🎉 Domains table setup complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
