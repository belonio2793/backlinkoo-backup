// Simplified Supabase client for debugging
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Direct environment variable access
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Simple Supabase client debug:', {
  url: SUPABASE_URL,
  hasUrl: !!SUPABASE_URL,
  hasKey: !!SUPABASE_ANON_KEY,
  keyLength: SUPABASE_ANON_KEY?.length,
  keyPrefix: SUPABASE_ANON_KEY?.substring(0, 10),
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  allEnv: Object.keys(import.meta.env)
});

// Fallback values if environment variables aren't loaded
const url = SUPABASE_URL || 'https://dfhanacsmsvvkpunurnp.supabase.co';
const key = SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2NDcsImV4cCI6MjA2ODUzMjY0N30.MZcB4P_TAOOTktXSG7bNK5BsIMAf1bKXVgT87Zqa5RY';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Environment variables not loaded, using fallback values');
}

console.log('🔧 Creating Supabase client with:', {
  url: url.substring(0, 30) + '...',
  keyPrefix: key.substring(0, 10) + '...'
});

// Create simple client without any wrappers
export const supabaseSimple = createClient<Database>(url, key, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'backlinkoo-debug@1.0.0'
    }
  }
});

// Test the client immediately
if (import.meta.env.DEV) {
  setTimeout(async () => {
    console.log('🧪 Testing simple Supabase client...');
    try {
      const { data, error } = await supabaseSimple
        .from('profiles')
        .select('id')
        .limit(1);
        
      if (error) {
        console.error('❌ Simple client test failed:', error);
      } else {
        console.log('✅ Simple client test successful');
      }
    } catch (testError) {
      console.error('❌ Simple client test error:', testError);
    }
  }, 1000);
}

export { url as SUPABASE_URL_USED, key as SUPABASE_KEY_USED };
