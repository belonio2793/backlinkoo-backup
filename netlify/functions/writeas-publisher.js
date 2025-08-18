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
    const { title, content, author_name = 'Content Automation', user_id, keyword } = JSON.parse(event.body);

    console.log('📝 Write.as Publishing Request:', {
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

    // Convert HTML content to Write.as markdown format
    console.log('🔄 Converting content to Write.as format...');
    const writeasContent = convertToWriteasFormat(content, title);
    
    console.log('✅ Write.as content conversion complete');
    console.log('Content sample:', writeasContent.substring(0, 200) + '...');

    // Create the post on Write.as
    console.log('📄 Creating Write.as post...');
    
    const postResponse = await fetch('https://write.as/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        body: writeasContent
      })
    });

    const responseData = await postResponse.json();

    console.log('Write.as API Response:', responseData);

    if (!postResponse.ok || responseData.code !== 201) {
      throw new Error(`Failed to create Write.as post: ${responseData.error || responseData.message || 'Unknown error'}`);
    }

    const postData = responseData.data;
    const postUrl = `https://write.as/${postData.id}`;
    
    console.log('✅ Write.as post created successfully:', postUrl);
    console.log('Post details:', {
      id: postData.id,
      slug: postData.slug,
      token: postData.token,
      views: postData.views
    });

    // Store the published article in database for reporting
    if (user_id) {
      await storePublishedArticle({
        title,
        url: postUrl,
        platform: 'writeas',
        user_id,
        keyword,
        content_preview: writeasContent.substring(0, 200),
        post_id: postData.id,
        post_token: postData.token, // Store token for potential future claiming
        target_url: '', // Will be filled by the calling function
        anchor_text: '' // Will be filled by the calling function
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        url: postUrl,
        title: title,
        platform: 'writeas',
        post_id: postData.id,
        post_token: postData.token,
        published_at: postData.created || new Date().toISOString(),
        metadata: {
          slug: postData.slug,
          views: postData.views,
          can_claim: true,
          claim_instructions: 'Use the post_token to claim this post later if needed'
        }
      }),
    };

  } catch (error) {
    console.error('❌ Write.as Publishing Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to publish to Write.as',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
};

// Convert HTML content to Write.as markdown format
function convertToWriteasFormat(htmlContent, title) {
  // Write.as supports markdown, so we'll convert HTML to clean markdown
  let markdown = htmlContent;
  
  // Convert HTML headings to markdown
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1');
  
  // Convert HTML paragraphs to markdown (just remove p tags)
  markdown = markdown.replace(/<p[^>]*>/gi, '');
  markdown = markdown.replace(/<\/p>/gi, '\n\n');
  
  // Convert bold text to markdown
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  
  // Convert italic text to markdown
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  
  // Convert links to markdown
  markdown = markdown.replace(/<a[^>]*href\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  
  // Clean up list items
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1');
  markdown = markdown.replace(/<\/?[uo]l[^>]*>/gi, '');
  
  // Remove any remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, '');
  
  // Clean up multiple newlines
  markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Trim whitespace
  markdown = markdown.trim();
  
  return markdown;
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
      platform: 'writeas',
      published_url: articleData.url,
      status: 'published',
      is_trial_post: true,
      validation_status: 'pending',
      post_metadata: JSON.stringify({
        post_id: articleData.post_id,
        post_token: articleData.post_token,
        can_claim: true
      }),
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
