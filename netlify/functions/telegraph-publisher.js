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
        content_preview: content.substring(0, 200),
        target_url: '', // Will be filled by the calling function
        anchor_text: '' // Will be filled by the calling function
      });
    }

    // Emit real-time event for the published URL
    // This will be picked up by the BacklinkNotification component
    console.log('📡 Emitting real-time event for published URL:', pageUrl);

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
    const { createClient } = require('@supabase/supabase-js');

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('⚠️ Supabase not configured, skipping database storage');
      return true;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate a slug from the title
    const slug = articleData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);

    // Insert into published_blog_posts table
    const blogPostData = {
      user_id: articleData.user_id,
      title: articleData.title,
      content: articleData.content_preview || 'Content generated via automation',
      slug: `${slug}-${Date.now()}`, // Make it unique
      excerpt: articleData.content_preview?.substring(0, 200) || '',
      target_url: articleData.target_url || '',
      anchor_text: articleData.anchor_text || '',
      keyword: articleData.keyword || '',
      platform: 'telegraph',
      published_url: articleData.url,
      status: 'published',
      is_trial_post: true,
      validation_status: 'pending',
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('published_blog_posts')
      .insert([blogPostData]);

    if (error) {
      console.error('Failed to store published article:', error);
      return false;
    }

    console.log('✅ Article stored in database successfully');
    return true;
  } catch (error) {
    console.error('Failed to store article data:', error);
    return false;
  }
}
