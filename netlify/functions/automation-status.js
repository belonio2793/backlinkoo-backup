// Simple automation status for browser-safe implementation
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // For now, return a mock status
    // In a full implementation, this would check actual browser instances
    const mockStatus = {
      active: false,
      instances: [],
      totalInstances: 0,
      activeInstances: 0,
      stats: {
        totalJobsProcessed: 0,
        successRate: 0,
        uptime: 0
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mockStatus)
    };

  } catch (error) {
    console.error('Automation status error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        active: false,
        instances: []
      })
    };
  }
};
