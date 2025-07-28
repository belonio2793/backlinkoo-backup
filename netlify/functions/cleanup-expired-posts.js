/**
 * Netlify Function: Cleanup Expired AI Posts
 * Automatically deletes unclaimed AI posts after 24 hours
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for admin operations
);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('Starting cleanup of expired AI posts...');

    // Delete posts that are past their auto_delete_at time and not claimed
    const { data: deletedPosts, error } = await supabase
      .from('ai_generated_posts')
      .delete()
      .lt('auto_delete_at', new Date().toISOString())
      .eq('is_claimed', false)
      .select('id, slug, keyword');

    if (error) {
      console.error('Cleanup error:', error);
      throw new Error('Failed to cleanup expired posts');
    }

    const deletedCount = deletedPosts?.length || 0;
    console.log(`Cleaned up ${deletedCount} expired AI posts`);

    // Log the cleanup activity
    if (deletedCount > 0) {
      await supabase
        .from('system_logs')
        .insert([{
          event_type: 'ai_post_cleanup',
          message: `Auto-deleted ${deletedCount} expired unclaimed AI posts`,
          metadata: {
            deleted_posts: deletedPosts?.map(p => ({ id: p.id, slug: p.slug, keyword: p.keyword }))
          }
        }]);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        deletedCount,
        message: `Cleaned up ${deletedCount} expired posts`
      })
    };

  } catch (error) {
    console.error('Cleanup function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Cleanup failed',
        details: error.message 
      })
    };
  }
};
