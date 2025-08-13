import { supabase } from '@/integrations/supabase/client';

/**
 * Database Initialization Utility
 * Ensures required tables exist and have proper structure
 */

export class DatabaseInit {
  static async ensureTablesExist(): Promise<boolean> {
    try {
      // Check if article_submissions table exists
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('article_submissions')
        .select('id')
        .limit(1);

      // Check if automation_campaigns table exists  
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('automation_campaigns')
        .select('id')
        .limit(1);

      const tablesExist = !submissionsError && !campaignsError;
      
      console.log('🗄️ Database tables check:', {
        article_submissions: !submissionsError,
        automation_campaigns: !campaignsError,
        allTablesExist: tablesExist
      });

      if (submissionsError) {
        console.warn('⚠️ article_submissions table issue:', submissionsError.message);
      }

      if (campaignsError) {
        console.warn('⚠️ automation_campaigns table issue:', campaignsError.message);
      }

      return tablesExist;
    } catch (error) {
      console.error('❌ Database initialization check failed:', error);
      return false;
    }
  }

  static async createMissingTables(): Promise<void> {
    console.log('🚧 Creating missing database tables...');
    
    try {
      // This would typically be done via Supabase migrations
      // For now, we'll just log what needs to be created
      console.log('📝 Required tables:');
      console.log('   - automation_campaigns');
      console.log('   - article_submissions');
      console.log('💡 Please run database migrations to create these tables');
    } catch (error) {
      console.error('❌ Failed to create tables:', error);
    }
  }
}

// Auto-check on import in development
if (import.meta.env.MODE === 'development') {
  DatabaseInit.ensureTablesExist().then(exist => {
    if (!exist) {
      console.log('⚠️ Some database tables are missing. Check the console for details.');
    }
  });
}
