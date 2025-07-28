/**
 * Netlify Function: AI Post Auto-Cleanup
 * Automatically expires and cleans up unclaimed AI-generated posts after 24 hours
 * Runs on a schedule via Netlify's scheduled functions
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('Starting AI post cleanup process...');

    // Get current timestamp
    const now = new Date().toISOString();

    // Find posts that have expired (past expires_at time) and are still published
    const { data: expiredPosts, error: findError } = await supabase
      .from('ai_generated_posts')
      .select('id, title, slug, expires_at')
      .eq('status', 'published')
      .lt('expires_at', now);

    if (findError) {
      console.error('Error finding expired posts:', findError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Failed to find expired posts',
          details: findError.message
        })
      };
    }

    if (!expiredPosts || expiredPosts.length === 0) {
      console.log('No expired posts found');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'No expired posts to clean up',
          expiredCount: 0,
          cleanedUp: []
        })
      };
    }

    console.log(`Found ${expiredPosts.length} expired posts to clean up`);

    // Mark expired posts as 'expired' status
    const { data: updatedPosts, error: updateError } = await supabase
      .from('ai_generated_posts')
      .update({ status: 'expired' })
      .eq('status', 'published')
      .lt('expires_at', now)
      .select('id, title, slug');

    if (updateError) {
      console.error('Error updating expired posts:', updateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Failed to update expired posts',
          details: updateError.message
        })
      };
    }

    // Optional: Delete expired posts after a grace period (e.g., 7 days)
    const gracePeriodDate = new Date();
    gracePeriodDate.setDate(gracePeriodDate.getDate() - 7);
    const gracePeriodISO = gracePeriodDate.toISOString();

    const { data: deletedPosts, error: deleteError } = await supabase
      .from('ai_generated_posts')
      .delete()
      .eq('status', 'expired')
      .lt('expires_at', gracePeriodISO)
      .select('id, title, slug');

    if (deleteError) {
      console.error('Error deleting old expired posts:', deleteError);
      // Don't fail the entire operation for deletion errors
    }

    // Prepare response
    const result = {
      success: true,
      message: `Cleanup completed successfully`,
      timestamp: now,
      expiredCount: updatedPosts?.length || 0,
      deletedCount: deletedPosts?.length || 0,
      expiredPosts: updatedPosts?.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug
      })) || [],
      deletedPosts: deletedPosts?.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug
      })) || []
    };

    console.log('Cleanup completed:', result);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Unexpected error in cleanup function:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Export for potential direct invocation
exports.cleanupExpiredPosts = async () => {
  return exports.handler({ httpMethod: 'POST' }, {});
};
