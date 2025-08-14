/**
 * Create Array-Free Campaigns Table
 * This table eliminates all array dependencies for reliable campaign management
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createArrayFreeCampaignsTable() {
  console.log('🚀 Creating array-free campaigns table...');
  
  try {
    // Create the new table with only simple data types
    const createTableSQL = `
      -- Drop existing table if it exists
      DROP TABLE IF EXISTS automation_campaigns_simple CASCADE;
      
      -- Create new table without array dependencies
      CREATE TABLE automation_campaigns_simple (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        
        -- Basic campaign info (simple strings)
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'paused', 'completed', 'failed')),
        
        -- Keywords and content (comma-separated strings instead of arrays)
        primary_keyword TEXT NOT NULL,
        secondary_keywords_text TEXT DEFAULT '',
        primary_anchor_text TEXT NOT NULL,
        alternate_anchors_text TEXT DEFAULT '',
        target_url TEXT NOT NULL,
        
        -- Progress tracking (simple numbers and strings)
        sites_contacted INTEGER DEFAULT 0,
        links_built INTEGER DEFAULT 0,
        sites_used_text TEXT DEFAULT '', -- comma-separated list instead of array
        
        -- Simple configuration
        links_requested INTEGER DEFAULT 5 CHECK (links_requested > 0 AND links_requested <= 50),
        auto_start BOOLEAN DEFAULT false,
        
        -- Metadata as simple JSON string
        campaign_metadata TEXT DEFAULT '{}',
        
        -- Simple timestamps
        created_at TIMESTAMPTZ DEFAULT now(),
        started_at TIMESTAMPTZ NULL,
        completed_at TIMESTAMPTZ NULL,
        updated_at TIMESTAMPTZ DEFAULT now()
      );
      
      -- Create indexes for performance
      CREATE INDEX automation_campaigns_simple_user_id_idx ON automation_campaigns_simple(user_id);
      CREATE INDEX automation_campaigns_simple_status_idx ON automation_campaigns_simple(status);
      CREATE INDEX automation_campaigns_simple_created_at_idx ON automation_campaigns_simple(created_at);
      
      -- Add update trigger
      CREATE OR REPLACE FUNCTION update_automation_campaigns_simple_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      CREATE TRIGGER automation_campaigns_simple_updated_at
        BEFORE UPDATE ON automation_campaigns_simple
        FOR EACH ROW
        EXECUTE FUNCTION update_automation_campaigns_simple_updated_at();
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', {
      query: createTableSQL
    });
    
    if (createError) {
      throw createError;
    }
    
    console.log('✅ Table created successfully');
    
    // Create RLS policies
    console.log('🔐 Setting up Row Level Security...');
    
    const rlsSQL = `
      -- Enable RLS
      ALTER TABLE automation_campaigns_simple ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can insert own campaigns" ON automation_campaigns_simple;
      DROP POLICY IF EXISTS "Users can view own campaigns" ON automation_campaigns_simple;
      DROP POLICY IF EXISTS "Users can update own campaigns" ON automation_campaigns_simple;
      DROP POLICY IF EXISTS "Users can delete own campaigns" ON automation_campaigns_simple;
      
      -- Create new policies
      CREATE POLICY "Users can insert own campaigns" ON automation_campaigns_simple
        FOR INSERT WITH CHECK (auth.uid() = user_id);
        
      CREATE POLICY "Users can view own campaigns" ON automation_campaigns_simple
        FOR SELECT USING (auth.uid() = user_id);
        
      CREATE POLICY "Users can update own campaigns" ON automation_campaigns_simple
        FOR UPDATE USING (auth.uid() = user_id);
        
      CREATE POLICY "Users can delete own campaigns" ON automation_campaigns_simple
        FOR DELETE USING (auth.uid() = user_id);
    `;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      query: rlsSQL
    });
    
    if (rlsError) {
      throw rlsError;
    }
    
    console.log('✅ RLS policies created successfully');
    
    // Test the table
    console.log('🧪 Testing table functionality...');
    
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
      name: 'TEST_CAMPAIGN_DELETE_ME',
      primary_keyword: 'test keyword',
      secondary_keywords_text: 'seo, marketing, content',
      primary_anchor_text: 'test link',
      alternate_anchors_text: 'click here, learn more',
      target_url: 'https://example.com',
      links_requested: 5,
      auto_start: false,
      campaign_metadata: JSON.stringify({ test: true })
    };
    
    // Insert test data
    const { data: insertData, error: insertError } = await supabase
      .from('automation_campaigns_simple')
      .insert(testData)
      .select('*')
      .single();
    
    if (insertError) {
      console.warn('⚠️ Test insert failed (this is expected if user doesn\'t exist):', insertError.message);
    } else {
      console.log('✅ Test insert successful');
      
      // Clean up test data
      await supabase
        .from('automation_campaigns_simple')
        .delete()
        .eq('id', insertData.id);
      
      console.log('✅ Test cleanup completed');
    }
    
    console.log('🎉 Array-free campaigns table setup complete!');
    console.log('\n📋 Table Features:');
    console.log('- ✅ No array columns (TEXT[] eliminated)');
    console.log('- ✅ Comma-separated strings for multiple values');
    console.log('- ✅ Simple JSON strings instead of JSONB');
    console.log('- ✅ Standard SQL data types only');
    console.log('- ✅ Full RLS security');
    console.log('- ✅ Performance indexes');
    console.log('- ✅ Automatic timestamp updates');
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check that SUPABASE_SERVICE_ROLE_KEY is set correctly');
    console.error('2. Verify the exec_sql function exists in your database');
    console.error('3. Ensure you have admin permissions');
    process.exit(1);
  }
}

// Migration options
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'create':
    createArrayFreeCampaignsTable();
    break;
    
  case 'test':
    testTableAccess();
    break;
    
  default:
    console.log('📖 Usage:');
    console.log('  node create-array-free-campaigns-table.js create  # Create the table');
    console.log('  node create-array-free-campaigns-table.js test    # Test table access');
    break;
}

async function testTableAccess() {
  console.log('🧪 Testing table access...');
  
  try {
    const { data, error } = await supabase
      .from('automation_campaigns_simple')
      .select('count(*)')
      .single();
    
    if (error) {
      console.error('❌ Table access failed:', error.message);
    } else {
      console.log('✅ Table access successful');
      console.log('📊 Current campaign count:', data?.count || 0);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}
