// Simple test script to check OpenAI API key connection
const API_KEY = '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';

async function testOpenAIConnection() {
  console.log('🧪 Testing OpenAI API Connection...');
  console.log('🔑 API Key preview:', API_KEY.substring(0, 15) + '...');
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI API connection successful!');
      console.log(`📊 Available models: ${data.data?.length || 0}`);
      console.log('🤖 Sample models:', data.data?.slice(0, 3).map(m => m.id).join(', '));
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ OpenAI API connection failed:');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${errorData.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Network error testing OpenAI API:', error.message);
    return false;
  }
}

// Test simple content generation
async function testContentGeneration() {
  console.log('\n🧪 Testing content generation...');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: 'Write a single sentence about JavaScript programming.'
        }],
        max_tokens: 50
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Content generation successful!');
      console.log('📝 Generated:', data.choices[0]?.message?.content?.trim());
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Content generation failed:');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${errorData.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Network error during content generation:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  const connectionTest = await testOpenAIConnection();
  
  if (connectionTest) {
    await testContentGeneration();
  }
  
  console.log('\n🏁 Test completed!');
}

if (typeof module !== 'undefined') {
  module.exports = { testOpenAIConnection, testContentGeneration };
} else {
  runTests();
}
