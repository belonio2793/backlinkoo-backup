exports.handler = async (event, context) => {
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
      body: ''
    };
  }

  try {
    console.log('🧪 Test connection function called');
    console.log('Method:', event.httpMethod);
    console.log('Path:', event.path);
    console.log('Headers:', event.headers);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Netlify function is working!',
        timestamp: new Date().toISOString(),
        method: event.httpMethod,
        path: event.path,
        environment: {
          node_version: process.version,
          has_openai_key: !!process.env.OPENAI_API_KEY,
          has_vite_openai_key: !!process.env.VITE_OPENAI_API_KEY,
          openai_related_vars: Object.keys(process.env).filter(key => 
            key.toLowerCase().includes('openai')
          )
        }
      })
    };
  } catch (error) {
    console.error('❌ Test connection error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
