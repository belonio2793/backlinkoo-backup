/**
 * Netlify Function: Claim AI Post
 * Allows authenticated users to claim AI-generated posts
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    // Get user from auth header
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid authorization' })
      };
    }

    const { postId, slug } = JSON.parse(event.body);

    if (!postId && !slug) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Post ID or slug required' })
      };
    }

    // Find the post
    let query = supabase
      .from('ai_generated_posts')
      .select('*')
      .eq('is_claimed', false)
      .gt('auto_delete_at', new Date().toISOString());

    if (postId) {
      query = query.eq('id', postId);
    } else {
      query = query.eq('slug', slug);
    }

    const { data: post, error: fetchError } = await query.single();

    if (fetchError || !post) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Post not found or already claimed' })
      };
    }

    // Claim the post
    const { data: claimedPost, error: claimError } = await supabase
      .from('ai_generated_posts')
      .update({
        user_id: user.id,
        is_claimed: true,
        claimed_at: new Date().toISOString(),
        auto_delete_at: null // Remove auto-delete when claimed
      })
      .eq('id', post.id)
      .eq('is_claimed', false) // Ensure it's still unclaimed
      .select()
      .single();

    if (claimError) {
      console.error('Claim error:', claimError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to claim post' })
      };
    }

    if (!claimedPost) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Post was already claimed by another user' })
      };
    }

    console.log(`Post ${post.slug} claimed by user ${user.id}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        post: claimedPost,
        message: 'Post claimed successfully'
      })
    };

  } catch (error) {
    console.error('Claim function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Claim failed',
        details: error.message 
      })
    };
  }
};
