/**
 * Netlify Function: Generate AI Content
 * Handles content generation using OpenAI or Grok APIs
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
    const { provider, prompt, keyword, anchorText, url } = JSON.parse(event.body);

    if (!provider || !prompt || !keyword || !anchorText || !url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    let apiKey, endpoint, model;

    switch (provider) {
      case 'OpenAI':
        apiKey = process.env.OPENAI_API_KEY;
        endpoint = 'https://api.openai.com/v1/chat/completions';
        model = 'gpt-4o-mini'; // More cost-effective model
        break;
      case 'Grok':
        apiKey = process.env.GROK_API_KEY;
        endpoint = 'https://api.x.ai/v1/chat/completions';
        model = 'grok-beta';
        break;
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Unsupported provider' })
        };
    }

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: `${provider} API key not configured` })
      };
    }

    const systemPrompt = `You are a professional content writer specializing in SEO-optimized blog posts. Create high-quality, engaging content that:

1. Meets the minimum 1000-word requirement
2. Uses proper SEO formatting with H1, H2, and H3 headers
3. Includes short, readable paragraphs
4. Incorporates bullet points or numbered lists where appropriate
5. Uses natural keyword placement (avoid keyword stuffing)
6. Creates valuable, informative content for readers
7. Includes the specified anchor text as a natural hyperlink to the target URL

Format the content in clean HTML with proper heading tags, paragraph tags, and list elements. Make the anchor text "${anchorText}" link to "${url}" naturally within the content flow.`;

    const userPrompt = `${prompt}

Additional requirements:
- Target keyword: "${keyword}"
- Anchor text to link: "${anchorText}"
- Link destination: "${url}"
- Minimum 1000 words
- Professional, engaging tone
- SEO-optimized structure with clear headings
- Include practical tips, insights, or examples related to the topic

Please create a comprehensive, well-structured blog post that naturally incorporates the anchor text "${anchorText}" as a clickable link to "${url}".`;

    const requestBody = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    };

    console.log(`Generating content with ${provider}...`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${provider} API error:`, errorText);
      throw new Error(`${provider} API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from API');
    }

    const content = data.choices[0].message.content;
    const wordCount = content.split(/\s+/).length;

    // Ensure the content includes the anchor text as a link
    let processedContent = content;
    if (!content.includes(`<a href="${url}"`)) {
      // If the content doesn't already have the link formatted, add it
      const anchorTextPattern = new RegExp(`\\b${anchorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      processedContent = content.replace(anchorTextPattern, `<a href="${url}" target="_blank" rel="noopener noreferrer">${anchorText}</a>`);
    }

    console.log(`Content generated successfully: ${wordCount} words`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        content: processedContent,
        wordCount,
        provider,
        success: true
      })
    };

  } catch (error) {
    console.error('Content generation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Content generation failed',
        details: error.message 
      })
    };
  }
};
