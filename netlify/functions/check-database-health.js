const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    const healthStatus = {
      tables: {},
      permissions: {},
      timestamp: new Date().toISOString()
    };

    // Test profiles table access
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        healthStatus.tables.profiles = false;
        healthStatus.permissions.profiles = error.message;
      } else {
        healthStatus.tables.profiles = true;
        healthStatus.permissions.profiles = 'accessible';
      }
    } catch (error) {
      healthStatus.tables.profiles = false;
      healthStatus.permissions.profiles = error.message;
    }

    // Test blog_posts table access
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        healthStatus.tables.blog_posts = false;
        healthStatus.permissions.blog_posts = error.message;
      } else {
        healthStatus.tables.blog_posts = true;
        healthStatus.permissions.blog_posts = 'accessible';
      }
    } catch (error) {
      healthStatus.tables.blog_posts = false;
      healthStatus.permissions.blog_posts = error.message;
    }

    // Generate recommendations
    const recommendations = [];
    
    if (!healthStatus.tables.profiles) {
      recommendations.push('Profiles table access issue detected. Consider using fallback mode.');
    }
    
    if (!healthStatus.tables.blog_posts) {
      recommendations.push('Blog posts table access issue detected. May need database setup.');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        health: healthStatus,
        recommendations,
        fallbackMode: !healthStatus.tables.profiles
      })
    };

  } catch (error) {
    console.error('Database health check error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Health check failed',
        details: error.message,
        fallbackMode: true
      })
    };
  }
};
