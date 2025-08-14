export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
    };
  }

  try {
    const { title, content, author_name = 'Content Automation', author_url = '', user_id, keyword } = JSON.parse(event.body);

    console.log('📡 Telegraph Publishing Request:', {
      title: title?.substring(0, 50) + '...',
      contentLength: content?.length,
      author_name,
      user_id,
      keyword
    });

    if (!title || !content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: title, content'
        }),
      };
    }

    // Convert markdown content to Telegraph format
    const telegraphContent = convertMarkdownToTelegraph(content);

    // Create Telegraph account if needed (using a simple approach)
    let accessToken = process.env.TELEGRAPH_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.log('🔑 Creating Telegraph account...');
      
      const accountResponse = await fetch('https://api.telegra.ph/createAccount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          short_name: 'AutomationBot',
          author_name: author_name || 'Content Automation',
          author_url: author_url || ''
        })
      });

      const accountData = await accountResponse.json();
      
      if (!accountData.ok) {
        throw new Error(`Failed to create Telegraph account: ${accountData.error}`);
      }
      
      accessToken = accountData.result.access_token;
      console.log('✅ Telegraph account created');
    }

    // Create the page on Telegraph
    console.log('📄 Creating Telegraph page...');
    
    const pageResponse = await fetch('https://api.telegra.ph/createPage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        title: title,
        author_name: author_name || 'Content Automation',
        author_url: author_url || '',
        content: telegraphContent,
        return_content: false
      })
    });

    const pageData = await pageResponse.json();

    if (!pageData.ok) {
      throw new Error(`Failed to create Telegraph page: ${pageData.error || 'Unknown error'}`);
    }

    const pageUrl = pageData.result.url;
    
    console.log('✅ Telegraph page created successfully:', pageUrl);

    // Store the published article in database for reporting
    if (user_id) {
      await storePublishedArticle({
        title,
        url: pageUrl,
        platform: 'Telegraph',
        user_id,
        keyword,
        content_preview: content.substring(0, 200)
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        url: pageUrl,
        title: title,
        platform: 'Telegraph',
        published_at: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('❌ Telegraph Publishing Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to publish to Telegraph',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
};

// Convert markdown content to Telegraph DOM format
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
      telegraphNodes.push({
        tag: 'h3',
        children: [trimmed.substring(2)]
      });
    } else if (trimmed.startsWith('## ')) {
      telegraphNodes.push({
        tag: 'h4',
        children: [trimmed.substring(3)]
      });
    }
    // Handle paragraphs with links
    else {
      const processedText = processLinksInText(trimmed);
      telegraphNodes.push({
        tag: 'p',
        children: processedText
      });
    }
  }
  
  return telegraphNodes;
}

// Process markdown links and convert them to Telegraph format
function processLinksInText(text) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const result = [];
  let lastIndex = 0;
  let match;
  
  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
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

// Store published article in database for reporting
async function storePublishedArticle(articleData) {
  try {
    // This would integrate with your Supabase database
    // For now, we'll just log it
    console.log('📊 Article data for database:', articleData);
    
    // In a real implementation, you would:
    // 1. Initialize Supabase client
    // 2. Insert into article_submissions table
    // 3. Update campaign statistics
    
    return true;
  } catch (error) {
    console.error('Failed to store article data:', error);
    return false;
  }
}
