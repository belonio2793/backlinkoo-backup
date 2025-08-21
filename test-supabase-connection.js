import { createClient } from '@supabase/supabase-js';

// Test the same credentials as the app uses
const SUPABASE_URL = 'https://dfhanacsmsvvkpunurnp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2NDcsImV4cCI6MjA2ODUzMjY0N30.MZcB4P_TAOOTktXSG7bNK5BsIMAf1bKXVgT87Zqa5RY';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  console.log('URL:', SUPABASE_URL);
  console.log('Key prefix:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Test 1: Basic connection to profiles table
    console.log('\n📊 Test 1: Profiles table access');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (profilesError) {
      console.error('❌ Profiles access failed:', profilesError.message);
    } else {
      console.log('✅ Profiles access successful');
    }
    
    // Test 2: Blog posts table access
    console.log('\n📝 Test 2: Blog posts table access');
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('id')
      .limit(1);
      
    if (postsError) {
      console.error('❌ Blog posts access failed:', postsError.message);
    } else {
      console.log('✅ Blog posts access successful');
    }
    
    // Test 3: Published blog posts table access
    console.log('\n📰 Test 3: Published blog posts table access');
    const { data: published, error: publishedError } = await supabase
      .from('published_blog_posts')
      .select('id')
      .limit(1);
      
    if (publishedError) {
      console.error('❌ Published blog posts access failed:', publishedError.message);
    } else {
      console.log('✅ Published blog posts access successful');
    }
    
    // Test 4: Domains table access
    console.log('\n🌐 Test 4: Domains table access');
    const { data: domains, error: domainsError } = await supabase
      .from('domains')
      .select('id')
      .limit(1);
      
    if (domainsError) {
      console.error('❌ Domains access failed:', domainsError.message);
    } else {
      console.log('✅ Domains access successful');
    }
    
    console.log('\n🎉 Connection test completed!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testSupabaseConnection();
