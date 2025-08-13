/**
 * Netlify Function for Article Publishing
 * Handles posting to approved target websites and returns postback URLs
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight request
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
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const requestBody = JSON.parse(event.body);
    const { 
      title, 
      content, 
      campaign_id, 
      target_site = 'telegraph',
      user_id,
      author_name = 'SEO Content Bot'
    } = requestBody;

    // Validate required fields
    if (!title || !content || !campaign_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: title, content, campaign_id' 
        }),
      };
    }

    console.log('📰 Article Publishing Request:', {
      campaign_id,
      target_site,
      title: title.substring(0, 50),
      content_length: content.length,
      user_id
    });

    let publishResult;

    // Route to appropriate publishing service based on target_site
    switch (target_site.toLowerCase()) {
      case 'telegraph':
      case 'telegra.ph':
        publishResult = await publishToTelegraph(title, content, author_name);
        break;
      default:
        throw new Error(`Unsupported target site: ${target_site}`);
    }

    if (!publishResult.success) {
      throw new Error(publishResult.error || 'Publishing failed');
    }

    // Save submission to database
    const submissionData = {
      campaign_id,
      target_site_id: target_site.toLowerCase(),
      article_title: title,
      article_content: content,
      article_url: publishResult.url,
      status: 'published',
      published_date: new Date().toISOString(),
      backlink_url: publishResult.backlink_url,
      anchor_text: publishResult.anchor_text,
      notes: `Published via Netlify function to ${target_site}`,
      metadata: {
        ...publishResult.metadata,
        target_site,
        published_via: 'netlify_function',
        author_name
      }
    };

    console.log('💾 Saving submission to database:', {
      campaign_id,
      article_url: publishResult.url,
      target_site
    });

    const { data: submission, error: submissionError } = await supabase
      .from('article_submissions')
      .insert(submissionData)
      .select()
      .single();

    if (submissionError) {
      console.error('Database save error:', submissionError);
      // Continue anyway - we still published successfully
    }

    // Log successful publication
    if (user_id) {
      try {
        await supabase
          .from('automation_logs')
          .insert({
            timestamp: new Date().toISOString(),
            level: 'info',
            category: 'article_submission',
            message: `Article published successfully to ${target_site}`,
            data: JSON.stringify({
              campaign_id,
              article_url: publishResult.url,
              target_site,
              title: title.substring(0, 100)
            }),
            campaign_id,
            user_id,
            session_id: `netlify_${Date.now()}`,
            environment: 'production'
          });
      } catch (logError) {
        console.warn('Failed to log to database:', logError.message);
      }
    }

    console.log('✅ Article published successfully:', {
      campaign_id,
      url: publishResult.url,
      target_site
    });

    // Return successful response with postback URL
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          url: publishResult.url,
          title: title,
          target_site,
          published_date: new Date().toISOString(),
          submission_id: submission?.id,
          metadata: publishResult.metadata
        }
      }),
    };

  } catch (error) {
    console.error('❌ Article publishing error:', error);
    
    // Log error to database if possible
    try {
      const requestBody = JSON.parse(event.body);
      if (requestBody.user_id) {
        await supabase
          .from('automation_logs')
          .insert({
            timestamp: new Date().toISOString(),
            level: 'error',
            category: 'article_submission',
            message: 'Article publishing failed in Netlify function',
            data: JSON.stringify({
              error: error.message,
              campaign_id: requestBody.campaign_id,
              target_site: requestBody.target_site
            }),
            campaign_id: requestBody.campaign_id,
            user_id: requestBody.user_id,
            error_stack: error.stack,
            session_id: `netlify_${Date.now()}`,
            environment: 'production'
          });
      }
    } catch (logError) {
      console.warn('Failed to log error to database:', logError.message);
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Article publishing failed'
      }),
    };
  }
};

/**
 * Publish article to Telegraph
 */
