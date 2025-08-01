const { createClient } = require('@supabase/supabase-js');

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Initialize Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Not logged in' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid authentication' })
      };
    }

    // Parse request body
    const { slug } = JSON.parse(event.body || '{}');
    if (!slug) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Slug is required' })
      };
    }

    // Check if post exists and is available for claiming
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (postError || !post) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Post not found' })
      };
    }

    if (post.user_id) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Post already claimed' })
      };
    }

    // Check user's current claim count
    const { data: claimedPosts, error: countError } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    if (countError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to check claim limit' })
      };
    }

    const claimCount = claimedPosts?.length || 0;
    if (claimCount >= 3) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Claim limit reached (3 posts maximum)' })
      };
    }

    // Claim the post
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        user_id: user.id,
        is_trial_post: false,
        expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', post.id);

    if (updateError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to claim post' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Blog post claimed successfully!',
        claimedPosts: claimCount + 1
      })
    };

  } catch (error) {
    console.error('Claim API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
