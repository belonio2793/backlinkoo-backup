const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Get environment variables with fallbacks to different naming conventions
const SUPABASE_URL = process.env.SUPABASE_URL ||
                    process.env.VITE_SUPABASE_URL ||
                    'https://dfhanacsmsvvkpunurnp.supabase.co';

const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ||
                         process.env.VITE_SUPABASE_ANON_KEY ||
                         process.env.SUPABASE_SERVICE_ROLE_KEY ||
                         'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2NDcsImV4cCI6MjA2ODUzMjY0N30.MZcB4P_TAOOTktXSG7bNK5BsIMAf1bKXVgT8ZZqa5RY';

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY');
  console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
}

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

exports.handler = async (event, context) => {
  console.log('🚀 Blog generation function called:', {
    method: event.httpMethod,
    path: event.path,
    hasSupabase: !!supabase,
    envVars: {
      hasSupabaseUrl: !!SUPABASE_URL,
      hasSupabaseKey: !!SUPABASE_ANON_KEY,
      supabaseUrlLength: SUPABASE_URL?.length,
      supabaseKeyLength: SUPABASE_ANON_KEY?.length
    }
  });

  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    console.warn('⚠️ Invalid method:', event.httpMethod);
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  // Check if Supabase is configured
  if (!supabase) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: 'Server configuration error: Database not available. Please contact support.'
      })
    };
  }

  try {
    const { destinationUrl, keyword, userId, anchorText } = JSON.parse(event.body);

    // Validate input
    if (!destinationUrl || !keyword) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: false, error: 'Missing destinationUrl or keyword' })
      };
    }

    // Validate URL format
    try {
      new URL(destinationUrl);
    } catch (e) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: false, error: 'Invalid URL format' })
      };
    }

    // Generate AI content using ChatGPT structure
    const aiContent = await generateChatGPTBlogContent(destinationUrl, keyword, anchorText);
    
    // Create unique slug
    const slug = `${keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomBytes(4).toString('hex')}`;
    
    // Prepare blog post data
    const blogPost = {
      id: `blog_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      user_id: userId || null,
      slug,
      title: aiContent.title,
      content: aiContent.content,
      meta_description: aiContent.metaDescription,
      excerpt: aiContent.excerpt,
      keywords: [keyword, ...extractKeywordsFromContent(aiContent.content)],
      target_url: destinationUrl,
      published_url: `${process.env.URL || process.env.DEPLOY_URL || 'https://backlinkoo.com'}/blog/${slug}`,
      status: 'published',
      is_trial_post: !userId,
      expires_at: !userId ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
      view_count: 0,
      seo_score: aiContent.seoScore || 85,
      contextual_links: aiContent.contextualLinks || [],
      reading_time: Math.ceil(aiContent.content.length / 200),
      word_count: aiContent.content.split(' ').length,
      featured_image: `https://images.unsplash.com/1600x900/?${encodeURIComponent(keyword)}`,
      author_name: 'Backlinkoo Team',
      author_avatar: '/placeholder.svg',
      tags: generateTags(keyword, destinationUrl),
      category: categorizeContent(keyword),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString()
    };

    // Save to Supabase
    const { data, error } = await supabase
      .from('published_blog_posts')
      .insert(blogPost)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: false, error: 'Failed to save blog post' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        slug,
        blogPost: data,
        publishedUrl: blogPost.published_url
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
};

async function generateChatGPTBlogContent(destinationUrl, keyword, anchorText) {
  const finalAnchorText = anchorText || keyword;
  const domain = new URL(destinationUrl).hostname.replace('www.', '');

  // Use OpenAI for primary content generation with ChatGPT structure
  const aiContent = await generateWithOpenAI(destinationUrl, keyword, finalAnchorText, domain);

  // If OpenAI fails, use ChatGPT structured fallback
  if (!aiContent.content) {
    return generateChatGPTFallbackContent(destinationUrl, keyword, finalAnchorText, domain);
  }

  return aiContent;
}

