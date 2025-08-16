/**
 * Test script to verify blog generation fixes
 * This will test the entire blog generation pipeline
 */

const testBlogGeneration = async () => {
  try {
    console.log('🧪 Testing blog generation with fixed pipeline...');
    
    const testParams = {
      targetUrl: 'https://example.com',
      primaryKeyword: 'digital marketing',
      anchorText: 'digital marketing tools',
      userLocation: 'United States',
      additionalContext: {
        industry: 'tech',
        contentTone: 'professional'
      }
    };

    // Test the Netlify function
    const response = await fetch('/.netlify/functions/global-blog-generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testParams)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Blog generation test result:', {
      success: result.success,
      hasContent: !!result.data?.blogPost?.content,
      contentLength: result.data?.blogPost?.content?.length || 0,
      slug: result.data?.blogPost?.slug,
      title: result.data?.blogPost?.title
    });

    if (result.success && result.data?.blogPost?.content) {
      console.log('📄 Generated content preview:', result.data.blogPost.content.substring(0, 200));
      
      // Test content quality
      const content = result.data.blogPost.content;
      const qualityChecks = {
        hasHeadings: content.includes('<h1>') || content.includes('<h2>'),
        hasBacklink: content.includes(testParams.targetUrl),
        notEmpty: content.trim().length > 100,
        noMalformedPatterns: !content.includes('## &lt;') && !content.includes('**E**nhanced'),
        hasProperLength: content.length > 1000
      };
      
      console.log('🔍 Content quality checks:', qualityChecks);
      
      const qualityScore = Object.values(qualityChecks).filter(Boolean).length;
      console.log(`📊 Quality score: ${qualityScore}/5`);
      
      if (qualityScore >= 4) {
        console.log('🎉 Blog generation is working properly!');
      } else {
        console.warn('⚠️ Blog generation has quality issues');
      }
      
      return result;
    } else {
      console.error('❌ Blog generation failed:', result);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return null;
  }
};

// Test existing problematic posts retrieval
const testProblematicPosts = async () => {
  try {
    console.log('\n🔍 Testing retrieval of previously problematic posts...');
    
    const problematicSlugs = [
      'h1-unleashing-the-power-of-faceook-the-ultimate-guide-to-dominating-social-media-medqxdg8',
      'unlocking-the-secrets-of-google-rankings-your-ultimate-guide-to-seo-success-meds4cls'
    ];
    
    for (const slug of problematicSlugs) {
      console.log(`\nTesting slug: ${slug}`);
      
      try {
        const response = await fetch(`/blog/${slug}`);
        if (response.ok) {
          const html = await response.text();
          const hasContentError = html.includes('Content Error');
          const hasNoContent = html.includes('This blog post appears to have no content');
          
          console.log(`📊 Post status:`, {
            accessible: true,
            hasContentError,
            hasNoContent,
            status: hasContentError ? '❌ STILL BROKEN' : '✅ FIXED'
          });
        } else {
          console.log(`📊 Post status: Not accessible (${response.status})`);
        }
      } catch (error) {
        console.log(`📊 Post status: Error accessing (${error.message})`);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Auto-run tests
console.log('🚀 Starting blog generation fix tests...');

testBlogGeneration()
  .then(() => testProblematicPosts())
  .then(() => {
    console.log('\n✨ All tests completed!');
  })
  .catch(error => {
    console.error('❌ Test suite failed:', error);
  });

// Export for manual testing
window.testBlogGeneration = testBlogGeneration;
window.testProblematicPosts = testProblematicPosts;
