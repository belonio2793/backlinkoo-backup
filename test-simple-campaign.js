/**
 * Test script for the simplified campaign processing
 * This tests the complete flow: generate content -> publish to Telegraph -> return URL
 */

async function testSimpleCampaignProcessing() {
  console.log('🧪 Testing simplified campaign processing...');
  
  const testData = {
    keyword: 'leadpages',
    anchorText: 'best landing page builder',
    targetUrl: 'https://leadpages.com',
    campaignId: 'test-campaign-123'
  };

  try {
    console.log('📡 Calling simple-campaign-processor function...');
    
    const response = await fetch('/.netlify/functions/simple-campaign-processor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log(`📊 Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Campaign processing successful!');
      console.log('📝 Title:', result.data.title);
      console.log('📏 Content length:', result.data.content?.length || 0, 'characters');
      console.log('🔗 Published URL:', result.data.publishedUrl);
      console.log('⏰ Completed at:', result.data.completedAt);
      
      // Test if the Telegraph link is accessible
      console.log('🔍 Verifying Telegraph link...');
      const linkResponse = await fetch(result.data.publishedUrl, { method: 'HEAD' });
      
      if (linkResponse.ok) {
        console.log('✅ Telegraph link is live and accessible!');
      } else {
        console.log('⚠️ Telegraph link returned status:', linkResponse.status);
      }
      
    } else {
      console.log('❌ Campaign processing failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('analytics') || error.message.includes('blocked')) {
      console.log('🔧 This confirms the analytics blocking issue exists');
      console.log('💡 Solution: Use server-side processing to bypass browser analytics');
    }
  }
}

// Run the test
testSimpleCampaignProcessing();
