const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

exports.handler = async (event, context) => {
  // Enable CORS
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
    const { campaign_id } = JSON.parse(event.body);

    if (!campaign_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing campaign_id' }),
      };
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();

    if (campaignError || !campaign) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Campaign not found' }),
      };
    }

    // Check if there's already a pending discovery job
    const { data: existingJob, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('job_type', 'discover')
      .contains('payload', { campaign_id })
      .in('status', ['queued', 'running'])
      .single();

    if (existingJob) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Discovery job already queued or running',
          job_id: existingJob.id
        }),
      };
    }

    // Create discovery job
    const { data: job, error: createJobError } = await supabase
      .from('jobs')
      .insert([{
        job_type: 'discover',
        payload: {
          campaign_id: campaign.id,
          keyword: campaign.keyword,
          destination_url: campaign.destination_url,
          auto_post: false // Manual approval required
        },
        status: 'queued'
      }])
      .select('*')
      .single();

    if (createJobError) {
      console.error('Job creation error:', createJobError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create discovery job' }),
      };
    }

    // Update campaign status
    await supabase
      .from('campaigns')
      .update({ 
        status: 'running',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign_id);

    // Log the discovery start
    await supabase.from('campaign_logs').insert([{
      campaign_id,
      level: 'info',
      message: `Discovery job queued for keyword: ${campaign.keyword}`,
      meta: { 
        job_id: job.id,
        keyword: campaign.keyword 
      }
    }]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        job,
        message: 'Discovery job queued successfully'
      }),
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};
