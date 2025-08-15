/**
 * Test Campaign Flow - End-to-end test of campaign processing
 */

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('🧪 Starting campaign flow test...');

    // Test data
    const testData = {
      keyword: 'digital marketing',
      anchorText: 'best digital marketing tools',
      targetUrl: 'https://example.com',
      campaignId: 'test-campaign-' + Date.now()
    };

    console.log('📝 Test data:', testData);

    // Step 1: Test working-campaign-processor function
    console.log('🔧 Testing working-campaign-processor...');
    
    const processorResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/working-campaign-processor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const processorResult = await processorResponse.json();
    
    if (!processorResponse.ok) {
      throw new Error(`Processor test failed: ${processorResult.error || processorResponse.statusText}`);
    }

    console.log('✅ Campaign processor test successful');
    console.log('📊 Result:', processorResult);

    // Step 2: Validate published URLs
    const publishedUrls = processorResult.data?.publishedUrls || [];
    console.log(`🔗 Testing ${publishedUrls.length} published URLs...`);
    
    const urlValidation = [];
    for (let i = 0; i < publishedUrls.length; i++) {
      const url = publishedUrls[i];
      try {
        const urlResponse = await fetch(url, { method: 'HEAD' });
        urlValidation.push({
          url,
          status: urlResponse.status,
          valid: urlResponse.ok
        });
        console.log(`✅ URL ${i + 1} validated: ${url} (${urlResponse.status})`);
      } catch (error) {
        urlValidation.push({
          url,
          status: 0,
          valid: false,
          error: error.message
        });
        console.log(`❌ URL ${i + 1} failed: ${url} - ${error.message}`);
      }
    }

    const validUrls = urlValidation.filter(v => v.valid);
    const invalidUrls = urlValidation.filter(v => !v.valid);

    console.log(`📈 URL Validation Results: ${validUrls.length}/${publishedUrls.length} valid`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        testResults: {
          campaignProcessor: {
            success: true,
            data: processorResult
          },
          urlValidation: {
            total: publishedUrls.length,
            valid: validUrls.length,
            invalid: invalidUrls.length,
            details: urlValidation
          },
          summary: {
            totalPosts: processorResult.data?.totalPosts || 0,
            publishedUrls: publishedUrls.length,
            validUrls: validUrls.length,
            testPassed: validUrls.length > 0
          }
        },
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('❌ Campaign flow test failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Campaign flow test failed',
        timestamp: new Date().toISOString()
      }),
    };
  }
};
