const { SecureConfig } = require('./scripts/secure-config.js');

// Test OpenAI connection internally
async function testOpenAIConnection() {
  try {
    const apiKey = SecureConfig.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log('❌ OpenAI API key not found in secure config');
      return false;
    }
    
    console.log('✅ OpenAI API key found in secure config');
    console.log('Key length:', apiKey.length);
    console.log('Key prefix:', apiKey.substring(0, 7) + '...');
    
    // Test the API connection
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI API connection successful');
      console.log('Available models:', data.data.length);
      return true;
    } else {
      console.log('❌ OpenAI API connection failed');
      console.log('Status:', response.status);
      const errorText = await response.text();
      console.log('Error:', errorText);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Error testing OpenAI connection:', error.message);
    return false;
  }
}

// Test environment variable availability
function testEnvironmentVariables() {
  console.log('\n=== Environment Variables ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('OPENAI_API_KEY (env):', process.env.OPENAI_API_KEY ? 'Set' : 'Not set');
  console.log('VITE_OPENAI_API_KEY (env):', process.env.VITE_OPENAI_API_KEY ? 'Set' : 'Not set');
}

// Main test
async function main() {
  console.log('🔍 Testing OpenAI API Connection');
  console.log('================================');
  
  testEnvironmentVariables();
  
  console.log('\n=== Secure Config Test ===');
  const result = await testOpenAIConnection();
  
  console.log('\n=== Summary ===');
  console.log('OpenAI API Connection:', result ? '✅ Working' : '❌ Failed');
}

main().catch(console.error);
