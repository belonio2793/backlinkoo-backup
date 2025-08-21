/**
 * Direct Supabase Client - Bypasses all wrappers and potential issues
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Direct hardcoded credentials to eliminate any environment variable issues
const SUPABASE_URL = 'https://dfhanacsmsvvkpunurnp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2NDcsImV4cCI6MjA2ODUzMjY0N30.MZcB4P_TAOOTktXSG7bNK5BsIMAf1bKXVgT87Zqa5RY';

console.log('🚀 Creating direct Supabase client...');
console.log('URL:', SUPABASE_URL);
console.log('Key prefix:', SUPABASE_ANON_KEY.substring(0, 20) + '...');

// Create the most basic client possible
export const supabaseDirect = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'backlinkoo-direct@1.0.0'
    }
  }
});

// Test the direct client immediately
if (import.meta.env.DEV) {
  setTimeout(async () => {
    console.log('🔍 Testing direct Supabase client...');
    
    try {
      // Test profiles table
      console.log('Testing profiles...');
      const { data: profilesData, error: profilesError } = await supabaseDirect
        .from('profiles')
        .select('id')
        .limit(1);
        
      if (profilesError) {
        console.error('❌ Direct client profiles test failed:', profilesError);
      } else {
        console.log('✅ Direct client profiles test successful');
      }
      
      // Test blog_posts table
      console.log('Testing blog_posts...');
      const { data: postsData, error: postsError } = await supabaseDirect
        .from('blog_posts')
        .select('id')
        .limit(1);
        
      if (postsError) {
        console.error('❌ Direct client blog_posts test failed:', postsError);
      } else {
        console.log('✅ Direct client blog_posts test successful');
      }
      
      // Test published_blog_posts table
      console.log('Testing published_blog_posts...');
      const { data: publishedData, error: publishedError } = await supabaseDirect
        .from('published_blog_posts')
        .select('id')
        .limit(1);
        
      if (publishedError) {
        console.error('❌ Direct client published_blog_posts test failed:', publishedError);
      } else {
        console.log('✅ Direct client published_blog_posts test successful');
      }
      
    } catch (error) {
      console.error('❌ Direct client test failed:', error);
    }
  }, 2000);
}

// Export for debugging
export { SUPABASE_URL as DIRECT_URL, SUPABASE_ANON_KEY as DIRECT_KEY };
