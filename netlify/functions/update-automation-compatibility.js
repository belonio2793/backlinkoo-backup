// Update Automation Compatibility Function
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
    const { testResults } = JSON.parse(event.body || '{}');

    if (!testResults || !Array.isArray(testResults)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Test results array is required' }),
      };
    }

    const updatePromises = testResults.map(async (result) => {
      try {
        // Map compatibility data to database fields
        const dbStatus = result.automation_ready ? 'verified' : result.compatibility_score >= 50 ? 'pending' : 'broken';
        
        // Update the discovered_urls table with automation compatibility data
        const { data, error } = await supabase
          .from('discovered_urls')
          .update({
            status: dbStatus,
            last_verified: new Date().toISOString(),
            verification_attempts: supabase.raw('verification_attempts + 1'),
            success_rate: result.compatibility_score,
            posting_method: result.publishing_method || 'form_submission',
            
            // Automation-specific fields (if they exist in schema)
            // Note: These might need to be added to the schema
            auto_clean_score: 100 - result.compatibility_score, // Lower score = less likely to be cleaned
            consecutive_failures: result.automation_ready ? 0 : supabase.raw('consecutive_failures + 1')
          })
          .eq('id', result.id)
          .select();

        if (error) {
          console.error(`Error updating URL ${result.id}:`, error);
          return { id: result.id, success: false, error: error.message };
        }

        // Also log the automation test result for analytics
        await logAutomationTest(result);

        return { id: result.id, success: true, data };
      } catch (error) {
        console.error(`Error processing URL ${result.id}:`, error);
        return { id: result.id, success: false, error: error.message };
      }
    });

    const results = await Promise.allSettled(updatePromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;
    const automationReady = testResults.filter(r => r.automation_ready).length;

    // Log the automation testing session
    try {
      await supabase
        .from('url_discovery_sessions')
        .insert([{
          session_type: 'automation_testing',
          urls_processed: testResults.length,
          urls_successful: automationReady,
          urls_failed: testResults.length - automationReady,
          session_data: { 
            automation_test_results: testResults,
            compatibility_summary: {
              api_available: testResults.filter(r => r.api_available).length,
              form_compatible: testResults.filter(r => r.form_detection).length,
              instant_publishing: testResults.filter(r => r.publishing_method?.includes('instant')).length
            }
          },
          created_at: new Date().toISOString()
        }]);
    } catch (logError) {
      console.error('Error logging automation testing session:', logError);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        processed: testResults.length,
        successful: successful,
        failed: failed,
        automation_ready: automationReady,
        message: `Updated ${successful} URLs successfully, ${automationReady} are automation-ready`
      }),
    };

  } catch (error) {
    console.error('Update automation compatibility error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to update automation compatibility'
      }),
    };
  }
};

async function logAutomationTest(testResult) {
  try {
    // Create a detailed log entry for the automation test
    const logEntry = {
      url: testResult.url,
      domain: testResult.domain,
      test_timestamp: new Date().toISOString(),
      automation_ready: testResult.automation_ready,
      api_available: testResult.api_available,
      form_detection: testResult.form_detection,
      publishing_method: testResult.publishing_method,
      success_probability: testResult.success_probability,
      compatibility_score: testResult.compatibility_score,
      response_time: testResult.response_time,
      registration_required: testResult.registration_required,
      test_results: testResult.test_results || {},
      error_message: testResult.error || null
    };

    // Try to insert into automation_logs table (if it exists)
    const { error } = await supabase
      .from('automation_logs')
      .insert([{
        campaign_id: null, // This is a discovery test, not tied to a campaign
        action: 'automation_compatibility_test',
        status: testResult.automation_ready ? 'success' : 'warning',
        message: `Automation compatibility test for ${testResult.url}: ${testResult.compatibility_score}% compatible`,
        details: logEntry,
        created_at: new Date().toISOString()
      }]);

    if (error && !error.message?.includes('relation') && !error.message?.includes('does not exist')) {
      console.error('Error logging automation test:', error);
    }
  } catch (error) {
    console.error('Error in logAutomationTest:', error);
  }
}
