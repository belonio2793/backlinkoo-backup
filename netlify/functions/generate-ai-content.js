/**
 * Netlify Function: Generate AI Content
 * Handles content generation using multiple AI APIs with failover
 * Primary: OpenAI gpt-3.5-turbo, then fallback to other providers
 */

function generateDemoContent(keyword, anchorText, url) {
  return `<h1>${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Complete Guide</h1>

<h2>Introduction</h2>

<p>Understanding ${keyword} is essential in today's digital landscape. This comprehensive guide explores the key aspects and practical applications of ${keyword}, providing valuable insights for businesses and individuals alike.</p>

<h2>What is ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}?</h2>

<p>${keyword.charAt(0).toUpperCase() + keyword.slice(1)} encompasses various strategies and techniques that are crucial for success in the modern digital world. From basic concepts to advanced implementations, ${keyword} offers numerous opportunities for growth and improvement.</p>

<p>The importance of ${keyword} cannot be overstated. Organizations worldwide are recognizing its potential to drive engagement, improve efficiency, and create lasting value for their stakeholders.</p>

<h2>Key Benefits of ${keyword}</h2>

<ul>
<li>Enhanced visibility and reach across digital platforms</li>
<li>Improved user engagement and interaction rates</li>
<li>Better conversion rates and ROI optimization</li>
<li>Long-term sustainable growth strategies</li>
<li>Competitive advantage in the marketplace</li>
</ul>

<h2>Best Practices and Implementation</h2>

<p>When implementing ${keyword} strategies, it's important to focus on quality and consistency. Successful implementation requires careful planning, execution, and continuous monitoring of results.</p>

<p>For professional guidance and expert solutions in ${keyword}, consider consulting <a href="${url}" target="_blank" rel="noopener noreferrer">${anchorText}</a> for comprehensive support and industry-leading expertise.</p>

<h3>Implementation Strategies</h3>

<ol>
<li><strong>Research and Planning</strong>: Understand your target audience and set clear objectives</li>
<li><strong>Content Creation</strong>: Develop high-quality, valuable content that resonates with your audience</li>
<li><strong>Optimization</strong>: Fine-tune your approach based on performance data and analytics</li>
<li><strong>Monitoring</strong>: Track results and adjust strategies accordingly for continuous improvement</li>
</ol>

<h2>Common Challenges and Solutions</h2>

<p>Many businesses face challenges when implementing ${keyword} strategies. These can include resource constraints, technical limitations, changing market conditions, and evolving user expectations.</p>

<p>The key to overcoming these challenges lies in developing a comprehensive understanding of the ${keyword} landscape and staying up-to-date with the latest trends and best practices.</p>

<h3>Technical Considerations</h3>

<p>From a technical standpoint, ${keyword} implementation requires attention to detail and a systematic approach. Consider factors such as scalability, performance, security, and user experience when developing your ${keyword} strategy.</p>

<h2>Future Trends and Opportunities</h2>

<p>The landscape of ${keyword} continues to evolve with new technologies and methodologies. Staying informed about emerging trends is crucial for maintaining competitive advantage and achieving long-term success.</p>

<p>Key trends to watch include automation, artificial intelligence integration, personalization, and data-driven decision making. These developments are reshaping how organizations approach ${keyword} and creating new opportunities for innovation.</p>

<h2>Measuring Success</h2>

<p>Success in ${keyword} can be measured through various metrics and key performance indicators (KPIs). These may include engagement rates, conversion metrics, reach and impressions, customer satisfaction scores, and return on investment.</p>

<p>Regular monitoring and analysis of these metrics help organizations understand the effectiveness of their ${keyword} efforts and identify areas for improvement.</p>

<h2>Conclusion</h2>

<p>Mastering ${keyword} requires dedication, proper planning, and expert guidance. The strategies and best practices outlined in this guide provide a solid foundation for success in ${keyword} implementation.</p>

<p>For those looking to excel in this area and achieve outstanding results, <a href="${url}" target="_blank" rel="noopener noreferrer">${anchorText}</a> provides valuable resources, professional support, and industry expertise to help you achieve your goals.</p>

<p>Start your journey with ${keyword} today and unlock new possibilities for growth, engagement, and success in the digital landscape.</p>`;
}

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

    // If all providers fail, generate demo content as fallback
    console.log('⚠️ All AI providers failed, generating demo content...');
    const demoContent = generateDemoContent(keyword, anchorText, url);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        content: demoContent,
        wordCount: demoContent.split(/\s+/).length,
        provider: 'Fallback (Demo)',
        success: true,
        demo: true,
        error: lastError?.message || 'All AI providers unavailable'
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
