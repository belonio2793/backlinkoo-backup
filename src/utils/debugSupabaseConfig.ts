/**
 * Debug utility to check Supabase configuration at runtime
 */

export function debugSupabaseConfig() {
  console.log('🔍 Supabase Configuration Debug:');
  console.log('Environment Mode:', import.meta.env.MODE);
  console.log('Has VITE_SUPABASE_URL:', !!import.meta.env.VITE_SUPABASE_URL);
  console.log('Has VITE_SUPABASE_ANON_KEY:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  if (import.meta.env.VITE_SUPABASE_URL) {
    console.log('Supabase URL:', `${import.meta.env.VITE_SUPABASE_URL.substring(0, 30)}...`);
    console.log('URL Format Check:', import.meta.env.VITE_SUPABASE_URL.startsWith('https://') && import.meta.env.VITE_SUPABASE_URL.includes('.supabase.co'));
  } else {
    console.error('❌ VITE_SUPABASE_URL is missing!');
  }
  
  if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.log('Anon Key Prefix:', `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 10)}...`);
    console.log('Key Format Check:', import.meta.env.VITE_SUPABASE_ANON_KEY.startsWith('eyJ') && import.meta.env.VITE_SUPABASE_ANON_KEY.length > 100);
  } else {
    console.error('❌ VITE_SUPABASE_ANON_KEY is missing!');
  }
  
  // Test importing Supabase client
  import('@/integrations/supabase/client').then(({ supabase }) => {
    console.log('✅ Supabase client imported successfully');
    
    // Test a simple query
    return supabase.from('profiles').select('id').limit(1);
  }).then(({ data, error }) => {
    if (error) {
      // Import and use error extractor
      import('@/utils/errorExtractor').then(({ logSupabaseError }) => {
        logSupabaseError('Test query failed', error);
      }).catch(() => {
        // Fallback if import fails
        console.error('❌ Test query failed:', error?.message || error?.code || String(error));
      });
    } else {
      console.log('✅ Test query successful:', data);
    }
  }).catch(error => {
    // Import and use error extractor
    import('@/utils/errorExtractor').then(({ logError }) => {
      logError('Supabase client import or test failed', error);
    }).catch(() => {
      // Fallback if import fails
      console.error('❌ Supabase client import or test failed:', error?.message || String(error));
    });
  });
}

// Auto-run in development
if (import.meta.env.DEV) {
  // Add to window for manual testing
  (window as any).debugSupabaseConfig = debugSupabaseConfig;
  
  // Auto-run after a delay
  setTimeout(debugSupabaseConfig, 1000);
}
