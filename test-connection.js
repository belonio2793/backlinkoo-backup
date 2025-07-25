// Quick test to diagnose Supabase connection issues
const testSupabaseConnection = async () => {
  const SUPABASE_URL = 'https://dfhanacsmsvvkpunurnp.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2NDcsImV4cCI6MjA2ODUzMjY0N30.MZcB4P_TAOOTktXSG7bNK5BsIMAf1bKXVgT87Zqa5RY';

  console.log('Testing Supabase connection...');

  try {
    // Test 1: Basic REST API connectivity
    console.log('1. Testing REST API connectivity...');
    const restResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('REST API Status:', restResponse.status);

    // Test 2: Auth endpoint
    console.log('2. Testing Auth endpoint...');
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123'
      })
    });
    console.log('Auth API Status:', authResponse.status);
    const authResult = await authResponse.text();
    console.log('Auth Response:', authResult);

  } catch (error) {
    console.error('Connection test failed:', error);
    
    if (error.message === 'Failed to fetch') {
      console.log('This is a "Failed to fetch" error - possible causes:');
      console.log('- Network connectivity issues');
      console.log('- CORS policy blocking the request');
      console.log('- DNS resolution problems');
      console.log('- Firewall blocking the request');
      console.log('- Supabase service unavailable');
    }
  }
};

testSupabaseConnection();
