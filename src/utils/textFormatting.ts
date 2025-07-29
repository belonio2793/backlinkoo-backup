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
 * - Convert bullet points to hyphenated format with line separation
 * - Proper spacing around asterisks
 * - Capitalize first letter of every sentence
 * - Format bullet points with proper line breaks
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

  // Convert bullet points to hyphenated format with proper line breaks
  formattedContent = convertBulletPointsToHyphens(formattedContent);

  // Fix spacing around asterisks
  formattedContent = fixAsteriskSpacing(formattedContent);

  // Format inline bullet points with proper line separation
  formattedContent = formatInlineBulletPoints(formattedContent);

  // Capitalize first letter of every sentence
  formattedContent = capitalizeSentences(formattedContent);

  // Clean up multiple consecutive line breaks
  formattedContent = formattedContent.replace(/\n{3,}/g, '\n\n');

  return formattedContent;
}

/**
 * Converts bullet points from ul/ol/li structure to simple hyphenated format with proper line breaks
 */
function convertBulletPointsToHyphens(content: string): string {
  let fixed = content;

  // Convert ul/li structures to hyphenated lists
  fixed = fixed.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, listContent) => {
    // Extract list items and convert to hyphens
    const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    const hyphenItems = items.map((item: string) => {
      const content = item.replace(/<\/?li[^>]*>/gi, '').trim();
      // Ensure first letter is capitalized
      const capitalizedContent = content.charAt(0).toUpperCase() + content.slice(1);
      return `- ${capitalizedContent}`;
    });
    return '\n' + hyphenItems.join('\n') + '\n';
  });

  // Convert ol/li structures to hyphenated lists (instead of numbered)
  fixed = fixed.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, listContent) => {
    const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    const hyphenItems = items.map((item: string) => {
      const content = item.replace(/<\/?li[^>]*>/gi, '').trim();
      // Ensure first letter is capitalized
      const capitalizedContent = content.charAt(0).toUpperCase() + content.slice(1);
      return `- ${capitalizedContent}`;
    });
    return '\n' + hyphenItems.join('\n') + '\n';
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

/**
 * Formats inline bullet points that appear within paragraphs or text blocks
 * Separates them with proper line breaks and capitalizes first letters
 */
function formatInlineBulletPoints(content: string): string {
  let formatted = content;

  // Handle patterns like "- item1 - item2 - item3" and separate them with line breaks
  formatted = formatted.replace(/\s*-\s*([^-\n]+?)\s*-\s*([^-\n]+)/g, (match, ...items) => {
    // Split on hyphens and clean up each item
    const allItems = match.split(/\s*-\s*/).filter(item => item.trim());
    const formattedItems = allItems.map(item => {
      const cleanItem = item.trim();
      if (cleanItem) {
        // Capitalize first letter and ensure proper punctuation
        const capitalized = cleanItem.charAt(0).toUpperCase() + cleanItem.slice(1);
        return `- ${capitalized}`;
      }
      return '';
    }).filter(item => item);

    return '\n' + formattedItems.join('\n') + '\n';
  });

  // Handle bullet points that are run together without proper spacing
  formatted = formatted.replace(/([a-z])\s*-\s*([A-Z][^-]*)/g, (match, prevChar, nextItem) => {
    return `${prevChar}\n- ${nextItem}`;
  });

  // Clean up any double line breaks that might have been created
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  return formatted;
}

/**
 * Enhanced sentence capitalization that handles various punctuation marks
 */
export function capitalizeSentences(text: string): string {
  if (!text) return '';

  return text.replace(/(^|[.!?:]\s+|\n\s*)([a-z])/g, (match, prefix, letter) => {
    return prefix + letter.toUpperCase();
  });
}

/**
 * Cleans HTML content by removing comments and fixing structure
 */
export function cleanHTMLContent(content: string): string {
  if (!content) return '';

  let cleaned = content;

  // Remove HTML comments completely
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Remove meta tags hints that shouldn't be visible
  cleaned = cleaned.replace(/<!-- SEO Meta Tags[\s\S]*?-->/g, '');
  cleaned = cleaned.replace(/<!-- Structured Data[\s\S]*?-->/g, '');

  // Fix malformed bullet points that are inline
  cleaned = cleaned.replace(/- <(strong|b)>/g, '\n- <$1>');
  cleaned = cleaned.replace(/<\/(strong|b)> - /g, '</$1>\n- ');

  // Ensure proper paragraph structure around bullet points
  cleaned = cleaned.replace(/(\n- [^\n]+(?:\n- [^\n]+)*)/g, '\n<div class="bullet-list">$1\n</div>\n');

  // Clean up excessive line breaks
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Ensure content starts cleanly (no leading whitespace/comments)
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Calculates accurate word count from HTML content
 * Strips HTML tags and counts actual words
 */
export function calculateWordCount(content: string): number {
  if (!content) return 0;

  // Strip HTML tags
  const textContent = content.replace(/<[^>]*>/g, ' ');

  // Remove extra whitespace and split into words
  const words = textContent
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => word.length > 0);

  return words.length;
}

/**
 * Gets a rotating trending adjective for blog posts
 */
export function getTrendingLabel(): string {
  const trendingAdjectives = [
    'Trending',
    'Popular',
    'Hot',
    'Viral',
    'Buzzworthy',
    'Rising',
    'Must-Read',
    'Featured',
    'Top Pick',
    'Editor\'s Choice',
    'Spotlight',
    'Breaking',
    'Fresh',
    'Latest',
    'Exclusive'
  ];

  // Use current date to ensure consistent rotation per day
  const today = new Date().toDateString();
  const hash = today.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  const index = Math.abs(hash) % trendingAdjectives.length;
  return trendingAdjectives[index];
}
