/**
 * OpenAI Content Generation Netlify Function
 * Secure server-side OpenAI API calls
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
    const { keyword, url, anchorText, wordCount = 1500, contentType = 'how-to', tone = 'professional', apiKey: requestApiKey } = JSON.parse(event.body);

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

    // Get OpenAI API key from environment variables (secure server-side only)
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY;
    console.log('🔑 API Key check:', apiKey ? `Found (${apiKey.substring(0, 7)}...)` : 'Not found');

    if (!apiKey) {
      console.error('❌ No OpenAI API key found in environment variables');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'OpenAI API key not configured in Netlify environment',
          details: 'Please set OPENAI_API_KEY or OPEN_AI_API_KEY in Netlify environment variables'
        })
      };
    }

    const systemPrompt = `You are an elite SEO content strategist and copywriter with deep expertise in creating viral, high-ranking blog content. Your writing style combines authoritative expertise with engaging storytelling.

KEY EXPERTISE:
- Write compelling, data-driven content that ranks #1 on Google
- Master storyteller who hooks readers from the first sentence
- Expert in natural backlink integration that adds genuine value
- Create content that drives engagement, shares, and conversions
- Use ${tone} tone while maintaining authority and trustworthiness

CONTENT PHILOSOPHY:
- Every sentence must provide value to the reader
- Use psychological triggers and persuasive writing techniques
- Include specific examples, case studies, and actionable insights
- Write with clarity, confidence, and compelling narrative flow
- Integrate backlinks so naturally that they enhance the user experience`;

    const userPrompt = `Create a comprehensive ${wordCount}-word ${contentType} blog post about "${keyword}" that naturally incorporates a backlink.

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

SEO OPTIMIZATION:
- Include primary keyword "${keyword}" naturally throughout
- Use semantic keywords and related terms
- Include numbered lists or bullet points

BACKLINK INTEGRATION:
- Place the backlink "${anchorText || keyword}" naturally within the content
- Make the link contextually relevant to the surrounding text
- Ensure it adds value to the reader

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

    console.log('🚀 Starting OpenAI generation via Netlify function...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'BacklinkooBot/1.0'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: Math.min(4000, Math.floor(wordCount * 2.5)),
        temperature: 0.7,
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
          error: errorMessage,
          provider: 'openai'
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
          error: 'No content generated from OpenAI',
          provider: 'openai'
        })
      };
    }

    const content = data.choices[0].message.content;

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
          provider: 'openai'
        })
      };
    }

    const tokens = data.usage.total_tokens;
    const cost = tokens * 0.000002; // Approximate cost for gpt-3.5-turbo

    console.log('✅ OpenAI generation successful:', {
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
        source: 'openai',
        provider: 'openai',
        content,
        usage: {
          tokens,
          cost
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ OpenAI Netlify function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
        provider: 'openai'
      })
    };
  }
};
