const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    console.log('Generate comment function called');
    const { prompt, keyword } = JSON.parse(event.body || '{}');
    console.log('Request data:', { prompt, keyword });

    if (!prompt || !keyword) {
      console.error('Missing prompt or keyword:', { prompt, keyword });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing prompt or keyword' })
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OpenAI API not configured' })
      };
    }

    console.log('OpenAI API key found, making request...');

    // Generate comment using ChatGPT 3.5 Turbo
    console.log('Making OpenAI API request...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that generates authentic, engaging blog comments.
                   Generate comments that:
                   - Are natural and conversational
                   - Add value to the discussion
                   - Sound like genuine human responses
                   - Are 1-2 sentences maximum
                   - Avoid obvious promotional language
                   - Feel authentic and relatable`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.8,
      frequency_penalty: 0.5,
      presence_penalty: 0.3
    });

    console.log('OpenAI API response received');
    const comment = completion.choices[0]?.message?.content?.trim();
    console.log('Generated comment:', comment);

    if (!comment) {
      console.error('No comment generated from OpenAI response');
      throw new Error('No comment generated');
    }

    // Basic quality check
    if (comment.length < 10 || comment.length > 300) {
      console.error('Comment length outside acceptable range:', comment.length);
      throw new Error('Generated comment outside acceptable length range');
    }

    console.log('Comment generation successful');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        comment,
        keyword,
        prompt_used: prompt
      })
    };

  } catch (error) {
    console.error('Error generating comment:', error);
    
    // Return a fallback comment if OpenAI fails
    const fallbackComments = [
      `Really valuable insights about ${keyword}! This is exactly what I was looking for.`,
      `Thanks for sharing this perspective on ${keyword} - very helpful!`,
      `Great points about ${keyword}. Have you considered the impact on user experience too?`,
      `This article on ${keyword} really opened my eyes to new possibilities.`,
      `Appreciate the detailed breakdown of ${keyword}. Looking forward to implementing these ideas!`
    ];
    
    const fallbackComment = fallbackComments[Math.floor(Math.random() * fallbackComments.length)];
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        comment: fallbackComment,
        keyword,
        fallback: true,
        error: error.message
      })
    };
  }
};
