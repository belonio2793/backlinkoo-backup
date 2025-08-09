/**
 * Database Setup and Initialization Utilities
 * Handles database table creation and initial data seeding
 */

import { supabase } from '@/integrations/supabase/client';

export interface DatabaseStatus {
  isConnected: boolean;
  tablesExist: {
    backlink_campaigns: boolean;
    discovered_urls: boolean;
    link_opportunities: boolean;
    link_posting_results: boolean;
  };
  errors: string[];
  needsSetup: boolean;
}

/**
 * Check database connectivity and table existence
 */
export async function checkDatabaseStatus(): Promise<DatabaseStatus> {
  const status: DatabaseStatus = {
    isConnected: false,
    tablesExist: {
      backlink_campaigns: false,
      discovered_urls: false,
      link_opportunities: false,
      link_posting_results: false,
    },
    errors: [],
    needsSetup: false,
  };

  try {
    // Test basic connectivity
    const { data: authData } = await supabase.auth.getSession();
    console.log('🔍 Auth session check:', authData?.session ? 'Active' : 'No session');

    // Check if tables exist by attempting simple queries
    const tableChecks = [
      { name: 'backlink_campaigns', query: supabase.from('backlink_campaigns').select('id').limit(1) },
      { name: 'discovered_urls', query: supabase.from('discovered_urls').select('id').limit(1) },
      { name: 'link_opportunities', query: supabase.from('link_opportunities').select('id').limit(1) },
      { name: 'link_posting_results', query: supabase.from('link_posting_results').select('id').limit(1) },
    ];

    for (const { name, query } of tableChecks) {
      try {
        const { error } = await query;
        if (error) {
          console.warn(`⚠️ Table ${name} check failed:`, error.message);
          status.errors.push(`Table ${name}: ${error.message}`);
          status.tablesExist[name as keyof typeof status.tablesExist] = false;
        } else {
          console.log(`✅ Table ${name} exists and accessible`);
          status.tablesExist[name as keyof typeof status.tablesExist] = true;
        }
      } catch (checkError: any) {
        console.error(`❌ Table ${name} check error:`, checkError);
        status.errors.push(`Table ${name}: ${checkError.message}`);
        status.tablesExist[name as keyof typeof status.tablesExist] = false;
      }
    }

    status.isConnected = status.errors.length === 0 || status.errors.some(e => !e.includes('relation') && !e.includes('does not exist'));
    status.needsSetup = Object.values(status.tablesExist).some(exists => !exists);

    console.log('📊 Database Status:', {
      connected: status.isConnected,
      tablesExisting: Object.values(status.tablesExist).filter(Boolean).length,
      totalTables: Object.keys(status.tablesExist).length,
      needsSetup: status.needsSetup,
      errorCount: status.errors.length
    });

  } catch (error: any) {
    console.error('❌ Database status check failed:', error);
    status.errors.push(`Connection error: ${error.message}`);
    status.isConnected = false;
    status.needsSetup = true;
  }

  return status;
}

/**
 * Initialize database with required tables and seed data
 */
export async function initializeDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🚀 Starting database initialization...');

    // Check current status first
    const status = await checkDatabaseStatus();
    
    if (!status.needsSetup) {
      return { success: true, message: 'Database already initialized' };
    }

    // For now, we'll return a message that manual setup is needed
    // In a real deployment, this would trigger the migration scripts
    return {
      success: false,
      message: 'Database requires setup. Please run migration scripts or contact support.',
    };

  } catch (error: any) {
    console.error('❌ Database initialization failed:', error);
    return {
      success: false,
      message: `Database initialization failed: ${error.message}`,
    };
  }
}

/**
 * Seed database with initial discovery URLs for testing
 */
export async function seedDiscoveryUrls(): Promise<{ success: boolean; count: number }> {
  try {
    console.log('🌱 Seeding discovery URLs...');

    const seedUrls = [
      {
        url: 'https://techcrunch.com/submit-startup/',
        domain: 'techcrunch.com',
        link_type: 'directory_listing',
        domain_authority: 95,
        status: 'verified',
        upvotes: 15,
        downvotes: 2,
      },
      {
        url: 'https://medium.com',
        domain: 'medium.com', 
        link_type: 'web2_platform',
        domain_authority: 90,
        status: 'verified',
        upvotes: 25,
        downvotes: 1,
      },
      {
        url: 'https://reddit.com/r/startups',
        domain: 'reddit.com',
        link_type: 'social_profile',
        domain_authority: 85,
        status: 'verified', 
        upvotes: 20,
        downvotes: 3,
      },
    ];

    const { data, error } = await supabase
      .from('discovered_urls')
      .upsert(seedUrls, { onConflict: 'url' })
      .select('id');

    if (error) {
      console.error('❌ Failed to seed URLs:', error);
      return { success: false, count: 0 };
    }

    console.log(`✅ Seeded ${data?.length || 0} discovery URLs`);
    return { success: true, count: data?.length || 0 };

  } catch (error: any) {
    console.error('❌ URL seeding failed:', error);
    return { success: false, count: 0 };
  }
}

/**
 * Get database statistics for dashboard
 */
export async function getDatabaseStats() {
  try {
    const stats = {
      campaigns: 0,
      discoveredUrls: 0,
      linkOpportunities: 0,
      postedLinks: 0,
    };

    // Get campaign count
    const { count: campaignCount } = await supabase
      .from('backlink_campaigns')
      .select('*', { count: 'exact', head: true });
    stats.campaigns = campaignCount || 0;

    // Get discovered URLs count  
    const { count: urlCount } = await supabase
      .from('discovered_urls')
      .select('*', { count: 'exact', head: true });
    stats.discoveredUrls = urlCount || 0;

    // Get opportunities count
    const { count: opportunityCount } = await supabase
      .from('link_opportunities')
      .select('*', { count: 'exact', head: true });
    stats.linkOpportunities = opportunityCount || 0;

    // Get posted links count
    const { count: postedCount } = await supabase
      .from('link_posting_results')
      .select('*', { count: 'exact', head: true });
    stats.postedLinks = postedCount || 0;

    return stats;

  } catch (error: any) {
    console.error('❌ Failed to get database stats:', error);
    return {
      campaigns: 0,
      discoveredUrls: 0, 
      linkOpportunities: 0,
      postedLinks: 0,
    };
  }
}
