// Backlink Campaign Management Function
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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

    if (event.httpMethod === 'GET') {
      // Return existing campaigns (demo data for now)
      const demoCampaigns = [
        {
          id: 'demo_campaign_1',
          name: 'SEO Authority Building',
          targetUrl: 'https://example.com',
          keywords: ['SEO', 'digital marketing', 'backlinks'],
          status: 'active',
          progress: 65,
          linksGenerated: 127,
          linkStrategy: {
            blogComments: true,
            forumProfiles: true,
            web2Platforms: true,
            socialProfiles: false,
            contactForms: false
          },
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
          lastActive: new Date().toISOString()
        }
      ];

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          campaigns: demoCampaigns
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
