/**
 * Template Blog Generation Netlify Function
 * Handles template-based blog generation with OpenAI integration
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
      keyword, 
      anchorText, 
      targetUrl, 
      wordCount = 1000, 
      template,
      userQuery 
    } = JSON.parse(event.body);

    // Validate required fields
    if (!keyword || !anchorText || !targetUrl) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: keyword, anchorText, and targetUrl' 
        })
      };
    }

    // Validate URL format
    try {
      new URL(targetUrl);
    } catch {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid target URL format' 
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

    console.log('🎯 Starting template-based blog generation:', {
      keyword,
      anchorText,
      targetUrl,
      wordCount,
      template: template || 'default'
    });

    // Create enhanced system prompt for template generation
    const systemPrompt = `You are an expert SEO content writer specializing in creating high-quality blog posts that naturally integrate contextual backlinks. Your content is always original, comprehensive, and genuinely valuable to readers. You excel at:

1. Creating engaging, well-structured articles with proper heading hierarchy
2. Natural keyword integration without over-optimization
3. Contextual backlink placement that adds genuine value
4. Practical, actionable content that helps readers
5. SEO-optimized formatting and structure

Focus on creating content that serves readers first while achieving SEO goals.`;

    // Create comprehensive user prompt based on template requirements
    const userPrompt = `Create a comprehensive ${wordCount}-word blog post about "${keyword}" that naturally incorporates a contextual backlink to enhance reader value.

CONTENT SPECIFICATIONS:
- Primary Topic: "${keyword}"
- Target Word Count: ${wordCount} words
- Required Backlink: "${anchorText}" → ${targetUrl}
- Content Type: Informative, actionable blog post
- Tone: Professional but engaging

STRUCTURAL REQUIREMENTS:
1. Compelling H1 title featuring "${keyword}"
2. Engaging introduction (150-200 words) that hooks readers
3. 4-6 main content sections with descriptive H2 headings
4. Practical subsections with H3 headings where appropriate
5. Actionable content with examples, tips, or step-by-step guidance
6. Natural integration of "${anchorText}" linking to ${targetUrl}
7. Strong conclusion with key takeaways and next steps

SEO OPTIMIZATION GUIDELINES:
- Use "${keyword}" naturally throughout the content (aim for 1-2% density)
- Include semantic keywords and related terms
- Add numbered lists, bullet points, and practical examples
- Ensure proper heading hierarchy for SEO structure
- Include relevant internal topic connections

BACKLINK INTEGRATION STRATEGY:
- Place "${anchorText}" where it most naturally fits the content flow
- Ensure the backlink adds genuine value to the reader's understanding
- Position the link in a context where it enhances the topic discussion
- Make the anchor text feel natural and not forced
- Provide context for why the link is valuable

CONTENT QUALITY STANDARDS:
- Original, unique content that provides real value
- Practical advice readers can immediately implement
- Expert-level insights and comprehensive coverage
- Engaging writing style that keeps readers interested
- Professional formatting and clear structure

HTML OUTPUT REQUIREMENTS:
Return clean, semantic HTML with this exact structure:
- <h1>Main Title</h1> for the article title
- <h2>Section Title</h2> for main sections
- <h3>Subsection Title</h3> for subsections
- <p>Paragraph content</p> for all body text
- <ul><li>Item</li></ul> or <ol><li>Item</li></ol> for lists
- <strong>Important text</strong> for emphasis
- <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> for the required backlink

ADDITIONAL CONTEXT:
${userQuery ? `User's original request: "${userQuery}"` : ''}
${template ? `Template used: "${template}"` : ''}

Create content that genuinely helps readers while naturally achieving the SEO and backlink objectives.`;

    // Make OpenAI API call
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
        max_tokens: Math.min(4000, Math.floor(wordCount * 2.8)),
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
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

    // Extract title from content
    const titleMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1] : `Complete Guide to ${keyword}`;

    // Calculate content metrics
    const wordCountActual = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCountActual / 200);

    // Generate meta description
    const plainText = content.replace(/<[^>]*>/g, '');
    const metaDescription = plainText.split(/\s+/).slice(0, 25).join(' ') + `... Learn more about ${keyword}.`;

    // Calculate SEO score based on content quality
    let seoScore = 75; // Base score
    
    // Check keyword presence
    const keywordMatches = (content.match(new RegExp(keyword, 'gi')) || []).length;
    if (keywordMatches >= 3) seoScore += 5;
    if (keywordMatches >= 5) seoScore += 5;
    
    // Check structure
    if (content.includes('<h1>')) seoScore += 5;
    if (content.includes('<h2>')) seoScore += 5;
    if (content.includes('<ul>') || content.includes('<ol>')) seoScore += 5;
    
    // Check backlink presence
    if (content.includes(targetUrl)) seoScore += 10;

    const tokens = data.usage.total_tokens;
    const cost = tokens * 0.000002; // Approximate cost for gpt-3.5-turbo

    console.log('✅ Template blog generation successful:', {
      title,
      wordCount: wordCountActual,
      readingTime,
      seoScore,
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
        source: 'template-openai',
        provider: 'openai',
        content,
        metadata: {
          title,
          keyword,
          anchorText,
          targetUrl,
          wordCount: wordCountActual,
          readingTime,
          seoScore,
          metaDescription,
          template: template || 'default',
          userQuery: userQuery || null
        },
        usage: {
          tokens,
          cost
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Template blog generation error:', error);
    
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
