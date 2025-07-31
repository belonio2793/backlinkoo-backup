/**
 * Netlify Function - Cleanup Expired Blog Posts
 * Runs every hour to delete unclaimed posts older than 24 hours
 * Called by Netlify scheduled functions or cron job
 */

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  console.log('🧹 Starting cleanup of expired blog posts...');

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call the cleanup function
    const { data, error } = await supabase
      .rpc('cleanup_expired_posts');

    if (error) {
      console.error('❌ Error during cleanup:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      };
    }

    const deletedCount = data || 0;
    console.log(`✅ Cleanup completed: ${deletedCount} expired posts deleted`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        deletedCount,
        message: `Cleanup completed: ${deletedCount} expired posts deleted`,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
