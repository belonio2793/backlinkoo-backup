#!/usr/bin/env node

// Test script to verify database connection and RLS policies
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dfhanacsmsvvkpunurnp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2NDcsImV4cCI6MjA2ODUzMjY0N30.MZcB4P_TAOOTktXSG7bNK5BsIMAf1bKXVgT87Zqa5RY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test 1: Basic connection
    console.log('\n1. Testing basic connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('blog_posts')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Connection failed:', healthError.message);
      return false;
    }
    
    console.log('✅ Database connection working');
    
    // Test 2: Read existing blog posts
    console.log('\n2. Testing blog post access...');
    const { data: posts, error: readError } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(5);
    
    if (readError) {
      console.error('❌ Read access failed:', readError.message);
      
      if (readError.message.includes('row-level security') || readError.message.includes('policy')) {
        console.log('\n🔒 RLS (Row Level Security) is blocking access!');
        console.log('Fix required: You need to update the RLS policies in Supabase.');
        console.log('\nTo fix this:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Execute this SQL:');
        console.log('\n--- SQL FIX ---');
        console.log('ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;');
        console.log('GRANT ALL PRIVILEGES ON TABLE blog_posts TO PUBLIC;');
        console.log('GRANT ALL PRIVILEGES ON TABLE blog_posts TO anon;');
        console.log('GRANT ALL PRIVILEGES ON TABLE blog_posts TO authenticated;');
        console.log('--- END SQL ---\n');
      }
      return false;
    }
    
    console.log(`✅ Found ${posts.length} blog posts`);
    
    // Test 3: Try to create a test post
    console.log('\n3. Testing blog post creation...');
    const testPost = {
      title: 'Database Test Post',
      slug: `test-${Date.now()}`,
      content: '<p>This is a test post to verify database access.</p>',
      status: 'published',
      is_trial_post: true,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    const { data: newPost, error: createError } = await supabase
      .from('blog_posts')
      .insert(testPost)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Create access failed:', createError.message);
      
      if (createError.message.includes('row-level security') || createError.message.includes('policy')) {
        console.log('\n🔒 RLS is blocking blog post creation!');
        console.log('This is the most common issue preventing blog posts from working.');
      }
      return false;
    }
    
    console.log('✅ Blog post creation working');
    
    // Clean up test post
    await supabase
      .from('blog_posts')
      .delete()
      .eq('id', newPost.id);
    
    console.log('✅ Test cleanup completed');
    
    console.log('\n🎉 All database tests passed! Blog posts should be accessible.');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

testDatabaseConnection();
