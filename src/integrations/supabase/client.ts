import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase API: Initializing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dfhanacsmsvvkpunurnp.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

console.log('🔧 Supabase configuration:', {
  url: supabaseUrl,
  hasKey: !!supabaseKey,
  keyPrefix: supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'missing'
});

const supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Test connection in development
if (import.meta.env.DEV) {
  setTimeout(async () => {
    try {
      console.log('🔍 Testing Supabase connection...');
      const { data, error } = await supabaseClient
        .from('domains')
        .select('id')
        .limit(1);

      if (error) {
        console.warn('⚠️ Database connection test failed:', error.message);
      } else {
        console.log('✅ Supabase connection test successful');
      }
    } catch (testError: any) {
      console.error('❌ Connection test failed:', testError.message);
    }
  }, 1000);
}

export const supabase = supabaseClient;