async function publishToTelegraph(title, content, authorName) {
  try {
    // Create Telegraph account first
    console.log('📝 Creating Telegraph account...');
    
    const accountResponse = await fetch('https://api.telegra.ph/createAccount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        short_name: 'AutoSEO',
        author_name: authorName,
        author_url: 'https://autoseo.app'
      }),
    });

    if (!accountResponse.ok) {
      throw new Error(`Telegraph account creation failed: ${accountResponse.status}`);
    }

    const accountData = await accountResponse.json();
    
    if (!accountData.ok) {
      throw new Error(`Telegraph account error: ${accountData.error || 'Unknown error'}`);
    }

    const accessToken = accountData.result.access_token;
    console.log('✅ Telegraph account created successfully');

    // Convert markdown content to Telegraph format
    const telegraphContent = convertMarkdownToTelegraph(content);

    // Create the page
    console.log('📄 Creating Telegraph page...');
    
    const pageResponse = await fetch('https://api.telegra.ph/createPage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        title: title,
        author_name: authorName,
        content: telegraphContent,
        return_content: true
      }),
    });

    if (!pageResponse.ok) {
      throw new Error(`Telegraph page creation failed: ${pageResponse.status}`);
    }

    const pageData = await pageResponse.json();

    if (!pageData.ok) {
      throw new Error(`Telegraph page error: ${pageData.error || 'Unknown error'}`);
    }

    const result = pageData.result;
    const telegraphUrl = `https://telegra.ph/${result.path}`;

    // Extract backlink info from content
    const linkMatch = content.match(/\[([^\]]+)\]\(([^)]+)\)/);
    const backlink_url = linkMatch ? linkMatch[2] : null;
    const anchor_text = linkMatch ? linkMatch[1] : null;

    console.log('✅ Telegraph page created:', telegraphUrl);

    return {
      success: true,
      url: telegraphUrl,
      backlink_url,
      anchor_text,
      metadata: {
        telegraph_path: result.path,
        author_name: result.author_name,
        can_edit: result.can_edit,
        views: result.views || 0
      }
    };

  } catch (error) {
    console.error('Telegraph publishing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Convert markdown to Telegraph DOM format
 */
function convertMarkdownToTelegraph(markdown) {
  const lines = markdown.split('\n').filter(line => line.trim());
  const telegraphContent = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) continue;

    // Headers
    if (trimmedLine.startsWith('##')) {
      telegraphContent.push({
        tag: 'h3',
        children: [parseInlineMarkdown(trimmedLine.replace(/^#+\s*/, ''))]
      });
    } else if (trimmedLine.startsWith('#')) {
      telegraphContent.push({
        tag: 'h3',
        children: [parseInlineMarkdown(trimmedLine.replace(/^#+\s*/, ''))]
      });
    }
    // Lists
    else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      telegraphContent.push({
        tag: 'p',
        children: ['• ' + parseInlineMarkdown(trimmedLine.replace(/^[-*]\s*/, ''))]
      });
    }
    // Regular paragraphs
    else {
      const parsedContent = parseInlineMarkdown(trimmedLine);
      telegraphContent.push({
        tag: 'p',
        children: Array.isArray(parsedContent) ? parsedContent : [parsedContent]
      });
    }
  }

  return telegraphContent;
}

/**
 * Parse inline markdown (links, bold, etc.)
 */
function parseInlineMarkdown(text) {
  // Handle links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  if (linkRegex.test(text)) {
    const parts = [];
    let lastIndex = 0;
    
    text.replace(linkRegex, (match, linkText, url, index) => {
      // Add text before link
      if (index > lastIndex) {
        const beforeText = text.substring(lastIndex, index);
        if (beforeText) {
          parts.push(parseTextFormatting(beforeText));
        }
      }
      
      // Add link
      parts.push({
        tag: 'a',
        attrs: { href: url },
        children: [linkText]
      });
      
      lastIndex = index + match.length;
      return match;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        parts.push(parseTextFormatting(remainingText));
      }
    }
    
    return parts.length === 1 ? parts[0] : parts;
  }
  
  return parseTextFormatting(text);
}

/**
 * Parse text formatting (bold, italic)
 */
function parseTextFormatting(text) {
  // Handle bold **text**
  if (text.includes('**')) {
    const parts = [];
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    
    text.replace(boldRegex, (match, boldText, index) => {
      // Add text before bold
      if (index > lastIndex) {
        parts.push(text.substring(lastIndex, index));
      }
      
      // Add bold text
      parts.push({
        tag: 'strong',
        children: [boldText]
      });
      
      lastIndex = index + match.length;
      return match;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length === 1 ? parts[0] : parts;
  }
  
  return text;
}
