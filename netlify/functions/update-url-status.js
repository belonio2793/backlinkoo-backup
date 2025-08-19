// Update URL Status Function - Updates database with validation results
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { validationResults } = JSON.parse(event.body || '{}');

    if (!validationResults || !Array.isArray(validationResults)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Validation results array is required' }),
      };
    }

    const updatePromises = validationResults.map(async (result) => {
      try {
        // Map validation status to database status
        let dbStatus = 'pending';
        if (result.status === 'working' && result.http_status >= 200 && result.http_status < 300) {
          dbStatus = 'working';
        } else if (result.status === 'broken' || result.status === 'invalid') {
          dbStatus = 'broken';
        }

        // Update the discovered_urls table
        const { data, error } = await supabase
          .from('discovered_urls')
          .update({
            status: dbStatus,
            last_verified: new Date().toISOString(),
            verification_attempts: supabase.raw('verification_attempts + 1'),
            // Update success rate based on validation result
            success_rate: result.status === 'working' ? 100.00 : 0.00,
            // Reset consecutive failures if working
            consecutive_failures: result.status === 'working' ? 0 : supabase.raw('consecutive_failures + 1')
          })
          .eq('id', result.id)
          .select();

        if (error) {
          console.error(`Error updating URL ${result.id}:`, error);
          return { id: result.id, success: false, error: error.message };
        }

        return { id: result.id, success: true, data };
      } catch (error) {
        console.error(`Error processing URL ${result.id}:`, error);
        return { id: result.id, success: false, error: error.message };
      }
    });

    const results = await Promise.allSettled(updatePromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    // Also log the validation session for analytics
    try {
      await supabase
        .from('url_discovery_sessions')
        .insert([{
          session_type: 'validation',
          urls_processed: validationResults.length,
          urls_successful: successful,
          urls_failed: failed,
          session_data: { validation_results: validationResults },
          created_at: new Date().toISOString()
        }]);
    } catch (logError) {
      console.error('Error logging validation session:', logError);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        processed: validationResults.length,
        successful: successful,
        failed: failed,
        message: `Updated ${successful} URLs successfully, ${failed} failed`
      }),
    };

  } catch (error) {
    console.error('Update URL status error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to update URL status'
      }),
    };
  }
};
