/**
 * Test Telegraph Platform
 * API endpoint for testing Telegraph.ph publishing capability
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
    const { title, content, testMode = false } = JSON.parse(event.body);

    if (!title || !content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: title, content' 
        }),
      };
    }

    console.log(`🧪 Testing Telegraph platform (Test Mode: ${testMode})`);
    console.log(`Title: ${title}`);
    console.log(`Content length: ${content.length}`);

    const fetch = require('node-fetch');

    // Step 1: Create Telegraph account
    const accountResponse = await fetch('https://api.telegra.ph/createAccount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        short_name: testMode ? 'PlatformTest' : 'LinkBuilder',
        author_name: testMode ? 'Platform Tester' : 'Professional Content',
        author_url: ''
      })
    });

    const accountData = await accountResponse.json();
    if (!accountData.ok) {
      throw new Error(`Telegraph account creation failed: ${accountData.error}`);
    }

    const accessToken = accountData.result.access_token;
    console.log('✅ Telegraph account created successfully');

    // Step 2: Convert content to Telegraph format
    const telegraphContent = convertToTelegraphFormat(content);
    console.log(`✅ Content converted to Telegraph format (${telegraphContent.length} nodes)`);

    // Step 3: Create Telegraph page
    const pageResponse = await fetch('https://api.telegra.ph/createPage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: accessToken,
        title: title,
        author_name: testMode ? 'Platform Tester' : 'Professional Content',
        content: telegraphContent,
        return_content: false
      })
    });

    const pageData = await pageResponse.json();
    if (!pageData.ok) {
      throw new Error(`Telegraph page creation failed: ${pageData.error}`);
    }

    const publishedUrl = pageData.result.url;
    console.log(`✅ Telegraph page created: ${publishedUrl}`);

    // Step 4: Verify the URL is accessible
    const verifyResponse = await fetch(publishedUrl, { method: 'HEAD' });
    
    if (!verifyResponse.ok) {
      throw new Error(`Published URL not accessible: HTTP ${verifyResponse.status}`);
    }

    console.log('✅ Telegraph URL verification passed');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        url: publishedUrl,
        platform: 'Telegraph.ph',
        statusCode: verifyResponse.status,
        message: testMode ? 'Telegraph test successful' : 'Published successfully to Telegraph',
        testMode
      }),
    };

  } catch (error) {
    console.error('❌ Telegraph test failed:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Telegraph test failed',
        platform: 'Telegraph.ph'
      }),
    };
  }
};

/**
 * Convert content to Telegraph DOM format
 */
function convertToTelegraphFormat(content) {
  const telegraphNodes = [];
  
  // Split content into paragraphs and headings
  const lines = content.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('# ')) {
      // H1 heading
      telegraphNodes.push({
        tag: 'h3',
        children: [trimmedLine.substring(2)]
      });
    } else if (trimmedLine.startsWith('## ')) {
      // H2 heading
      telegraphNodes.push({
        tag: 'h4',
        children: [trimmedLine.substring(3)]
      });
    } else if (trimmedLine.startsWith('- ')) {
      // List item
      telegraphNodes.push({
        tag: 'p',
        children: [`• ${trimmedLine.substring(2)}`]
      });
    } else if (trimmedLine) {
      // Regular paragraph - handle links
      if (trimmedLine.includes('[') && trimmedLine.includes('](')) {
        // Parse markdown links
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const children = [];
        let lastIndex = 0;
        let match;
        
        while ((match = linkRegex.exec(trimmedLine)) !== null) {
          // Add text before the link
          if (match.index > lastIndex) {
            children.push(trimmedLine.substring(lastIndex, match.index));
          }
          
          // Add the link
          children.push({
            tag: 'a',
            attrs: { href: match[2] },
            children: [match[1]]
          });
          
          lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text
        if (lastIndex < trimmedLine.length) {
          children.push(trimmedLine.substring(lastIndex));
        }
        
        telegraphNodes.push({
          tag: 'p',
          children: children
        });
      } else {
        // Simple paragraph
        telegraphNodes.push({
          tag: 'p',
          children: [trimmedLine]
        });
      }
    }
  }
  
  return telegraphNodes;
}
