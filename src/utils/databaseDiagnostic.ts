/**
 * Database Diagnostic Utility
 * Helps debug database connection and table structure issues
 */

import { supabase } from '@/integrations/supabase/client';

export interface DiagnosticResult {
  success: boolean;
  message: string;
  details?: any;
}

export class DatabaseDiagnostic {
  /**
   * Test basic Supabase connection
   */
  static async testConnection(): Promise<DiagnosticResult> {
    try {
      const { data, error } = await supabase.from('blog_posts').select('count', { count: 'exact', head: true });
      
      if (error) {
        return {
          success: false,
          message: `Connection failed: ${error.message}`,
          details: {
            code: error.code,
            details: error.details,
            hint: error.hint
          }
        };
      }

      return {
        success: true,
        message: 'Database connection successful',
        details: { count: data }
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Check if blog_posts table exists and get its structure
   */
  static async checkBlogPostsTable(): Promise<DiagnosticResult> {
    try {
      // First, try to get table info using RPC or direct query
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          return {
            success: false,
            message: 'blog_posts table does not exist',
            details: {
              solution: 'Create the blog_posts table in your Supabase database',
              error: error
            }
          };
        }

        return {
          success: false,
          message: `Table access error: ${error.message}`,
          details: error
        };
      }

      return {
        success: true,
        message: 'blog_posts table exists and is accessible',
        details: { sampleData: data }
      };
    } catch (error) {
      return {
        success: false,
        message: `Table check error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get table schema information
   */
  static async getTableSchema(): Promise<DiagnosticResult> {
    try {
      // Try to get one record to see the actual structure
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .limit(1);

      if (error) {
        return {
          success: false,
          message: `Schema check failed: ${error.message}`,
          details: error
        };
      }

      const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
      
      return {
        success: true,
        message: 'Schema retrieved successfully',
        details: {
          columns: columns,
          expectedColumns: [
            'id', 'title', 'slug', 'content', 'target_url', 'anchor_text',
            'keywords', 'meta_description', 'published_url', 'word_count',
            'expires_at', 'is_trial_post', 'user_id', 'status', 'created_at'
          ]
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Schema error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Run complete diagnostic
   */
  static async runCompleteDiagnostic(): Promise<DiagnosticResult[]> {
    console.log('🔍 Running complete database diagnostic...');
    
    const results = await Promise.all([
      this.testConnection(),
      this.checkBlogPostsTable(),
      this.getTableSchema()
    ]);

    console.log('📊 Diagnostic Results:');
    results.forEach((result, index) => {
      const tests = ['Connection Test', 'Table Check', 'Schema Check'];
      console.log(`${tests[index]}: ${result.success ? '✅' : '❌'} ${result.message}`);
      if (result.details) {
        console.log('Details:', result.details);
      }
    });

    return results;
  }

  /**
   * Create blog_posts table if it doesn't exist
   */
  static async createBlogPostsTable(): Promise<DiagnosticResult> {
    try {
      // Note: This would typically be done via Supabase SQL editor or migrations
      // This is just for reference - you can't create tables via the JS client
      const sql = `
        CREATE TABLE IF NOT EXISTS blog_posts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          content TEXT NOT NULL,
          target_url TEXT NOT NULL,
          anchor_text TEXT NOT NULL,
          keywords TEXT[],
          meta_description TEXT,
          published_url TEXT,
          word_count INTEGER DEFAULT 0,
          expires_at TIMESTAMP WITH TIME ZONE,
          is_trial_post BOOLEAN DEFAULT false,
          user_id UUID REFERENCES auth.users(id),
          status TEXT DEFAULT 'unclaimed' CHECK (status IN ('unclaimed', 'claimed', 'expired')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          deleted_at TIMESTAMP WITH TIME ZONE,
          claimed_by UUID REFERENCES auth.users(id),
          claimed_at TIMESTAMP WITH TIME ZONE
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_trial ON blog_posts(is_trial_post);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_expires ON blog_posts(expires_at);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_user ON blog_posts(user_id);
      `;

      return {
        success: false,
        message: 'Table creation requires SQL execution in Supabase dashboard',
        details: {
          sql: sql,
          instructions: 'Run this SQL in your Supabase SQL editor'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Table creation error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export const databaseDiagnostic = new DatabaseDiagnostic();
