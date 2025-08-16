// Test utility for verifying blog improvements v3
console.log('🧪 Blog Improvements Test v3');
console.log('============================');

const testCases = [
  {
    name: 'Broken URL Link Processing',
    input: '[Backlinkoo](https: //backlinkoo.com)',
    expected: 'Should render as working link with "Weebly SEO" anchor text'
  },
  {
    name: 'Plain URL Auto-linking',
    input: 'Visit https://example.com for more info',
    expected: 'Should automatically convert URL to clickable link'
  },
  {
    name: 'Consistent Headlines',
    input: 'Should have text-2xl font-bold for all h2 and h3',
    expected: 'All headlines should be same size and weight'
  },
  {
    name: 'Mid-wide Layout',
    input: 'max-w-4xl container width',
    expected: 'Better readability with narrower content width'
  },
  {
    name: 'Reduced Redundancies',
    input: 'Multiple separate <ul> elements',
    expected: 'Should combine related bullet points'
  }
];

// Browser testing function
if (typeof window !== 'undefined') {
  window.testBlogImprovementsV3 = () => {
    console.log('🔍 Testing current blog page improvements...');
    
    const results = {
      workingLinks: [],
      brokenLinks: [],
      headlineSizes: [],
      containerWidths: [],
      bulletListStructure: [],
      issues: []
    };
    
    const content = document.querySelector('.beautiful-blog-content');
    if (!content) {
      console.error('❌ No blog content found');
      return results;
    }
    
    // Test 1: Check all links
    const links = content.querySelectorAll('a');
    links.forEach(link => {
      const href = link.href;
      const text = link.textContent?.trim() || '';
      const target = link.target;
      
      if (href.includes('backlinkoo.com')) {
        if (text.includes('Weebly SEO')) {
          results.workingLinks.push(`✅ Backlinkoo: "${text}" -> ${href}`);
        } else {
          results.brokenLinks.push(`❌ Backlinkoo: "${text}" -> ${href}`);
          results.issues.push('Backlinkoo link has wrong anchor text');
        }
      }
      
      if (target !== '_blank') {
        results.issues.push(`Link missing target="_blank": ${href}`);
      }
      
      if (href.includes(' ')) {
        results.brokenLinks.push(`❌ URL with spaces: ${href}`);
        results.issues.push('URL contains spaces');
      }
    });
    
    // Test 2: Check headline consistency
    const headings = content.querySelectorAll('h2, h3');
    headings.forEach(heading => {
      const classes = heading.className;
      const text = heading.textContent?.substring(0, 30) || '';
      
      if (classes.includes('text-2xl font-bold')) {
        results.headlineSizes.push(`✅ "${text}..." - Consistent size`);
      } else {
        results.headlineSizes.push(`❌ "${text}..." - Wrong size: ${classes}`);
        results.issues.push(`Inconsistent headline size: ${text}`);
      }
    });
    
    // Test 3: Check container widths
    const containers = document.querySelectorAll('.max-w-4xl, .max-w-5xl');
    containers.forEach(container => {
      const classes = container.className;
      if (classes.includes('max-w-4xl')) {
        results.containerWidths.push('✅ Using max-w-4xl (correct)');
      } else if (classes.includes('max-w-5xl')) {
        results.containerWidths.push('❌ Using max-w-5xl (should be max-w-4xl)');
        results.issues.push('Container should use max-w-4xl for better readability');
      }
    });
    
    // Test 4: Check bullet list structure
    const bulletLists = content.querySelectorAll('ul');
    results.bulletListStructure.push(`Found ${bulletLists.length} bullet lists`);
    
    // Check for consecutive lists that could be combined
    bulletLists.forEach((list, index) => {
      const nextElement = list.nextElementSibling;
      if (nextElement && nextElement.tagName === 'UL') {
        results.issues.push(`Consecutive bullet lists found - could be combined`);
      }
    });
    
    // Test 5: Check for visible asterisks (should be none)
    const textContent = content.textContent || '';
    const visibleAsterisks = textContent.match(/\*+/g);
    if (visibleAsterisks) {
      results.issues.push(`Visible asterisks found: ${visibleAsterisks.length} instances`);
    }
    
    // Report results
    console.log('📊 Test Results:');
    console.log('================');
    
    console.log(`🔗 Working Links: ${results.workingLinks.length}`);
    results.workingLinks.forEach(link => console.log(`   ${link}`));
    
    console.log(`❌ Broken Links: ${results.brokenLinks.length}`);
    results.brokenLinks.forEach(link => console.log(`   ${link}`));
    
    console.log(`📏 Headlines: ${results.headlineSizes.length}`);
    results.headlineSizes.slice(0, 5).forEach(headline => console.log(`   ${headline}`));
    if (results.headlineSizes.length > 5) {
      console.log(`   ... and ${results.headlineSizes.length - 5} more`);
    }
    
    console.log(`📦 Containers: ${results.containerWidths.length}`);
    results.containerWidths.forEach(container => console.log(`   ${container}`));
    
    console.log(`📋 Bullet Lists: ${results.bulletListStructure[0]}`);
    
    console.log(`🚨 Issues: ${results.issues.length}`);
    results.issues.forEach(issue => console.log(`   - ${issue}`));
    
    // Summary
    const isWorking = results.issues.length === 0 && 
                     results.brokenLinks.length === 0 &&
                     results.workingLinks.length > 0;
    
    console.log(`\\n${isWorking ? '🎉 All improvements WORKING!' : '🔧 Some issues need fixing'}`);
    
    return results;
  };
  
  // Auto-run if on blog page
  if (window.location.pathname.includes('/blog/') && window.location.pathname !== '/blog') {
    setTimeout(() => {
      console.log('🔄 Auto-running blog improvements test v3...');
      window.testBlogImprovementsV3();
    }, 3000);
  }
}

// Export for manual verification
if (typeof module !== 'undefined') {
  module.exports = { testCases };
}
