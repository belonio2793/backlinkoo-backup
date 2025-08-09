const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Supabase configuration missing' })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if blog_posts table exists by attempting a simple query
    const { error: checkError } = await supabase
      .from('blog_posts')
      .select('id')
      .limit(1);

    if (checkError && checkError.message?.includes('relation') && checkError.message?.includes('does not exist')) {
      console.log('blog_posts table does not exist, checking published_blog_posts...');
      
      // Check if published_blog_posts table exists
      const { error: publishedCheckError } = await supabase
        .from('published_blog_posts')
        .select('id')
        .limit(1);

      if (publishedCheckError && publishedCheckError.message?.includes('relation') && publishedCheckError.message?.includes('does not exist')) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: false,
            message: 'Blog tables do not exist. Please contact admin to set up database tables.',
            fallbackToLocalStorage: true
          })
        };
      } else {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true,
            message: 'Published blog posts table exists',
            tableUsed: 'published_blog_posts'
          })
        };
      }
    } else {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true,
          message: 'Blog posts table exists',
          tableUsed: 'blog_posts'
        })
      };
    }

  } catch (error) {
    console.error('Error checking blog tables:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        fallbackToLocalStorage: true
      })
    };
  }
};
