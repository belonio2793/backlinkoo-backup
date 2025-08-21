/**
 * Utility to diagnose and fix Supabase authentication issues
 */

export async function fixSupabaseAuth() {
  console.log('🔐 Diagnosing Supabase authentication issues...');
  
  try {
    // Step 1: Check environment variables
    console.log('1️⃣ Checking environment variables...');
    const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
    const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Environment status:', {
      hasUrl,
      hasKey,
      url: hasUrl ? `${import.meta.env.VITE_SUPABASE_URL.substring(0, 30)}...` : 'MISSING',
      keyPrefix: hasKey ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 10)}...` : 'MISSING'
    });
    
    if (!hasUrl || !hasKey) {
      console.error('❌ Missing environment variables');
      console.log('💡 Required variables:');
      console.log('   - VITE_SUPABASE_URL');
      console.log('   - VITE_SUPABASE_ANON_KEY');
      console.log('💡 Check your .env file and restart the dev server');
      return { success: false, issue: 'missing_env_vars' };
    }
    
    // Step 2: Test URL format
    console.log('2️⃣ Validating URL format...');
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
      console.error('❌ Invalid Supabase URL format');
      console.log('💡 URL should be: https://your-project.supabase.co');
      return { success: false, issue: 'invalid_url_format' };
    }
    console.log('✅ URL format is valid');
    
    // Step 3: Test API key format
    console.log('3️⃣ Validating API key format...');
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!key.startsWith('eyJ') || key.length < 100) {
      console.error('❌ Invalid API key format');
      console.log('💡 API key should be a JWT token starting with "eyJ"');
      return { success: false, issue: 'invalid_key_format' };
    }
    console.log('✅ API key format is valid');
    
    // Step 4: Test basic network connectivity
    console.log('4️⃣ Testing network connectivity...');
    try {
      const response = await fetch(url + '/rest/v1/', {
        method: 'GET',
        headers: {
          'apikey': key,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log('✅ Network connectivity successful');
      } else {
        console.warn(`⚠️ Network response: ${response.status} ${response.statusText}`);
        if (response.status === 401) {
          console.error('🔑 401 Unauthorized - API key issue detected');
          return { success: false, issue: 'unauthorized' };
        }
      }
    } catch (networkError: any) {
      console.error('❌ Network connectivity failed:', networkError.message);
      return { success: false, issue: 'network_error', error: networkError };
    }
    
    // Step 5: Test Supabase client initialization
    console.log('5️⃣ Testing Supabase client...');
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      console.log('✅ Supabase client imported successfully');
      
      // Test a simple query to a table that should exist
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase query failed:', error.message || error);
        
        // Specific error analysis
        if (error.code === 'PGRST000') {
          console.error('🔑 PGRST000 - No API key found in request');
          console.log('💡 This usually means the API key is not being sent properly');
          console.log('💡 Try restarting the dev server to reload environment variables');
          return { success: false, issue: 'api_key_not_sent' };
        }
        
        if (error.code === '42P01') {
          console.error('📋 42P01 - Table does not exist');
          console.log('💡 The profiles table does not exist in your database');
          console.log('💡 Check your database schema in Supabase dashboard');
          return { success: false, issue: 'missing_table' };
        }
        
        if (error.code === '42501') {
          console.error('🔒 42501 - Permission denied');
          console.log('💡 RLS policies are blocking access');
          console.log('💡 Check Row Level Security settings in Supabase dashboard');
          return { success: false, issue: 'rls_blocking' };
        }
        
        return { success: false, issue: 'query_error', error };
      }
      
      console.log('✅ Supabase query successful');
      console.log('✅ Authentication is working correctly');
      return { success: true };
      
    } catch (clientError: any) {
      console.error('❌ Supabase client error:', clientError.message || clientError);
      return { success: false, issue: 'client_error', error: clientError };
    }
    
  } catch (error: any) {
    console.error('❌ Authentication fix failed:', error.message || error);
    return { success: false, error };
  }
}

export async function emergencySupabaseReset() {
  console.log('🚨 Running emergency Supabase reset...');
  
  try {
    // Clear any cached connection issues
    localStorage.removeItem('supabase_connection_error');
    localStorage.removeItem('supabase_auth_error');
    sessionStorage.clear();
    
    console.log('🧹 Cleared cached connection errors');
    
    // Force reload to reinitialize everything
    console.log('🔄 Forcing page reload to reinitialize Supabase...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
    return { success: true, action: 'reloading' };
    
  } catch (error: any) {
    console.error('❌ Emergency reset failed:', error.message || error);
    return { success: false, error };
  }
}

// Auto-run in development
if (import.meta.env.DEV) {
  (window as any).fixSupabaseAuth = fixSupabaseAuth;
  (window as any).emergencySupabaseReset = emergencySupabaseReset;
  
  // Auto-run fix if we detect auth issues
  setTimeout(async () => {
    // Check if we're seeing the "[object Object]" errors
    const hasAuthIssues = document.body.textContent?.includes('authentication issue') ||
                         document.body.textContent?.includes('[object Object]');
    
    if (hasAuthIssues) {
      console.log('🔍 Detected authentication issues - running automatic fix...');
      await fixSupabaseAuth();
    }
  }, 8000);
}
