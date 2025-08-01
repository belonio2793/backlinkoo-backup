const { createClient } = require('@supabase/supabase-js');

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

  try {
    // Initialize Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🧹 Starting cleanup of expired unclaimed posts...');

    // Delete expired posts where user_id is null (unclaimed trial posts)
    const { data, error } = await supabase
      .from('blog_posts')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .is('user_id', null);

    if (error) {
      console.error('❌ Cleanup failed:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Cleanup failed',
          details: error.message 
        }),
      };
    }

    const deletedCount = data?.length || 0;
    console.log(`✅ Cleanup completed: ${deletedCount} expired posts deleted`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        deleted: deletedCount,
        message: `Successfully cleaned up ${deletedCount} expired unclaimed posts`,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        details: error.message 
      }),
    };
  }
};
