// Simple automation control for browser-safe implementation
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { action, campaignId, campaignName } = JSON.parse(event.body || '{}');
    console.log('Automation control action:', { action, campaignId, campaignName });

    // For now, return success responses
    // In a full implementation, this would manage actual browser instances
    switch (action) {
      case 'start_system':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            message: 'Automation system started',
            active: true
          })
        };

      case 'stop_system':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            message: 'Automation system stopped',
            active: false
          })
        };

      case 'start_campaign':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            message: `Campaign automation started for ${campaignName}`,
            campaignId,
            status: 'active'
          })
        };

      case 'stop_campaign':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            message: 'Campaign automation stopped',
            campaignId,
            status: 'stopped'
          })
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

  } catch (error) {
    console.error('Automation control error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false
      })
    };
  }
};
