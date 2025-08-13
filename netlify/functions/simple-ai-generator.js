// Import OpenAI if available for real AI generation
let openai = null;
try {
  const { OpenAI } = require('openai');
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.log('OpenAI not available, using mock generation');
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { 
      action,
      user_id,
      content_type,
      platform,
      target_url,
      anchor_text,
      keywords,
      tone = 'professional',
      style = 'educational',
      word_count = 'medium'
    } = JSON.parse(event.body || '{}');
    
    console.log('🧠 Simple AI Generator request:', { 
      action, content_type, platform, keywords 
    });

    // Validate required parameters
    if (!action || action !== 'generate_content') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid action' })
      };
    }

    if (!content_type || !platform || !target_url || !anchor_text || !keywords) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required parameters',
          required: ['content_type', 'platform', 'target_url', 'anchor_text', 'keywords'],
          received: { content_type, platform, target_url, anchor_text, keywords }
        })
      };
    }

    const startTime = Date.now();
    
    // Generate content
    const generatedContent = await generateContent({
      content_type,
      platform,
      target_url,
      anchor_text,
      keywords: Array.isArray(keywords) ? keywords : [keywords],
      tone,
      style,
      word_count
    });

    const endTime = Date.now();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        content: {
          id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: generatedContent.content,
          title: generatedContent.title,
          content_type,
          platform,
          anchor_text,
          target_url,
          generated_at: new Date().toISOString(),
          generation_time_ms: endTime - startTime
        }
      })
    };

  } catch (error) {
    console.error('Simple AI Generator error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
};

async function generateContent(request) {
  const { keywords, content_type, platform, anchor_text, target_url, tone, style, word_count } = request;
  const primaryKeyword = keywords[0] || 'marketing';
  
  // Generate title based on content type
  const title = generateTitle(content_type, primaryKeyword);
  
  let content;
  
  if (openai && process.env.OPENAI_API_KEY) {
    // Use real OpenAI for content generation
    content = await generateWithOpenAI(request, title);
  } else {
    // Use mock content generation
    content = generateMockContent(request, title);
  }
  
  // Integrate the anchor text link naturally
  const finalContent = integrateLinkNaturally(content, anchor_text, target_url);
  
  return {
    title,
    content: finalContent
  };
}

async function generateWithOpenAI(request, title) {
  try {
    const { keywords, content_type, platform, anchor_text, target_url, tone } = request;
    const primaryKeyword = keywords[0];
    
    // Build prompt based on content type
    let systemPrompt = "You are an expert content writer specializing in creating high-quality, engaging content.";
    let userPrompt = "";
    
    switch (content_type) {
      case 'blog_post':
        userPrompt = `Write a comprehensive blog post about "${primaryKeyword}". The content should be informative, engaging, and written in a ${tone} tone. Include practical insights and actionable advice. Write approximately 400-600 words. Do NOT include any links - they will be added separately.`;
        break;
      case 'article':
        userPrompt = `Write an informative article about "${primaryKeyword}". Focus on providing valuable information and insights in a ${tone} tone. Structure it with clear sections and include practical examples. Write approximately 300-500 words. Do NOT include any links - they will be added separately.`;
        break;
      case 'comment':
        userPrompt = `Write an engaging comment about "${primaryKeyword}". The comment should add value to a discussion, be written in a ${tone} tone, and be conversational yet informative. Keep it concise but meaningful, around 50-150 words. Do NOT include any links - they will be added separately.`;
        break;
      default:
        userPrompt = `Write content about "${primaryKeyword}" in a ${tone} tone. Make it informative and engaging. Write approximately 300-400 words. Do NOT include any links - they will be added separately.`;
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI generation error:', error);
    // Fallback to mock generation
    return generateMockContent(request, title);
  }
}

function generateMockContent(request, title) {
  const { keywords, content_type, tone } = request;
  const primaryKeyword = keywords[0] || 'marketing';
  
  let content = "";
  
  switch (content_type) {
    case 'blog_post':
      content = `# ${title}

${primaryKeyword} has become increasingly important in today's digital landscape. Understanding the fundamentals and best practices can significantly impact your success.

## Key Benefits

When implementing effective ${primaryKeyword} strategies, businesses typically see:

- Improved performance metrics
- Better audience engagement  
- Enhanced brand visibility
- Stronger competitive positioning

## Getting Started

The first step in mastering ${primaryKeyword} is to understand your target audience. Research their needs, preferences, and pain points to create more targeted approaches.

Next, develop a comprehensive strategy that aligns with your business goals. This should include clear objectives, timelines, and success metrics.

## Best Practices

Here are some proven strategies for ${primaryKeyword}:

1. **Focus on Quality**: Always prioritize quality over quantity in your efforts.
2. **Stay Consistent**: Regular, consistent efforts yield better long-term results.
3. **Monitor Performance**: Track key metrics to understand what's working.
4. **Adapt and Improve**: Be ready to adjust your approach based on data.

## Conclusion

Success with ${primaryKeyword} requires patience, consistency, and continuous learning. By following these guidelines and staying up-to-date with industry trends, you'll be well-positioned to achieve your goals.`;
      break;
      
    case 'article':
      content = `# ${title}

Understanding ${primaryKeyword} is essential for anyone looking to improve their results in this area. This article explores the key concepts and practical applications.

## Overview

${primaryKeyword} encompasses various strategies and techniques that can drive meaningful outcomes. The key is to approach it systematically and with clear objectives.

## Implementation Strategy

To get started with ${primaryKeyword}, consider these steps:

- Research current trends and best practices
- Define your specific goals and metrics
- Develop a structured plan of action
- Execute consistently and monitor results

## Expected Outcomes

When done correctly, ${primaryKeyword} can lead to significant improvements in performance and results. Many professionals report positive changes within the first few months of implementation.

The most successful approaches combine proven techniques with innovative thinking, adapted to specific circumstances and goals.`;
      break;
      
    case 'comment':
      content = `Great insights on ${primaryKeyword}! I've been working in this space for a while and can definitely confirm that the strategies mentioned here are spot-on.

One thing I'd add is the importance of staying consistent with your efforts. ${primaryKeyword} isn't something where you see results overnight, but with patience and the right approach, the results can be really impressive.

Has anyone else here tried implementing these techniques? I'd love to hear about your experiences and any additional tips you might have discovered along the way.`;
      break;
      
    default:
      content = `${primaryKeyword} is a crucial topic that deserves careful consideration. Understanding the fundamentals and applying best practices can make a significant difference in achieving your goals.

The key to success lies in taking a systematic approach, staying informed about industry trends, and continuously refining your strategies based on results and feedback.`;
  }
  
  return content;
}

function generateTitle(content_type, keyword) {
  const templates = {
    blog_post: [
      `The Complete Guide to ${keyword}`,
      `${keyword}: Everything You Need to Know`,
      `Mastering ${keyword}: A Comprehensive Guide`,
      `The Ultimate ${keyword} Resource`
    ],
    article: [
      `Understanding ${keyword}: Key Insights`,
      `${keyword} Explained: A Practical Overview`,
      `Essential ${keyword} Strategies`,
      `${keyword}: Best Practices and Tips`
    ],
    comment: [
      `Re: ${keyword} Discussion`,
      `Thoughts on ${keyword}`,
      `${keyword} Experience`,
      `Adding to the ${keyword} conversation`
    ]
  };

  const typeTemplates = templates[content_type] || templates.blog_post;
  return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
}

function integrateLinkNaturally(content, anchorText, targetUrl) {
  // Find a natural place to insert the link (usually in the middle of the content)
  const paragraphs = content.split('\n\n');
  const targetParagraphIndex = Math.floor(paragraphs.length / 2);
  
  // Create a natural link mention
  const linkMention = ` For additional insights and resources, check out this guide on [${anchorText}](${targetUrl}).`;
  
  // Insert the link at the end of the target paragraph
  if (paragraphs[targetParagraphIndex]) {
    paragraphs[targetParagraphIndex] += linkMention;
  } else {
    // Fallback: add to the end
    paragraphs.push(`For more information on this topic, visit [${anchorText}](${targetUrl}).`);
  }
  
  return paragraphs.join('\n\n');
}
