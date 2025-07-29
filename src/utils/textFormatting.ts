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

  // Fix broken HTML structure first
  formattedContent = fixBrokenHTMLStructure(formattedContent);

  // Prevent double headlines
  formattedContent = fixDoubleHeadlines(formattedContent);

  // Convert text formatting to proper HTML tags
  formattedContent = convertToProperHTML(formattedContent);

  // Clean up multiple consecutive line breaks
  formattedContent = formattedContent.replace(/\n{3,}/g, '\n\n');

  // Clean HTML comments and fix structure
  formattedContent = cleanHTMLContent(formattedContent);

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

  // Handle long bullet point strings that are all concatenated together
  // Pattern: "- Item1: Description - Item2: Description - Item3: Description"
  formatted = formatted.replace(/(-\s*[^-]+?)(?=\s*-\s*[A-Z])/g, (match, item) => {
    const cleanItem = item.trim();
    if (cleanItem.startsWith('-')) {
      // Ensure proper formatting and capitalization
      const content = cleanItem.substring(1).trim();
      const capitalized = content.charAt(0).toUpperCase() + content.slice(1);
      return `- ${capitalized}\n`;
    }
    return match;
  });

  // Handle the last item in a sequence that doesn't have another bullet after it
  formatted = formatted.replace(/(-\s*[^-\n]+)(?!\s*-)/g, (match, item) => {
    const cleanItem = item.trim();
    if (cleanItem.startsWith('-')) {
      const content = cleanItem.substring(1).trim();
      const capitalized = content.charAt(0).toUpperCase() + content.slice(1);
      return `- ${capitalized}`;
    }
    return match;
  });

  // Convert HTML-style lists to proper bullet points with line breaks
  formatted = formatted.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, listContent) => {
    const items = listContent.match(/<li[^>]*>(.*?)<\/li>/gis) || [];
    const bulletItems = items.map(item => {
      const content = item.replace(/<\/?li[^>]*>/gi, '').trim();
      if (content) {
        const capitalized = content.charAt(0).toUpperCase() + content.slice(1);
        return `- ${capitalized}`;
      }
      return '';
    }).filter(item => item);

    return bulletItems.length > 0 ? '\n' + bulletItems.join('\n') + '\n' : '';
  });

  // Convert ordered lists to bullet points as well
  formatted = formatted.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, listContent) => {
    const items = listContent.match(/<li[^>]*>(.*?)<\/li>/gis) || [];
    const bulletItems = items.map(item => {
      const content = item.replace(/<\/?li[^>]*>/gi, '').trim();
      if (content) {
        const capitalized = content.charAt(0).toUpperCase() + content.slice(1);
        return `- ${capitalized}`;
      }
      return '';
    }).filter(item => item);

    return bulletItems.length > 0 ? '\n' + bulletItems.join('\n') + '\n' : '';
  });

  // Clean up any remaining li tags
  formatted = formatted.replace(/<\/?li[^>]*>/gi, '');

  // Clean up any multiple consecutive line breaks
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
 * Fixes broken HTML structure and paragraph formatting
 */
function fixBrokenHTMLStructure(content: string): string {
  let fixed = content;

  // Fix broken list items that contain paragraph content
  fixed = fixed.replace(/<li[^>]*>(.*?)<\/li>/gis, (match, liContent) => {
    // If the li content looks like regular paragraph text (not a bullet point), convert to paragraph
    const cleanContent = liContent.trim();
    if (cleanContent && !cleanContent.match(/^[-•·]\s/) && cleanContent.length > 100) {
      return `<p>${cleanContent}</p>`;
    }
    return match;
  });

  // Fix broken paragraph tags and malformed content
  fixed = fixed.replace(/<p[^>]*>\s*<\/p>/g, ''); // Remove empty paragraphs
  fixed = fixed.replace(/<p[^>]*>\s*(<h[1-6])/gi, '$1'); // Don't wrap headings in paragraphs
  fixed = fixed.replace(/(<\/h[1-6]>)\s*<\/p>/gi, '$1'); // Don't close paragraphs after headings

  // Fix content that's not properly wrapped in paragraphs
  fixed = fixed.replace(/^(?!<[hulo\/]|$)([^<\n][^<]*?)(?=\n\n|<h|<ul|<ol|$)/gm, '<p>$1</p>');

  // Fix broken sentences (text that ends abruptly without punctuation)
  fixed = fixed.replace(/([a-z])\s*<\/p>/gi, (match, lastChar) => {
    if (!'.,!?;:'.includes(lastChar)) {
      return `${lastChar}.</p>`;
    }
    return match;
  });

  // Remove any empty or malformed list structures
  fixed = fixed.replace(/<[uo]l[^>]*>\s*<\/[uo]l>/gi, '');
  fixed = fixed.replace(/<[uo]l[^>]*>\s*(<li[^>]*>\s*<\/li>\s*)*<\/[uo]l>/gi, '');

  return fixed;
}

