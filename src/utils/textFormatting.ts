/**
 * Utility functions for text formatting and capitalization
 */

// Words that should not be capitalized in titles (articles, prepositions, etc.)
const LOWERCASE_WORDS = [
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'is', 'it',
  'nor', 'of', 'off', 'on', 'onto', 'or', 'over', 'per', 'the', 'to', 'up', 'via', 
  'with', 'yet', 'so', 'nor', 'but', 'or', 'yet', 'so'
];

/**
 * Converts text to proper title case following standard capitalization rules
 * - First and last words are always capitalized
 * - Articles, prepositions, and conjunctions are lowercase (unless first/last word)
 * - All other words are capitalized
 */
export function toTitleCase(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  const words = text.toLowerCase().split(' ');
  
  return words.map((word, index) => {
    // Always capitalize first and last word
    if (index === 0 || index === words.length - 1) {
      return capitalizeWord(word);
    }
    
    // Check if word should remain lowercase
    if (LOWERCASE_WORDS.includes(word)) {
      return word;
    }
    
    // Capitalize other words
    return capitalizeWord(word);
  }).join(' ');
}

/**
 * Capitalizes the first letter of a word, preserving the rest
 */
function capitalizeWord(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Formats blog content to fix common issues:
 * - Proper title case for headings
 * - Convert bullet points to hyphenated format
 * - Proper spacing around asterisks
 */
export function formatBlogContent(content: string): string {
  if (!content) return '';

  let formattedContent = content;

  // Fix heading capitalization for ALL heading tags (h1-h6)
  formattedContent = formattedContent.replace(
    /<h([1-6])>(.*?)<\/h[1-6]>/gi,
    (match, level, text) => {
      // Strip any HTML tags from the text content
      const cleanText = text.replace(/<[^>]*>/g, '');
      const titleCased = toTitleCase(cleanText);
      return `<h${level}>${titleCased}</h${level}>`;
    }
  );

  // Convert bullet points to hyphenated format
  formattedContent = convertBulletPointsToHyphens(formattedContent);

  // Fix spacing around asterisks
  formattedContent = fixAsteriskSpacing(formattedContent);

  return formattedContent;
}

/**
 * Converts bullet points from ul/ol/li structure to simple hyphenated format
 */
function convertBulletPointsToHyphens(content: string): string {
  let fixed = content;

  // Convert ul/li structures to hyphenated lists
  fixed = fixed.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, listContent) => {
    // Extract list items and convert to hyphens
    const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    const hyphenItems = items.map((item: string) => {
      const content = item.replace(/<\/?li[^>]*>/gi, '').trim();
      return `- ${content}`;
    });
    return hyphenItems.join('\n');
  });

  // Convert ol/li structures to hyphenated lists (instead of numbered)
  fixed = fixed.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, listContent) => {
    const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    const hyphenItems = items.map((item: string) => {
      const content = item.replace(/<\/?li[^>]*>/gi, '').trim();
      return `- ${content}`;
    });
    return hyphenItems.join('\n');
  });

  // Clean up any orphaned li tags
  fixed = fixed.replace(/<\/?li[^>]*>/gi, '');

  return fixed;
}

/**
 * Fixes spacing around asterisk characters and ensures proper formatting
 */
function fixAsteriskSpacing(content: string): string {
  let fixed = content;

  // Fix asterisks at the beginning of sentences - ensure single asterisk with space
  // Transform "*This comprehensive guide" to "* This comprehensive guide"
  fixed = fixed.replace(/^\s*\*+\s*([A-Z])/gm, '* $1');

  // Fix mid-sentence asterisks - ensure spaces around them
  fixed = fixed.replace(/(\w)\*(\w)/g, '$1 * $2');

  // Fix emphasis asterisks - ensure proper spacing
  fixed = fixed.replace(/(\w)\*([^*\s])/g, '$1 *$2');
  fixed = fixed.replace(/([^*\s])\*(\w)/g, '$1* $2');

  // Clean up multiple consecutive asterisks
  fixed = fixed.replace(/\*{2,}/g, '*');

  // Fix double spaces that might have been created
  fixed = fixed.replace(/\s+/g, ' ');

  return fixed;
}

/**
 * Capitalizes the first letter of each sentence
 */
export function capitalizeSentences(text: string): string {
  if (!text) return '';
  
  return text.replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, letter) => {
    return prefix + letter.toUpperCase();
  });
}

/**
 * Formats a blog title with proper capitalization
 */
export function formatBlogTitle(title: string): string {
  if (!title) return '';
  
  // Apply title case
  let formatted = toTitleCase(title);
  
  // Special handling for common patterns
  formatted = formatted.replace(/\bSeo\b/gi, 'SEO');
  formatted = formatted.replace(/\bAi\b/gi, 'AI');
  formatted = formatted.replace(/\bApi\b/gi, 'API');
  formatted = formatted.replace(/\bUi\b/gi, 'UI');
  formatted = formatted.replace(/\bUx\b/gi, 'UX');
  formatted = formatted.replace(/\bCeo\b/gi, 'CEO');
  formatted = formatted.replace(/\bCto\b/gi, 'CTO');
  formatted = formatted.replace(/\bCfo\b/gi, 'CFO');
  
  return formatted;
}
