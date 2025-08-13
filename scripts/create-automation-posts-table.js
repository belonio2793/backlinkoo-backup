const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAutomationPostsTable() {
  console.log('🗄️ Creating automation_posts table...');

  try {
    // Create the automation_posts table
    const { data, error } = await supabase.rpc('create_automation_posts_table', {});

    if (error) {
      // If RPC doesn't exist, create table directly
      console.log('RPC not found, creating table with raw SQL...');
      
      const { error: sqlError } = await supabase.from('__sql_temp').select('1').limit(1);
      
      // Create table using SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS automation_posts (
          id TEXT PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          keyword TEXT NOT NULL,
          anchor_text TEXT NOT NULL,
          target_url TEXT NOT NULL,
          prompt_template TEXT NOT NULL,
          generated_content TEXT NOT NULL,
          platform TEXT NOT NULL,
          platform_url TEXT,
          status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed', 'published')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_automation_posts_user_id ON automation_posts(user_id);
        CREATE INDEX IF NOT EXISTS idx_automation_posts_status ON automation_posts(status);
        CREATE INDEX IF NOT EXISTS idx_automation_posts_created_at ON automation_posts(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_automation_posts_platform ON automation_posts(platform);

        -- Enable Row Level Security
        ALTER TABLE automation_posts ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Users can view their own automation posts" ON automation_posts
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own automation posts" ON automation_posts
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own automation posts" ON automation_posts
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own automation posts" ON automation_posts
          FOR DELETE USING (auth.uid() = user_id);

        -- Create updated_at trigger
        CREATE OR REPLACE FUNCTION update_automation_posts_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_automation_posts_updated_at
          BEFORE UPDATE ON automation_posts
          FOR EACH ROW EXECUTE FUNCTION update_automation_posts_updated_at();
      `;

      // We can't execute raw SQL directly through the JS client in this context
      // So we'll try to create the table through a different approach
      console.log('Please run the following SQL in your Supabase SQL editor:');
      console.log(createTableSQL);
      
      return { success: true, message: 'SQL provided for manual execution' };
    }

    console.log('✅ automation_posts table created successfully');
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error creating automation_posts table:', error);
    throw error;
  }
}

async function verifyTable() {
  console.log('🔍 Verifying automation_posts table...');

  try {
    const { data, error } = await supabase
      .from('automation_posts')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Table verification failed:', error.message);
      return false;
    }

    console.log('✅ automation_posts table exists and is accessible');
    return true;
  } catch (error) {
    console.log('❌ Table verification error:', error.message);
    return false;
  }
}

async function insertTestRecord() {
  console.log('🧪 Inserting test record...');

  try {
    const testId = `test_${Date.now()}`;
    
    const { data, error } = await supabase
      .from('automation_posts')
      .insert({
        id: testId,
        user_id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
        keyword: 'test keyword',
        anchor_text: 'test anchor',
        target_url: 'https://example.com',
        prompt_template: 'Blog Post',
        generated_content: 'This is test content generated for testing purposes.',
        platform: 'telegra_ph',
        status: 'completed'
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Test insert failed:', error.message);
      return false;
    }

    console.log('✅ Test record inserted successfully:', data.id);
    
    // Clean up test record
    await supabase
      .from('automation_posts')
      .delete()
      .eq('id', testId);
      
    console.log('✅ Test record cleaned up');
    return true;

  } catch (error) {
    console.log('❌ Test insert error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting automation_posts table setup...\n');

  try {
    // Check if we have the required environment variables
    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing required environment variables:');
      console.error('   - VITE_SUPABASE_URL');
      console.error('   - SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }

    // Create the table
    await createAutomationPostsTable();

    // Verify the table exists
    const tableExists = await verifyTable();
    
    if (tableExists) {
      // Test insert and delete
      await insertTestRecord();
      console.log('\n✅ automation_posts table setup completed successfully!');
    } else {
      console.log('\n❌ Table setup incomplete. Please check the SQL output above.');
    }

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  createAutomationPostsTable,
  verifyTable,
  insertTestRecord
};