/**
 * Prevents double headlines by merging consecutive heading tags
 */
function fixDoubleHeadlines(content: string): string {
  let fixed = content;

  // Remove consecutive H1 tags (keep only the first one)
  fixed = fixed.replace(/(<h1[^>]*>.*?<\/h1>)\s*(<h1[^>]*>.*?<\/h1>)/gi, '$1');

  // Convert H2 that immediately follows H1 to H2 with proper spacing
  fixed = fixed.replace(/(<h1[^>]*>.*?<\/h1>)\s*(<h2[^>]*>.*?<\/h2>)/gi, '$1\n\n$2');

  // Remove consecutive identical headings
  fixed = fixed.replace(/(<h([1-6])[^>]*>)(.*?)(<\/h\2>)\s*(<h\2[^>]*>)\3(<\/h\2>)/gi, '$1$3$4');

  // Ensure proper spacing between headings and content
  fixed = fixed.replace(/(<\/h[1-6]>)\s*(<h[1-6])/gi, '$1\n\n$2');
  fixed = fixed.replace(/(<\/h[1-6]>)\s*(<p)/gi, '$1\n\n$2');

  return fixed;
}

/**
 * Converts text formatting to proper HTML tags
 */
function convertToProperHTML(content: string): string {
  let formatted = content;

  // Convert **bold** to <strong>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert *italic* to <em>
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Fix standalone bullet points and convert to proper lists
  formatted = formatted.replace(/(?:^|\n)((?:\s*[-•·]\s[^\n]+(?:\n|$))+)/gm, (match, bulletGroup) => {
    const items = bulletGroup.split('\n')
      .map(line => line.trim())
      .filter(line => line.match(/^[-•·]\s/))
      .map(line => {
        const content = line.replace(/^[-•·]\s/, '').trim();
        return `  <li>${content}</li>`;
      });

    return items.length > 0 ? `\n<ul>\n${items.join('\n')}\n</ul>\n` : match;
  });

  // Convert numbered lists to ordered lists (1. 2. 3. etc.)
  formatted = formatted.replace(/(?:^|\n)((?:\s*\d+\.\s[^\n]+(?:\n|$))+)/gm, (match, listGroup) => {
    const items = listGroup.split('\n')
      .map(line => line.trim())
      .filter(line => /^\d+\.\s/.test(line))
      .map(line => {
        const content = line.replace(/^\d+\.\s/, '').trim();
        return `  <li>${content}</li>`;
      });

    return items.length > 0 ? `\n<ol>\n${items.join('\n')}\n</ol>\n` : match;
  });

  // Wrap standalone text in paragraphs (avoiding headings and lists)
  const lines = formatted.split('\n');
  const processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines, headings, lists, and already wrapped content
    if (!line ||
        line.startsWith('<h') ||
        line.startsWith('</h') ||
        line.startsWith('<ul') ||
        line.startsWith('</ul') ||
        line.startsWith('<ol') ||
        line.startsWith('</ol') ||
        line.startsWith('<li') ||
        line.startsWith('</li') ||
        line.startsWith('<p') ||
        line.startsWith('</p')) {
      processedLines.push(lines[i]);
      continue;
    }

    // If it's regular text content, wrap in paragraph
    if (line.length > 0 && !line.startsWith('<')) {
      processedLines.push(`<p>${line}</p>`);
    } else {
      processedLines.push(lines[i]);
    }
  }

  formatted = processedLines.join('\n');

  // Clean up any malformed paragraph tags
  formatted = formatted.replace(/<p>\s*<\/p>/g, '');
  formatted = formatted.replace(/<p>\s*(<[huo])/g, '$1');
  formatted = formatted.replace(/(<\/[huo]l>)\s*<\/p>/g, '$1');

  return formatted;
}

/**
 * Cleans HTML content by removing comments and fixing structure
 */
