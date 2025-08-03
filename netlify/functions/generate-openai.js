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

    const systemPrompt = `You are an elite SEO content strategist and copywriter with deep expertise in creating viral, high-ranking blog content specifically about "${keyword}". Your writing style combines authoritative expertise with engaging storytelling, and you have specialized knowledge in "${keyword}".

KEY EXPERTISE:
- Write compelling, data-driven content about "${keyword}" that ranks #1 on Google
- Master storyteller who hooks readers from the first sentence with "${keyword}" insights
- Expert in natural backlink integration that adds genuine value to "${keyword}" content
- Create content that drives engagement, shares, and conversions for "${keyword}" topics
- Use ${tone} tone while maintaining authority and trustworthiness about "${keyword}"

CONTENT PHILOSOPHY:
- Every sentence must provide value specifically about "${keyword}" - NO generic filler
- Use psychological triggers and persuasive writing techniques relevant to "${keyword}"
- Include specific examples, case studies, and actionable insights about "${keyword}"
- Write with clarity, confidence, and compelling narrative flow focused on "${keyword}"
- Integrate backlinks so naturally that they enhance the "${keyword}" user experience
- AVOID phrases like "in today's digital landscape" - be specific to "${keyword}"`;

    const userPrompt = `Create an exceptional ${wordCount}-word ${contentType} blog post about "${keyword}" that will rank #1 on Google and drive massive engagement.

🎯 CONTENT MISSION:
Write a comprehensive, authoritative guide that becomes the definitive resource on "${keyword}". Make readers bookmark this post and share it across social media.

📊 CONTENT REQUIREMENTS:
- Target exactly ${wordCount} words of premium, original content
- Hook readers with an irresistible opening that makes them scroll
- Include 3-5 data points, statistics, or expert insights
- Write scannable content with clear headings and visual breaks
- Natural integration of "${anchorText || keyword}" linking to ${url}
- End with a compelling call-to-action that drives engagement

🏗️ ENHANCED STRUCTURE:
1. **Attention-Grabbing H1**: Include "${keyword}" and promise a specific benefit
2. **Hook Introduction**: Start with a surprising statistic, question, or story (100-150 words)
3. **Value-Packed Sections** (4-6 H2 headings):
   - Each section solves a specific problem
   - Include actionable tips, examples, or case studies
   - Use H3 subheadings to break up longer sections
4. **Strategic Backlink Placement**: Integrate "${anchorText || keyword}" → ${url} where it adds genuine value
5. **Powerful Conclusion**: Summarize key insights and include next steps

🚀 SEO & ENGAGEMENT OPTIMIZATION:
- Naturally include "${keyword}" in H1, introduction, and 2-3 times throughout
- Use semantic keywords and LSI terms related to "${keyword}"
- Include numbered lists, bullet points, and actionable frameworks
- Write compelling meta descriptions within content
- Add transition phrases that improve readability
- Include rhetorical questions to increase engagement

🔗 STRATEGIC BACKLINK INTEGRATION:
- Place "${anchorText || keyword}" linking to ${url} where it provides maximum value
- Context should make the link feel like a natural extension of the content
- The link should solve a problem or provide additional resources mentioned in the content
- Ensure the backlink enhances rather than interrupts the reading experience

💻 ENHANCED HTML OUTPUT:
Structure the content with these semantic HTML tags:
- <h1> for the main title (include primary keyword)
- <h2> for major sections
- <h3> for subsections
- <p> for paragraphs with proper line spacing
- <ul> or <ol> with <li> for lists
- <strong> for key phrases and important concepts
- <em> for emphasis and transitional phrases
- <blockquote> for quotes or highlighted insights
- <a href="${url}" target="_blank" rel="noopener noreferrer">${anchorText || keyword}</a> for the strategic backlink

🎨 CONTENT EXCELLENCE STANDARDS:
- Write with authority and confidence
- Use active voice and strong action verbs
- Include specific examples and real-world applications
- Create content that solves problems and provides immediate value
- Maintain reader engagement from start to finish
- Make every paragraph contribute to the overall narrative

Create content so valuable that readers feel they've discovered a hidden gem. This should be the kind of post that gets bookmarked, shared, and referenced by others in the industry.`;

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
