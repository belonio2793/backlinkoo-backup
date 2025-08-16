// Test utility for verifying list formatting improvements
console.log('🧪 List Formatting Fix Test');
console.log('===========================');

const testScenarios = [
  {
    name: 'Numbered Content Conversion',
    description: 'All numbered content should be converted to bullet lists',
    expected: 'No <ol> elements, only <ul> with list-disc'
  },
  {
    name: 'Consistent List Styling',
    description: 'All lists should have consistent spacing and styling',
    expected: 'list-disc space-y-3 my-6 ml-6 classes'
  },
  {
    name: 'Better Readability',
    description: 'Content should flow better without fragmented numbered lists',
    expected: 'No isolated single-item lists'
  },
  {
    name: 'Data Point and Expert Insight',
    description: 'These should render as bold text, not separate list items',
    expected: '<strong>Data Point:</strong> and <strong>Expert Insight:</strong>'
  }
];

// Browser testing function
if (typeof window !== 'undefined') {
  window.testListFormattingFix = () => {
    console.log('🔍 Testing list formatting improvements...');
    
    const results = {
      numberedLists: [],
      bulletLists: [],
      singleItemLists: [],
      dataPointPatterns: [],
      listStyling: [],
      issues: []
    };
    
    const content = document.querySelector('.beautiful-blog-content');
    if (!content) {
      console.error('❌ No blog content found');
      return results;
    }
    
    // Test 1: Check for numbered lists (should be none)
    const numberedLists = content.querySelectorAll('ol');
    if (numberedLists.length > 0) {
      numberedLists.forEach(ol => {
        results.numberedLists.push(`❌ Found <ol> element with ${ol.children.length} items`);
        results.issues.push('Numbered lists still present - should be converted to bullets');
      });
    } else {
      results.numberedLists.push('✅ No <ol> elements found (correct)');
    }
    
    // Test 2: Check bullet lists
    const bulletLists = content.querySelectorAll('ul');
    bulletLists.forEach(ul => {
      const classes = ul.className || '';
      const itemCount = ul.children.length;
      
      if (classes.includes('list-disc')) {
        results.bulletLists.push(`✅ Bullet list with ${itemCount} items - proper styling`);
      } else {
        results.bulletLists.push(`❌ Bullet list with ${itemCount} items - missing list-disc class`);
        results.issues.push('Bullet list missing proper styling classes');
      }
      
      // Check for single-item lists (potential fragmentation)
      if (itemCount === 1) {
        const itemText = ul.textContent?.substring(0, 50) || '';
        results.singleItemLists.push(`⚠️ Single-item list: "${itemText}..."`);
        
        // Check if it's a problematic pattern
        if (itemText.includes('Data Point') || itemText.includes('Expert Insight')) {
          results.issues.push(`Single-item list for "${itemText}" - should be paragraph`);
        }
      }
    });
    
    // Test 3: Check for Data Point and Expert Insight patterns
    const strongElements = content.querySelectorAll('strong');
    strongElements.forEach(strong => {
      const text = strong.textContent || '';
      if (text.match(/^(Data Point|Expert Insight):/i)) {
        results.dataPointPatterns.push(`✅ "${text}" - properly formatted as bold`);
      }
    });
    
    // Check if these patterns are incorrectly in lists
    const listItems = content.querySelectorAll('li');
    listItems.forEach(li => {
      const text = li.textContent || '';
      if (text.match(/^(Data Point|Expert Insight):/i)) {
        results.issues.push(`"${text.substring(0, 30)}..." should be paragraph, not list item`);
      }
    });
    
    // Test 4: Check overall list styling consistency
    const allLists = content.querySelectorAll('ul, ol');
    allLists.forEach(list => {
      const classes = list.className || '';
      const expectedClasses = ['beautiful-prose', 'list-disc', 'space-y-3', 'my-6', 'ml-6'];
      const hasAllClasses = expectedClasses.every(cls => classes.includes(cls));
      
      if (hasAllClasses) {
        results.listStyling.push('✅ List has consistent styling');
      } else {
        results.listStyling.push(`❌ List missing styling: ${classes}`);
        results.issues.push('Inconsistent list styling detected');
      }
    });
    
    // Report results
    console.log('📊 Test Results:');
    console.log('================');
    
    console.log(`📝 Numbered Lists: ${results.numberedLists.length}`);
    results.numberedLists.forEach(item => console.log(`   ${item}`));
    
    console.log(`• Bullet Lists: ${results.bulletLists.length}`);
    results.bulletLists.slice(0, 5).forEach(item => console.log(`   ${item}`));
    if (results.bulletLists.length > 5) {
      console.log(`   ... and ${results.bulletLists.length - 5} more`);
    }
    
    console.log(`⚠️ Single-Item Lists: ${results.singleItemLists.length}`);
    results.singleItemLists.forEach(item => console.log(`   ${item}`));
    
    console.log(`💪 Data Point Patterns: ${results.dataPointPatterns.length}`);
    results.dataPointPatterns.forEach(item => console.log(`   ${item}`));
    
    console.log(`🎨 List Styling: ${results.listStyling.length}`);
    const stylingCounts = {};
    results.listStyling.forEach(item => {
      const status = item.includes('✅') ? 'correct' : 'incorrect';
      stylingCounts[status] = (stylingCounts[status] || 0) + 1;
    });
    Object.entries(stylingCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    console.log(`🚨 Issues: ${results.issues.length}`);
    results.issues.forEach(issue => console.log(`   - ${issue}`));
    
    // Summary
    const isWorking = results.issues.length === 0 && 
                     results.numberedLists.length > 0 && 
                     results.numberedLists[0].includes('✅');
    
    console.log(`\\n${isWorking ? '🎉 List formatting FIXED!' : '���� Some issues remain'}`);
    
    return results;
  };
  
  // Auto-run if on blog page
  if (window.location.pathname.includes('/blog/') && window.location.pathname !== '/blog') {
    setTimeout(() => {
      console.log('🔄 Auto-running list formatting test...');
      window.testListFormattingFix();
    }, 3000);
  }
}

// Export test scenarios
if (typeof module !== 'undefined') {
  module.exports = { testScenarios };
}
