/**
 * Test suite for markdown formatting fixes
 * Tests the ContentFormatter fixes for triple hyphens and malformed headings
 */

import { ContentFormatter } from './contentFormatter';

export function testMarkdownFormatting() {
  console.log('🧪 Testing Markdown Formatting Fixes...\n');

  // Test 1: Triple hyphen removal
  const tripleHyphenContent = `
# Introduction
This is some content.

---
More content here.

## Section
Content continues.

---

Final section.
`;

  const cleanedTripleHyphens = ContentFormatter.formatBlogContent(tripleHyphenContent);
  console.log('✅ Test 1: Triple Hyphens Removal');
  console.log('Input had --- separators');
  console.log('Output clean?', !cleanedTripleHyphens.includes('---'));
  console.log('');

  // Test 2: Malformed heading fixes
  const malformedHeadingContent = `
# Main Title

## P. Assessment needed

Some content here.

**P.** Another problematic pattern

## Q. Evaluation

More content.
`;

  const cleanedMalformed = ContentFormatter.formatBlogContent(malformedHeadingContent);
  console.log('✅ Test 2: Malformed Heading Fixes');
  console.log('Input had "## P. Assessment" patterns');
  console.log('Fixed malformed headings?', !cleanedMalformed.includes('<h2>P. Assessment</h2>'));
  console.log('');

  // Test 3: Nature blog example (based on user's issue)
  const natureBlogContent = `
# The Ultimate Guide to Nature

## Introduction
Nature provides incredible benefits.

---

## P. Assessment needed

Unfortunately, many species are facing the threat of extinction due to human activities such as deforestation and climate change. By supporting conservation efforts and raising awareness about endangered species, we can make a difference in preserving the rich tapestry of life on our planet.

---

In this definitive guide to nature, we've explored the incredible benefits, wonders, and importance of preserving the natural world.
`;

  const cleanedNatureBlog = ContentFormatter.formatBlogContent(natureBlogContent, 'The Ultimate Guide to Nature');
  console.log('✅ Test 3: Nature Blog Example');
  console.log('Removed triple hyphens?', !cleanedNatureBlog.includes('---'));
  console.log('Fixed malformed "P. Assessment"?', !cleanedNatureBlog.includes('<h2>P. Assessment</h2>'));
  console.log('Preserved valid content?', cleanedNatureBlog.includes('endangered species'));
  console.log('');

  // Test 4: Content sanitization
  const unsafeContent = `
<h2>P. Assessment needed</h2>
Some content with ---
<h1></h1>
Valid content here.
`;

  const sanitizedContent = ContentFormatter.sanitizeContent(unsafeContent);
  console.log('✅ Test 4: Content Sanitization');
  console.log('Removed empty headings?', !sanitizedContent.includes('<h1></h1>'));
  console.log('Removed malformed headings?', !sanitizedContent.includes('P. Assessment needed'));
  console.log('Removed triple hyphens?', !sanitizedContent.includes('---'));
  console.log('');

  console.log('🎉 All markdown formatting tests completed!');
  
  return {
    tripleHyphensFixed: !cleanedTripleHyphens.includes('---'),
    malformedHeadingsFixed: !cleanedMalformed.includes('<h2>P. Assessment</h2>'),
    natureBlogClean: !cleanedNatureBlog.includes('---') && !cleanedNatureBlog.includes('<h2>P. Assessment</h2>'),
    sanitizationWorking: !sanitizedContent.includes('<h1></h1>') && !sanitizedContent.includes('P. Assessment needed')
  };
}

// Run test if this file is executed directly
if (typeof window === 'undefined' && typeof require !== 'undefined') {
  testMarkdownFormatting();
}
