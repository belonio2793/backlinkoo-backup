const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing Supabase credentials' })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const results = {};

    // Check specific problematic slugs
    const slugs = [
      'h1-unleashing-the-power-of-faceook-the-ultimate-guide-to-dominating-social-media-medqxdg8',
      'unlocking-the-secrets-of-google-rankings-your-ultimate-guide-to-seo-success-meds4cls'
    ];
    
    results.specificPosts = {};
    
    for (const slug of slugs) {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, title, slug, content, status, created_at')
          .eq('slug', slug)
          .single();
        
        if (error) {
          results.specificPosts[slug] = {
            found: false,
            error: error.message,
            code: error.code
          };
        } else {
          results.specificPosts[slug] = {
            found: true,
            id: data.id,
            title: data.title,
            status: data.status,
            created_at: data.created_at,
            contentLength: data.content?.length || 0,
            isEmpty: !data.content || data.content.trim().length === 0,
            contentPreview: data.content?.substring(0, 200) || 'NO CONTENT',
            hasHTML: data.content?.includes('<') || false,
            hasMarkdown: (data.content?.includes('#') || data.content?.includes('**')) || false
          };
        }
      } catch (err) {
        results.specificPosts[slug] = {
          found: false,
          error: err.message
        };
      }
    }

    // Check recent posts for empty content pattern
    try {
      const { data: recentPosts, error: recentError } = await supabase
        .from('blog_posts')
        .select('id, title, slug, content, status, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (recentError) {
        results.recentPosts = { error: recentError.message };
      } else {
        results.recentPosts = {
          total: recentPosts.length,
          posts: recentPosts.map(post => ({
            slug: post.slug,
            title: post.title,
            status: post.status,
            contentLength: post.content?.length || 0,
            isEmpty: !post.content || post.content.trim().length === 0,
            created_at: post.created_at
          })),
          emptyCount: recentPosts.filter(post => !post.content || post.content.trim().length === 0).length
        };
      }
    } catch (err) {
      results.recentPosts = { error: err.message };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(results, null, 2)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to check blog content',
        details: error.message 
      })
    };
  }
};