async function generateWithOpenAI(destinationUrl, keyword, anchorText, domain) {
  // Check for OpenAI API key first, then try other providers
  const openaiKey = process.env.OPENAI_API_KEY;
  const grokKey = process.env.GROK_API_KEY;
  const cohereKey = process.env.COHERE_API_KEY;

  if (!openaiKey && !grokKey && !cohereKey) {
    console.warn('No AI API keys configured, using fallback content');
    return generateFallbackContent(destinationUrl, keyword);
  }

  // Try OpenAI first if available
  if (openaiKey) {
    console.log('🤖 Using OpenAI for content generation');
    return await tryOpenAI(destinationUrl, keyword, openaiKey);
  }

  // Try Grok as fallback
  if (grokKey) {
    console.log('⚡ Using Grok for content generation');
    return await tryGrok(destinationUrl, keyword, grokKey);
  }

  // Try Cohere as final fallback
  if (cohereKey) {
    console.log('🔥 Using Cohere for content generation');
    return await tryCohere(destinationUrl, keyword, cohereKey);
  }

  console.warn('All AI providers failed, using fallback content');
  return generateFallbackContent(destinationUrl, keyword);
}

async function tryOpenAI(destinationUrl, keyword, apiKey) {

  try {
    const domain = new URL(destinationUrl).hostname.replace('www.', '');
    
    const prompt = `Write a comprehensive, SEO-optimized blog post about "${keyword}" that naturally mentions and links to ${destinationUrl}. 

Requirements:
- 1200+ words
- Professional, informative tone
- Include the keyword "${keyword}" naturally throughout
- Add 2-3 contextual backlinks to ${destinationUrl} with relevant anchor text
- Structure with clear headings (H2, H3)
- Include actionable tips and insights
- Make it valuable for readers interested in ${keyword}

Format the response as JSON with:
{
  "title": "Engaging title with keyword",
  "content": "Full HTML formatted blog post content",
  "metaDescription": "SEO meta description under 160 chars",
  "excerpt": "Brief excerpt for preview (150 chars)",
  "contextualLinks": [{"anchor": "anchor text", "url": "${destinationUrl}"}],
  "seoScore": 85
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content generated from OpenAI');
    }

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || `Complete Guide to ${keyword}`,
        content: parsed.content || content,
        metaDescription: parsed.metaDescription || `Learn everything about ${keyword} and boost your results with expert insights.`,
        excerpt: parsed.excerpt || `Discover the ultimate guide to ${keyword} with actionable tips and strategies.`,
        contextualLinks: parsed.contextualLinks || [{ anchor: keyword, url: destinationUrl }],
        seoScore: parsed.seoScore || 85
      };
    } catch (parseError) {
      // If JSON parsing fails, use content as is
      return {
        title: `The Ultimate Guide to ${keyword}`,
        content: content,
        metaDescription: `Learn everything about ${keyword} and boost your results with expert insights.`,
        excerpt: `Discover the ultimate guide to ${keyword} with actionable tips and strategies.`,
        contextualLinks: [{ anchor: keyword, url: destinationUrl }],
        seoScore: 85
      };
    }

  } catch (error) {
    console.error('OpenAI generation failed:', error);
    throw error; // Let the calling function handle the fallback
  }
}

async function tryGrok(destinationUrl, keyword, apiKey) {
  try {
    const domain = new URL(destinationUrl).hostname.replace('www.', '');

    const prompt = `Write a comprehensive, SEO-optimized blog post about "${keyword}" that naturally mentions and links to ${destinationUrl}.

Requirements:
- 1200+ words
- Professional, informative tone
- Include the keyword "${keyword}" naturally throughout
- Add 2-3 contextual backlinks to ${destinationUrl} with relevant anchor text
- Structure with clear headings (H2, H3)
- Include actionable tips and insights
- Make it valuable for readers interested in ${keyword}

Format the response as JSON with:
{
  "title": "Engaging title with keyword",
  "content": "Full HTML formatted blog post content",
  "metaDescription": "SEO meta description under 160 chars",
  "excerpt": "Brief excerpt for preview (150 chars)",
  "contextualLinks": [{"anchor": "anchor text", "url": "${destinationUrl}"}],
  "seoScore": 85
}`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'grok-beta',
        stream: false,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated from Grok');
    }

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || `Complete Guide to ${keyword}`,
        content: parsed.content || content,
        metaDescription: parsed.metaDescription || `Learn everything about ${keyword} and boost your results with expert insights.`,
        excerpt: parsed.excerpt || `Discover the ultimate guide to ${keyword} with actionable tips and strategies.`,
        contextualLinks: parsed.contextualLinks || [{ anchor: keyword, url: destinationUrl }],
        seoScore: parsed.seoScore || 85
      };
    } catch (parseError) {
      return {
        title: `The Ultimate Guide to ${keyword}`,
        content: content,
        metaDescription: `Learn everything about ${keyword} and boost your results with expert insights.`,
        excerpt: `Discover the ultimate guide to ${keyword} with actionable tips and strategies.`,
        contextualLinks: [{ anchor: keyword, url: destinationUrl }],
        seoScore: 85
      };
    }

  } catch (error) {
    console.error('Grok generation failed:', error);
    throw error;
  }
}

async function tryCohere(destinationUrl, keyword, apiKey) {
  try {
    const domain = new URL(destinationUrl).hostname.replace('www.', '');

    const prompt = `Write a comprehensive, SEO-optimized blog post about "${keyword}" that naturally mentions and links to ${destinationUrl}. Include the keyword naturally throughout, add contextual backlinks, and structure with clear headings. Make it valuable for readers interested in ${keyword}.`;

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'command',
        prompt: prompt,
        max_tokens: 3000,
        temperature: 0.7,
        k: 0,
        stop_sequences: [],
        return_likelihoods: 'NONE'
      })
    });

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.generations?.[0]?.text;

    if (!content) {
      throw new Error('No content generated from Cohere');
    }

    return {
      title: `The Ultimate Guide to ${keyword}`,
      content: `<h1>The Ultimate Guide to ${keyword}</h1>\n\n${content.replace(/\n/g, '</p>\n<p>')}`,
      metaDescription: `Learn everything about ${keyword} and boost your results with expert insights.`,
      excerpt: `Discover the ultimate guide to ${keyword} with actionable tips and strategies.`,
      contextualLinks: [{ anchor: keyword, url: destinationUrl }],
      seoScore: 85
    };

  } catch (error) {
    console.error('Cohere generation failed:', error);
    throw error;
  }
}

function generateFallbackContent(destinationUrl, keyword) {
  const domain = new URL(destinationUrl).hostname.replace('www.', '');
  
  const title = `The Ultimate Guide to ${keyword}: Expert Insights and Strategies`;
  const content = `
    <h1>${title}</h1>
    
    <p>In today's competitive digital landscape, understanding <strong>${keyword}</strong> is crucial for success. This comprehensive guide will walk you through everything you need to know about ${keyword}, providing actionable insights and proven strategies.</p>
    
    <h2>What is ${keyword}?</h2>
    <p>${keyword} has become increasingly important in recent years. Whether you're a beginner or looking to advance your knowledge, this guide covers all the essential aspects you need to master.</p>
    
    <h2>Why ${keyword} Matters</h2>
    <p>The importance of ${keyword} cannot be overstated. Industry leaders and experts consistently emphasize its role in driving results and achieving goals. <a href="${destinationUrl}" target="_blank">${domain}</a> has been at the forefront of ${keyword} innovation, providing valuable solutions and insights.</p>
    
    <h2>Key Strategies for ${keyword}</h2>
    <p>Here are the most effective strategies for ${keyword}:</p>
    <ul>
      <li><strong>Research and Planning:</strong> Understanding your ${keyword} objectives is the first step to success.</li>
      <li><strong>Implementation:</strong> Execute your ${keyword} strategy with precision and consistency.</li>
      <li><strong>Optimization:</strong> Continuously improve your ${keyword} approach based on data and results.</li>
      <li><strong>Monitoring:</strong> Track your ${keyword} performance and make adjustments as needed.</li>
    </ul>
    
    <h2>Best Practices for ${keyword}</h2>
    <p>To maximize your ${keyword} results, consider these proven best practices. Many successful businesses, including those featured on <a href="${destinationUrl}" target="_blank">${domain}</a>, have implemented these strategies with great success.</p>
    
    <h3>Getting Started with ${keyword}</h3>
    <p>If you're new to ${keyword}, start with these fundamental steps:</p>
    <ol>
      <li>Define your ${keyword} goals and objectives</li>
      <li>Research your target audience and their ${keyword} needs</li>
      <li>Develop a comprehensive ${keyword} strategy</li>
      <li>Create high-quality content focused on ${keyword}</li>
      <li>Measure and analyze your ${keyword} performance</li>
    </ol>
    
    <h2>Advanced ${keyword} Techniques</h2>
    <p>Once you've mastered the basics, these advanced ${keyword} techniques can help you achieve even better results. The experts at <a href="${destinationUrl}" target="_blank">${domain}</a> recommend focusing on continuous learning and adaptation in the ${keyword} space.</p>
    
    <h2>Common ${keyword} Mistakes to Avoid</h2>
    <p>Learning from common ${keyword} mistakes can save you time and resources. Here are the most frequent pitfalls to avoid when working with ${keyword}.</p>
    
    <h2>Future of ${keyword}</h2>
    <p>The ${keyword} landscape continues to evolve rapidly. Staying informed about trends and emerging technologies in ${keyword} is essential for long-term success.</p>
    
    <h2>Conclusion</h2>
    <p>Mastering ${keyword} requires dedication, continuous learning, and the right strategies. By following the guidelines in this comprehensive guide, you'll be well-equipped to achieve your ${keyword} objectives and drive meaningful results.</p>
  `;
  
  return {
    title,
    content,
    metaDescription: `Master ${keyword} with this comprehensive guide. Learn proven strategies, best practices, and expert tips to achieve better results.`,
    excerpt: `Discover everything you need to know about ${keyword} in this ultimate guide with actionable strategies and expert insights.`,
    contextualLinks: [
      { anchor: keyword, url: destinationUrl },
      { anchor: domain, url: destinationUrl }
    ],
    seoScore: 82
  };
}

function extractKeywordsFromContent(content) {
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

function generateTags(keyword, targetUrl) {
  const domain = new URL(targetUrl).hostname.replace('www.', '');
  const keywordTags = keyword.split(' ').slice(0, 2);
  return [...keywordTags, domain, 'SEO', 'digital marketing'];
}

function categorizeContent(keyword) {
  const lowerKeyword = keyword.toLowerCase();
  
  if (lowerKeyword.includes('marketing') || lowerKeyword.includes('seo')) {
    return 'Digital Marketing';
  } else if (lowerKeyword.includes('tech') || lowerKeyword.includes('software')) {
    return 'Technology';
  } else if (lowerKeyword.includes('business') || lowerKeyword.includes('startup')) {
    return 'Business';
  } else if (lowerKeyword.includes('health') || lowerKeyword.includes('fitness')) {
    return 'Health & Wellness';
  } else if (lowerKeyword.includes('travel') || lowerKeyword.includes('tourism')) {
    return 'Travel';
  } else if (lowerKeyword.includes('finance') || lowerKeyword.includes('money')) {
    return 'Finance';
  } else {
    return 'General';
  }
}
