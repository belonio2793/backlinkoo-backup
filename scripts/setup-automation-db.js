const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupAutomationDatabase() {
  console.log('Setting up automation database tables...');
  
  try {
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241201000000_automation_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('execute_sql', { query: statement });
          
          if (error && !error.message.includes('already exists')) {
            console.error(`Error in statement ${i + 1}:`, error);
            // Continue with other statements
          } else {
            console.log(`✓ Statement ${i + 1} completed`);
          }
        } catch (err) {
          console.error(`Error executing statement ${i + 1}:`, err.message);
          // Continue with other statements
        }
      }
    }
    
    // Verify tables were created
    console.log('\nVerifying tables...');
    const tables = [
      'blog_campaigns',
      'blog_targets', 
      'comment_forms',
      'posting_accounts',
      'posting_results',
      'automation_jobs'
    ];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          console.log(`❌ Table ${table} not accessible: ${error.message}`);
        } else {
          console.log(`✅ Table ${table} ready`);
        }
      } catch (err) {
        console.log(`❌ Table ${table} error: ${err.message}`);
      }
    }
    
    console.log('\n🎉 Automation database setup completed!');
    
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

// Alternative setup using individual table creation
async function setupTablesManually() {
  console.log('Setting up automation tables manually...');
  
  const tables = [
    {
      name: 'blog_campaigns',
      sql: `
        CREATE TABLE IF NOT EXISTS blog_campaigns (
          id uuid default gen_random_uuid() primary key,
          user_id uuid references auth.users(id) on delete cascade,
          name text not null,
          target_url text not null,
          keyword text not null,
          anchor_text text,
          status text not null default 'paused' check (status in ('active', 'paused', 'completed')),
          automation_enabled boolean default false,
          max_posts_per_domain integer default 1,
          links_found integer default 0,
          links_posted integer default 0,
          created_at timestamptz default now(),
          updated_at timestamptz default now()
        );
      `
    },
    {
      name: 'blog_targets',
      sql: `
        CREATE TABLE IF NOT EXISTS blog_targets (
          id uuid default gen_random_uuid() primary key,
          campaign_id uuid references blog_campaigns(id) on delete cascade,
          url text not null,
          domain text not null,
          title text,
          has_comment_form boolean default false,
          form_selector text,
          confidence_score integer default 0,
          discovered_at timestamptz default now(),
          status text default 'discovered' check (status in ('discovered', 'analyzed', 'validated', 'posted', 'failed')),
          UNIQUE(campaign_id, url)
        );
      `
    },
    {
      name: 'comment_forms',
      sql: `
        CREATE TABLE IF NOT EXISTS comment_forms (
          id uuid default gen_random_uuid() primary key,
          campaign_id uuid references blog_campaigns(id) on delete cascade,
          url text not null,
          domain text not null,
          platform text default 'unknown',
          form_selector text not null,
          form_action text,
          form_method text default 'POST',
          field_mappings jsonb not null default '{}',
          hidden_fields jsonb not null default '{}',
          submit_selector text,
          confidence_score integer not null default 0,
          requires_captcha boolean default false,
          page_title text,
          detected_at timestamptz default now(),
          status text default 'detected' check (status in ('detected', 'validated', 'blocked', 'needs_review')),
          last_posted_at timestamptz,
          UNIQUE(url)
        );
      `
    },
    {
      name: 'posting_accounts',
      sql: `
        CREATE TABLE IF NOT EXISTS posting_accounts (
          id uuid default gen_random_uuid() primary key,
          user_id uuid references auth.users(id) on delete cascade,
          name text not null,
          email text not null,
          website text,
          platform text default 'generic',
          is_active boolean default true,
          health_score integer default 100,
          last_used timestamptz,
          created_at timestamptz default now(),
          UNIQUE(user_id, email)
        );
      `
    },
    {
      name: 'posting_results',
      sql: `
        CREATE TABLE IF NOT EXISTS posting_results (
          id uuid default gen_random_uuid() primary key,
          campaign_id uuid references blog_campaigns(id) on delete cascade,
          form_id uuid references comment_forms(id),
          account_id uuid references posting_accounts(id),
          target_url text not null,
          comment_content text not null,
          status text not null check (status in ('posted', 'failed', 'pending', 'captcha', 'moderation')),
          error_message text,
          response_data text,
          screenshot_url text,
          live_url text,
          posted_at timestamptz default now(),
          created_at timestamptz default now()
        );
      `
    },
    {
      name: 'automation_jobs',
      sql: `
        CREATE TABLE IF NOT EXISTS automation_jobs (
          id uuid default gen_random_uuid() primary key,
          campaign_id uuid references blog_campaigns(id) on delete cascade,
          job_type text not null check (job_type in ('discover', 'detect', 'post', 'validate')),
          status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
          payload jsonb,
          result jsonb,
          progress integer default 0,
          error_message text,
          started_at timestamptz,
          completed_at timestamptz,
          created_at timestamptz default now()
        );
      `
    }
  ];

  for (const table of tables) {
    try {
      console.log(`Creating table ${table.name}...`);
      
      // Try using a Supabase function if available
      const { error } = await supabase.rpc('exec', { sql: table.sql });
      
      if (error) {
        console.log(`Direct SQL failed for ${table.name}, trying alternative...`);
        // Alternative: Use a simple insert to test table existence
        const { error: testError } = await supabase.from(table.name).select('count').limit(1);
        if (testError && testError.message.includes('does not exist')) {
          console.log(`❌ Table ${table.name} needs manual creation`);
        } else {
          console.log(`✅ Table ${table.name} exists`);
        }
      } else {
        console.log(`✅ Table ${table.name} created/verified`);
      }
      
    } catch (err) {
      console.error(`Error with table ${table.name}:`, err.message);
    }
  }
  
  console.log('\n🎉 Manual table setup completed!');
}

// Run the setup
if (process.argv.includes('--manual')) {
  setupTablesManually();
} else {
  setupAutomationDatabase();
}
