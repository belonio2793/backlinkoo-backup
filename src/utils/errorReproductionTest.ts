/**
 * Error Reproduction Test
 * Simple test to reproduce and identify the "[object Object]" error
 */

import { supabase } from '@/integrations/supabase/client';

export class ErrorReproductionTest {
  /**
   * Test the exact scenario causing the error
   */
  static async reproduceError(): Promise<void> {
    console.log('🐛 Starting error reproduction test...');
    console.log('====================================');
    
    try {
      console.log('Step 1: Testing basic Supabase connection...');
      
      // Test the exact same query that's failing
      const now = new Date().toISOString();
      console.log('Current timestamp:', now);
      
      console.log('Step 2: Attempting the failing query...');
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, published_url, title, created_at, expires_at')
        .eq('status', 'unclaimed')
        .eq('is_trial_post', true)
        .lt('expires_at', now);
      
      if (error) {
        console.log('🎯 FOUND THE ERROR!');
        console.log('Error type:', typeof error);
        console.log('Error constructor:', error.constructor.name);
        console.log('Error properties:');
        console.log('- message:', error.message);
        console.log('- details:', error.details);
        console.log('- hint:', error.hint);
        console.log('- code:', error.code);
        console.log('Full error object:', error);
        console.log('JSON stringified:', JSON.stringify(error, null, 2));
        
        // Try different ways to log the error
        console.log('String conversion:', String(error));
        console.log('Error toString():', error.toString());
        
        // Check if it's a specific type of error
        if (error.code === 'PGRST116') {
          console.log('🎯 DIAGNOSIS: Table "blog_posts" does not exist in your Supabase database');
          console.log('SOLUTION: Create the blog_posts table in your Supabase SQL editor');
        } else if (error.message.includes('permission')) {
          console.log('🎯 DIAGNOSIS: Permission denied - check your RLS policies');
        } else {
          console.log('🎯 DIAGNOSIS: Unknown database error');
        }
        
        return;
      }
      
      console.log('✅ Query successful! Data:', data);
      
    } catch (catchError) {
      console.log('🎯 CAUGHT EXCEPTION!');
      console.log('Exception type:', typeof catchError);
      console.log('Exception constructor:', catchError.constructor?.name);
      console.log('Exception message:', catchError instanceof Error ? catchError.message : 'No message');
      console.log('Exception stack:', catchError instanceof Error ? catchError.stack : 'No stack');
      console.log('Full exception:', catchError);
      console.log('String conversion:', String(catchError));
      
      // This might be where the [object Object] is coming from
      if (typeof catchError === 'object' && catchError !== null) {
        console.log('Object keys:', Object.keys(catchError));
        console.log('Object values:', Object.values(catchError));
      }
    }
    
    console.log('====================================');
    console.log('✅ Error reproduction test complete');
  }

  /**
   * Test what happens when we try to access a non-existent table
   */
  static async testNonExistentTable(): Promise<void> {
    console.log('🧪 Testing non-existent table access...');
    
    try {
      const { data, error } = await supabase
        .from('definitely_does_not_exist')
        .select('*');
        
      if (error) {
        console.log('Non-existent table error:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
      }
    } catch (e) {
      console.log('Non-existent table exception:', e);
    }
  }

  /**
   * Test what happens with RLS policy issues
   */
  static async testRLSIssue(): Promise<void> {
    console.log('🔒 Testing potential RLS policy issues...');

    try {
      // Try to access profiles table (which should exist)
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, role')
        .limit(1);

      if (error) {
        console.log('RLS/Permission error example:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
      } else {
        console.log('✅ Profiles table accessible, data:', data);
      }
    } catch (e) {
      console.log('RLS/Permission exception:', e);
    }
  }
}

// Note: Auto-run removed to prevent unwanted queries
// Call ErrorReproductionTest.reproduceError() manually if needed

export default ErrorReproductionTest;
