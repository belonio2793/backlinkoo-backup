/**
 * Netlify Function: Generate AI Content
 * Handles content generation using OpenAI or Grok APIs
 */

function detectKeywordCategory(keyword) {
  const keywordLower = keyword.toLowerCase();

  // Food and cuisine keywords
  if (['sushi', 'pizza', 'pasta', 'burger', 'tacos', 'ramen', 'curry', 'salad', 'sandwich', 'soup', 'steak', 'chicken', 'seafood', 'dessert', 'cake', 'coffee', 'tea', 'wine', 'beer', 'cocktail', 'recipe', 'cooking', 'cuisine', 'restaurant', 'food'].some(food => keywordLower.includes(food))) {
    return 'food';
  }

  // Technology keywords
  if (['software', 'app', 'technology', 'computer', 'mobile', 'ai', 'artificial intelligence', 'machine learning', 'coding', 'programming', 'web development', 'database', 'cloud', 'cybersecurity', 'tech', 'digital'].some(tech => keywordLower.includes(tech))) {
    return 'technology';
  }

  // Health and fitness keywords
  if (['health', 'fitness', 'exercise', 'workout', 'nutrition', 'diet', 'wellness', 'medicine', 'doctor', 'therapy', 'mental health', 'yoga', 'meditation', 'medical'].some(health => keywordLower.includes(health))) {
    return 'health';
  }

  // Travel keywords
  if (['travel', 'vacation', 'tourism', 'hotel', 'flight', 'destination', 'trip', 'adventure', 'backpacking', 'cruise', 'resort', 'city', 'country', 'place'].some(travel => keywordLower.includes(travel))) {
    return 'travel';
  }

  // Business and marketing keywords
  if (['marketing', 'business', 'strategy', 'seo', 'analytics', 'sales', 'entrepreneur', 'startup', 'investment', 'finance', 'management'].some(biz => keywordLower.includes(biz))) {
    return 'business';
  }

  return 'informational';
}

function generateFoodContent(keyword, anchorText, url) {
  // Generate more dynamic titles instead of template format
  const titleVariations = [
    `The Ultimate ${keyword} Experience: What You Need to Know`,
    `Discovering ${keyword}: A Food Lover's Guide`,
    `${keyword} Unveiled: Your Complete Culinary Journey`,
    `The Art of ${keyword}: From Basics to Mastery`
  ];
  const hash = keyword.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const dynamicTitle = titleVariations[hash % titleVariations.length];

  return `<h1>${dynamicTitle}</h1>

<h2>Introduction</h2>

<p>Welcome to your comprehensive guide to <strong>${keyword}</strong>. Whether you're a complete beginner or looking to expand your culinary knowledge, this guide covers everything you need to know about ${keyword}.</p>

<h2>What is ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}?</h2>

<p><em>${keyword}</em> is a beloved culinary delight that has captured the hearts and taste buds of food enthusiasts worldwide. Understanding its origins, preparation methods, and cultural significance can enhance your appreciation and enjoyment.</p>

<h2>History and Origins</h2>

<p>The rich history of ${keyword} spans centuries, with deep cultural roots and traditional preparation methods that have been passed down through generations. Learning about its background helps us appreciate the craftsmanship involved.</p>

<h2>Types and Varieties</h2>

<p>There are numerous varieties of ${keyword}, each with unique characteristics:</p>

<ul>
<li><strong>Traditional varieties</strong>: Classic preparations that honor original recipes</li>
<li><strong>Modern interpretations</strong>: Contemporary twists on traditional favorites</li>
<li><strong>Regional specialties</strong>: Unique local variations worth exploring</li>
<li><strong>Fusion styles</strong>: Creative combinations with other culinary traditions</li>
</ul>

<h2>How to Enjoy ${keyword}</h2>

<p>Getting the most out of your ${keyword} experience involves understanding proper etiquette, pairing suggestions, and quality indicators. Whether dining out or preparing at home, these tips will enhance your enjoyment.</p>

<h2>Where to Find the Best ${keyword}</h2>

<p>Finding exceptional ${keyword} requires knowing what to look for. For comprehensive guides, reviews, and recommendations, <a href="${url}" target="_blank" rel="noopener noreferrer">${anchorText}</a> provides expert insights and curated selections.</p>

<h2>Making ${keyword} at Home</h2>

<p>Creating delicious ${keyword} in your own kitchen can be incredibly rewarding. Start with quality ingredients, follow time-tested techniques, and don't be afraid to experiment with flavors.</p>

<h2>Nutritional Benefits</h2>

<p>Beyond its delicious taste, ${keyword} can offer various nutritional benefits when prepared thoughtfully and consumed as part of a balanced diet.</p>

<h2>Conclusion</h2>

<p>Whether you're a longtime enthusiast or new to ${keyword}, there's always more to discover and enjoy. The world of ${keyword} offers endless possibilities for culinary exploration and satisfaction.</p>`;
}

function generateBusinessContent(keyword, anchorText, url) {
  const currentYear = new Date().getFullYear();
  return `<h1>${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Complete Business Guide for ${currentYear}</h1>

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

function generateDemoContent(keyword, anchorText, url) {
  const category = detectKeywordCategory(keyword);
  console.log(`🎯 Detected category for "${keyword}": ${category}`);

  switch (category) {
    case 'food':
      return generateFoodContent(keyword, anchorText, url);
    case 'business':
      return generateBusinessContent(keyword, anchorText, url);
    default:
      // For other categories, use informational content
      const currentYear = new Date().getFullYear();
      return `<h1>${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Complete Guide for ${currentYear}</h1>

<h2>Introduction</h2>

<p>Welcome to your comprehensive guide about <strong>${keyword}</strong>. This detailed resource provides valuable insights and practical information to help you understand and make the most of ${keyword}.</p>

<h2>Understanding ${keyword}</h2>

<p>Learning about <em>${keyword}</em> is important for anyone looking to expand their knowledge in this area. This guide covers the essential information you need to know.</p>

<h2>Key Aspects</h2>

<ul>
<li><strong>Fundamentals</strong>: Core concepts and principles</li>
<li><strong>Applications</strong>: Real-world uses and examples</li>
<li><strong>Benefits</strong>: Advantages and positive outcomes</li>
<li><strong>Considerations</strong>: Important factors to keep in mind</li>
</ul>

<h2>Getting Started</h2>

<p>If you're new to ${keyword}, start with the basics and gradually build your understanding. Learning about ${keyword} can be rewarding and beneficial in many ways.</p>

<h2>Expert Resources</h2>

<p>For more detailed information and expert insights about ${keyword}, <a href="${url}" target="_blank" rel="noopener noreferrer">${anchorText}</a> offers comprehensive resources and professional guidance.</p>

<h2>Conclusion</h2>

<p>Whether you're just beginning to learn about ${keyword} or looking to deepen your understanding, this guide provides a solid foundation for your journey.</p>`;
  }
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
      // For demo purposes, generate mock content when API key is not available
      console.log(`${provider} API key not configured, generating demo content...`);

      const demoContent = generateDemoContent(keyword, anchorText, url);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          content: demoContent,
          wordCount: demoContent.split(/\s+/).length,
          provider: `${provider} (Demo)`,
          success: true,
          demo: true
        })
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
