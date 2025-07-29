/**
 * Unified Blog Cleanup Function
 * Replaces multiple scattered cleanup functions with a single efficient one
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('🧹 Starting unified blog cleanup...');

    // Call the database cleanup function
    const { data, error } = await supabase.rpc('cleanup_expired_blog_drafts');

    if (error) {
      console.error('❌ Database cleanup error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: error.message
        })
      };
    }

    const deletedCount = data || 0;
    
    console.log(`✅ Cleanup completed: ${deletedCount} expired drafts deleted`);

    // Also cleanup any orphaned localStorage references
    // This is a no-op for server-side, but documents the intent
    const cleanupStats = {
      expiredDrafts: deletedCount,
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Cleanup completed successfully`,
        stats: cleanupStats
      })
    };

  } catch (error) {
    console.error('❌ Cleanup function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      })
    };
  }
}

// Health check endpoint
export async function healthCheck() {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('count(*)', { count: 'exact' })
      .eq('status', 'draft');

    if (error) throw error;

    return {
      status: 'healthy',
      draftsCount: data?.[0]?.count || 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
