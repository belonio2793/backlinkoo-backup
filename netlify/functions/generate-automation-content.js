const { OpenAI } = require('openai');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const { keyword, anchorText, targetUrl } = JSON.parse(event.body);

    // Validate required parameters
    if (!keyword || !anchorText || !targetUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required parameters: keyword, anchorText, and targetUrl are required' 
        })
      };
    }

    // Initialize OpenAI with server-side API key
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY environment variable not set');
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' 
        })
      };
    }

    // Define the three different prompts
    const prompts = [
      {
        type: 'article',
        prompt: `Generate a 1000 word article on ${keyword} including the ${anchorText} hyperlinked to ${targetUrl}. Write in a professional, informative style with proper SEO optimization. Include an introduction, main body with multiple sections, and a conclusion. Make sure the anchor text "${anchorText}" appears naturally in the content and would logically link to the provided URL.`
      },
      {
        type: 'blog_post',
        prompt: `Write a 1000 word blog post about ${keyword} with a hyperlinked ${anchorText} linked to ${targetUrl}. Use a conversational, engaging tone suitable for blog readers. Include practical tips, insights, and actionable advice. Naturally incorporate the anchor text "${anchorText}" in a way that makes sense for linking to the target URL.`
      },
      {
        type: 'reader_friendly',
        prompt: `Produce a 1000-word reader friendly post on ${keyword} that links ${anchorText} to ${targetUrl}. Write in an accessible, easy-to-understand style with clear explanations. Break down complex concepts and include examples where helpful. Ensure the anchor text "${anchorText}" fits naturally within the content flow and provides value when linked to the target URL.`
      }
    ];

    // Randomly select one prompt
    const randomIndex = Math.floor(Math.random() * prompts.length);
    const selectedPrompt = prompts[randomIndex];

    console.log(`Randomly selected prompt type: ${selectedPrompt.type}`);

    const results = [];

    // Generate content for the randomly selected prompt
    const { type, prompt } = selectedPrompt;
    try {
      console.log(`Generating ${type} content for keyword: ${keyword}`);

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional content writer specializing in SEO-optimized articles and blog posts. Write engaging, informative content that naturally incorporates anchor text for backlinking purposes. Always aim for the specified word count and maintain high quality throughout.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error(`No content generated for ${type}`);
      }

      // Format content with proper anchor text linking
      const formattedContent = formatContentWithAnchorLink(content, anchorText, targetUrl);
      const wordCount = countWords(formattedContent);

      results.push({
        type,
        content: formattedContent,
        wordCount
      });

      console.log(`Successfully generated ${type} content (${wordCount} words)`);

    } catch (error) {
      console.error(`Error generating ${type} content:`, error);
      throw new Error(`Failed to generate ${type} content: ${error.message}`);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        content: results
      })
    };

  } catch (error) {
    console.error('Content generation error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate content'
      })
    };
  }
};

/**
 * Format content to include proper HTML anchor link
 */
function formatContentWithAnchorLink(content, anchorText, targetUrl) {
  // Find the anchor text in the content and replace with HTML link
  const anchorLink = `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>`;
  
  // Replace the first occurrence of the anchor text with the HTML link
  const formattedContent = content.replace(
    new RegExp(escapeRegExp(anchorText), 'i'),
    anchorLink
  );

  // Convert to basic HTML formatting
  return convertToHtml(formattedContent);
}

/**
 * Convert plain text to basic HTML formatting
 */
function convertToHtml(text) {
  // Split into paragraphs and wrap with <p> tags
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  
  return paragraphs
    .map(paragraph => {
      // Check if it's a heading (starts with #)
      if (paragraph.trim().startsWith('#')) {
        const level = (paragraph.match(/^#+/) || [''])[0].length;
        const headingText = paragraph.replace(/^#+\s*/, '');
        return `<h${Math.min(level, 6)}>${headingText.trim()}</h${Math.min(level, 6)}>`;
      }
      
      // Regular paragraph
      return `<p>${paragraph.trim()}</p>`;
    })
    .join('\n\n');
}

/**
 * Count words in text
 */
function countWords(text) {
  // Remove HTML tags and count words
  const plainText = text.replace(/<[^>]*>/g, '');
  return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Escape special characters for regex
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
