/**
 * Markdown Processing Utility
 * Ensures consistent markdown-to-HTML conversion across all content areas
 */

export interface MarkdownProcessingOptions {
  preserveLineBreaks?: boolean;
  addClasses?: boolean;
  linkTarget?: string;
}

/**
 * Process markdown content and convert to properly formatted HTML
 */
export function processMarkdown(content: string, options: MarkdownProcessingOptions = {}): string {
  if (!content) return '';
  
  const {
    preserveLineBreaks = true,
    addClasses = true,
    linkTarget = '_blank'
  } = options;
  
  let processed = content;
  
  // Process bold text (**text** or __text__)
  processed = processed.replace(/\*\*(.*?)\*\*/g, (match, text) => {
    const className = addClasses ? 'class="font-bold text-gray-900"' : '';
    return `<strong ${className}>${text}</strong>`;
  });
  
  processed = processed.replace(/__(.*?)__/g, (match, text) => {
    const className = addClasses ? 'class="font-bold text-gray-900"' : '';
    return `<strong ${className}>${text}</strong>`;
  });
  
  // Process italic text (*text* or _text_)
  processed = processed.replace(/\*(.*?)\*/g, (match, text) => {
    const className = addClasses ? 'class="italic text-gray-800"' : '';
    return `<em ${className}>${text}</em>`;
  });
  
  processed = processed.replace(/_(.*?)_/g, (match, text) => {
    const className = addClasses ? 'class="italic text-gray-800"' : '';
    return `<em ${className}>${text}</em>`;
  });
  
  // Process links [text](url)
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    const className = addClasses ? 'class="text-blue-600 hover:text-blue-800 font-semibold"' : '';
    const target = linkTarget ? `target="${linkTarget}" rel="noopener noreferrer"` : '';
    return `<a href="${url}" ${className} ${target}>${text}</a>`;
  });
  
  // Process headings
  processed = processed.replace(/^### (.*$)/gm, (match, text) => {
    const className = addClasses ? 'class="text-lg font-semibold text-gray-900 mb-2"' : '';
    return `<h3 ${className}>${text}</h3>`;
  });
  
  processed = processed.replace(/^## (.*$)/gm, (match, text) => {
    const className = addClasses ? 'class="text-xl font-bold text-gray-900 mb-3"' : '';
    return `<h2 ${className}>${text}</h2>`;
  });
  
  processed = processed.replace(/^# (.*$)/gm, (match, text) => {
    const className = addClasses ? 'class="text-2xl font-bold text-gray-900 mb-4"' : '';
    return `<h1 ${className}>${text}</h1>`;
  });
  
  // Process numbered lists
  processed = processed.replace(/^\d+\.\s+(.*)$/gm, (match, text) => {
    const processedText = processInlineMarkdown(text, addClasses);
    const className = addClasses ? 'class="mb-2 pl-4"' : '';
    return `<div ${className}>${match.replace(text, processedText)}</div>`;
  });
  
  // Process unordered lists
  processed = processed.replace(/^[-*+]\s+(.*)$/gm, (match, text) => {
    const processedText = processInlineMarkdown(text, addClasses);
    const className = addClasses ? 'class="mb-2 pl-4"' : '';
    return `<div ${className}>• ${processedText}</div>`;
  });
  
  // Process line breaks
  if (preserveLineBreaks) {
    processed = processed.replace(/\n\n/g, '<br><br>');
    processed = processed.replace(/\n/g, '<br>');
  }
  
  return processed;
}

/**
 * Process inline markdown within text (used for list items, etc.)
 */
function processInlineMarkdown(text: string, addClasses: boolean = true): string {
  let processed = text;
  
  // Process bold text
  processed = processed.replace(/\*\*(.*?)\*\*/g, (match, text) => {
    const className = addClasses ? 'class="font-bold text-gray-900"' : '';
    return `<strong ${className}>${text}</strong>`;
  });
  
  // Process italic text
  processed = processed.replace(/\*(.*?)\*/g, (match, text) => {
    const className = addClasses ? 'class="italic text-gray-800"' : '';
    return `<em ${className}>${text}</em>`;
  });
  
  // Process links
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    const className = addClasses ? 'class="text-blue-600 hover:text-blue-800 font-semibold"' : '';
    return `<a href="${url}" ${className} target="_blank" rel="noopener noreferrer">${text}</a>`;
  });
  
  return processed;
}

/**
 * Enhanced content processor for blog posts and similar content
 */
export function processBlogContent(content: string): string {
  if (!content) return '';
  
  let processed = content;
  
  // Process blog-specific formatting
  processed = processMarkdown(processed, {
    preserveLineBreaks: true,
    addClasses: true,
    linkTarget: '_blank'
  });
  
  // Ensure proper paragraph structure
  processed = processed.replace(/(<br><br>)/g, '</p><p>');
  processed = `<p>${processed}</p>`;
  
  // Clean up empty paragraphs
  processed = processed.replace(/<p><\/p>/g, '');
  processed = processed.replace(/<p>\s*<\/p>/g, '');
  
  return processed;
}

/**
 * Process content specifically for lists and bullet points
 */
export function processListContent(items: string[]): string {
  return items.map(item => {
    const processed = processInlineMarkdown(item, true);
    return `<li class="mb-2">${processed}</li>`;
  }).join('');
}

/**
 * Simple bold text processor for quick fixes
 */
export function processBoldText(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
}
