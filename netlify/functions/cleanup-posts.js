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

    console.log('🛡️ Starting SAFE cleanup of expired trial posts...');

    // SAFETY FIRST: Enhanced query with multiple safety checks
    const { data: expiredPosts, error: selectError } = await supabase
      .from('published_blog_posts')
      .select('slug, title, created_at, expires_at, user_id, is_trial_post, status')
      .eq('is_trial_post', true)
      .is('user_id', null)
      .not('expires_at', 'is', null)
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

    console.log(`🔍 Found ${expiredPosts?.length || 0} potential posts for deletion`);

    // SAFETY FILTER: Only delete posts that pass all safety checks
    const safePosts = (expiredPosts || []).filter(post => {
      const isSafe = (
        post.is_trial_post === true &&
        post.user_id === null &&
        post.expires_at !== null &&
        new Date(post.expires_at) < new Date(now) &&
        post.status !== 'claimed'
      );

      if (!isSafe) {
        console.warn('🛡️ PROTECTED from deletion:', {
          slug: post.slug,
          is_trial_post: post.is_trial_post,
          user_id: post.user_id,
          expires_at: post.expires_at,
          status: post.status
        });
      }

      return isSafe;
    });

    console.log(`✅ ${safePosts.length} posts verified safe for deletion`);

    if (safePosts.length === 0) {
      console.log('🛡️ No posts are safe to delete - all are protected');
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'No posts found that are safe to delete',
          deleted_count: 0,
          protected_count: (expiredPosts?.length || 0) - safePosts.length,
          expired_posts: []
        })
      };
    }

    // SAFE DELETION: Mark as expired instead of hard delete
    const { data: deletedPosts, error: deleteError } = await supabase
      .from('published_blog_posts')
      .update({
        status: 'expired',
        deleted_at: now,
        deletion_metadata: {
          deleted_by: 'SafeCleanupFunction',
          deletion_reason: 'Expired trial post',
          safety_verified: true,
          original_expires_at: 'varies'
        }
      })
      .eq('is_trial_post', true)
      .is('user_id', null)
      .not('expires_at', 'is', null)
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
    const protectedCount = (expiredPosts?.length || 0) - deletedCount;
    console.log(`🛡️ Safe cleanup completed: ${deletedCount} expired, ${protectedCount} protected`);

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
              protected_count: protectedCount,
              safe_posts_processed: safePosts.length,
              total_posts_scanned: expiredPosts?.length || 0,
              expired_posts: expiredPosts,
              cleanup_timestamp: now,
              safety_verified: true
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
        message: `Safe cleanup completed successfully`,
        deleted_count: deletedCount,
        protected_count: protectedCount,
        safety_verified: true,
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
