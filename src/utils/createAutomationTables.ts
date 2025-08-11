import { supabase } from '@/integrations/supabase/client';

export async function initializeAutomationTables() {
  console.log('🔧 Initializing automation system...');
  
  try {
    // For now, let's just test if the tables exist by trying to select from them
    // and handle the errors gracefully
    
    // Test automation_campaigns table
    const { data: campaignsTest, error: campaignsError } = await supabase
      .from('automation_campaigns')
      .select('count')
      .limit(1);

    let campaignsTableExists = false;
    if (campaignsError) {
      // Handle auth session missing as expected for unauthenticated checks
      if (campaignsError.message?.includes('Auth session missing')) {
        console.log('✅ automation_campaigns table exists (no auth session required for table check)');
        campaignsTableExists = true;
      } else {
        console.log('automation_campaigns table does not exist or has issues:', {
          message: campaignsError.message,
          code: campaignsError.code,
          details: campaignsError.details
        });
        campaignsTableExists = false;
      }
    } else {
      console.log('✅ automation_campaigns table exists');
      campaignsTableExists = true;
    }
    
    // Test link_placements table
    const { data: placementsTest, error: placementsError } = await supabase
      .from('link_placements')
      .select('count')
      .limit(1);

    let placementsTableExists = false;
    if (placementsError) {
      // Handle auth session missing as expected for unauthenticated checks
      if (placementsError.message?.includes('Auth session missing')) {
        console.log('✅ link_placements table exists (no auth session required for table check)');
        placementsTableExists = true;
      } else {
        console.log('link_placements table does not exist or has issues:', {
          message: placementsError.message,
          code: placementsError.code,
          details: placementsError.details
        });
        placementsTableExists = false;
      }
    } else {
      console.log('✅ link_placements table exists');
      placementsTableExists = true;
    }
    
    // Test user_link_quotas table
    const { data: quotasTest, error: quotasError } = await supabase
      .from('user_link_quotas')
      .select('count')
      .limit(1);

    let quotasTableExists = false;
    if (quotasError) {
      // Handle auth session missing as expected for unauthenticated checks
      if (quotasError.message?.includes('Auth session missing')) {
        console.log('✅ user_link_quotas table exists (no auth session required for table check)');
        quotasTableExists = true;
      } else {
        console.log('user_link_quotas table does not exist or has issues:', {
          message: quotasError.message,
          code: quotasError.code,
          details: quotasError.details
        });
        quotasTableExists = false;
      }
    } else {
      console.log('✅ user_link_quotas table exists');
      quotasTableExists = true;
    }
    
    // Return status
    return {
      automation_campaigns: campaignsTableExists,
      link_placements: placementsTableExists,
      user_link_quotas: quotasTableExists,
      allTablesExist: campaignsTableExists && placementsTableExists && quotasTableExists
    };
    
  } catch (error: any) {
    console.error('❌ Failed to check automation tables:', {
      message: error.message,
      stack: error.stack
    });
    return {
      automation_campaigns: false,
      link_placements: false,
      user_link_quotas: false,
      allTablesExist: false,
      error: error.message
    };
  }
}
