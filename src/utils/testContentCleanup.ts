/**
 * Test utilities for validating content cleanup functions
 */
import { cleanHTMLContent } from './textFormatting';

export function testCleanHTMLContent(): void {
  console.log('🧪 Testing HTML content cleanup...');
  
  // Test case 1: HTML comments
  const malformedContent1 = `
<!-- SEO Meta Tags -->
<h2>Introduction</h2>
<p>This is some content.</p>
<!-- Structured Data -->
<!--
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Test Article"
}
-->
<p>More content here.</p>
-->`;

  // Test case 2: Broken bullet points
  const malformedContent2 = `
<h2>Benefits</h2>
<p>Here are the benefits:</p>
- &lt;div class="bullet"&gt;First benefit&lt;/div&gt;
- &lt;div class="bullet"&gt;Second benefit&lt;/div&gt;
- &lt;div class="bullet"&gt;Third benefit&lt;/div&gt;
<p>End of list.</p>`;

  // Test case 3: Mixed malformed content
  const malformedContent3 = `
<!-- This should be removed -->
<h1>Title</h1>
- &lt;div class="bullet"&gt;Point one&lt;/div&gt;
-->
{
  "@context": "https://schema.org",
  "@type": "Article"
}
<p>Normal paragraph.</p>
<!--`;

  const testCases = [
    { name: 'HTML Comments', content: malformedContent1 },
    { name: 'Broken Bullet Points', content: malformedContent2 },
    { name: 'Mixed Malformed Content', content: malformedContent3 }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\n📝 Test ${index + 1}: ${testCase.name}`);
    console.log('Before cleanup:', testCase.content.substring(0, 100) + '...');
    
    const cleaned = cleanHTMLContent(testCase.content);
    console.log('After cleanup:', cleaned.substring(0, 100) + '...');
    
    // Verify no HTML comments remain
    const hasComments = cleaned.includes('<!--') || cleaned.includes('-->');
    const hasStructuredData = cleaned.includes('"@context"');
    const hasBrokenBullets = cleaned.includes('&lt;div class="bullet');
    
    console.log('✅ Test results:');
    console.log(`  - HTML comments removed: ${!hasComments ? '✅' : '❌'}`);
    console.log(`  - Structured data removed: ${!hasStructuredData ? '✅' : '❌'}`);
    console.log(`  - Broken bullets fixed: ${!hasBrokenBullets ? '✅' : '❌'}`);
  });
  
  console.log('\n🎉 Content cleanup testing completed!');
}

// Run test if this file is executed directly
if (typeof window !== 'undefined' && (window as any).testCleanup) {
  testCleanHTMLContent();
}
