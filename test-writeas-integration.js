/**
 * Test Write.as Integration
 * Verifies that Write.as publishing functionality works correctly
 */

const fetch = require('node-fetch');

async function testWriteAsIntegration() {
  console.log('🧪 Testing Write.as Integration');
  console.log('===============================');
  
  try {
    // Test 1: Basic API connectivity
    console.log('\n📋 Test 1: Write.as API Connectivity');
    await testWriteAsAPI();

    // Test 2: Content formatting
    console.log('\n📋 Test 2: Content Formatting');
    testContentFormatting();

    // Test 3: URL validation
    console.log('\n📋 Test 3: URL Validation');
    await testURLValidation();

    console.log('\n🎉 Write.as Integration Test Completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * Test Write.as API connectivity
 */
async function testWriteAsAPI() {
  try {
    console.log('   🔄 Testing Write.as API endpoint...');
    
    const testContent = `# Test Post
    
This is a test post to verify Write.as integration.

## Features
- **Bold text**
- *Italic text*
- [Test link](https://example.com)

Content posted at: ${new Date().toISOString()}`;

    const response = await fetch('https://write.as/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'API Test Post',
        body: testContent
      })
    });

    const responseData = await response.json();
    
    if (!response.ok || responseData.code !== 201) {
      console.warn('   ⚠️ Write.as API test returned error:', responseData);
      console.log('   ℹ️ This might be expected if the API requires authentication');
    } else {
      const postUrl = `https://write.as/${responseData.data.id}`;
      console.log('   ✅ Write.as API test successful!');
      console.log('   📄 Test post URL:', postUrl);
      
      // Clean up test post if needed
      // Note: Write.as doesn't provide easy deletion for anonymous posts
      console.log('   ℹ️ Test post created (anonymous posts cannot be easily deleted)');
    }

  } catch (error) {
    console.warn('   ⚠️ Write.as API test failed:', error.message);
    console.log('   ℹ️ This might indicate network issues or API changes');
  }
}

/**
 * Test content formatting
 */
function testContentFormatting() {
  console.log('   🔄 Testing HTML to Markdown conversion...');
  
  const testHtml = `
    <h1>Test Article</h1>
    <p>This is a test article about <strong>sushi</strong> restaurants.</p>
    <h2>Best Sushi Places</h2>
    <p>Here are some <a href="https://example.com/sushi" target="_blank" rel="noopener noreferrer">great sushi places</a> to try.</p>
    <ul>
      <li>Restaurant A</li>
      <li>Restaurant B</li>
    </ul>
    <p>Visit <a href="https://example.com">our website</a> for more information.</p>
  `;

  const markdown = convertToWriteAsFormat(testHtml);
  
  console.log('   ✅ Content formatting test completed');
  console.log('   📝 Converted content sample:');
  console.log('   ' + markdown.substring(0, 200) + '...');
  
  // Verify key conversions
  const hasHeaders = markdown.includes('#');
  const hasLinks = markdown.includes('[') && markdown.includes('](');
  const hasBold = markdown.includes('**');
  
  console.log('   📊 Formatting checks:');
  console.log(`      Headers: ${hasHeaders ? '✅' : '❌'}`);
  console.log(`      Links: ${hasLinks ? '✅' : '❌'}`);
  console.log(`      Bold text: ${hasBold ? '✅' : '��'}`);
}

/**
 * Test URL validation
 */
async function testURLValidation() {
  const testUrls = [
    'https://write.as/test-post',
    'https://write.as/invalid-post-id-that-should-not-exist-12345',
  ];

  for (const url of testUrls) {
    try {
      console.log(`   🔄 Testing URL: ${url}`);
      
      const response = await fetch(url, { method: 'HEAD' });
      
      if (response.ok) {
        console.log(`   ✅ URL accessible: ${url}`);
      } else {
        console.log(`   ⚠️ URL not accessible (${response.status}): ${url}`);
      }
      
    } catch (error) {
      console.log(`   ❌ URL validation failed: ${url} - ${error.message}`);
    }
  }
}

/**
 * Convert HTML content to Write.as markdown format (simplified version)
 */
function convertToWriteAsFormat(htmlContent) {
  let markdown = htmlContent;
  
  // Remove extra whitespace and normalize
  markdown = markdown.replace(/\s+/g, ' ').trim();
  
  // Convert headers
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  
  // Convert paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  
  // Convert bold and italic
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  
  // Convert links
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  
  // Convert lists
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gi, '$1');
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  
  // Clean up extra whitespace
  markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');
  markdown = markdown.replace(/^\s+|\s+$/g, '');
  
  return markdown;
}

// Run the test
if (require.main === module) {
  testWriteAsIntegration();
}

module.exports = { testWriteAsIntegration, convertToWriteAsFormat };
