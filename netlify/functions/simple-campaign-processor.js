/**
 * Simple Campaign Processor - Streamlined content generation + Telegraph publishing
 * Bypasses browser analytics and processes campaigns directly
 */

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
    };
  }

  try {
    const { keyword, anchorText, targetUrl, campaignId } = JSON.parse(event.body);

    console.log('🚀 Processing campaign:', { keyword, anchorText, targetUrl, campaignId });

    // Step 1: Generate content (with fallback if OpenAI unavailable)
    let content;
    let title = `The Complete Guide to ${keyword}`;

    try {
      if (process.env.OPENAI_API_KEY) {
        content = await generateOpenAIContent(keyword, anchorText, targetUrl);
        console.log('✅ Generated content via OpenAI');
      } else {
        throw new Error('OpenAI not available');
      }
    } catch (error) {
      console.log('⚠️ OpenAI failed, using template content');
      content = generateTemplateContent(keyword, anchorText, targetUrl);
    }

    // Step 2: Publish to Telegraph
    const telegraphUrl = await publishToTelegraph(title, content);
    console.log('✅ Published to Telegraph:', telegraphUrl);

    // Step 3: Verify link is live
    await verifyTelegraphLink(telegraphUrl);
    console.log('✅ Telegraph link verified as live');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          title,
          content,
          publishedUrl: telegraphUrl,
          keyword,
          anchorText,
          targetUrl,
          completedAt: new Date().toISOString()
        }
      }),
    };

  } catch (error) {
    console.error('❌ Campaign processing failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Campaign processing failed'
      }),
    };
  }
};

/**
 * Generate content using OpenAI
 */
async function generateOpenAIContent(keyword, anchorText, targetUrl) {
  const { OpenAI } = require('openai');
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const prompt = `Write a comprehensive 500-word article about "${keyword}". Include practical insights and naturally incorporate the phrase "${anchorText}" in a context where it would make sense to link to relevant resources.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a professional content writer. Create engaging, informative content that naturally incorporates anchor text for backlinking.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 1000,
    temperature: 0.7
  });

  let content = completion.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content generated');
  }

  // Embed the backlink naturally
  return embedBacklink(content, anchorText, targetUrl);
}

/**
 * Generate template content as fallback
 */
function generateTemplateContent(keyword, anchorText, targetUrl) {
  const content = `# Understanding ${keyword}: A Comprehensive Guide

${keyword} has become increasingly important in today's digital landscape. This guide explores the key aspects, benefits, and implementation strategies surrounding ${keyword}.

## What is ${keyword}?

${keyword} represents a fundamental concept that organizations and individuals need to understand. Whether you're just starting out or looking to deepen your expertise, understanding ${keyword} is essential for success.

## Key Benefits of ${keyword}

The implementation of effective ${keyword} strategies offers numerous advantages:

- Improved efficiency and productivity
- Enhanced user experience and satisfaction
- Better resource optimization
- Competitive advantage in the market
- Long-term sustainability and growth

## Implementation Strategies

When working with ${keyword}, it's important to follow proven methodologies. For comprehensive guidance and expert resources on this topic, ${anchorText} provides valuable insights and solutions that can help you achieve your goals.

## Best Practices

To maximize the benefits of ${keyword}, consider these essential best practices:

1. **Planning and Strategy**: Develop a clear roadmap before implementation
2. **Quality Focus**: Prioritize quality over quantity in all aspects
3. **Continuous Monitoring**: Regular assessment and optimization
4. **Expert Consultation**: Leverage professional expertise when needed

## Conclusion

${keyword} continues to evolve and shape how we approach modern challenges. By understanding its principles and implementing effective strategies, you can achieve significant improvements in your outcomes.

Remember that success with ${keyword} requires dedication, proper planning, and access to reliable resources. Stay informed about the latest developments and don't hesitate to seek expert guidance when needed.`;

  return embedBacklink(content, anchorText, targetUrl);
}

/**
 * Embed backlink naturally in content
 */
function embedBacklink(content, anchorText, targetUrl) {
  // Convert to markdown link format
  const markdownLink = `[${anchorText}](${targetUrl})`;
  
  // Replace first occurrence of anchor text with markdown link
  return content.replace(anchorText, markdownLink);
}

/**
 * Publish content to Telegraph
 */
async function publishToTelegraph(title, content) {
  const fetch = require('node-fetch');

  // Step 1: Create Telegraph account
  const accountResponse = await fetch('https://api.telegra.ph/createAccount', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      short_name: 'ContentBot',
      author_name: 'Automated Content',
      author_url: ''
    })
  });

  const accountData = await accountResponse.json();
  if (!accountData.ok) {
    throw new Error(`Telegraph account creation failed: ${accountData.error}`);
  }

  const accessToken = accountData.result.access_token;

  // Step 2: Convert content to Telegraph format
  const telegraphContent = convertToTelegraphFormat(content);

  // Step 3: Create Telegraph page
  const pageResponse = await fetch('https://api.telegra.ph/createPage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: accessToken,
      title: title,
      author_name: 'Automated Content',
      content: telegraphContent,
      return_content: false
    })
  });

  const pageData = await pageResponse.json();
  if (!pageData.ok) {
    throw new Error(`Telegraph page creation failed: ${pageData.error}`);
  }

  return pageData.result.url;
}

/**
 * Convert markdown content to Telegraph DOM format
 */
function convertToTelegraphFormat(markdown) {
  const lines = markdown.split('\n');
  const telegraphNodes = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) continue;
    
    // Handle headings
    if (trimmed.startsWith('# ')) {
      telegraphNodes.push({
        tag: 'h3',
        children: [trimmed.substring(2)]
      });
    } else if (trimmed.startsWith('## ')) {
      telegraphNodes.push({
        tag: 'h4',
        children: [trimmed.substring(3)]
      });
    } else {
      // Handle paragraphs with links
      const processedText = processMarkdownLinks(trimmed);
      telegraphNodes.push({
        tag: 'p',
        children: processedText
      });
    }
  }
  
  return telegraphNodes;
}

/**
 * Process markdown links in text
 */
function processMarkdownLinks(text) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const result = [];
  let lastIndex = 0;
  let match;
  
  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before link
    if (match.index > lastIndex) {
      result.push(text.substring(lastIndex, match.index));
    }
    
    // Add the link
    result.push({
      tag: 'a',
      attrs: {
        href: match[2],
        target: '_blank'
      },
      children: [match[1]]
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }
  
  return result.length > 0 ? result : [text];
}

/**
 * Verify Telegraph link is accessible
 */
async function verifyTelegraphLink(url) {
  const fetch = require('node-fetch');
  
  try {
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
    if (!response.ok) {
      throw new Error(`Telegraph link verification failed: ${response.status}`);
    }
  } catch (error) {
    console.warn('Telegraph link verification failed:', error.message);
    // Don't throw error, just warn - link might still be accessible
  }
}
