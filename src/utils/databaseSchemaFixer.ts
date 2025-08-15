/**
 * Database Schema Fixer Utility
 * Tests and fixes missing published_blog_posts table
 */

export interface SchemaCheckResult {
  success: boolean;
  tableExists: boolean;
  error?: string;
  message: string;
}

export class DatabaseSchemaFixer {
  
  /**
   * Check if published_blog_posts table exists
   */
  static async checkSchema(): Promise<SchemaCheckResult> {
    try {
      console.log('🔍 Checking published_blog_posts table schema...');
      
      const response = await fetch('/.netlify/functions/ensure-blog-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'check'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: result.success || false,
        tableExists: result.tableExists || false,
        message: result.message || 'Schema check completed',
        error: result.error
      };

    } catch (error) {
      console.error('❌ Schema check failed:', error);
      return {
        success: false,
        tableExists: false,
        message: 'Schema check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fix missing published_blog_posts table
   */
  static async fixSchema(): Promise<SchemaCheckResult> {
    try {
      console.log('🔧 Fixing published_blog_posts table schema...');
      
      const response = await fetch('/.netlify/functions/fix-published-blog-posts-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Schema fix successful');
      } else {
        console.error('❌ Schema fix failed:', result.error);
      }
      
      return {
        success: result.success || false,
        tableExists: result.tableExists || false,
        message: result.message || 'Schema fix completed',
        error: result.error
      };

    } catch (error) {
      console.error('❌ Schema fix failed:', error);
      return {
        success: false,
        tableExists: false,
        message: 'Schema fix failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Auto-fix schema if table is missing
   */
  static async autoFixIfNeeded(): Promise<SchemaCheckResult> {
    try {
      // First check if table exists
      const checkResult = await this.checkSchema();
      
      if (checkResult.tableExists) {
        console.log('✅ published_blog_posts table already exists');
        return checkResult;
      }

      console.log('⚠️ published_blog_posts table missing, attempting to fix...');
      
      // Table doesn't exist, try to fix it
      const fixResult = await this.fixSchema();
      
      if (fixResult.success) {
        console.log('✅ Schema auto-fix completed successfully');
      } else {
        console.error('❌ Schema auto-fix failed:', fixResult.error);
      }
      
      return fixResult;

    } catch (error) {
      console.error('❌ Auto-fix failed:', error);
      return {
        success: false,
        tableExists: false,
        message: 'Auto-fix failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test database connection and published_blog_posts table
   */
  static async testConnection(): Promise<SchemaCheckResult> {
    try {
      console.log('🧪 Testing database connection...');
      
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Try to query the table
      const { data, error } = await supabase
        .from('published_blog_posts')
        .select('id')
        .limit(1);

      if (error) {
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          return {
            success: false,
            tableExists: false,
            message: 'Table does not exist - run auto-fix',
            error: error.message
          };
        }
        
        return {
          success: false,
          tableExists: false,
          message: 'Database connection failed',
          error: error.message
        };
      }

      return {
        success: true,
        tableExists: true,
        message: 'Database connection and table verified'
      };

    } catch (error) {
      console.error('❌ Database test failed:', error);
      return {
        success: false,
        tableExists: false,
        message: 'Database test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Make functions available in window for testing
if (typeof window !== 'undefined') {
  (window as any).testDatabaseSchema = () => DatabaseSchemaFixer.testConnection();
  (window as any).fixDatabaseSchema = () => DatabaseSchemaFixer.autoFixIfNeeded();
  (window as any).checkDatabaseSchema = () => DatabaseSchemaFixer.checkSchema();
  
  console.log('🔧 Database schema utilities available:');
  console.log('  - window.testDatabaseSchema() - Test connection and table');
  console.log('  - window.checkDatabaseSchema() - Check if table exists');
  console.log('  - window.fixDatabaseSchema() - Auto-fix missing table');
}

export default DatabaseSchemaFixer;
