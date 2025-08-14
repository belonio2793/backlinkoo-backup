import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
    };
  }

  try {
    const { prompt, keyword, anchor_text, target_url, word_count = 1000 } = JSON.parse(event.body);

    console.log('🤖 AI Content Generation Request:', {
      prompt: prompt.substring(0, 100) + '...',
      keyword,
      anchor_text,
      target_url,
      word_count
    });

    if (!prompt || !keyword || !anchor_text || !target_url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: prompt, keyword, anchor_text, target_url'
        }),
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'OpenAI API not configured'
        }),
      };
    }

    // Enhanced prompt for better content generation
    const enhancedPrompt = `${prompt}

Please ensure the article:
- Is exactly around ${word_count} words
- Has a compelling title
- Is well-structured with clear headings
- Includes the anchor text "${anchor_text}" naturally linked to ${target_url}
- Is informative and engaging
- Uses markdown formatting for better readability

Format the response as a complete article with proper markdown formatting.`;

    console.log('🚀 Sending request to OpenAI...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional content writer specializing in creating high-quality, SEO-optimized articles. Always include the specified anchor text as a natural hyperlink in the content.'
        },
        {
          role: 'user',
          content: enhancedPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const generatedContent = completion.choices[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated from OpenAI');
    }

    // Extract title from content (look for # heading or create one)
    let title = '';
    const lines = generatedContent.split('\n');
    const titleLine = lines.find(line => line.startsWith('# '));
    
    if (titleLine) {
      title = titleLine.replace('# ', '').trim();
    } else {
      // Generate a title based on keyword if none found
      title = `The Complete Guide to ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
    }

    // Count words
    const wordCount = generatedContent.trim().split(/\s+/).length;

    // Ensure anchor text is properly linked
    let finalContent = generatedContent;
    const linkPattern = new RegExp(`\\[${anchor_text}\\]\\(${target_url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'gi');
    
    if (!linkPattern.test(finalContent)) {
      // If the link isn't properly formatted, add it
      const linkText = `[${anchor_text}](${target_url})`;
      
      // Try to replace plain anchor text with linked version
      const anchorPattern = new RegExp(`\\b${anchor_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (anchorPattern.test(finalContent)) {
        finalContent = finalContent.replace(anchorPattern, linkText);
      } else {
        // Add the link naturally to the content
        const paragraphs = finalContent.split('\n\n');
        if (paragraphs.length > 2) {
          paragraphs[2] = paragraphs[2] + ` You can learn more about this topic at ${linkText}.`;
          finalContent = paragraphs.join('\n\n');
        }
      }
    }

    console.log('✅ Content generated successfully:', {
      title,
      wordCount,
      hasAnchorLink: finalContent.includes(`[${anchor_text}]`)
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        content: finalContent,
        title,
        word_count: wordCount,
        keyword_used: keyword,
        anchor_text_used: anchor_text,
        target_url_used: target_url
      }),
    };

  } catch (error) {
    console.error('❌ AI Content Generation Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate content',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
};
