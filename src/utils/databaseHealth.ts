import { supabase } from '@/integrations/supabase/client';

export interface DatabaseHealthResult {
  isAvailable: boolean;
  tablesExist: {
    published_blog_posts: boolean;
    subscribers: boolean;
    profiles: boolean;
  };
  error?: string;
}

export class DatabaseHealthChecker {
  /**
   * Check if critical database tables exist
   */
  static async checkDatabaseHealth(): Promise<DatabaseHealthResult> {
    const result: DatabaseHealthResult = {
      isAvailable: false,
      tablesExist: {
        published_blog_posts: false,
        subscribers: false,
        profiles: false,
      }
    };

    try {
      // Test published_blog_posts table
      try {
        const { error } = await supabase
          .from('published_blog_posts')
          .select('id')
          .limit(1);
        
        if (!error) {
          result.tablesExist.published_blog_posts = true;
        } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          console.warn('⚠️ published_blog_posts table does not exist');
        }
      } catch (error: any) {
        console.warn('Error checking published_blog_posts table:', error.message);
      }

      // Test subscribers table
      try {
        const { error } = await supabase
          .from('subscribers')
          .select('id')
          .limit(1);
        
        if (!error) {
          result.tablesExist.subscribers = true;
        } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          console.warn('⚠️ subscribers table does not exist');
        }
      } catch (error: any) {
        console.warn('Error checking subscribers table:', error.message);
      }

      // Test profiles table
      try {
        const { error } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        if (!error) {
          result.tablesExist.profiles = true;
        } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          console.warn('⚠️ profiles table does not exist');
        }
      } catch (error: any) {
        console.warn('Error checking profiles table:', error.message);
      }

      // Database is considered available if we can connect (even if tables don't exist)
      result.isAvailable = true;
      
      return result;
    } catch (error: any) {
      result.error = error.message;
      console.error('Database health check failed:', error);
      return result;
    }
  }

  /**
   * Check if a specific table exists
   */
  static async tableExists(tableName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        return true;
      }
      
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return false;
      }
      
      // If there's another error, assume table exists but there's a different issue
      return true;
    } catch (error) {
      console.warn(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
  }

  /**
   * Log database health status
   */
  static async logDatabaseStatus(): Promise<void> {
    const health = await this.checkDatabaseHealth();
    
    console.log('🔍 Database Health Check:', {
      available: health.isAvailable,
      tables: health.tablesExist,
      error: health.error
    });

    if (!health.isAvailable) {
      console.warn('⚠️ Database is not available, falling back to localStorage');
    } else {
      const missingTables = Object.entries(health.tablesExist)
        .filter(([_, exists]) => !exists)
        .map(([table, _]) => table);
      
      if (missingTables.length > 0) {
        console.warn('⚠️ Missing database tables:', missingTables.join(', '));
        console.warn('📝 These features will use localStorage fallback');
      } else {
        console.log('✅ All critical database tables are available');
      }
    }
  }
}

export default DatabaseHealthChecker;
