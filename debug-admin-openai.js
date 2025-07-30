// Test script to debug OpenAI connection issues in admin panel
console.log('🔍 Testing OpenAI API Connection for Admin Panel');
console.log('================================================');

// Test 1: Check environment variable
console.log('\n1. Environment Variables:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `Set (${process.env.OPENAI_API_KEY.length} chars)` : 'Not set');

// Test 2: Test the check-ai-provider function logic directly
async function testCheckProviderFunction() {
  console.log('\n2. Testing check-ai-provider function logic:');
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('❌ API key not available');
    return false;
  }
  
  console.log('✅ API key available');
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI API working - Models available:', data.data?.length || 0);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ OpenAI API error:', errorText);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return false;
  }
}

// Test 3: Test content generation
async function testContentGeneration() {
  console.log('\n3. Testing content generation:');
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('❌ API key not available');
    return false;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Say "Hello from OpenAI API test"' }
        ],
        max_tokens: 50
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      console.log('✅ Content generation working:', content);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Content generation failed:', errorText);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Content generation error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const modelTest = await testCheckProviderFunction();
  const contentTest = await testContentGeneration();
  
  console.log('\n=== Summary ===');
  console.log('Model API test:', modelTest ? '✅ PASS' : '❌ FAIL');
  console.log('Content generation test:', contentTest ? '✅ PASS' : '❌ FAIL');
  
  if (modelTest && contentTest) {
    console.log('\n✅ OpenAI API is working correctly!');
    console.log('The admin panel should show as configured.');
  } else {
    console.log('\n❌ OpenAI API has issues.');
    console.log('This explains why the admin panel shows errors.');
  }
}

runTests().catch(console.error);
