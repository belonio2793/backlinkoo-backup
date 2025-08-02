exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🔑 Processing OpenAI API key request...');
    
    // Get the OpenAI API key from environment variables
    const openaiKey = process.env.OPENAI_API_KEY || 
                      process.env.VITE_OPENAI_API_KEY;

    console.log('Environment check:', {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasViteOpenAI: !!process.env.VITE_OPENAI_API_KEY,
      availableKeys: Object.keys(process.env).filter(key => 
        key.toLowerCase().includes('openai')
      )
    });

    if (!openaiKey) {
      console.log('❌ No OpenAI API key found in environment');
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'OpenAI API key not found in environment variables',
          available_vars: Object.keys(process.env).filter(key => 
            key.toLowerCase().includes('openai')
          )
        })
      };
    }

    // Validate the key format
    if (!openaiKey.startsWith('sk-')) {
      console.log('❌ Invalid OpenAI API key format');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid OpenAI API key format',
          key_prefix: openaiKey.substring(0, 10)
        })
      };
    }

    console.log(`✅ OpenAI API key retrieved: ${openaiKey.substring(0, 10)}...`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        api_key: openaiKey,
        key_length: openaiKey.length,
        key_prefix: openaiKey.substring(0, 10)
      })
    };

  } catch (error) {
    console.error('❌ Error retrieving OpenAI API key:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};
