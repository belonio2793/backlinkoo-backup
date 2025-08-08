const { createClient } = require('@supabase/supabase-js');

// Backlink Campaign Management Function
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Supabase configuration missing' }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    let requestBody = {};
    if (event.body) {
      try {
        requestBody = JSON.parse(event.body);
      } catch (parseError) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid JSON in request body' }),
        };
      }
    }

    // Get user from Authorization header
    const authHeader = event.headers.authorization;
    let user = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: userData } = await supabase.auth.getUser(token);
      user = userData.user;
    }

    if (event.httpMethod === 'GET') {
      if (!user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authentication required' }),
        };
      }

      // Get user's campaigns
      const { data: campaigns, error } = await supabase
        .from('backlink_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch campaigns' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          campaigns: campaigns || []
        }),
      };
    }

    if (event.httpMethod === 'POST') {
      const { action, campaign, campaignId, anchorTexts, dailyLimit } = requestBody;

      switch (action) {
        case 'create':
          // Create new campaign
          console.log('Creating campaign:', campaign.name);
          
          // Here you would normally save to database
          // For demo, we'll simulate campaign creation
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              campaignId: campaign.id,
              message: 'Campaign created successfully',
              campaign: {
                ...campaign,
                anchorTexts: anchorTexts || [],
                dailyLimit: dailyLimit || 10
              }
            }),
          };

        case 'pause':
          console.log('Pausing campaign:', campaignId);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'Campaign paused successfully'
            }),
          };

        case 'resume':
          console.log('Resuming campaign:', campaignId);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'Campaign resumed successfully'
            }),
          };

        case 'stop':
          console.log('Stopping campaign:', campaignId);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'Campaign stopped successfully'
            }),
          };

        default:
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid action' }),
          };
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('Error in backlink campaigns:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'An unexpected error occurred'
      }),
    };
  }
};
