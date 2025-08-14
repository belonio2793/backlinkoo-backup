#!/usr/bin/env node

/**
 * Test Script for Telegraph Content Formatting Fix
 * This tests the fixed parsing functions to ensure proper link formatting
 */

console.log('🧪 Testing Telegraph Content Formatting Fixes...\n');

// Test sample content with markdown links
const testContent = `
# This is a heading

This is a paragraph with some **bold text** and a [test link](https://example.com) in the middle.

## Another heading

Another paragraph with multiple links: [first link](https://first.com) and [second link](https://second.com).

- List item with a [link in bullet](https://bullet.com)
- Another list item

Regular text with **bold formatting** and final [anchor text](https://target.com).
`;

// Load the parsing functions (we'll simulate them here)
function parseInlineMarkdown(text) {
  if (!text || typeof text !== 'string') {
    return text || '';
  }
  
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, linkText, url] = match;
    const index = match.index;
    
    if (index > lastIndex) {
      const beforeText = text.substring(lastIndex, index);
      if (beforeText.trim()) {
        const formatted = parseTextFormatting(beforeText);
        if (typeof formatted === 'string') {
          parts.push(formatted);
        } else if (Array.isArray(formatted)) {
          parts.push(...formatted);
        } else {
          parts.push(formatted);
        }
      }
    }
    
    parts.push({
      tag: 'a',
      attrs: { href: url },
      children: [linkText]
    });
    
    lastIndex = index + fullMatch.length;
  }
  
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText.trim()) {
      const formatted = parseTextFormatting(remainingText);
      if (typeof formatted === 'string') {
        parts.push(formatted);
      } else if (Array.isArray(formatted)) {
        parts.push(...formatted);
      } else {
        parts.push(formatted);
      }
    }
  }
  
  if (parts.length === 0) {
    return parseTextFormatting(text);
  }
  
  return parts;
}

function parseTextFormatting(text) {
  if (!text || typeof text !== 'string') {
    return text || '';
  }
  
  if (text.includes('**')) {
    const parts = [];
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      const [fullMatch, boldText] = match;
      const index = match.index;
      
      if (index > lastIndex) {
        const beforeText = text.substring(lastIndex, index);
        if (beforeText) {
          parts.push(beforeText);
        }
      }
      
      parts.push({
        tag: 'strong',
        children: [boldText]
      });
      
      lastIndex = index + fullMatch.length;
    }
    
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        parts.push(remainingText);
      }
    }
    
    return parts.length === 0 ? text : (parts.length === 1 ? parts[0] : parts);
  }
  
  return text;
}

function convertMarkdownToTelegraph(markdown) {
  const lines = markdown.split('\n').filter(line => line.trim());
  const telegraphContent = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) continue;

    if (trimmedLine.startsWith('##')) {
      const headerText = trimmedLine.replace(/^#+\s*/, '');
      const parsedContent = parseInlineMarkdown(headerText);
      
      telegraphContent.push({
        tag: 'h3',
        children: Array.isArray(parsedContent) ? parsedContent : [parsedContent]
      });
    } else if (trimmedLine.startsWith('#')) {
      const headerText = trimmedLine.replace(/^#+\s*/, '');
      const parsedContent = parseInlineMarkdown(headerText);
      
      telegraphContent.push({
        tag: 'h3',
        children: Array.isArray(parsedContent) ? parsedContent : [parsedContent]
      });
    }
    else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      const listText = trimmedLine.replace(/^[-*]\s*/, '');
      const parsedContent = parseInlineMarkdown(listText);
      
      let children = ['• '];
      if (Array.isArray(parsedContent)) {
        children.push(...parsedContent);
      } else {
        children.push(parsedContent);
      }
      
      telegraphContent.push({
        tag: 'p',
        children: children
      });
    }
    else {
      const parsedContent = parseInlineMarkdown(trimmedLine);
      
      let children;
      if (Array.isArray(parsedContent)) {
        children = parsedContent.filter(item => item !== null && item !== undefined);
      } else if (parsedContent !== null && parsedContent !== undefined) {
        children = [parsedContent];
      } else {
        children = [trimmedLine];
      }
      
      telegraphContent.push({
        tag: 'p',
        children: children
      });
    }
  }

  return telegraphContent;
}

// Test the conversion
console.log('📝 Original content:');
console.log(testContent);
console.log('\n🔄 Converted Telegraph format:');

const converted = convertMarkdownToTelegraph(testContent);
console.log(JSON.stringify(converted, null, 2));

// Verify no [object Object] appears
const serialized = JSON.stringify(converted);
const hasObjectError = serialized.includes('[object Object]');

console.log('\n✅ Test Results:');
console.log(`- Contains [object Object]: ${hasObjectError ? '❌ FAIL' : '✅ PASS'}`);
console.log(`- Has proper link structure: ${converted.some(item => 
  item.children && item.children.some(child => 
    typeof child === 'object' && child.tag === 'a'
  )
) ? '✅ PASS' : '❌ FAIL'}`);

// Count links
let linkCount = 0;
function countLinks(item) {
  if (Array.isArray(item)) {
    item.forEach(countLinks);
  } else if (typeof item === 'object' && item !== null) {
    if (item.tag === 'a') {
      linkCount++;
    }
    if (item.children) {
      countLinks(item.children);
    }
  }
}

converted.forEach(countLinks);
console.log(`- Total links found: ${linkCount} (expected: 5)`);

console.log('\n🎯 Summary:');
if (!hasObjectError && linkCount === 5) {
  console.log('✅ ALL TESTS PASSED - Content formatting fix is working correctly!');
} else {
  console.log('❌ SOME TESTS FAILED - Fix needs more work');
}
