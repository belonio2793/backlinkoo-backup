/**
 * Netlify Function for OpenAI Content Generation
 * Handles all OpenAI API calls server-side with rotating prompts
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Rotating prompt templates
const PROMPT_TEMPLATES = [
  "Generate a blog post on {{keyword}} including the {{anchor_text}} hyperlinked to {{url}}",
  "Write a article about {{keyword}} with a hyperlinked {{anchor_text}} linked to {{url}}", 
  "Produce a write up on {{keyword}} that links {{anchor_text}} to {{url}}"
];

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
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Check for OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured in Netlify environment');
    }

    // Parse request body
    const requestBody = JSON.parse(event.body);
    const { 
      keyword, 
      anchor_text, 
      url, 
      campaign_id, 
      word_count = 800,
      tone = 'professional',
      user_id 
    } = requestBody;

    // Validate required fields
    if (!keyword || !anchor_text || !url || !campaign_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: keyword, anchor_text, url, campaign_id' 
        }),
      };
    }

    // Log the content generation request
    console.log('🎯 Content Generation Request:', {
      campaign_id,
      keyword: keyword.substring(0, 50),
      anchor_text: anchor_text.substring(0, 30),
      url: url.substring(0, 50),
      word_count,
      user_id
    });

    // Select rotating prompt template
    const promptIndex = Math.floor(Math.random() * PROMPT_TEMPLATES.length);
    const selectedTemplate = PROMPT_TEMPLATES[promptIndex];
    
    // Replace placeholders in template
    const basePrompt = selectedTemplate
      .replace('{{keyword}}', keyword)
      .replace('{{anchor_text}}', anchor_text)
      .replace('{{url}}', url);

    // Create comprehensive prompt
    const fullPrompt = `${basePrompt}

REQUIREMENTS:
- Length: approximately ${word_count} words
- Tone: ${tone} and engaging
- Format: Use markdown formatting with headers (##), bold text (**text**), and lists
- Structure: Introduction, 3-4 main sections with subheadings, conclusion
- SEO optimized: Natural keyword integration, engaging title
- Include exactly ONE hyperlink: [${anchor_text}](${url})
- Make the anchor text placement natural and contextual

OUTPUT FORMAT:
TITLE: [Your engaging title here]

CONTENT:
[Your full blog post content in markdown format with the anchor link integrated naturally]

Focus on providing genuine value while naturally incorporating the keyword and required anchor link.`;

    console.log('📝 Using prompt template:', promptIndex + 1, '/', PROMPT_TEMPLATES.length);
    console.log('🔗 Generated prompt preview:', basePrompt);

    // Make request to OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional content writer specializing in SEO-optimized blog posts. Create engaging, informative content that naturally incorporates provided keywords and anchor text links.'
          },
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        max_tokens: Math.min(4000, Math.ceil(word_count * 1.5)),
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0.2,
        presence_penalty: 0.1
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedText = openaiData.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No content generated from OpenAI');
    }

    // Parse the generated content
    const titleMatch = generatedText.match(/TITLE:\s*(.+?)(?:\n|$)/i);
    const contentMatch = generatedText.match(/CONTENT:\s*([\s\S]+)/i);
    
    const title = titleMatch?.[1]?.trim() || `${keyword} - Complete Guide`;
    const content = contentMatch?.[1]?.trim() || generatedText;
    
    // Check for anchor link
    const anchorLinkRegex = new RegExp(`\\[([^\\]]+)\\]\\(${escapeRegExp(url)}\\)`, 'i');
    const hasAnchorLink = anchorLinkRegex.test(content);
    
    // Extract the actual anchor text used
    const anchorMatch = content.match(anchorLinkRegex);
    const actualAnchorText = anchorMatch?.[1] || anchor_text;
    
    // Count words (approximate)
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

    // Log successful generation
    console.log('✅ Content generated successfully:', {
      campaign_id,
      title: title.substring(0, 50),
      word_count: wordCount,
      has_anchor_link: hasAnchorLink,
      prompt_template_used: promptIndex + 1
    });

    // Log to automation_logs table if user_id provided
    if (user_id) {
      try {
        await supabase
          .from('automation_logs')
          .insert({
            timestamp: new Date().toISOString(),
            level: 'info',
            category: 'article_submission',
            message: 'Content generated successfully via Netlify function',
            data: JSON.stringify({
              campaign_id,
              word_count: wordCount,
              has_anchor_link: hasAnchorLink,
              prompt_template: promptIndex + 1,
              title: title.substring(0, 100)
            }),
            campaign_id,
            user_id,
            session_id: `netlify_${Date.now()}`,
            environment: 'production'
          });
      } catch (logError) {
        console.warn('Failed to log to database:', logError.message);
      }
    }

    // Return successful response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          title,
          content,
          hasAnchorLink,
          anchorText: hasAnchorLink ? actualAnchorText : undefined,
          wordCount,
          targetUrl: url,
          promptTemplate: selectedTemplate,
          promptIndex: promptIndex + 1
        }
      }),
    };

  } catch (error) {
    console.error('❌ Content generation error:', error);
    
    // Log error to database if possible
    try {
      const requestBody = JSON.parse(event.body);
      if (requestBody.user_id) {
        await supabase
          .from('automation_logs')
          .insert({
            timestamp: new Date().toISOString(),
            level: 'error',
            category: 'api',
            message: 'Content generation failed in Netlify function',
            data: JSON.stringify({
              error: error.message,
              campaign_id: requestBody.campaign_id
            }),
            campaign_id: requestBody.campaign_id,
            user_id: requestBody.user_id,
            error_stack: error.stack,
            session_id: `netlify_${Date.now()}`,
            environment: 'production'
          });
      }
    } catch (logError) {
      console.warn('Failed to log error to database:', logError.message);
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Content generation failed'
      }),
    };
  }
};

// Helper function to escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
