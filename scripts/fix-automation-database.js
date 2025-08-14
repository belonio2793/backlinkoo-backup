#!/usr/bin/env node

/**
 * Emergency Fix for Automation Campaigns Database
 * Fixes the null constraint violation and missing columns issues
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixDatabase() {
  console.log('🔧 Fixing automation_campaigns database issues...');
  
  try {
    // Step 1: Check if table exists
    console.log('📋 Checking table existence...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('automation_campaigns')
      .select('id')
      .limit(1);

    if (tableError && tableError.message.includes('does not exist')) {
      console.log('🆕 Creating automation_campaigns table...');
      await createTable();
    } else if (tableError) {
      console.warn('⚠️ Table access issue:', tableError.message);
    } else {
      console.log('✅ Table exists, checking schema...');
    }

    // Step 2: Check and fix missing columns
    console.log('🔍 Checking required columns...');
    await checkAndFixColumns();

    // Step 3: Verify table structure
    console.log('✅ Verifying table structure...');
    await verifyTable();

    // Step 4: Test minimal insertion
    console.log('🧪 Testing minimal insertion...');
    await testMinimalInsertion();

    console.log('\n🎉 Database fix completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Go to /automation page');
    console.log('2. Test campaign creation');
    console.log('3. Run the automation test dashboard');

  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    
    console.log('\n💡 Manual fix required:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Run this SQL:');
    console.log(`
-- Fix automation_campaigns table
CREATE TABLE IF NOT EXISTS automation_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  anchor_texts TEXT[] NOT NULL DEFAULT '{}',
  target_url TEXT NOT NULL,
  target_links INTEGER DEFAULT 10,
  links_built INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  auto_start BOOLEAN DEFAULT false,
  available_sites INTEGER DEFAULT 1,
  target_sites_used TEXT[] DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE automation_campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own campaigns" ON automation_campaigns
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_user_id ON automation_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_status ON automation_campaigns(status);
    `);
    
    process.exit(1);
  }
}

async function createTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS automation_campaigns (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      keywords TEXT[] NOT NULL DEFAULT '{}',
      anchor_texts TEXT[] NOT NULL DEFAULT '{}',
      target_url TEXT NOT NULL,
      target_links INTEGER DEFAULT 10,
      links_built INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      auto_start BOOLEAN DEFAULT false,
      available_sites INTEGER DEFAULT 1,
      target_sites_used TEXT[] DEFAULT '{}'
    );

    ALTER TABLE automation_campaigns ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can manage their own campaigns" ON automation_campaigns
      FOR ALL USING (auth.uid() = user_id);

    CREATE INDEX IF NOT EXISTS idx_automation_campaigns_user_id ON automation_campaigns(user_id);
    CREATE INDEX IF NOT EXISTS idx_automation_campaigns_status ON automation_campaigns(status);
  `;

  const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
  if (error) throw error;
  
  console.log('✅ Table created successfully');
}

async function checkAndFixColumns() {
  const requiredColumns = [
    { name: 'started_at', type: 'TIMESTAMPTZ' },
    { name: 'completed_at', type: 'TIMESTAMPTZ' },
    { name: 'auto_start', type: 'BOOLEAN DEFAULT false' },
    { name: 'available_sites', type: 'INTEGER DEFAULT 1' },
    { name: 'target_sites_used', type: 'TEXT[] DEFAULT \'{}\'::TEXT[]' }
  ];

  for (const column of requiredColumns) {
    try {
      const { error } = await supabase
        .from('automation_campaigns')
        .select(column.name)
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        console.log(`🔧 Adding missing column: ${column.name}`);
        const addColumnSQL = `ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`;
        
        const { error: addError } = await supabase.rpc('exec_sql', { sql: addColumnSQL });
        if (addError) {
          console.warn(`⚠️ Failed to add column ${column.name}:`, addError.message);
        } else {
          console.log(`✅ Added column: ${column.name}`);
        }
      } else if (error) {
        console.warn(`⚠️ Column check issue for ${column.name}:`, error.message);
      } else {
        console.log(`✅ Column exists: ${column.name}`);
      }
    } catch (err) {
      console.warn(`⚠️ Error checking column ${column.name}:`, err.message);
    }
  }
}

async function verifyTable() {
  // Test basic table access
  const { data, error } = await supabase
    .from('automation_campaigns')
    .select('id, name, target_url')
    .limit(1);

  if (error) {
    throw new Error(`Table verification failed: ${error.message}`);
  }

  console.log('✅ Table structure verified');
}

async function testMinimalInsertion() {
  try {
    // Get a user ID for testing (if available)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    let testUserId;
    if (userError || !userData.user) {
      // Try to get any user from the database
      const { data: users, error: usersError } = await supabase
        .from('auth.users')
        .select('id')
        .limit(1);
      
      if (usersError || !users || users.length === 0) {
        console.log('⚠️ No user available for testing, skipping insertion test');
        return;
      }
      testUserId = users[0].id;
    } else {
      testUserId = userData.user.id;
    }

    const testCampaign = {
      user_id: testUserId,
      name: 'Test Campaign - ' + Date.now(),
      keywords: ['test', 'automation'],
      anchor_texts: ['test link'],
      target_url: 'https://test.example.com',
      status: 'draft'
    };

    console.log('🔍 Testing minimal insertion...');
    const { data, error } = await supabase
      .from('automation_campaigns')
      .insert(testCampaign)
      .select()
      .single();

    if (error) {
      throw new Error(`Insertion test failed: ${error.message}`);
    }

    console.log('✅ Minimal insertion successful, campaign ID:', data.id);

    // Clean up test data
    await supabase
      .from('automation_campaigns')
      .delete()
      .eq('id', data.id);

    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Minimal insertion test failed:', error.message);
    throw error;
  }
}

// Run the fix
fixDatabase();
