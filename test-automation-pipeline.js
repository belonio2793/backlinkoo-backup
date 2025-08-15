/**
 * Test Automation Pipeline
 * Tests the complete flow: Content Generation → Telegraph Publishing → Database Storage
 */

const testPipeline = async () => {
  console.log('🧪 Testing Complete Automation Pipeline\n');

  const testData = {
    keyword: 'AI automation',
    anchorText: 'best AI tools',
    targetUrl: 'https://example.com',
    userId: 'test-user-123'
  };

  console.log('📝 Test Data:', testData);
  console.log('\n=== STEP 1: Content Generation ===');

  try {
    // Test content generation
    const contentResponse = await fetch('/.netlify/functions/working-content-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    console.log('Content Generation Response:', contentResponse.status, contentResponse.statusText);

    if (!contentResponse.ok) {
      const errorData = await contentResponse.text();
      console.error('❌ Content generation failed:', errorData);
      return;
    }

    const contentData = await contentResponse.json();
    console.log('✅ Content generated successfully');
    console.log('Title:', contentData.data?.title);
    console.log('Word Count:', contentData.data?.wordCount);
    console.log('Content Preview:', contentData.data?.content?.substring(0, 200) + '...');

    console.log('\n=== STEP 2: Telegraph Publishing ===');

    // Test Telegraph publishing
    const publishResponse = await fetch('/.netlify/functions/publish-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: contentData.data.title,
        content: contentData.data.content,
        campaign_id: 'test-campaign-123',
        target_site: 'telegraph',
        user_id: testData.userId
      })
    });

    console.log('Publishing Response:', publishResponse.status, publishResponse.statusText);

    if (!publishResponse.ok) {
      const errorData = await publishResponse.text();
      console.error('❌ Publishing failed:', errorData);
      return;
    }

    const publishData = await publishResponse.json();
    console.log('✅ Article published successfully');
    console.log('Published URL:', publishData.data?.url);

    console.log('\n=== STEP 3: Test Complete ===');
    console.log('🎉 Complete automation pipeline test successful!');
    console.log('\nSummary:');
    console.log('- Content Generation: ✅ Success');
    console.log('- Telegraph Publishing: ✅ Success');
    console.log('- Final URL:', publishData.data?.url);

  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
    console.log('\nDebugging steps:');
    console.log('1. Check if OPENAI_API_KEY is set in Netlify environment variables');
    console.log('2. Verify Netlify functions are deployed');
    console.log('3. Check network connectivity');
  }
};

// Test OpenAI API key first
const testApiKey = async () => {
  console.log('🔑 Testing OpenAI API Key Configuration\n');
  
  try {
    const response = await fetch('/.netlify/functions/test-openai-key');
    const data = await response.json();
    
    console.log('API Key Status:', data);
    
    if (!data.configured) {
      console.log('\n❌ OpenAI API key is not configured!');
      console.log('Please set OPENAI_API_KEY in your Netlify environment variables');
      return false;
    }
    
    if (!data.working) {
      console.log('\n⚠️ OpenAI API key is configured but not working');
      console.log('Error:', data.message);
      return false;
    }
    
    console.log('✅ OpenAI API key is properly configured and working\n');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to test API key:', error);
    return false;
  }
};

// Run tests
const runAllTests = async () => {
  console.log('🚀 Starting Automation Pipeline Tests\n');
  
  const apiKeyWorking = await testApiKey();
  
  if (apiKeyWorking) {
    await testPipeline();
  } else {
    console.log('❌ Skipping pipeline test due to API key issues');
  }
};

// Make it available globally for testing
window.testAutomationPipeline = runAllTests;
window.testApiKey = testApiKey;
window.testPipeline = testPipeline;

console.log('🧪 Automation test functions loaded:');
console.log('- testAutomationPipeline() - Run complete tests');
console.log('- testApiKey() - Test OpenAI API key only');
console.log('- testPipeline() - Test content generation and publishing');
