/**
 * Netlify Function: Generate AI Content
 * Handles content generation using multiple AI APIs with failover
 * Primary: OpenAI gpt-3.5-turbo, then fallback to other providers
 */



async function generateWithProvider(providerConfig, prompt, keyword, anchorText, url) {
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

  // Handle different provider APIs
  if (providerConfig.name === 'OpenAI' || providerConfig.name === 'Grok') {
    const requestBody = {
      model: providerConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    };

    const response = await fetch(providerConfig.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${providerConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${providerConfig.name} API request failed: ${response.status} - ${errorText}`);
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
      const anchorTextPattern = new RegExp(`\\b${anchorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      processedContent = content.replace(anchorTextPattern, `<a href="${url}" target="_blank" rel="noopener noreferrer">${anchorText}</a>`);
    }

    return {
      content: processedContent,
      wordCount,
      provider: providerConfig.name,
      success: true
    };
  }

  // For other providers (simplified implementation for demo)
  throw new Error(`${providerConfig.name} integration not fully implemented yet`);
}

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

    // Provider configurations in priority order (OpenAI first with gpt-3.5-turbo)
    const providers = [
      {
        name: 'OpenAI',
        apiKey: process.env.OPENAI_API_KEY,
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo'  // Primary model as requested
      },
      {
        name: 'Grok',
        apiKey: process.env.GROK_API_KEY,
        endpoint: 'https://api.x.ai/v1/chat/completions',
        model: 'grok-beta'
      },
      {
        name: 'HuggingFace',
        apiKey: process.env.HF_ACCESS_TOKEN,
        endpoint: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large',
        model: 'microsoft/DialoGPT-large'
      },
      {
        name: 'Cohere',
        apiKey: process.env.COHERE_API_KEY,
        endpoint: 'https://api.cohere.ai/v1/generate',
        model: 'command'
      },
      {
        name: 'DeepAI',
        apiKey: process.env.DEEPAI_API_KEY,
        endpoint: 'https://api.deepai.org/api/text-generator',
        model: 'text-generator'
      }
    ];

    // Try providers in order until one succeeds
    let lastError = null;
    for (const providerConfig of providers) {
      if (!providerConfig.apiKey) {
        console.log(`${providerConfig.name} API key not configured, skipping...`);
        continue;
      }

      try {
        console.log(`🤖 Attempting content generation with ${providerConfig.name}...`);
        const result = await generateWithProvider(providerConfig, prompt, keyword, anchorText, url);
        
        console.log(`✅ ${providerConfig.name} succeeded: ${result.wordCount} words`);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result)
        };
      } catch (error) {
        console.error(`❌ ${providerConfig.name} failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    // If all providers fail, return error instead of fallback content
    console.error('❌ All AI providers failed');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Content generation failed',
        details: lastError?.message || 'All AI providers are unavailable or misconfigured',
        success: false,
        providersAttempted: providers.filter(p => p.apiKey).map(p => p.name)
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
