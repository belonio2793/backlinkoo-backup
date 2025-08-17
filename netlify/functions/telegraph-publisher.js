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
    console.log('🔄 Converting content to Telegraph format...');
    console.log('Original content sample:', content.substring(0, 200) + '...');

    const telegraphContent = convertMarkdownToTelegraph(content);

    console.log('✅ Telegraph content nodes:', telegraphContent.length);
    console.log('First few nodes:', JSON.stringify(telegraphContent.slice(0, 3), null, 2));

    // Validate Telegraph content structure
    const validationErrors = validateTelegraphContent(telegraphContent);
    if (validationErrors.length > 0) {
      console.warn('⚠️ Telegraph content validation warnings:', validationErrors);
    }

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

// Convert markdown or HTML content to Telegraph DOM format
function convertMarkdownToTelegraph(content) {
  // Check if content is HTML or markdown
  const isHtml = content.includes('<p>') || content.includes('<h') || content.includes('<div>');

  if (isHtml) {
    console.log('🔄 Processing HTML content for Telegraph...');
    return convertHtmlToTelegraph(content);
  } else {
    console.log('🔄 Processing Markdown content for Telegraph...');
    return convertMarkdownToTelegraphNodes(content);
  }
}

// Convert HTML content to Telegraph DOM format
function convertHtmlToTelegraph(html) {
  const telegraphNodes = [];

  // Split by HTML tags and process each element
  const htmlRegex = /<(\w+)(?:\s[^>]*)?>([^<]*(?:<(?!\/?(?:p|h[1-6]|div|ul|ol|li)\b)[^<]*)*?)<\/\1>|([^<]+)/gi;
  let match;

  while ((match = htmlRegex.exec(html)) !== null) {
    const tag = match[1];
    const content = match[2] || match[3];

    if (!content || !content.trim()) continue;

    if (tag) {
      // Handle HTML tags
      let telegraphTag = 'p'; // default

      if (tag.match(/^h[1-6]$/)) {
        const level = parseInt(tag.charAt(1));
        telegraphTag = level <= 2 ? 'h3' : 'h4'; // Telegraph supports h3 and h4
      } else if (tag === 'p') {
        telegraphTag = 'p';
      }

      const processedContent = processTextFormatting(content.trim());
      telegraphNodes.push({
        tag: telegraphTag,
        children: processedContent
      });
    } else if (content.trim()) {
      // Plain text content
      const processedContent = processTextFormatting(content.trim());
      telegraphNodes.push({
        tag: 'p',
        children: processedContent
      });
    }
  }

  // Fallback: if no nodes were created, split by double newlines and process as paragraphs
  if (telegraphNodes.length === 0) {
    const paragraphs = html.split(/\n\s*\n/).filter(p => p.trim());
    for (const paragraph of paragraphs) {
      const cleanParagraph = paragraph.replace(/<[^>]*>/g, '').trim();
      if (cleanParagraph) {
        const processedContent = processTextFormatting(cleanParagraph);
        telegraphNodes.push({
          tag: 'p',
          children: processedContent
        });
      }
    }
  }

  return telegraphNodes;
}

// Convert markdown content to Telegraph DOM format (original function)
function convertMarkdownToTelegraphNodes(markdown) {
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

// Process text formatting including bold, italic, and links for Telegraph
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

// Parse text with mixed formatting (bold, italic, links)
function parseFormattedText(text) {
  const segments = [];
  let currentIndex = 0;

  // Enhanced regex for all formatting types with better HTML support
  const formatRegex = /(<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^<]+)<\/a>|<strong>([^<]+)<\/strong>|<b>([^<]+)<\/b>|\*\*([^*]+)\*\*|<i>([^<]+)<\/i>|<em>([^<]+)<\/em>|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\))/gi;
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
    if (match[0].startsWith('<a')) {
      // HTML link
      const url = match[2];
      const content = match[3];
      segments.push({ type: 'link', content, url });
    } else if (match[0].startsWith('<strong>') || match[0].startsWith('<b>')) {
      // HTML bold
      const content = match[4] || match[5];
      segments.push({ type: 'bold', content });
    } else if (match[0].startsWith('**')) {
      // Markdown bold
      const content = match[6];
      segments.push({ type: 'bold', content });
    } else if (match[0].startsWith('<i>') || match[0].startsWith('<em>')) {
      // HTML italic
      const content = match[7] || match[8];
      segments.push({ type: 'italic', content });
    } else if (match[0].startsWith('*')) {
      // Markdown italic
      const content = match[9];
      segments.push({ type: 'italic', content });
    } else if (match[0].startsWith('[')) {
      // Markdown link
      const content = match[10];
      const url = match[11];
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

// Process markdown links and convert them to Telegraph format (legacy function for backward compatibility)
function processLinksInText(text) {
  return processTextFormatting(text);
}

// Validate Telegraph content structure
function validateTelegraphContent(content) {
  const errors = [];

  if (!Array.isArray(content)) {
    errors.push('Content must be an array of nodes');
    return errors;
  }

  if (content.length === 0) {
    errors.push('Content array is empty');
    return errors;
  }

  content.forEach((node, index) => {
    if (!node.tag) {
      errors.push(`Node ${index} missing 'tag' property`);
    }

    if (!node.children) {
      errors.push(`Node ${index} missing 'children' property`);
    } else if (!Array.isArray(node.children)) {
      errors.push(`Node ${index} 'children' must be an array`);
    }

    // Check for valid Telegraph tags
    const validTags = ['p', 'h3', 'h4', 'b', 'i', 'strong', 'em', 'a', 'br'];
    if (node.tag && !validTags.includes(node.tag)) {
      errors.push(`Node ${index} uses unsupported tag '${node.tag}'`);
    }
  });

  return errors;
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
