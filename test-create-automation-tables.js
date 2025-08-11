import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dfhanacsmsvvkpunurnp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2Mzc0MDAsImV4cCI6MjA0ODIxMzQwMH0.7tH3V9yKowKYRKwZW5FKw9p7EjZuHEWZbWJ__B5LHeg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAutomationTables() {
  console.log('🔧 Creating automation tables...');
  
  try {
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection test failed:', testError);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Create automation_campaigns table
    console.log('Creating automation_campaigns table...');
    const { error: campaignsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS automation_campaigns (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          name VARCHAR(255) NOT NULL,
          engine_type VARCHAR(50) NOT NULL,
          target_url TEXT NOT NULL,
          keywords TEXT[] NOT NULL DEFAULT '{}',
          anchor_texts TEXT[] NOT NULL DEFAULT '{}',
          status VARCHAR(20) DEFAULT 'draft',
          daily_limit INTEGER DEFAULT 10,
          auto_start BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_activity TIMESTAMP WITH TIME ZONE,
          total_links_built INTEGER DEFAULT 0,
          success_rate DECIMAL(5,2) DEFAULT 0.00
        );
      `
    });
    
    if (campaignsError) {
      console.error('❌ Error creating automation_campaigns:', campaignsError);
    } else {
      console.log('✅ automation_campaigns table created');
    }
    
    // Create link_placements table
    console.log('Creating link_placements table...');
    const { error: placementsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS link_placements (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE NOT NULL,
          source_domain VARCHAR(255) NOT NULL,
          target_url TEXT NOT NULL,
          anchor_text TEXT NOT NULL,
          placement_type VARCHAR(50) NOT NULL,
          placement_url TEXT,
          status VARCHAR(20) DEFAULT 'pending',
          domain_authority INTEGER,
          placement_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          cost DECIMAL(10,2) DEFAULT 0.00,
          notes TEXT
        );
      `
    });
    
    if (placementsError) {
      console.error('❌ Error creating link_placements:', placementsError);
    } else {
      console.log('✅ link_placements table created');
    }
    
    // Create user_link_quotas table
    console.log('Creating user_link_quotas table...');
    const { error: quotasError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_link_quotas (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
          plan_type VARCHAR(20) DEFAULT 'free',
          total_quota INTEGER DEFAULT 20,
          used_quota INTEGER DEFAULT 0,
          remaining_quota INTEGER DEFAULT 20,
          reset_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (quotasError) {
      console.error('❌ Error creating user_link_quotas:', quotasError);
    } else {
      console.log('✅ user_link_quotas table created');
    }
    
    console.log('🎉 Automation tables setup complete!');
    
  } catch (error) {
    console.error('❌ Failed to create automation tables:', error);
  }
}

createAutomationTables();
