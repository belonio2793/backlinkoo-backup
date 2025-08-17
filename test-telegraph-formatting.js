// Test Telegraph formatting functionality

// Mock the Telegraph publisher functions
function convertMarkdownToTelegraph(markdown) {
  const lines = markdown.split('\n');
  const telegraphNodes = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      continue; // Skip empty lines
    }
    
    // Handle headings
    if (trimmed.startsWith('# ')) {
      const headingText = processTextFormatting(trimmed.substring(2));
      telegraphNodes.push({
        tag: 'h3',
        children: headingText
      });
    } else if (trimmed.startsWith('## ')) {
      const headingText = processTextFormatting(trimmed.substring(3));
      telegraphNodes.push({
        tag: 'h4',
        children: headingText
      });
    }
    // Handle list items
    else if (trimmed.startsWith('• ') || trimmed.match(/^\d+\.\s/)) {
      const listText = processTextFormatting(trimmed.replace(/^[•\d]+\.\s*/, ''));
      telegraphNodes.push({
        tag: 'p',
        children: ['• ', ...listText]
      });
    }
    // Handle paragraphs with text formatting and links
    else {
      const processedText = processTextFormatting(trimmed);
      telegraphNodes.push({
        tag: 'p',
        children: processedText
      });
    }
  }
  
  return telegraphNodes;
}

function processTextFormatting(text) {
  // Process all formatting in sequence: bold, italic, then links
  const result = [];
  const segments = parseFormattedText(text);
  
  for (const segment of segments) {
    if (segment.type === 'text') {
      result.push(segment.content);
    } else if (segment.type === 'bold') {
      result.push({
        tag: 'b',
        children: [segment.content]
      });
    } else if (segment.type === 'italic') {
      result.push({
        tag: 'i',
        children: [segment.content]
      });
    } else if (segment.type === 'strong') {
      result.push({
        tag: 'strong',
        children: [segment.content]
      });
    } else if (segment.type === 'link') {
      result.push({
        tag: 'a',
        attrs: {
          href: segment.url,
          target: '_blank'
        },
        children: [segment.content]
      });
    }
  }
  
  return result.length > 0 ? result : [text];
}

function parseFormattedText(text) {
  const segments = [];
  let currentIndex = 0;
  
  // Combined regex for all formatting types
  const formatRegex = /(\*\*([^*]+)\*\*|<strong>([^<]+)<\/strong>|<b>([^<]+)<\/b>|\*([^*]+)\*|<i>([^<]+)<\/i>|<em>([^<]+)<\/em>|\[([^\]]+)\]\(([^)]+)\))/g;
  let match;
  
  while ((match = formatRegex.exec(text)) !== null) {
    // Add any text before this match
    if (match.index > currentIndex) {
      const beforeText = text.substring(currentIndex, match.index);
      if (beforeText) {
        segments.push({ type: 'text', content: beforeText });
      }
    }
    
    // Determine the type of formatting
    if (match[0].startsWith('**') || match[0].startsWith('<strong>') || match[0].startsWith('<b>')) {
      // Bold text
      const content = match[2] || match[3] || match[4];
      segments.push({ type: 'bold', content });
    } else if (match[0].startsWith('*') || match[0].startsWith('<i>') || match[0].startsWith('<em>')) {
      // Italic text
      const content = match[5] || match[6] || match[7];
      segments.push({ type: 'italic', content });
    } else if (match[0].startsWith('[')) {
      // Link
      const content = match[8];
      const url = match[9];
      segments.push({ type: 'link', content, url });
    }
    
    currentIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (currentIndex < text.length) {
    const remainingText = text.substring(currentIndex);
    if (remainingText) {
      segments.push({ type: 'text', content: remainingText });
    }
  }
  
  return segments.length > 0 ? segments : [{ type: 'text', content: text }];
}

// Test content with various formatting
const testContent = `# Bold Heading Test

This is a paragraph with <strong>bold text using strong tags</strong> and also **bold text using markdown**.

## Features

• <strong>Easy-to-Use Interface:</strong> Leadpages has a user-friendly interface that allows you to quickly create and customize landing pages and websites.

• <strong>Mobile-Responsive Templates:</strong> The templates provided by Leadpages are mobile-responsive, ensuring that your pages look great on any device.

• <strong>Conversion Optimization Tools:</strong> Leadpages offers tools like A/B testing and analytics to help you optimize your pages for maximum conversions.

• <strong>Integration Capabilities:</strong> You can easily integrate Leadpages with other marketing tools such as email marketing platforms, CRM systems, and more.

Visit [Leadpages](https://leadpages.com) for more information.`;

console.log('=== TESTING TELEGRAPH FORMATTING ===\n');

console.log('Input content:');
console.log(testContent);
console.log('\n' + '='.repeat(50) + '\n');

const result = convertMarkdownToTelegraph(testContent);

console.log('Telegraph formatted result:');
console.log(JSON.stringify(result, null, 2));

console.log('\n=== INDIVIDUAL FORMATTING TESTS ===\n');

// Test individual formatting cases
const testCases = [
  '<strong>Bold with strong tags</strong>',
  '**Bold with markdown**',
  '<b>Bold with b tags</b>',
  'Mixed <strong>bold</strong> and **markdown** formatting',
  'Text with [link](https://example.com) in it',
  '<strong>Bold</strong> text with [link](https://example.com)',
  'Normal text without formatting'
];

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: "${testCase}"`);
  const formatted = processTextFormatting(testCase);
  console.log('Result:', JSON.stringify(formatted, null, 2));
  console.log('---');
});

console.log('\n✅ Telegraph formatting test completed!');
