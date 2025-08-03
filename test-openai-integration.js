/**
 * OpenAI API Integration Test Script
 * Tests the three specific query patterns requested
 */

const testQueries = [
  {
    id: 1,
    pattern: 'Generate a 1000 word blog post on {{keyword}} including the {{anchor_text}} hyperlinked to {{url}}',
    description: 'Pattern 1: Generate + including + hyperlinked'
  },
  {
    id: 2,
    pattern: 'Write a 1000 word blog post about {{keyword}} with a hyperlinked {{anchor_text}} linked to {{url}}',
    description: 'Pattern 2: Write + with hyperlinked + linked'
  },
  {
    id: 3,
    pattern: 'Produce a 1000-word blog post on {{keyword}} that links {{anchor_text}}',
    description: 'Pattern 3: Produce + that links'
  }
];

const testData = {
  keyword: 'digital marketing strategies',
  anchor_text: 'professional SEO services',
  url: 'https://example.com/seo-services'
};

async function testOpenAIAPI() {
  console.log('🧪 Starting OpenAI API Integration Tests...');
  console.log('📋 Test Data:');
  console.log(`   Keyword: ${testData.keyword}`);
  console.log(`   Anchor Text: ${testData.anchor_text}`);
  console.log(`   Target URL: ${testData.url}`);
  console.log('');

  const results = [];

  for (const query of testQueries) {
    console.log(`\n🔍 Testing ${query.description}`);
    console.log(`📝 Pattern: ${query.pattern}`);
    
    try {
      // Replace placeholders
      const processedPattern = query.pattern
        .replace('{{keyword}}', testData.keyword)
        .replace('{{anchor_text}}', testData.anchor_text)
        .replace('{{url}}', testData.url);

      console.log(`🚀 Processed Query: ${processedPattern}`);

      // Make API call to Netlify function
      const response = await fetch('/.netlify/functions/generate-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: testData.keyword,
          url: testData.url,
          anchorText: testData.anchor_text,
          wordCount: 1000,
          contentType: 'how-to',
          tone: 'professional'
        })
      });

      const result = await response.json();

      if (result.success) {
        const analysis = {
          success: true,
          contentLength: result.content?.length || 0,
          wordCount: result.content?.split(' ').length || 0,
          tokensUsed: result.usage?.tokens || 0,
          cost: result.usage?.cost || 0,
          hasAnchorText: result.content?.includes(testData.anchor_text) || false,
          hasTargetUrl: result.content?.includes(testData.url) || false,
          hasBacklink: (result.content?.includes(testData.anchor_text) && result.content?.includes(testData.url)) || false
        };

        console.log('✅ Success!');
        console.log(`   Content Length: ${analysis.contentLength} characters`);
        console.log(`   Word Count: ${analysis.wordCount} words`);
        console.log(`   Tokens Used: ${analysis.tokensUsed}`);
        console.log(`   Cost: $${analysis.cost?.toFixed(4)}`);
        console.log(`   Contains Anchor Text: ${analysis.hasAnchorText ? '✅' : '❌'}`);
        console.log(`   Contains Target URL: ${analysis.hasTargetUrl ? '✅' : '❌'}`);
        console.log(`   Backlink Integration: ${analysis.hasBacklink ? '✅' : '❌'}`);

        results.push({ query, ...analysis });
      } else {
        console.log('❌ Failed:', result.error);
        results.push({ query, success: false, error: result.error });
      }

    } catch (error) {
      console.log('❌ Error:', error.message);
      results.push({ query, success: false, error: error.message });
    }

    // Wait between requests to avoid rate limiting
    if (query.id < testQueries.length) {
      console.log('⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('=' * 50);
  
  const successCount = results.filter(r => r.success).length;
  const successRate = Math.round((successCount / results.length) * 100);
  
  console.log(`Success Rate: ${successRate}% (${successCount}/${results.length})`);
  
  results.forEach((result, index) => {
    console.log(`\nTest ${index + 1}: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
    if (result.success) {
      console.log(`  - ${result.wordCount} words generated`);
      console.log(`  - Backlink: ${result.hasBacklink ? 'Integrated' : 'Missing'}`);
    } else {
      console.log(`  - Error: ${result.error}`);
    }
  });

  return results;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testOpenAIAPI = testOpenAIAPI;
  console.log('🔧 OpenAI API test function loaded. Run testOpenAIAPI() in console to test.');
}

// For Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testOpenAIAPI, testQueries, testData };
}
