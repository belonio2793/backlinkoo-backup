const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupBacklinkDatabase() {
  console.log('Setting up backlink automation database tables...');
  
  try {
    // Create backlink_campaigns table
    const createCampaignsTable = `
      CREATE TABLE IF NOT EXISTS backlink_campaigns (
        id uuid default gen_random_uuid() primary key,
        user_id uuid references auth.users(id) on delete cascade,
        name text not null,
        target_url text not null,
        keyword text not null,
        anchor_text text not null,
        target_platform text not null,
        status text not null default 'paused' check (status in ('active', 'paused', 'completed')),
        links_found integer default 0,
        links_posted integer default 0,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      );
    `;

    console.log('Creating backlink_campaigns table...');
    const { error: campaignsError } = await supabase.rpc('execute_sql', { sql: createCampaignsTable });
    
    if (campaignsError) {
      // Try direct table creation via insert/select test
      const { error: testError } = await supabase.from('backlink_campaigns').select('count').limit(1);
      if (testError && testError.message.includes('does not exist')) {
        console.log('❌ backlink_campaigns table needs manual creation');
        console.log('Please run this SQL in your Supabase SQL Editor:');
        console.log(createCampaignsTable);
      } else {
        console.log('✅ backlink_campaigns table exists');
      }
    } else {
      console.log('✅ backlink_campaigns table created/verified');
    }

    // Create backlink_posts table
    const createPostsTable = `
      CREATE TABLE IF NOT EXISTS backlink_posts (
        id uuid default gen_random_uuid() primary key,
        user_id uuid references auth.users(id) on delete cascade,
        campaign_id uuid references backlink_campaigns(id) on delete cascade,
        target_platform text not null,
        post_url text not null,
        live_url text,
        comment_content text not null,
        domain text not null,
        post_title text,
        status text not null check (status in ('posted', 'failed', 'pending')),
        posted_at timestamptz default now(),
        created_at timestamptz default now(),
        UNIQUE(campaign_id, post_url)
      );
    `;

    console.log('Creating backlink_posts table...');
    const { error: postsError } = await supabase.rpc('execute_sql', { sql: createPostsTable });
    
    if (postsError) {
      const { error: testError } = await supabase.from('backlink_posts').select('count').limit(1);
      if (testError && testError.message.includes('does not exist')) {
        console.log('❌ backlink_posts table needs manual creation');
        console.log('Please run this SQL in your Supabase SQL Editor:');
        console.log(createPostsTable);
      } else {
        console.log('✅ backlink_posts table exists');
      }
    } else {
      console.log('✅ backlink_posts table created/verified');
    }

    // Enable RLS
    const enableRLS = `
      ALTER TABLE backlink_campaigns ENABLE ROW LEVEL SECURITY;
      ALTER TABLE backlink_posts ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can manage their own campaigns" ON backlink_campaigns
        FOR ALL USING (auth.uid() = user_id);
        
      CREATE POLICY "Users can manage their own posts" ON backlink_posts
        FOR ALL USING (auth.uid() = user_id);
    `;

    console.log('Setting up RLS policies...');
    const { error: rlsError } = await supabase.rpc('execute_sql', { sql: enableRLS });
    
    if (rlsError) {
      console.log('⚠️ RLS setup may need manual configuration');
    } else {
      console.log('✅ RLS policies configured');
    }

    console.log('\n🎉 Backlink automation database setup completed!');
    console.log('\nIf you see any ❌ errors above, please run the SQL commands in your Supabase SQL Editor.');
    
  } catch (error) {
    console.error('Setup failed:', error);
    
    // Provide manual setup instructions
    console.log('\n📋 MANUAL SETUP REQUIRED:');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('\n-- Backlink Campaigns Table');
    console.log(`CREATE TABLE IF NOT EXISTS backlink_campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  target_url text not null,
  keyword text not null,
  anchor_text text not null,
  target_platform text not null,
  status text not null default 'paused' check (status in ('active', 'paused', 'completed')),
  links_found integer default 0,
  links_posted integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);`);

    console.log('\n-- Backlink Posts Table');
    console.log(`CREATE TABLE IF NOT EXISTS backlink_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  campaign_id uuid references backlink_campaigns(id) on delete cascade,
  target_platform text not null,
  post_url text not null,
  live_url text,
  comment_content text not null,
  domain text not null,
  post_title text,
  status text not null check (status in ('posted', 'failed', 'pending')),
  posted_at timestamptz default now(),
  created_at timestamptz default now(),
  UNIQUE(campaign_id, post_url)
);`);

    console.log('\n-- Enable RLS');
    console.log(`ALTER TABLE backlink_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlink_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own campaigns" ON backlink_campaigns
  FOR ALL USING (auth.uid() = user_id);
  
CREATE POLICY "Users can manage their own posts" ON backlink_posts
  FOR ALL USING (auth.uid() = user_id);`);
  }
}

// Run the setup
setupBacklinkDatabase();
