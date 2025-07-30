// Simple test to verify current API key
const NEW_KEY = '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';

// Quick test function - can be called from browser console
window.testCurrentOpenAIKey = async function() {
  console.log('🧪 Testing current OpenAI API key configuration...');
  
  // Check environment variable
  const envKey = import.meta?.env?.VITE_OPENAI_API_KEY;
  console.log('🔑 Environment key:', envKey ? envKey.substring(0, 15) + '...' : 'Not found');
  
  // Check if it matches expected
  if (envKey === NEW_KEY) {
    console.log('✅ Environment variable matches expected key');
  } else {
    console.log('❌ Environment variable does not match expected key');
  }
  
  // Test API call with current key
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${envKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ API key is valid and working');
      const data = await response.json();
      console.log(`📊 Available models: ${data.data?.length || 0}`);
    } else {
      console.log('❌ API key validation failed:', response.status);
      const error = await response.text();
      console.log('Error details:', error);
    }
  } catch (error) {
    console.log('❌ Network error testing API:', error.message);
  }
};

console.log('🔧 API key test utility loaded. Run: testCurrentOpenAIKey()');
