/**
 * Cohere Content Generation Netlify Function
 * Fallback provider for content generation
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
    const { keyword, url, anchorText, wordCount = 1500, contentType = 'how-to', tone = 'professional' } = JSON.parse(event.body);

    if (!keyword || !url) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: keyword and url' 
        })
      };
    }

    // Get Cohere API key from environment
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Cohere API key not configured' 
        })
      };
    }

    const systemPrompt = `You are an expert SEO content writer specializing in creating high-quality, engaging blog posts that rank well in search engines. Focus on step-by-step instructions, practical tips, and actionable advice. Use ${tone} tone throughout the article.`;

    const fullPrompt = `${systemPrompt}

Create a comprehensive ${wordCount}-word ${contentType} blog post about "${keyword}" that naturally incorporates a backlink.

CONTENT REQUIREMENTS:
- Write exactly ${wordCount} words of high-quality, original content
- Focus on "${keyword}" as the main topic
- Include practical, actionable advice
- Structure with proper headings (H1, H2, H3)
- Natural integration of anchor text "${anchorText || keyword}" linking to ${url}

CONTENT STRUCTURE:
1. Compelling H1 title with the primary keyword
2. Engaging introduction that hooks the reader
3. 4-6 main sections with H2 headings
4. Subsections with H3 headings where appropriate
5. Natural placement of backlink: "${anchorText || keyword}" → ${url}
6. Strong conclusion with actionable takeaways

OUTPUT FORMAT:
Return the content as HTML with proper tags:
- Use <h1> for main title
- Use <h2> for main sections
- Use <h3> for subsections
- Use <p> for paragraphs
- Use <ul>/<ol> and <li> for lists
- Use <strong> for emphasis
- Use <a href="${url}" target="_blank" rel="noopener noreferrer">${anchorText || keyword}</a> for the backlink

Focus on creating valuable, informative content that genuinely helps readers.`;

    console.log('🔶 Starting Cohere generation via Netlify function...');

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'BacklinkooBot/1.0'
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        max_tokens: Math.min(4000, Math.floor(wordCount * 2.5)),
        temperature: 0.7,
        model: 'command-xlarge-nightly'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = `Cohere API error: ${response.status}`;
      
      if (errorData.message) {
        errorMessage += ` - ${errorData.message}`;
      }

      console.error('❌ Cohere API error:', errorMessage);
      
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: errorMessage,
          provider: 'cohere'
        })
      };
    }

    const data = await response.json();

    if (!data.generations || data.generations.length === 0) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'No content generated from Cohere',
          provider: 'cohere'
        })
      };
    }

    const content = data.generations[0].text;

    if (!content || content.trim().length < 100) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Generated content is too short or empty',
          provider: 'cohere'
        })
      };
    }

    // Estimate tokens and cost
    const tokens = Math.ceil(content.length / 4);
    const cost = tokens * 0.000002; // Approximate cost

    console.log('✅ Cohere generation successful:', {
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
        source: 'cohere',
        provider: 'cohere',
        content,
        usage: {
          tokens,
          cost
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Cohere Netlify function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
        provider: 'cohere'
      })
    };
  }
};
