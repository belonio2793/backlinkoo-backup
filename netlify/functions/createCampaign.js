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
    const { user_id, destination_url, keyword, anchor_text, auto_discover, auto_post } = JSON.parse(event.body);

    if (!user_id || !destination_url || !keyword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: user_id, destination_url, keyword' }),
      };
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert([{
        user_id,
        destination_url,
        keyword,
        anchor_text: anchor_text || '',
        status: 'pending'
      }])
      .select('*')
      .single();

    if (campaignError) {
      console.error('Campaign creation error:', campaignError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create campaign', details: campaignError.message }),
      };
    }

    // Log campaign creation
    await supabase.from('campaign_logs').insert([{
      campaign_id: campaign.id,
      level: 'info',
      message: `Campaign created for keyword: ${keyword}`,
      meta: { destination_url, keyword, anchor_text }
    }]);

    // If auto-discover is enabled, enqueue discovery job
    if (auto_discover) {
      await supabase.from('jobs').insert([{
        job_type: 'discover',
        payload: {
          campaign_id: campaign.id,
          keyword,
          destination_url,
          auto_post: auto_post || false
        },
        status: 'queued'
      }]);

      await supabase.from('campaign_logs').insert([{
        campaign_id: campaign.id,
        level: 'info',
        message: 'Discovery job queued',
        meta: { keyword }
      }]);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        campaign,
        message: auto_discover ? 'Campaign created and discovery queued' : 'Campaign created'
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
