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
  const apiKeys = [
    import.meta.env.VITE_OPENAI_API_KEY,
    import.meta.env.VITE_OPENAI_API_KEY_BACKUP_1,
    import.meta.env.VITE_OPENAI_API_KEY_BACKUP_2
  ].filter(key => key && key !== 'your-openai-api-key-here');
  
  console.log(`🔍 Testing ${apiKeys.length} OpenAI API keys...`);
  
  for (let i = 0; i < apiKeys.length; i++) {
    console.log(`\n🔑 Testing Key ${i + 1}/${apiKeys.length}:`);
    const success = await testOpenAIKey(apiKeys[i]);
    
    if (success) {
      console.log(`✅ Key ${i + 1} is working perfectly!`);
      return apiKeys[i]; // Return the first working key
    } else {
      console.log(`❌ Key ${i + 1} failed tests`);
    }
  }
  
  console.log(`\n🚨 All ${apiKeys.length} keys failed tests`);
  return null;
}
