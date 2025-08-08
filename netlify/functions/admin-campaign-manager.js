const { createClient } = require('@supabase/supabase-js');

// Admin Campaign Manager Function
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
    // Get user from Authorization header
    const authHeader = event.headers.authorization;
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: userData } = await supabase.auth.getUser(token);
      user = userData.user;
    }

    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authentication required' }),
      };
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin access required' }),
      };
    }

    if (event.httpMethod === 'GET') {
      // Get all campaigns with user information
      const { data: campaigns, error: campaignsError } = await supabase
        .from('backlink_campaigns')
        .select(`
          *,
          user_profiles!inner(email)
        `)
        .order('created_at', { ascending: false });

      if (campaignsError) {
        console.error('Error fetching campaigns:', campaignsError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch campaigns' }),
        };
      }

      // Transform campaigns to include user email
      const formattedCampaigns = campaigns.map(campaign => ({
        ...campaign,
        user_email: campaign.user_profiles?.email
      }));

      // Calculate stats
      const stats = {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        totalUsers: [...new Set(campaigns.map(c => c.user_id))].length,
        totalLinksGenerated: campaigns.reduce((sum, c) => sum + (c.links_generated || 0), 0),
        campaignsToday: campaigns.filter(c => {
          const today = new Date().toDateString();
          const campaignDate = new Date(c.created_at).toDateString();
          return today === campaignDate;
        }).length,
        averageSuccessRate: 85 // This would be calculated from actual posting results
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          campaigns: formattedCampaigns,
          stats
        }),
      };
    }

    if (event.httpMethod === 'POST') {
      let requestBody;
      try {
        requestBody = JSON.parse(event.body);
      } catch (parseError) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid JSON in request body' }),
        };
      }

      const { action, campaignId } = requestBody;

      switch (action) {
        case 'pause':
          const { error: pauseError } = await supabase
            .from('backlink_campaigns')
            .update({ 
              status: 'paused',
              updated_at: new Date().toISOString()
            })
            .eq('id', campaignId);

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
            .eq('id', campaignId);

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
          // First delete related data
          await supabase
            .from('link_posting_results')
            .delete()
            .eq('campaign_id', campaignId);

          await supabase
            .from('link_opportunities')
            .delete()
            .eq('campaign_id', campaignId);

          await supabase
            .from('campaign_analytics')
            .delete()
            .eq('campaign_id', campaignId);

          await supabase
            .from('link_discovery_queue')
            .delete()
            .eq('campaign_id', campaignId);

          // Then delete the campaign
          const { error: deleteError } = await supabase
            .from('backlink_campaigns')
            .delete()
            .eq('id', campaignId);

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

        case 'bulk_pause':
          const { campaignIds: pauseIds } = requestBody;
          const { error: bulkPauseError } = await supabase
            .from('backlink_campaigns')
            .update({ 
              status: 'paused',
              updated_at: new Date().toISOString()
            })
            .in('id', pauseIds);

          if (bulkPauseError) {
            console.error('Bulk pause error:', bulkPauseError);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to pause campaigns' }),
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: `${pauseIds.length} campaigns paused successfully`
            }),
          };

        case 'bulk_delete':
          const { campaignIds: deleteIds } = requestBody;
          
          // Delete related data first
          await supabase.from('link_posting_results').delete().in('campaign_id', deleteIds);
          await supabase.from('link_opportunities').delete().in('campaign_id', deleteIds);
          await supabase.from('campaign_analytics').delete().in('campaign_id', deleteIds);
          await supabase.from('link_discovery_queue').delete().in('campaign_id', deleteIds);

          // Then delete campaigns
          const { error: bulkDeleteError } = await supabase
            .from('backlink_campaigns')
            .delete()
            .in('id', deleteIds);

          if (bulkDeleteError) {
            console.error('Bulk delete error:', bulkDeleteError);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to delete campaigns' }),
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: `${deleteIds.length} campaigns deleted successfully`
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
    console.error('Error in admin campaign manager:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'An unexpected error occurred'
      }),
    };
  }
};
