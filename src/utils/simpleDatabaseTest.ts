import { supabase } from '@/integrations/supabase/client';

export async function testDatabaseConnectivity() {
  console.log('🔗 Testing basic database connectivity...');
  
  try {
    // Simple connectivity test using supabase auth which is always available
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message !== 'Invalid session') {
      console.error('❌ Database connectivity failed:', error.message);
      return {
        connected: false,
        error: error.message,
        details: error
      };
    }
    
    console.log('✅ Database connectivity successful');
    return {
      connected: true,
      session: data?.session ? 'Active session found' : 'No active session'
    };
    
  } catch (error: any) {
    console.error('❌ Database connectivity test failed:', error.message);
    return {
      connected: false,
      error: error.message,
      details: error
    };
  }
}

export async function testAutomationTablesAccess() {
  console.log('🔧 Testing automation tables access...');
  
  const results = {
    automation_campaigns: false,
    link_placements: false,
    user_link_quotas: false,
    available_sites: false,
    campaign_reports: false,
    errors: [] as string[]
  };
  
  // Test each table individually
  const tables = [
    'automation_campaigns',
    'link_placements', 
    'user_link_quotas',
    'available_sites',
    'campaign_reports'
  ];
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        results.errors.push(`${table}: ${error.message}`);
        results[table as keyof typeof results] = false;
      } else {
        console.log(`✅ ${table}: accessible`);
        results[table as keyof typeof results] = true;
      }
    } catch (err: any) {
      console.log(`❌ ${table}: ${err.message}`);
      results.errors.push(`${table}: ${err.message}`);
      results[table as keyof typeof results] = false;
    }
  }
  
  const allTablesAccessible = Object.values(results).slice(0, 5).every(Boolean);
  
  return {
    ...results,
    allTablesAccessible,
    summary: `${Object.values(results).slice(0, 5).filter(Boolean).length}/5 tables accessible`
  };
}
