exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Test comment function called');
    const { prompt, keyword } = JSON.parse(event.body || '{}');
    console.log('Request data:', { prompt, keyword });

    if (!prompt || !keyword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing prompt or keyword' })
      };
    }

    // Generate a simple test comment
    const testComments = [
      `Great insights about ${keyword}! This is exactly what I was looking for.`,
      `Thanks for sharing this perspective on ${keyword} - very helpful and informative.`,
      `Really appreciate this detailed breakdown of ${keyword}. Looking forward to implementing these ideas!`,
      `This article on ${keyword} really opened my eyes to new possibilities in the field.`,
      `Excellent work explaining ${keyword} in such an accessible way. Bookmarked for future reference!`
    ];
    
    const comment = testComments[Math.floor(Math.random() * testComments.length)];
    
    console.log('Generated test comment:', comment);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        comment,
        keyword,
        prompt_used: prompt,
        test_mode: true
      })
    };

  } catch (error) {
    console.error('Error in test comment function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        details: 'Test comment generation failed'
      })
    };
  }
};
