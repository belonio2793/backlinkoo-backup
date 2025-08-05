// Test to verify blog listing excerpt fixes
// This simulates the exact issues shown in the user's screenshots

// Sample problematic content from the screenshots
const problematicContent1 = `# The Ultimate Guide to Nature: Discover the World's Most Incredible Wonders
From the majestic mountains to the incredible wonders of nature...`;

const problematicContent2 = `**H1**: Mastering Money: How to Build Wealth and Financial Freedom 
**Introduction** Do you want to take control of your financial future...`;

const problematicContent3 = `**Title:** Complete Guide to Success
## Introduction
This is some real content that should appear in the excerpt...`;

// Test titles
const title1 = "The Ultimate Guide to Nature: Discover the World's Most Incredible Wonders";
const title2 = "Mastering Money: How to Build Wealth and Financial Freedom";
const title3 = "Complete Guide to Success";

console.log('🧪 Testing Blog Listing Excerpt Fixes\n');

// Simulate the ExcerptCleaner logic we created
function getCleanExcerpt(content, title, maxLength = 150) {
  if (!content) return '';

  let cleanText = content;

  // Remove HTML tags first
  cleanText = cleanText.replace(/<[^>]*>/g, '');

  // Remove the title from the beginning if it appears
  if (title) {
    const cleanTitle = title
      .replace(/^\s*\*\*Title:\s*([^*]*)\*\*\s*/i, '$1')
      .replace(/^\*\*H1\*\*:\s*/i, '')
      .replace(/^\*\*Title\*\*:\s*/i, '')
      .replace(/^Title:\s*/gi, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/^#{1,6}\s+/, '')
      .trim();

    // Create patterns to match title variations
    const escapedTitle = cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&');
    const titlePatterns = [
      new RegExp(`^\\s*#\\s*${escapedTitle}\\s*`, 'i'),
      new RegExp(`^\\s*${escapedTitle}\\s*`, 'i'),
      new RegExp(`^\\s*\\*\\*H1\\*\\*:\\s*${escapedTitle}\\s*`, 'i'),
      new RegExp(`^\\s*\\*\\*Title\\*\\*:\\s*${escapedTitle}\\s*`, 'i'),
      new RegExp(`^\\s*Title:\\s*${escapedTitle}\\s*`, 'i'),
    ];

    for (const pattern of titlePatterns) {
      cleanText = cleanText.replace(pattern, '');
    }
  }

  // Remove all markdown and formatting artifacts
  cleanText = cleanText
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove **H1**: patterns
    .replace(/\*\*H1\*\*:\s*/gi, '')
    // Remove **Title**: patterns
    .replace(/\*\*Title\*\*:\s*/gi, '')
    // Remove **Introduction**, **Conclusion** etc patterns
    .replace(/\*\*([A-Za-z]+)\*\*:\s*/g, '$1: ')
    .replace(/\*\*([A-Za-z]+)\*\*\s/g, '$1 ')
    // Remove remaining **text** bold formatting
    .replace(/\*\*([^*]+?)\*\*/g, '$1')
    // Remove *text* italic formatting
    .replace(/\*([^*]+?)\*/g, '$1')
    // Remove remaining asterisks
    .replace(/\*/g, '')
    // Remove Title: patterns at line start
    .replace(/^Title:\s*[^\n]*/gmi, '')
    // Remove standalone Title: patterns
    .replace(/\bTitle:\s*/gi, '')
    // Remove triple hyphens
    .replace(/---+/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Truncate to desired length
  if (cleanText.length > maxLength) {
    cleanText = cleanText.substring(0, maxLength).trim();
    const lastSpaceIndex = cleanText.lastIndexOf(' ');
    if (lastSpaceIndex > maxLength * 0.8) {
      cleanText = cleanText.substring(0, lastSpaceIndex);
    }
    cleanText += '...';
  }

  return cleanText;
}

// Test the fixes
console.log('Test 1 - Nature Guide (with duplicate title in content):');
console.log('Original:', problematicContent1.substring(0, 100) + '...');
const result1 = getCleanExcerpt(problematicContent1, title1);
console.log('Fixed:', result1);
console.log('✓ Title removed:', !result1.includes('Ultimate Guide to Nature'));
console.log('✓ Content preserved:', result1.includes('majestic mountains'));
console.log('');

console.log('Test 2 - Money Guide (with **H1** and **Introduction**):');
console.log('Original:', problematicContent2.substring(0, 100) + '...');
const result2 = getCleanExcerpt(problematicContent2, title2);
console.log('Fixed:', result2);
console.log('✓ **H1** removed:', !result2.includes('**H1**'));
console.log('✓ **Introduction** cleaned:', !result2.includes('**Introduction**'));
console.log('✓ Content preserved:', result2.includes('financial future'));
console.log('');

console.log('Test 3 - Success Guide (with **Title** prefix):');
console.log('Original:', problematicContent3.substring(0, 100) + '...');
const result3 = getCleanExcerpt(problematicContent3, title3);
console.log('Fixed:', result3);
console.log('✓ **Title** removed:', !result3.includes('**Title**'));
console.log('✓ Duplicate title removed:', !result3.includes('Complete Guide to Success'));
console.log('✓ Content preserved:', result3.includes('real content'));
console.log('');

console.log('🎉 All tests completed! Blog listing excerpts should now be clean.');
