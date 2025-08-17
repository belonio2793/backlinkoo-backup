// Test the asterisk pattern fixes
const testContent = `
Data Point:** According to recent studies, websites that implement proper SEO see 40% more traffic.

Expert Insight:** Professional SEO consultants recommend focusing on these key areas:

Title Tags and Meta Descriptions:** Essential for search engine optimization
Heading Structure:** Proper H1, H2, H3 hierarchy improves readability  
Keyword Research:** Understanding what your audience searches for
Content Optimization:** Creating valuable, keyword-rich content
Weebly SEO Settings:** Platform-specific optimization techniques
Insights from Case Studies:** Real-world examples of successful SEO implementations

Some **proper bold formatting** should still work.
`;

// Simulate the processing logic from BeautifulBlogPost.tsx
function processText(text) {
  return text
    // Handle section headers that end with :** pattern
    .replace(/^([A-Za-z][^:\n]*?):\*\*/gm, '<strong class="font-bold text-gray-900">$1:</strong>')
    .replace(/\b([A-Za-z][A-Za-z\s&]+):\*\*/g, '<strong class="font-bold text-gray-900">$1:</strong>')
    // Standard markdown bold patterns
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
}

console.log('🧪 Testing Asterisk Pattern Fixes');
console.log('=================================');
console.log('\nOriginal content:');
console.log(testContent);

console.log('\nProcessed content:');
const processed = processText(testContent);
console.log(processed);

console.log('\n✅ Expected results:');
console.log('- "Data Point:" should be bold (without asterisks)');
console.log('- "Expert Insight:" should be bold (without asterisks)');
console.log('- "Title Tags and Meta Descriptions:" should be bold');
console.log('- "Heading Structure:" should be bold');
console.log('- "Keyword Research:" should be bold');
console.log('- "Content Optimization:" should be bold');
console.log('- "Weebly SEO Settings:" should be bold');
console.log('- "Insights from Case Studies:" should be bold');
console.log('- "proper bold formatting" should still be bold');

// Check if patterns are working
const checks = [
  { pattern: 'Data Point:', expected: true },
  { pattern: 'Expert Insight:', expected: true },
  { pattern: 'Title Tags and Meta Descriptions:', expected: true },
  { pattern: 'proper bold formatting', expected: true }
];

console.log('\n🔍 Pattern Validation:');
checks.forEach(check => {
  const found = processed.includes(`<strong class="font-bold text-gray-900">${check.pattern}</strong>`);
  console.log(`${found ? '✅' : '❌'} ${check.pattern}: ${found ? 'BOLD' : 'NOT BOLD'}`);
});
