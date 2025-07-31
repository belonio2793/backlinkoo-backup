/**
 * OpenAI GPT API Function
 * Direct implementation as suggested by ChatGPT
 */

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    
    // Check if OPENAI_API_KEY is configured
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'OpenAI API key not configured',
          configured: false 
        })
      };
    }

    // Default messages if none provided
    const messages = body.messages || [{ role: 'user', content: 'Hello' }];
    const model = body.model || 'gpt-3.5-turbo';
    const max_tokens = body.max_tokens || 150;

    console.log('🤖 Making OpenAI API call with model:', model);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', response.status, errorData);
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `OpenAI API error: ${response.status}`,
          details: errorData,
          configured: true
        })
      };
    }

    const data = await response.json();
    
    console.log('✅ OpenAI API call successful');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...data,
        configured: true,
        status: 'success'
      })
    };

  } catch (error) {
    console.error('GPT Function Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        configured: !!process.env.OPENAI_API_KEY
      })
    };
  }
};
