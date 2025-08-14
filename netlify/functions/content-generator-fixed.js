/**
 * Fixed Content Generator - Reliable Netlify Function
 * Addresses 404 errors by providing a working content generation endpoint
 */

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const requestData = JSON.parse(event.body || '{}');
    const { keyword, anchor_text, target_url, word_count = 800, tone = 'professional' } = requestData;

    console.log('🔧 Fixed content generator processing:', { keyword, anchor_text });

    // Check for OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (openaiApiKey) {
      try {
        // Try OpenAI generation
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey: openaiApiKey });

        const prompt = `Write a ${word_count}-word professional article about "${keyword}". 
        Include a natural mention of "${anchor_text}" that should link to ${target_url}. 
        Make the content informative, engaging, and SEO-friendly. 
        Format with clear paragraphs and structure.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: Math.min(4000, word_count * 2),
          temperature: 0.7,
        });

        const generatedContent = completion.choices[0]?.message?.content || '';
        
        // Ensure anchor text is properly linked
        let finalContent = generatedContent;
        if (anchor_text && !finalContent.includes(`[${anchor_text}]`)) {
          finalContent = finalContent.replace(
            new RegExp(anchor_text, 'i'),
            `[${anchor_text}](${target_url})`
          );
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: {
              title: `Complete Guide to ${keyword}`,
              content: finalContent,
              word_count: finalContent.split(' ').length,
              anchor_text_used: anchor_text,
              target_url_used: target_url
            }
          }),
        };

      } catch (openaiError) {
        console.log('OpenAI failed, using fallback:', openaiError.message);
        // Fall through to fallback generation
      }
    }

    // Fallback content generation (when OpenAI is not available)
    console.log('🎭 Using fallback content generation');
    
    const fallbackContent = `# ${keyword}: A Comprehensive Guide

${keyword} has become increasingly important in today's digital landscape. Understanding the fundamentals and best practices can make a significant difference in your success.

## What You Need to Know About ${keyword}

When working with ${keyword}, there are several key factors to consider. The most successful approaches typically involve a combination of strategy, implementation, and continuous optimization.

## Best Practices and Strategies

Here are some proven strategies for ${keyword}:

1. **Research and Planning**: Before diving in, it's crucial to understand your goals and target audience.

2. **Implementation**: Focus on quality over quantity when implementing your ${keyword} strategy.

3. **Optimization**: Continuously monitor and refine your approach based on results and feedback.

## Professional Resources

For those looking to dive deeper into ${keyword}, [${anchor_text}](${target_url}) provides valuable insights and tools that can help accelerate your progress.

## Advanced Techniques

As you become more experienced with ${keyword}, you can explore advanced techniques that can give you a competitive edge. These methods require more time and effort but often yield better results.

## Measuring Success

Success with ${keyword} can be measured through various metrics. Regular monitoring helps ensure you're on the right track and allows for timely adjustments when needed.

## Conclusion

${keyword} continues to evolve, and staying informed about the latest trends and best practices is essential for long-term success. By following the strategies outlined in this guide, you'll be well-positioned to achieve your goals.

Remember that consistency and patience are key when working with ${keyword}. Results may not be immediate, but with persistence and the right approach, you can achieve significant improvements over time.`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          title: `Complete Guide to ${keyword}`,
          content: fallbackContent,
          word_count: fallbackContent.split(' ').length,
          anchor_text_used: anchor_text,
          target_url_used: target_url,
          generation_method: 'fallback'
        }
      }),
    };

  } catch (error) {
    console.error('Content generation error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Content generation failed',
        details: 'Check function logs for more information'
      }),
    };
  }
};
