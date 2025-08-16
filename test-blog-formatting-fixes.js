// Test utility to verify blog formatting fixes
const testContent = `
**Mastering Weebly SEO: A Definitive Guide to Dominate Search Rankings**

This is a comprehensive guide to mastering Weebly SEO...

Data Point:** According to recent studies, websites that implement proper SEO see 40% more traffic.

Expert Insight:** Professional SEO consultants recommend focusing on these key areas:

Title Tags and Meta Descriptions: Essential for search engine optimization
Heading Structure: Proper H1, H2, H3 hierarchy improves readability
Keyword Research: Understanding what your audience searches for
Content Optimization: Creating valuable, keyword-rich content
Weebly SEO Settings: Platform-specific optimization techniques
Insights from Case Studies: Real-world examples of successful SEO implementations

For further insights on advanced SEO strategies and techniques, consider exploring the comprehensive guide on Weebly SEO at [Backlinkoo](https: //backlinkoo.com). This valuable resource offers in-depth analysis and actionable tips to elevate your Weebly SEO game.

Some content with * asterisks * that should be cleaned up.

More content with **proper bold formatting**.
`;

const expectedImprovements = [
  '✅ Title should not appear twice',
  '✅ "Data Point:**" should be bold without asterisks showing',
  '✅ "Expert Insight:**" should be bold without asterisks showing', 
  '✅ Section headers should be italicized, not list items',
  '✅ Asterisks should be hidden from display',
  '✅ Backlinkoo link should have "Weebly SEO" as anchor text',
  '✅ URL spaces should be fixed'
];

console.log('🧪 Blog Formatting Fixes Test');
console.log('============================');
console.log('Test content length:', testContent.length);
console.log('Expected improvements:');
expectedImprovements.forEach(improvement => console.log(improvement));
console.log('\n📋 Manual Testing Steps:');
console.log('1. Navigate to a blog post page');
console.log('2. Check that the title appears only once (in header, not in body)');
console.log('3. Verify "Data Point:**" and "Expert Insight:**" are bold without asterisks');
console.log('4. Confirm section headers are italicized rather than bullet points');
console.log('5. Ensure no stray asterisks (*) are visible in the content');
console.log('6. Check that the Backlinkoo link shows "Weebly SEO" as anchor text');
console.log('7. Verify the URL works correctly (no spaces)');

if (typeof window !== 'undefined') {
  window.testBlogFormatting = () => {
    console.log('Testing blog formatting on current page...');
    
    // Test 1: Check for duplicate titles
    const titles = document.querySelectorAll('h1, .beautiful-blog-title');
    const titleTexts = Array.from(titles).map(t => t.textContent?.trim());
    console.log('Title elements found:', titleTexts.length);
    
    // Test 2: Check for visible asterisks that shouldn't be there
    const bodyText = document.querySelector('.beautiful-blog-content')?.textContent || '';
    const visibleAsterisks = bodyText.match(/\*+/g);
    if (visibleAsterisks) {
      console.warn('⚠️ Visible asterisks found:', visibleAsterisks);
    } else {
      console.log('✅ No visible asterisks in content');
    }
    
    // Test 3: Check for proper anchor text on Backlinkoo links
    const links = document.querySelectorAll('a[href*="backlinkoo"]');
    links.forEach(link => {
      console.log('Backlinkoo link text:', link.textContent);
      console.log('Backlinkoo link href:', link.href);
    });
    
    // Test 4: Check for italic section headers
    const italicElements = document.querySelectorAll('em, i');
    console.log('Italic elements found:', italicElements.length);
    
    return {
      titleElements: titleTexts,
      hasVisibleAsterisks: !!visibleAsterisks,
      backlinkooLinks: Array.from(links).map(l => ({
        text: l.textContent,
        href: l.href
      })),
      italicElements: italicElements.length
    };
  };
  
  // Auto-run test if we're on a blog post page
  if (window.location.pathname.includes('/blog/')) {
    setTimeout(() => {
      console.log('🔄 Auto-running blog formatting test...');
      window.testBlogFormatting();
    }, 2000);
  }
}
