/**
 * BlogClaimService Diagnostic Utility
 * Helps debug database connection and table issues
 */

import { supabase } from '@/integrations/supabase/client';

export interface BlogClaimDiagnosticResult {
  success: boolean;
  issues: string[];
  details: {
    databaseConnected: boolean;
    tableExists: boolean;
    hasData: boolean;
    samplePosts: any[];
    errorDetails?: any;
  };
}

export class BlogClaimDiagnostic {
  static async runFullDiagnostic(): Promise<BlogClaimDiagnosticResult> {
    console.log('🔧 BlogClaimService: Running full diagnostic...');
    
    const result: BlogClaimDiagnosticResult = {
      success: true,
      issues: [],
      details: {
        databaseConnected: false,
        tableExists: false,
        hasData: false,
        samplePosts: []
      }
    };

    try {
      // Test 1: Basic database connection
      console.log('🔧 Test 1: Testing database connection...');
      try {
        const { data: healthCheck, error: healthError } = await supabase
          .from('published_blog_posts')
          .select('count')
          .limit(0);

        if (healthError) {
          result.issues.push(`Database connection failed: ${healthError.message}`);
          result.details.errorDetails = healthError;
          result.success = false;
          
          if (healthError.message?.includes('relation') || healthError.message?.includes('does not exist')) {
            result.issues.push('Table "published_blog_posts" does not exist');
          }
        } else {
          result.details.databaseConnected = true;
          result.details.tableExists = true;
          console.log('✅ Database connection and table exist');
        }
      } catch (connectionError: any) {
        result.issues.push(`Connection exception: ${connectionError.message}`);
        result.details.errorDetails = connectionError;
        result.success = false;
      }

      // Test 2: Try to fetch sample data (if table exists)
      if (result.details.tableExists) {
        console.log('🔧 Test 2: Testing data retrieval...');
        try {
          const { data: sampleData, error: dataError } = await supabase
            .from('published_blog_posts')
            .select('id, title, slug, is_trial_post, created_at')
            .limit(3);

          if (dataError) {
            result.issues.push(`Data retrieval failed: ${dataError.message}`);
            result.details.errorDetails = dataError;
            result.success = false;
          } else {
            result.details.hasData = (sampleData?.length || 0) > 0;
            result.details.samplePosts = sampleData || [];
            console.log(`✅ Retrieved ${sampleData?.length || 0} sample posts`);
          }
        } catch (dataError: any) {
          result.issues.push(`Data retrieval exception: ${dataError.message}`);
          result.details.errorDetails = dataError;
          result.success = false;
        }
      }

      // Test 3: Schema validation
      if (result.details.tableExists) {
        console.log('🔧 Test 3: Testing schema compatibility...');
        try {
          const { data: schemaTest, error: schemaError } = await supabase
            .from('published_blog_posts')
            .select(`
              id, slug, title, excerpt, published_url, target_url,
              created_at, expires_at, seo_score, reading_time, word_count,
              view_count, is_trial_post, user_id, author_name, tags, category
            `)
            .limit(1);

          if (schemaError) {
            result.issues.push(`Schema validation failed: ${schemaError.message}`);
            result.details.errorDetails = schemaError;
            result.success = false;
          } else {
            console.log('✅ Schema validation passed');
          }
        } catch (schemaError: any) {
          result.issues.push(`Schema validation exception: ${schemaError.message}`);
          result.details.errorDetails = schemaError;
          result.success = false;
        }
      }

    } catch (error: any) {
      result.issues.push(`Diagnostic failed: ${error.message}`);
      result.details.errorDetails = error;
      result.success = false;
    }

    console.log('🔧 BlogClaimService Diagnostic Results:', result);
    return result;
  }

  static async quickConnectionTest(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('published_blog_posts')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      return false;
    }
  }

  static async testTableSchema(): Promise<{ valid: boolean; missingColumns: string[] }> {
    const requiredColumns = [
      'id', 'slug', 'title', 'excerpt', 'published_url', 'target_url',
      'created_at', 'expires_at', 'seo_score', 'reading_time', 'word_count',
      'view_count', 'is_trial_post', 'user_id', 'author_name', 'tags', 'category'
    ];

    const missingColumns: string[] = [];

    for (const column of requiredColumns) {
      try {
        const { error } = await supabase
          .from('published_blog_posts')
          .select(column)
          .limit(1);

        if (error && error.message.includes(column)) {
          missingColumns.push(column);
        }
      } catch (error) {
        missingColumns.push(column);
      }
    }

    return {
      valid: missingColumns.length === 0,
      missingColumns
    };
  }
}

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).blogClaimDiagnostic = BlogClaimDiagnostic;
  console.log('🔧 BlogClaimService diagnostic available via window.blogClaimDiagnostic');
}
