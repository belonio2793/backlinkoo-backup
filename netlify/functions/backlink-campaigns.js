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
      if (!user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authentication required' }),
        };
      }

      const { action, campaign, campaignId } = requestBody;

      switch (action) {
        case 'create':
          // Create new campaign
          const { data: newCampaign, error: createError } = await supabase
            .from('backlink_campaigns')
            .insert([{
              user_id: user.id,
              name: campaign.name,
              target_url: campaign.target_url,
              keywords: campaign.keywords,
              anchor_texts: campaign.anchor_texts,
              daily_limit: campaign.daily_limit,
              strategy_blog_comments: campaign.strategy_blog_comments,
              strategy_forum_profiles: campaign.strategy_forum_profiles,
              strategy_web2_platforms: campaign.strategy_web2_platforms,
              strategy_social_profiles: campaign.strategy_social_profiles,
              strategy_contact_forms: campaign.strategy_contact_forms
            }])
            .select()
            .single();

          if (createError) {
            console.error('Create campaign error:', createError);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to create campaign' }),
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              campaign: newCampaign,
              message: 'Campaign created successfully'
            }),
          };

        case 'pause':
          const { error: pauseError } = await supabase
            .from('backlink_campaigns')
            .update({
              status: 'paused',
              updated_at: new Date().toISOString()
            })
            .eq('id', campaignId)
            .eq('user_id', user.id);

          if (pauseError) {
            console.error('Pause campaign error:', pauseError);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to pause campaign' }),
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'Campaign paused successfully'
            }),
          };

        case 'resume':
          const { error: resumeError } = await supabase
            .from('backlink_campaigns')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
              last_active_at: new Date().toISOString()
            })
            .eq('id', campaignId)
            .eq('user_id', user.id);

          if (resumeError) {
            console.error('Resume campaign error:', resumeError);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to resume campaign' }),
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'Campaign resumed successfully'
            }),
          };

        case 'delete':
          const { error: deleteError } = await supabase
            .from('backlink_campaigns')
            .delete()
            .eq('id', campaignId)
            .eq('user_id', user.id);

          if (deleteError) {
            console.error('Delete campaign error:', deleteError);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to delete campaign' }),
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'Campaign deleted successfully'
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
