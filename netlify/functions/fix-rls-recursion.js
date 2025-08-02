// RLS Recursion Fix - Netlify Edge Function
// This function helps resolve RLS policy recursion issues

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'RLS recursion fix function ready',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Function execution failed',
        details: error.message
      })
    };
  }
};
