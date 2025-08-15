/**
 * Test OpenAI API Key Configuration
 * This function tests if the OpenAI API key is properly configured
 */
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    const keyLength = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0;
    const keyPrefix = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) : 'none';

    console.log('🔑 OpenAI API Key Status:', {
      hasKey: hasApiKey,
      keyLength,
      keyPrefix
    });

    if (!hasApiKey) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          configured: false,
          message: 'OpenAI API key is not configured',
          instructions: 'Please set OPENAI_API_KEY environment variable in Netlify'
        }),
      };
    }

    // Test the API key with a simple request
    const { OpenAI } = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Make a simple test request
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        configured: true,
        working: true,
        message: 'OpenAI API key is properly configured and working',
        keyPrefix,
        keyLength,
        testResponse: completion.choices[0]?.message?.content || 'Test successful'
      }),
    };

  } catch (error) {
    console.error('❌ OpenAI API Key Test Error:', error);

    let errorType = 'unknown';
    let message = error.message;

    if (error.code === 'insufficient_quota') {
      errorType = 'quota_exceeded';
      message = 'OpenAI quota exceeded';
    } else if (error.code === 'invalid_api_key') {
      errorType = 'invalid_key';
      message = 'OpenAI API key is invalid';
    } else if (error.code === 'rate_limit_exceeded') {
      errorType = 'rate_limit';
      message = 'OpenAI rate limit exceeded';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        configured: !!process.env.OPENAI_API_KEY,
        working: false,
        error: errorType,
        message,
        keyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) : 'none'
      }),
    };
  }
};
