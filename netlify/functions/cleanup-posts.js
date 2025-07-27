const { createClient } = require('@supabase/supabase-js');

// Validate required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

exports.handler = async (event, context) => {
  // This is a scheduled function, but allow manual triggers too
  if (event.httpMethod && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check if Supabase is configured
  if (!supabase) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Server configuration error: Database not available for cleanup.'
      })
    };
  }

  try {
    const now = new Date().toISOString();
    
    console.log('Starting cleanup of expired trial posts...');
    
    // First, get the posts that will be deleted for logging
    const { data: expiredPosts, error: selectError } = await supabase
      .from('published_blog_posts')
      .select('slug, title, created_at, expires_at')
      .eq('is_trial_post', true)
      .is('user_id', null)
      .lt('expires_at', now);

    if (selectError) {
      console.error('Error fetching expired posts:', selectError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Failed to fetch expired posts' })
      };
    }

    console.log(`Found ${expiredPosts?.length || 0} expired posts to delete`);

    // Delete expired trial posts
    const { data: deletedPosts, error: deleteError } = await supabase
      .from('published_blog_posts')
      .delete()
      .eq('is_trial_post', true)
      .is('user_id', null)
      .lt('expires_at', now)
      .select('slug, title');

    if (deleteError) {
      console.error('Error deleting expired posts:', deleteError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Failed to delete expired posts' })
      };
    }

    const deletedCount = deletedPosts?.length || 0;
    console.log(`Successfully deleted ${deletedCount} expired trial posts`);

    // Log the cleanup operation
    if (deletedCount > 0) {
      try {
        await supabase
          .from('security_audit_log')
          .insert({
            action: 'cleanup_expired_posts',
            resource: 'published_blog_posts',
            details: {
              deleted_count: deletedCount,
              expired_posts: expiredPosts,
              cleanup_timestamp: now
            }
          });
      } catch (auditError) {
        console.warn('Failed to log cleanup operation:', auditError);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        message: `Cleanup completed successfully`,
        deleted_count: deletedCount,
        expired_posts: expiredPosts
      })
    };

  } catch (error) {
    console.error('Cleanup function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error during cleanup' })
    };
  }
};
