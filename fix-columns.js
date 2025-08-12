const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addColumns() {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;
      `
    });
    
    if (error) throw error;
    console.log('✅ Columns added successfully');
    
    // Verify
    const { data } = await supabase.rpc('exec_sql', {
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'automation_campaigns' AND column_name IN ('started_at', 'completed_at', 'auto_start');`
    });
    
    console.log('📋 Found columns:', data?.map(c => c.column_name) || []);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Run this SQL manually in Supabase SQL Editor:');
    console.log('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;');
    console.log('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;');
    console.log('ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;');
  }
}

addColumns();
