const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Contextual comment generation called');
    const { blogTitle, blogContent, keyword, targetUrl } = JSON.parse(event.body || '{}');
    console.log('Request data:', { blogTitle, keyword, contentLength: blogContent?.length });

    if (!blogTitle || !keyword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OpenAI API not configured' })
      };
    }

    console.log('Generating contextual comment with OpenAI...');

    // Create a contextual prompt based on the blog content
    const contextualPrompt = `You are writing a thoughtful, authentic comment on a blog post. 

Blog Post Title: "${blogTitle}"
Blog Content Preview: "${blogContent.substring(0, 500)}..."
Your Target Keyword: "${keyword}"
Your Website: "${targetUrl}"

Write a natural, engaging comment that:
1. Specifically references something from the blog post content
2. Adds genuine value to the discussion
3. Naturally incorporates your target keyword "${keyword}"
4. Subtly mentions your website "${targetUrl}" as a helpful resource (not spammy)
5. Is 2-3 sentences maximum
6. Sounds like a real person who actually read the article
7. Avoids obvious promotional language

Make it conversational and authentic - as if you're genuinely engaged with the content.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an expert at writing authentic, contextual blog comments that add value to discussions while naturally incorporating relevant keywords and resources. Your comments should never sound promotional or spammy.`
        },
        {
          role: 'user',
          content: contextualPrompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
      frequency_penalty: 0.3,
      presence_penalty: 0.2
    });

    console.log('OpenAI API response received');
    const comment = completion.choices[0]?.message?.content?.trim();
    console.log('Generated contextual comment:', comment);

    if (!comment) {
      console.error('No comment generated from OpenAI response');
      throw new Error('No comment generated');
    }

    // Quality checks
    if (comment.length < 20) {
      throw new Error('Generated comment too short');
    }

    if (comment.length > 500) {
      throw new Error('Generated comment too long');
    }

    // Check if comment actually references the content
    const hasContext = blogTitle.split(' ').some(word => 
      word.length > 3 && comment.toLowerCase().includes(word.toLowerCase())
    ) || blogContent.split(' ').slice(0, 20).some(word => 
      word.length > 4 && comment.toLowerCase().includes(word.toLowerCase())
    );

    console.log('Comment contextual relevance check:', hasContext);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        comment,
        keyword,
        blogTitle,
        hasContext,
        targetUrl
      })
    };

  } catch (error) {
    console.error('Error generating contextual comment:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    // Return a fallback contextual comment
    const { blogTitle, keyword, targetUrl } = JSON.parse(event.body || '{}');
    
    const fallbackComments = [
      `Really appreciate this perspective on ${blogTitle || keyword}. The insights about ${keyword} align perfectly with what I've been exploring. I've found some complementary resources at ${targetUrl} that readers might find valuable too.`,
      `This article on ${blogTitle || keyword} brings up excellent points about ${keyword}. Thanks for sharing such detailed analysis. For anyone looking for additional ${keyword} resources, I've had good experiences with ${targetUrl}.`,
      `Great breakdown of ${keyword} concepts in this piece about ${blogTitle || keyword}. The practical approach you've outlined here mirrors some strategies I've been implementing. ${targetUrl} has been another helpful resource in this space.`,
      `Your insights on ${keyword} in "${blogTitle || keyword}" are spot-on. This is exactly the kind of practical guidance that makes a difference. I've been documenting similar findings at ${targetUrl} - would love to continue this discussion.`,
      `Excellent work diving deep into ${keyword} here. The way you've explained "${blogTitle || keyword}" makes it really accessible. This complements some research I've been sharing at ${targetUrl} nicely.`
    ];
    
    const fallbackComment = fallbackComments[Math.floor(Math.random() * fallbackComments.length)];
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        comment: fallbackComment,
        keyword: keyword || 'unknown',
        blogTitle: blogTitle || 'unknown',
        fallback: true,
        error: error.message
      })
    };
  }
};
