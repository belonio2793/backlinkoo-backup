/**
 * Simple OpenAI API test utility
 */

export async function testOpenAIKey(apiKey: string) {
  const keyPreview = `${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 4)}`;
  
  console.log(`🧪 Testing API key: ${keyPreview}`);
  console.log(`📏 Key length: ${apiKey.length} characters`);
  console.log(`🔤 Key format: ${apiKey.startsWith('sk-') ? '✅ Starts with sk-' : '❌ Invalid format'}`);
  
  try {
    // Test 1: Simple models endpoint
    console.log('📡 Testing /v1/models endpoint...');
    const modelsResponse = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Models response status: ${modelsResponse.status}`);
    console.log(`📋 Response headers:`, Object.fromEntries(modelsResponse.headers.entries()));
    
    if (!modelsResponse.ok) {
      const errorText = await modelsResponse.text();
      console.error(`❌ Models endpoint failed:`, errorText);
      return false;
    }
    
    const modelsData = await modelsResponse.json();
    console.log(`✅ Models endpoint successful - ${modelsData.data?.length || 0} models available`);
    
    // Test 2: Simple chat completion
    console.log('🤖 Testing /v1/chat/completions endpoint...');
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Say "API test successful" if you can read this.'
          }
        ],
        max_tokens: 10
      })
    });
    
    console.log(`🗨️ Chat response status: ${chatResponse.status}`);
    
    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error(`❌ Chat endpoint failed:`, errorText);
      return false;
    }
    
    const chatData = await chatResponse.json();
    const response = chatData.choices?.[0]?.message?.content;
    console.log(`✅ Chat endpoint successful - Response: "${response}"`);
    
    return true;
    
  } catch (error) {
    console.error(`🚨 Network error testing ${keyPreview}:`, error);
    return false;
  }
}

export async function testAllKeys() {
  const apiKey = import.meta.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    console.log('🚨 No OpenAI API key configured');
    return null;
  }

  console.log('🔍 Testing OpenAI API key...');

  const success = await testOpenAIKey(apiKey);

  if (success) {
    console.log('✅ OpenAI API key is working perfectly!');
    return apiKey;
  } else {
    console.log('❌ OpenAI API key failed tests');
    return null;
  }
}
