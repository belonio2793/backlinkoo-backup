/**
 * Utility to check Supabase table permissions and RLS policies
 */

import { supabase } from '@/integrations/supabase/client';

export async function checkSupabasePermissions() {
  console.log('🔐 Checking Supabase table permissions...');
  
  const tables = ['blog_posts', 'published_blog_posts', 'profiles', 'domains'];
  const results: Record<string, any> = {};
  
  for (const table of tables) {
    try {
      console.log(`Testing ${table} table...`);
      
      // Test SELECT permission
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      results[table] = {
        accessible: !error,
        error: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        hasData: !!data?.length,
        dataCount: data?.length || 0
      };
      
      if (error) {
        // Import and use error extractor
        const { logSupabaseError, extractErrorMessage } = await import('@/utils/errorExtractor');
        logSupabaseError(`${table} access failed`, error);

        const errorMessage = extractErrorMessage(error);

        // Check for common RLS or permission issues
        if (errorMessage.includes('permission denied') ||
            errorMessage.includes('RLS') ||
            error.code === '42501') {
          console.error(`🔒 ${table} appears to have RLS policy issues`);
        }

        if (errorMessage.includes('No API key') ||
            error.code === '401' ||
            error.code === 'PGRST000') {
          console.error(`🔑 ${table} access blocked by authentication issue`);
        }

        if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          console.error(`📋 ${table} table does not exist in database`);
        }
      } else {
        console.log(`✅ ${table} accessible, found ${data?.length || 0} records`);
      }
      
    } catch (error: any) {
      const { extractErrorMessage } = await import('@/utils/errorExtractor');
      const errorMessage = extractErrorMessage(error);
      console.error(`❌ ${table} test failed with exception:`, errorMessage);
      results[table] = {
        accessible: false,
        error: errorMessage,
        exception: true
      };
    }
  }
  
  console.log('📊 Permission check summary:', results);
  
  // Check authentication status
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 Current user:', {
      authenticated: !!user,
      userId: user?.id,
      email: user?.email,
      error: authError?.message
    });
  } catch (authError: any) {
    const { extractErrorMessage } = await import('@/utils/errorExtractor');
    const errorMessage = extractErrorMessage(authError);
    console.error('❌ Auth check failed:', errorMessage);
  }
  
  return results;
}

// Auto-run in development
if (import.meta.env.DEV) {
  (window as any).checkSupabasePermissions = checkSupabasePermissions;
  
  // Auto-run after other diagnostics
  setTimeout(checkSupabasePermissions, 3000);
}
