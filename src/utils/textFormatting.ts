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
 * - Consistent bullet point structure
 * - Proper spacing around asterisks
 */
export function formatBlogContent(content: string): string {
  if (!content) return '';
  
  let formattedContent = content;
  
  // Fix heading capitalization
  formattedContent = formattedContent.replace(
    /<h([1-6])>(.*?)<\/h[1-6]>/gi,
    (match, level, text) => {
      const titleCased = toTitleCase(text.replace(/<[^>]*>/g, '')); // Remove any inner HTML
      return `<h${level}>${titleCased}</h${level}>`;
    }
  );
  
  // Fix broken bullet point structures
  formattedContent = fixBulletPoints(formattedContent);
  
  // Fix spacing around asterisks
  formattedContent = fixAsteriskSpacing(formattedContent);
  
  return formattedContent;
}

/**
 * Fixes broken bullet point structures and ensures consistency
 */
function fixBulletPoints(content: string): string {
  let fixed = content;
  
  // Fix broken nested structures like <ol><ul><li>
  fixed = fixed.replace(/<ol>\s*<ul>/gi, '<ul>');
  fixed = fixed.replace(/<\/ul>\s*<\/ol>/gi, '</ul>');
  
  // Fix orphaned <li> elements (not inside ul or ol)
  fixed = fixed.replace(/(?<!<ul[^>]*>|<ol[^>]*>)(\s*<li[^>]*>.*?<\/li>)/gi, '<ul>$1</ul>');
  
  // Fix multiple consecutive ul/ol tags
  fixed = fixed.replace(/<\/ul>\s*<ul>/gi, '');
  fixed = fixed.replace(/<\/ol>\s*<ol>/gi, '');
  
  // Ensure proper nesting - no direct ul inside ol or vice versa without li
  fixed = fixed.replace(/<ol>(\s*<ul>)/gi, '<ol><li><ul>');
  fixed = fixed.replace(/(<\/ul>\s*)<\/ol>/gi, '</ul></li></ol>');
  
  // Fix unclosed list tags by finding orphaned opening tags
  const openUl = (fixed.match(/<ul[^>]*>/gi) || []).length;
  const closeUl = (fixed.match(/<\/ul>/gi) || []).length;
  const openOl = (fixed.match(/<ol[^>]*>/gi) || []).length;
  const closeOl = (fixed.match(/<\/ol>/gi) || []).length;
  
  // Add missing closing tags
  if (openUl > closeUl) {
    fixed += '</ul>'.repeat(openUl - closeUl);
  }
  if (openOl > closeOl) {
    fixed += '</ol>'.repeat(openOl - closeOl);
  }
  
  return fixed;
}

/**
 * Fixes spacing around asterisk characters
 */
function fixAsteriskSpacing(content: string): string {
  let fixed = content;
  
  // Fix cases where asterisk is stuck to words without spaces
  // e.g., "word*another" becomes "word * another"
  fixed = fixed.replace(/(\w)\*(\w)/g, '$1 * $2');
  
  // Fix cases where there's no space before asterisk at start of emphasis
  // e.g., "word*emphasis*" becomes "word *emphasis*"
  fixed = fixed.replace(/(\w)\*([^*\s])/g, '$1 *$2');
  
  // Fix cases where there's no space after asterisk at end of emphasis
  // e.g., "*emphasis*word" becomes "*emphasis* word"
  fixed = fixed.replace(/([^*\s])\*(\w)/g, '$1* $2');
  
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
