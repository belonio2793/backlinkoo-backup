const fetch = require('node-fetch');

async function testContentFunctions() {
  console.log('🧪 Testing content generation functions...\n');
  
  const functions = [
    'generate-content',
    'ai-content-generator', 
    'generate-openai',
    'simple-ai-generator',
    'content-generator-fixed'
  ];
  
  const testPayload = {
    keyword: 'go high level',
    anchor_text: 'test link',
    target_url: 'https://example.com',
    word_count: 300,
    tone: 'professional'
  };
  
  for (const func of functions) {
    try {
      console.log(`Testing /.netlify/functions/${func}...`);
      
      const response = await fetch(`http://localhost:8888/.netlify/functions/${func}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });
      
      console.log(`  Status: ${response.status}`);
      
      if (response.status === 404) {
        console.log(`  ❌ Function not found\n`);
        continue;
      }
      
      const data = await response.json();
      console.log(`  ✅ Response:`, data.success ? 'Success' : 'Failed');
      
      if (data.success) {
        console.log(`  📝 Generated ${data.data?.word_count || 'unknown'} words\n`);
        break; // Found working function
      } else {
        console.log(`  ❌ Error: ${data.error}\n`);
      }
      
    } catch (error) {
      console.log(`  💥 Network error: ${error.message}\n`);
    }
  }
}

testContentFunctions().catch(console.error);
