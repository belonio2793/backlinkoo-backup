/**
 * Netlify Function: Generate Content
 * Flexible content generation for various use cases
 */

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      })
    };
  }

  try {
    const { 
      prompt, 
      type = 'general',
      maxTokens = 1000,
      temperature = 0.7,
      topic,
      keywords = []
    } = JSON.parse(event.body);

    if (!prompt && !topic) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Either prompt or topic is required' 
        })
      };
    }

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'OpenAI API key not configured' 
        })
      };
    }

    let systemPrompt = '';
    let userPrompt = '';

    // Generate prompts based on content type
    switch (type) {
      case 'blog_post':
        systemPrompt = 'You are an expert blog writer creating engaging, SEO-friendly content.';
        userPrompt = prompt || `Write a comprehensive blog post about "${topic}". Include relevant headings, make it informative and engaging. ${keywords.length > 0 ? `Include these keywords naturally: ${keywords.join(', ')}` : ''}`;
        break;
      
      case 'seo_keywords':
        systemPrompt = 'You are an SEO expert generating relevant keywords.';
        userPrompt = prompt || `Generate 10 SEO-friendly keywords for the topic: "${topic}". Return only the keywords, one per line.`;
        break;
      
      case 'content_improvement':
        systemPrompt = 'You are a content editor improving existing text.';
        userPrompt = prompt || `Improve and enhance this content while maintaining its core message.`;
        break;
      
      default:
        systemPrompt = 'You are a helpful AI assistant providing high-quality content.';
        userPrompt = prompt || `Create informative content about "${topic}".`;
    }

    console.log('🚀 Generating content via OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ContentGenerator/1.0'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = `OpenAI API error: ${response.status}`;
      
      if (errorData.error?.message) {
        errorMessage += ` - ${errorData.error.message}`;
      }

      console.error('❌ OpenAI API error:', errorMessage);
      
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: errorMessage
        })
      };
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'No content generated' 
        })
      };
    }

    const content = data.choices[0].message.content;

    if (!content || content.trim().length < 10) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Generated content is too short' 
        })
      };
    }

    const tokens = data.usage.total_tokens;
    const cost = tokens * 0.000002; // Approximate cost for gpt-3.5-turbo

    console.log('✅ Content generation successful:', {
      type,
      contentLength: content.length,
      tokens,
      cost: `$${cost.toFixed(4)}`
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        content,
        type,
        usage: {
          tokens,
          cost
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Content generation error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error'
      })
    };
  }
};
