// Test utility for verifying the latest blog formatting improvements
console.log('🧪 Blog Formatting Test v2');
console.log('========================');

const testCases = [
  {
    name: 'Standalone section headers should be italicized',
    input: [
      'Title Tags and Meta Descriptions:',
      'Heading Structure:',
      'Keyword Research:',
      'Content Optimization:',
      'Weebly SEO Settings:',
      'Insights from Case Studies:'
    ],
    expected: 'Should render as <em> tags, not <li> tags'
  },
  {
    name: 'Descriptive content should remain as regular text or bullets',
    input: [
      'Weebly SEO Settings: Explore Weebly\'s built-in SEO settings to customize your website\'s meta tags, URLs, and more for optimal search performance.'
    ],
    expected: 'Should render as regular paragraph or bullet, not italicized'
  },
  {
    name: 'Backlinkoo link should be fixed',
    input: '[Backlinkoo](https: //backlinkoo.com)',
    expected: 'Should render as: <a href="https://backlinkoo.com">Weebly SEO</a>'
  },
  {
    name: 'Data Point and Expert Insight patterns',
    input: [
      'Data Point:** According to studies...',
      'Expert Insight:** Professional consultants recommend...'
    ],
    expected: 'Should render as: <strong>Data Point:</strong> According to studies...'
  }
];

// Browser testing function
if (typeof window !== 'undefined') {
  window.testBlogFormattingV2 = () => {
    console.log('🔍 Testing current blog page formatting...');
    
    const results = {
      italicElements: [],
      bulletElements: [],
      backlinkooLinks: [],
      boldElements: [],
      issues: []
    };
    
    // Test 1: Check for italic section headers
    const italicElements = document.querySelectorAll('em');
    italicElements.forEach(em => {
      const text = em.textContent?.trim() || '';
      if (text.match(/^(Title Tags and Meta Descriptions|Heading Structure|Keyword Research|Content Optimization|Weebly SEO Settings|Insights from Case Studies):/i)) {
        results.italicElements.push(text);
      }
    });
    
    // Test 2: Check for bullet points that might contain section headers
    const bulletElements = document.querySelectorAll('li');
    bulletElements.forEach(li => {
      const text = li.textContent?.trim() || '';
      if (text.match(/^(Title Tags and Meta Descriptions|Heading Structure|Keyword Research|Content Optimization|Weebly SEO Settings|Insights from Case Studies):/i)) {
        results.bulletElements.push(text);
        results.issues.push(`Section header found in bullet: "${text.substring(0, 50)}..."`);
      }
    });
    
    // Test 3: Check Backlinkoo links
    const links = document.querySelectorAll('a[href*="backlinkoo"]');
    links.forEach(link => {
      results.backlinkooLinks.push({
        text: link.textContent?.trim() || '',
        href: link.href,
        isCorrect: link.textContent?.includes('Weebly SEO') || false
      });
    });
    
    // Test 4: Check for Data Point and Expert Insight patterns
    const boldElements = document.querySelectorAll('strong');
    boldElements.forEach(strong => {
      const text = strong.textContent?.trim() || '';
      if (text.match(/^(Data Point|Expert Insight):/i)) {
        results.boldElements.push(text);
      }
    });
    
    // Test 5: Check for visible asterisks
    const contentElement = document.querySelector('.beautiful-blog-content');
    if (contentElement) {
      const contentText = contentElement.textContent || '';
      const visibleAsterisks = contentText.match(/\\*+/g);
      if (visibleAsterisks) {
        results.issues.push(`Visible asterisks found: ${visibleAsterisks.length} instances`);
      }
    }
    
    // Report results
    console.log('📊 Test Results:');
    console.log('================');
    
    console.log(`✅ Italic section headers: ${results.italicElements.length}`);
    results.italicElements.forEach(text => console.log(`   - "${text}"`));
    
    console.log(`⚠️  Section headers in bullets: ${results.bulletElements.length}`);
    results.bulletElements.forEach(text => console.log(`   - "${text.substring(0, 50)}..."`));
    
    console.log(`🔗 Backlinkoo links: ${results.backlinkooLinks.length}`);
    results.backlinkooLinks.forEach(link => {
      const status = link.isCorrect ? '✅' : '❌';
      console.log(`   ${status} Text: "${link.text}", Href: ${link.href}`);
    });
    
    console.log(`💪 Bold patterns: ${results.boldElements.length}`);
    results.boldElements.forEach(text => console.log(`   - "${text}"`));
    
    console.log(`🚨 Issues found: ${results.issues.length}`);
    results.issues.forEach(issue => console.log(`   - ${issue}`));
    
    // Summary
    const isWorking = results.issues.length === 0 && 
                     results.italicElements.length > 0 && 
                     results.bulletElements.length === 0;
    
    console.log(`\\n${isWorking ? '🎉 All tests PASSED!' : '🔧 Some issues need fixing'}`);
    
    return results;
  };
  
  // Auto-run if on blog page
  if (window.location.pathname.includes('/blog/') && window.location.pathname !== '/blog') {
    setTimeout(() => {
      console.log('🔄 Auto-running blog formatting test v2...');
      window.testBlogFormattingV2();
    }, 3000);
  }
}

// Export test cases for manual verification
if (typeof module !== 'undefined') {
  module.exports = { testCases };
}
