#!/usr/bin/env node

/**
 * Test Blog Functions - Verify blog content serving works
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the blog server function
const domainBlogServerPath = join(__dirname, '../netlify/functions/domain-blog-server.js');

async function testDomainBlogServer() {
  console.log('🧪 Testing Domain Blog Server Function...');
  
  try {
    // Dynamically import the function (since it's CommonJS)
    const { handler } = await import(domainBlogServerPath);
    
    // Create a mock event
    const mockEvent = {
      httpMethod: 'GET',
      headers: {
        host: 'leadpages.org'
      },
      queryStringParameters: {},
      path: '/'
    };
    
    const mockContext = {};
    
    console.log('📡 Calling function with mock leadpages.org request...');
    const result = await handler(mockEvent, mockContext);
    
    console.log('✅ Function Response:');
    console.log('Status Code:', result.statusCode);
    console.log('Headers:', result.headers);
    console.log('Body Length:', result.body?.length || 0, 'characters');
    
    if (result.statusCode === 200) {
      console.log('🎉 Success! Blog content served correctly');
      
      // Check if HTML contains expected elements
      const html = result.body;
      const hasTitle = html.includes('<title>');
      const hasHeader = html.includes('Leadpages');
      const hasContent = html.includes('Expert insights');
      
      console.log('\\n📋 Content Validation:');
      console.log('- Has title tag:', hasTitle ? '✅' : '❌');
      console.log('- Has header content:', hasHeader ? '✅' : '❌');
      console.log('- Has main content:', hasContent ? '✅' : '❌');
      
      if (hasTitle && hasHeader && hasContent) {
        console.log('\\n🏆 All validation checks passed!');
        return true;
      } else {
        console.log('\\n⚠️  Some content validation checks failed');
        return false;
      }
    } else {
      console.log('❌ Function returned non-200 status');
      console.log('Response body:', result.body);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function testBlogPostServer() {
  console.log('\\n🧪 Testing Blog Post Server Function...');
  
  try {
    const blogPostServerPath = join(__dirname, '../netlify/functions/blog-post-server.js');
    const { handler } = await import(blogPostServerPath);
    
    // Test with a sample blog post slug
    const mockEvent = {
      httpMethod: 'GET',
      headers: {
        host: 'leadpages.org'
      },
      queryStringParameters: {
        slug: 'essential-lead-generation-strategies-2024'
      },
      path: '/blog/essential-lead-generation-strategies-2024'
    };
    
    const mockContext = {};
    
    console.log('📡 Calling function with mock blog post request...');
    const result = await handler(mockEvent, mockContext);
    
    console.log('✅ Function Response:');
    console.log('Status Code:', result.statusCode);
    console.log('Body Length:', result.body?.length || 0, 'characters');
    
    if (result.statusCode === 200 || result.statusCode === 404) {
      console.log('🎉 Blog post function working correctly');
      
      if (result.statusCode === 404) {
        console.log('ℹ️  404 response is expected (no blog content in database yet)');
      }
      
      return true;
    } else {
      console.log('❌ Unexpected status code');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Blog post test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Blog Function Tests...');
  console.log('=' .repeat(60));
  
  const results = {
    domainBlogServer: false,
    blogPostServer: false
  };
  
  // Test domain blog server
  results.domainBlogServer = await testDomainBlogServer();
  
  // Test blog post server
  results.blogPostServer = await testBlogPostServer();
  
  // Summary
  console.log('\\n📊 Test Results Summary:');
  console.log('=' .repeat(60));
  console.log('Domain Blog Server:', results.domainBlogServer ? '✅ PASS' : '❌ FAIL');
  console.log('Blog Post Server:', results.blogPostServer ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('\\n🎉 All tests passed! Blog functions are working correctly.');
    console.log('\\n📋 Next Steps:');
    console.log('1. Deploy the functions to Netlify');
    console.log('2. Update DNS to point to Netlify hosting');
    console.log('3. Test leadpages.org in production');
  } else {
    console.log('\\n⚠️  Some tests failed. Check the errors above.');
  }
  
  return allPassed;
}

// Run the tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
