const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { title, content, author_name = 'Anonymous', return_content = false } = JSON.parse(event.body || '{}');
    
    if (!title || !content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Title and content are required' })
      };
    }

    console.log('📝 Publishing to Telegraph:', { title, author_name });

    // First, create an account (or use existing token)
    let accessToken;
    
    try {
      const accountResponse = await fetch('https://api.telegra.ph/createAccount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          short_name: author_name.substring(0, 32),
          author_name: author_name,
          author_url: ''
        })
      });

      const accountData = await accountResponse.json();
      
      if (accountData.ok) {
        accessToken = accountData.result.access_token;
      } else {
        throw new Error('Failed to create Telegraph account');
      }
    } catch (accountError) {
      console.error('Telegraph account creation error:', accountError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to create Telegraph account',
          success: false 
        })
      };
    }

    // Convert content to Telegraph format
    const telegraphContent = convertToTelegraphFormat(content);

    // Create the page
    const pageResponse = await fetch('https://api.telegra.ph/createPage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        title: title.substring(0, 256), // Telegraph title limit
        content: telegraphContent,
        author_name: author_name,
        return_content: return_content
      })
    });

    const pageData = await pageResponse.json();

    if (pageData.ok) {
      const pageUrl = `https://telegra.ph/${pageData.result.path}`;
      
      console.log('✅ Successfully published to Telegraph:', pageUrl);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          url: pageUrl,
          path: pageData.result.path,
          title: pageData.result.title,
          views: pageData.result.views || 0
        })
      };
    } else {
      console.error('Telegraph page creation error:', pageData);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: pageData.error || 'Failed to create Telegraph page',
          success: false
        })
      };
    }

  } catch (error) {
    console.error('Telegraph publisher error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
};

function convertToTelegraphFormat(content) {
  // Telegraph expects an array of Node objects
  // For simplicity, we'll convert text content to paragraphs
  
  if (typeof content !== 'string') {
    content = String(content);
  }

  // Split content into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  const telegraphNodes = [];
  
  paragraphs.forEach(paragraph => {
    const trimmedParagraph = paragraph.trim();
    
    if (!trimmedParagraph) return;
    
    // Check if it's a heading (starts with #)
    if (trimmedParagraph.startsWith('#')) {
      const headingLevel = (trimmedParagraph.match(/^#+/) || [''])[0].length;
      const headingText = trimmedParagraph.replace(/^#+\s*/, '');
      
      telegraphNodes.push({
        tag: headingLevel <= 3 ? `h${Math.min(headingLevel, 3)}` : 'h3',
        children: [headingText]
      });
    }
    // Check if it's a list item
    else if (trimmedParagraph.startsWith('- ') || trimmedParagraph.startsWith('* ')) {
      const listText = trimmedParagraph.replace(/^[-*]\s*/, '');
      telegraphNodes.push({
        tag: 'ul',
        children: [
          {
            tag: 'li',
            children: [listText]
          }
        ]
      });
    }
    // Check if it's a numbered list
    else if (/^\d+\.\s/.test(trimmedParagraph)) {
      const listText = trimmedParagraph.replace(/^\d+\.\s*/, '');
      telegraphNodes.push({
        tag: 'ol',
        children: [
          {
            tag: 'li',
            children: [listText]
          }
        ]
      });
    }
    // Regular paragraph
    else {
      // Handle links in the paragraph
      const processedParagraph = processLinksInText(trimmedParagraph);
      telegraphNodes.push({
        tag: 'p',
        children: processedParagraph
      });
    }
  });

  // If no content was processed, add a default paragraph
  if (telegraphNodes.length === 0) {
    telegraphNodes.push({
      tag: 'p',
      children: [content.substring(0, 1000)] // Limit content length
    });
  }

  return telegraphNodes;
}

function processLinksInText(text) {
  // Simple link detection and conversion
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add the link
    parts.push({
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
    parts.push(text.substring(lastIndex));
  }
  
  // If no links were found, return the original text
  return parts.length === 0 ? [text] : parts;
}
