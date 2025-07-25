// Simple Supabase connection test
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dfhanacsmsvvkpunurnp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2NDcsImV4cCI6MjA2ODUzMjY0N30.MZcB4P_TAOOTktXSG7bNK5BsIMAf1bKXVgT87Zqa5RY';

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey.length);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test 1: Check if client can be created
console.log('✅ Supabase client created successfully');

// Test 2: Test auth functionality
async function testAuth() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Auth test failed:', error.message);
      return false;
    }
    console.log('✅ Auth connection successful');
    console.log('Current session:', session ? 'User logged in' : 'No user logged in');
    return true;
  } catch (error) {
    console.log('❌ Auth connection failed:', error.message);
    return false;
  }
}

// Test 3: Test database connection
async function testDatabase() {
  try {
    // Try to access a table (this will tell us if the connection works)
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.log('❌ Database test failed:', error.message);
      return false;
    }
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

// Run tests
testAuth().then(authOk => {
  testDatabase().then(dbOk => {
    if (authOk && dbOk) {
      console.log('🎉 All Supabase connections working!');
    } else {
      console.log('❌ Some connections failed');
    }
  });
});
