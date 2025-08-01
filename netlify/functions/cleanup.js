const { createClient } = require('@supabase/supabase-js');

export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Delete expired posts where user_id is null (unclaimed)
    const { data, error } = await supabase
      .from('blog_posts')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .is('user_id', null);

    if (error) {
      console.error('❌ Cleanup failed:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Cleanup failed',
          details: error.message 
        }),
      };
    }

    const deletedCount = data?.length || 0;
    console.log(`✅ Cleanup completed: ${deletedCount} expired posts deleted`);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        deleted: deletedCount,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Cleanup failed',
        details: error.message 
      }),
    };
  }
};

// Schedule: daily at midnight UTC
export const config = {
  schedule: '0 0 * * *',
};
