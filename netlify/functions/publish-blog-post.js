/**
 * Netlify Function: Publish Blog Post
 * Saves generated content and creates blog post with auto-delete timer
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { 
      content, 
      slug, 
      keyword, 
      anchorText, 
      url, 
      provider, 
      promptIndex 
    } = JSON.parse(event.body);

    if (!content || !slug || !keyword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    const now = new Date();
    const autoDeleteAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Create blog post record
    const blogPost = {
      slug,
      title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Complete Guide`,
      content,
      keyword,
      anchor_text: anchorText,
      target_url: url,
      ai_provider: provider,
      prompt_index: promptIndex,
      word_count: content.split(/\s+/).length,
      status: 'published',
      auto_delete_at: autoDeleteAt.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      is_claimed: false,
      user_id: null // Will be set when user claims the post
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('ai_generated_posts')
      .insert([blogPost])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to save blog post');
    }

    const publishedUrl = `${event.headers.origin || 'https://app.backlinkoo.com'}/blog/${slug}`;

    console.log(`Blog post published: ${publishedUrl}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        url: publishedUrl,
        slug,
        autoDeleteAt: autoDeleteAt.toISOString(),
        postId: data.id
      })
    };

  } catch (error) {
    console.error('Publishing error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Publishing failed',
        details: error.message 
      })
    };
  }
};
