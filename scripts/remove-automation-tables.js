import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const automationTables = [
  'automation_campaigns',
  'automation_logs',
  'automation_analytics',
  'automation_activity',
  'automation_posts',
  'automation_jobs',
  'automation_sessions',
  'automation_alerts',
  'automation_debug_logs',
  'automation_error_patterns',
  'automation_controls',
  'automation_discovered_links',
  'automation_campaign_logs',
  'automation_campaign_metrics',
  'substack_sessions',
  'no_hands_seo_projects',
  'link_opportunities',
  'content_requests',
  'posted_links',
  'campaign_metrics_timeseries',
  'competitor_analysis'
];

async function removeAutomationTables() {
  console.log('🧹 Starting automation table cleanup...');
  
  for (const table of automationTables) {
    try {
      console.log(`Dropping table: ${table}`);
      const { error } = await supabase.rpc('exec_sql', {
        sql: `DROP TABLE IF EXISTS ${table} CASCADE;`
      });
      
      if (error) {
        console.warn(`⚠️  Warning dropping ${table}:`, error.message);
      } else {
        console.log(`✅ Successfully dropped table: ${table}`);
      }
    } catch (err) {
      console.warn(`⚠️  Error dropping ${table}:`, err.message);
    }
  }
  
  console.log('✨ Automation table cleanup completed!');
}

removeAutomationTables().catch(console.error);
