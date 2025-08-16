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
    const requestBody = JSON.parse(event.body);
    const {
      prompt,
      keyword,
      anchor_text,
      target_url,
      word_count = 1000,
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      max_tokens = 2000
    } = requestBody;

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

    // Enhanced prompt for clean HTML generation
    const enhancedPrompt = `${prompt}

CRITICAL OUTPUT REQUIREMENTS:
- Generate clean HTML content (NO <html>, <head>, or <body> tags)
- Use <h2> for major sections, <h3> for subsections
- Wrap ALL text in proper <p> tags (never leave text unwrapped)
- Use <ul>/<ol> and <li> for lists
- Include anchor text "${anchor_text}" as: <a href="${target_url}" target="_blank" rel="noopener noreferrer">${anchor_text}</a>
- Target approximately ${word_count} words
- NO markdown syntax (**, ##, etc.) - use proper HTML tags only
- NO HTML entities like &lt; or &gt; unless absolutely necessary
- NO malformed patterns or broken formatting

Return only the body content as clean, valid HTML that displays correctly without any additional processing.`;

    console.log('🚀 Sending request to OpenAI...');

    console.log(`🤖 Using model: ${model} with temperature: ${temperature}`);

    const completion = await openai.chat.completions.create({
      model: model, // Support dynamic model selection (ChatGPT 3.5 Turbo by default)
      messages: [
        {
          role: 'system',
          content: 'You are a professional content writer specializing in creating clean, well-formatted HTML content. Generate articles with proper HTML structure using semantic tags. CRITICAL: Return only clean HTML content - no markdown, no malformed HTML entities, no broken formatting. Use <h2> for major sections, <h3> for subsections, <p> for paragraphs, and proper HTML lists. Never mix markdown syntax with HTML tags.'
        },
        {
          role: 'user',
          content: `${enhancedPrompt}\n\nIMPORTANT:
1. Return ONLY clean HTML content (no title, no markdown, no malformed HTML)
2. Include the anchor text "${anchor_text}" naturally as: <a href="${target_url}" target="_blank" rel="noopener noreferrer">${anchor_text}</a>
3. Use proper HTML structure: <h2>, <h3>, <p>, <ul>/<ol>, <li>
4. NO markdown symbols or HTML entities that break display
5. Content must display correctly without any post-processing`
        }
      ],
      max_tokens: max_tokens,
      temperature: temperature,
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