export function cleanHTMLContent(content: string): string {
  if (!content) return '';

  let cleaned = content;

  // Remove all HTML comments completely (including malformed ones)
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Remove orphaned comment markers that might appear as text
  cleaned = cleaned.replace(/-->/g, '');
  cleaned = cleaned.replace(/<!--/g, '');

  // Remove meta tags hints that shouldn't be visible
  cleaned = cleaned.replace(/<!-- SEO Meta Tags[\s\S]*?-->/g, '');
  cleaned = cleaned.replace(/<!-- Structured Data[\s\S]*?-->/g, '');

  // Remove content structure comments and references
  cleaned = cleaned.replace(/<!-- Rest of the sections[\s\S]*?-->/gi, '');
  cleaned = cleaned.replace(/<!-- The complete implementation[\s\S]*?-->/gi, '');
  cleaned = cleaned.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  cleaned = cleaned.replace(/\{\/\* Rest of the sections[\s\S]*?\*\/\}/gi, '');
  cleaned = cleaned.replace(/\{\/\* The complete implementation[\s\S]*?\*\/\}/gi, '');

  // Remove JSON-LD structured data that appears as text
  cleaned = cleaned.replace(/\{\s*"@context"[\s\S]*?\}/g, '');

  // Clean up malformed bullet points with HTML entities
  cleaned = cleaned.replace(/- &lt;div class=["']bullet["'][^&]*?&gt;/g, '-');
  cleaned = cleaned.replace(/&lt;\/div&gt;/g, '');

  // Fix HTML entities that shouldn't be visible
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&amp;/g, '&');

  // Fix malformed bullet points that are inline
  cleaned = cleaned.replace(/- <(strong|b)>/g, '\n- <$1>');
  cleaned = cleaned.replace(/<\/(strong|b)> - /g, '</$1>\n- ');

  // Fix broken bullet point structures
  cleaned = cleaned.replace(/- <div[^>]*>/g, '-');
  cleaned = cleaned.replace(/<\/div>\s*(?=\n|$)/g, '');

  // Remove unnecessary symbols and characters that don't align with content
  cleaned = cleaned.replace(/[\u2018\u2019]/g, "'"); // Smart quotes to straight quotes
  cleaned = cleaned.replace(/[\u201C\u201D]/g, '"'); // Smart double quotes
  cleaned = cleaned.replace(/\u2026/g, '...'); // Ellipsis character
  cleaned = cleaned.replace(/[\u2013\u2014]/g, '-'); // En/em dashes to hyphens

  // Remove excessive punctuation
  cleaned = cleaned.replace(/[!]{2,}/g, '!'); // Multiple exclamation marks
  cleaned = cleaned.replace(/[?]{2,}/g, '?'); // Multiple question marks
  cleaned = cleaned.replace(/[.]{4,}/g, '...'); // Multiple periods

  // Replace AI mentions with Backlink ∞ Algorithm
  cleaned = cleaned.replace(/\bAI\b/g, 'Backlink ∞ Algorithm');
  cleaned = cleaned.replace(/\bai\b/g, 'Backlink ∞ Algorithm');
  cleaned = cleaned.replace(/\bartificial intelligence\b/gi, 'Backlink ∞ Algorithm');
  cleaned = cleaned.replace(/\bmachine learning\b/gi, 'Backlink ∞ Algorithm');

  // Remove geolocation specifics from content
  cleaned = cleaned.replace(/Optimized for [A-Za-z\s]+\./g, '');
  cleaned = cleaned.replace(/Tailored for [A-Za-z\s]+\./g, '');
  cleaned = cleaned.replace(/Designed for [A-Za-z\s]+ market\./g, '');
  cleaned = cleaned.replace(/Localized for [A-Za-z\s]+\./g, '');

  // Fix paragraph and list alignment issues
  cleaned = cleaned.replace(/(<\/p>)\s*(<ul|<ol)/g, '$1\n\n$2');
  cleaned = cleaned.replace(/(<\/ul>|<\/ol>)\s*(<p)/g, '$1\n\n$2');
  cleaned = cleaned.replace(/(<\/h[1-6]>)\s*(<ul|<ol|<p)/g, '$1\n\n$2');

  // Fix broken sentence continuations
  cleaned = cleaned.replace(/([a-z])\s*\n\s*([A-Z][a-z])/g, '$1 $2');

  // Clean up excessive line breaks
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Remove any remaining malformed HTML patterns
  cleaned = cleaned.replace(/class=["'][^"']*bullet["'][^>]*>/g, '');
  cleaned = cleaned.replace(/data-loc=["'][^"']*["']/g, '');
  cleaned = cleaned.replace(/<div[^>]*bullet[^>]*>/g, '');

  // Clean up any text that looks like comment markers
  cleaned = cleaned.replace(/^\s*-->\s*/gm, '');
  cleaned = cleaned.replace(/\s*<!--\s*$/gm, '');

  // Remove unnecessary HTML attributes that don't belong in content
  cleaned = cleaned.replace(/\s+data-[^=]*=["'][^"']*["']/g, '');
  cleaned = cleaned.replace(/\s+class=["'][^"']*bullet[^"']*["']/g, '');

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
