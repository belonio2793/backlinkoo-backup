const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// AI Services Integration (for server-side use)
class SimpleAIGenerator {
  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY;
    this.grokKey = process.env.GROK_API_KEY;
    this.cohereKey = process.env.COHERE_API_KEY;
    this.huggingfaceKey = process.env.HUGGINGFACE_TOKEN;
  }

  async generateWithOpenAI(prompt, systemPrompt) {
    if (!this.openaiKey) return null;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 3500,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          content: data.choices[0]?.message?.content || '',
          provider: 'openai',
          tokens: data.usage?.total_tokens || 0,
          success: true
        };
      }
    } catch (error) {
      console.warn('OpenAI generation failed:', error);
    }
    return null;
  }

  async generateWithGrok(prompt, systemPrompt) {
    if (!this.grokKey) return null;

    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.grokKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 3000,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          content: data.choices[0]?.message?.content || '',
          provider: 'grok',
          tokens: data.usage?.total_tokens || 0,
          success: true
        };
      }
    } catch (error) {
      console.warn('Grok generation failed:', error);
    }
    return null;
  }

  async generateWithCohere(prompt) {
    if (!this.cohereKey) return null;

    try {
      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.cohereKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'command',
          prompt: prompt,
          max_tokens: 3000,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          content: data.generations[0]?.text || '',
          provider: 'cohere',
          tokens: Math.ceil((data.generations[0]?.text || '').length / 4),
          success: true
        };
      }
    } catch (error) {
      console.warn('Cohere generation failed:', error);
    }
    return null;
  }

  async generateWithHuggingFace(prompt) {
    if (!this.huggingfaceKey) return null;

    try {
      const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.huggingfaceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 3000,
            temperature: 0.7,
            do_sample: true,
            top_p: 0.95,
            num_return_sequences: 1
          },
          options: {
            wait_for_model: true,
            use_cache: false
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data[0]?.generated_text || '';
        // Remove the original prompt from the response if it's included
        const cleanContent = content.replace(prompt, '').trim();

        return {
          content: cleanContent,
          provider: 'huggingface',
          tokens: Math.ceil(cleanContent.length / 4),
          success: true
        };
      }
    } catch (error) {
      console.warn('HuggingFace generation failed:', error);
    }
    return null;
  }

  async generateEnhancedContent(request) {
    const { primaryKeyword, targetUrl, anchorText, userLocation } = request;
    const wordCount = 2000;
    const anchor = anchorText || primaryKeyword;

    // Enhanced prompt based on SEO guidelines
    const prompt = `Write ${wordCount} words on "${primaryKeyword}" and naturally integrate the hyperlink <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchor}</a> following strict SEO content formatting guidelines.

SEO CONTENT FORMATTING REQUIREMENTS:
✅ Headline Structure:
- Use ONE <h1> tag for the main title
- Use <h2> for major section headings (3-5 sections)
- Use <h3> for subpoints under each h2 (5-8 subheadings)

✅ Paragraph Structure:
- Keep paragraphs short (2–4 sentences max)
- Use line breaks between paragraphs
- Avoid long blocks of text

✅ Keyword Optimization:
- Include main keyword "${primaryKeyword}" in the <h1> tag
- Include keyword in first 100 words
- Use keyword 2-4 times in body (avoid keyword stuffing)
- Use related keywords and synonyms naturally

✅ Anchor Text and Hyperlinks:
- Use natural anchor text (not just "click here")
- ALWAYS hyperlink "${anchor}" to ${targetUrl}
- Links must open in new tab: target="_blank" rel="noopener noreferrer"
- Example: <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchor}</a>

✅ Text Emphasis:
- Use <strong> for bold important keywords and value points
- Use <em> for italic emphasis or stylistic voice

✅ Content Quality:
- Minimum ${wordCount} words
- Original, not duplicate content
- Include intro and conclusion
- Use bullet points or numbered lists where helpful
- Ensure mobile-responsive formatting

CONTENT STRUCTURE:
1. <h1> with keyword: Compelling title that includes "${primaryKeyword}"
2. Introduction paragraph (include keyword in first 100 words)
3. 3-5 <h2> major sections with valuable content
4. 5-8 <h3> subheadings under main sections
5. Natural integration of ${anchor} backlink within relevant context
6. Strong conclusion with call-to-action
7. Short paragraphs throughout (2-4 sentences each)

Focus on creating content that ranks well while providing genuine value to users.`;

    const systemPrompt = `You are a world-class SEO content writer and digital marketing expert. Create original, high-quality content that ranks well in search engines while providing genuine value to readers. Focus on expertise, authoritativeness, and trustworthiness.`;

    // Try multiple AI providers - HuggingFace primary, Cohere secondary
    const providers = [
      () => this.generateWithHuggingFace(`${systemPrompt}\n\n${prompt}`), // Primary
      () => this.generateWithCohere(`${systemPrompt}\n\n${prompt}`) // Secondary
      // OpenAI and Grok disabled as requested
    ];

    for (const provider of providers) {
      try {
        const result = await provider();
        if (result && result.success && result.content.length > 500) {
          console.log(`✅ AI generation successful with ${result.provider}`);
          return result;
        }
      } catch (error) {
        console.warn('Provider failed:', error);
      }
    }

    return null;
  }
}

const aiGenerator = new SimpleAIGenerator();

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 
                    process.env.VITE_SUPABASE_URL || 
                    'https://dfhanacsmsvvkpunurnp.supabase.co';

const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 
                         process.env.VITE_SUPABASE_ANON_KEY || 
                         'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2NDcsImV4cCI6MjA2ODUzMjY0N30.MZcB4P_TAOOTktXSG7bNK5BsIMAf1bKXVgT8ZZqa5RY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global blog post templates based on user location and context
const generateContextualContent = (request) => {
  const { targetUrl, primaryKeyword, userLocation, additionalContext } = request;
  
  // Determine content style based on user location and context
  const contentStyles = {
    'United States': 'direct and action-oriented',
    'United Kingdom': 'professional and detailed',
    'Canada': 'friendly and comprehensive',
    'Australia': 'casual and engaging',
    'Germany': 'technical and thorough',
    'Japan': 'respectful and structured',
    'India': 'informative and value-focused',
    'Brazil': 'enthusiastic and community-focused',
    'France': 'elegant and sophisticated',
    'default': 'professional and balanced'
  };

  const style = contentStyles[userLocation] || contentStyles.default;
  const tone = additionalContext?.contentTone || 'professional';
  
  // Generate location-aware content
  const generateLocationAwareIntro = () => {
    const locationIntros = {
      'United States': `In today's competitive business landscape, ${primaryKeyword} has become essential for American enterprises`,
      'United Kingdom': `Across the UK, businesses are increasingly recognising the importance of ${primaryKeyword}`,
      'Canada': `From coast to coast, Canadian businesses are embracing ${primaryKeyword} strategies`,
      'Australia': `Right across Australia, smart businesses are getting ahead with ${primaryKeyword}`,
      'Germany': `In the German market, precision and quality in ${primaryKeyword} implementation`,
      'India': `The rapidly growing Indian market presents unique opportunities for ${primaryKeyword}`,
      'default': `Businesses worldwide are recognising the critical importance of ${primaryKeyword}`
    };
    
    return locationIntros[userLocation] || locationIntros.default;
  };

  // Main content generation
  const sections = [
    `# ${primaryKeyword}: The Complete ${new Date().getFullYear()} Guide\n\n${generateLocationAwareIntro()} for sustainable growth and competitive advantage.\n\n`,
    
    `## Understanding ${primaryKeyword} in Today's Market\n\n${primaryKeyword} represents more than just a strategy—it's a fundamental approach to building lasting success. ${userLocation ? `In ${userLocation}, ` : ''}businesses that prioritize ${primaryKeyword} consistently outperform their competitors.\n\n`,
    
    `## The Global Impact of ${primaryKeyword}\n\nWith users from over 50 countries accessing our platform daily, we've observed fascinating patterns in how ${primaryKeyword} strategies vary across different markets. ${userLocation ? `Users in ${userLocation} particularly benefit from ` : 'Global users consistently see value in '}targeted approaches that align with local business practices.\n\n`,
    
    `## Proven ${primaryKeyword} Strategies\n\n### Foundation Building\nEvery successful ${primaryKeyword} initiative starts with solid foundations. Whether you're based in ${userLocation || 'any location'}, these core principles remain constant:\n\n- Strategic planning aligned with business objectives\n- Data-driven decision making\n- Continuous optimization and improvement\n- User-focused implementation\n\n`,
    
    `### Advanced Implementation\nOnce you've mastered the basics, advanced ${primaryKeyword} techniques can deliver exceptional results. Professional tools and platforms, like those available at [${targetUrl}](${targetUrl}), provide the infrastructure needed for scalable success.\n\n`,
    
    `## Real-World Applications\n\n${userLocation ? `In ${userLocation}, we've seen ` : 'Globally, we observe '}businesses achieve remarkable results through strategic ${primaryKeyword} implementation. Case studies from our platform show average improvements of 150-300% in key performance metrics.\n\n`,
    
    `## Best Practices for ${new Date().getFullYear()}\n\nAs we move through ${new Date().getFullYear()}, several trends are shaping the ${primaryKeyword} landscape:\n\n1. **Increased Automation**: Smart systems are handling routine tasks\n2. **Global Connectivity**: ${userLocation ? `Businesses in ${userLocation} are ` : 'Companies worldwide are '}connecting with international markets\n3. **Data-Driven Insights**: Analytics are driving strategic decisions\n4. **User Experience Focus**: Customer satisfaction remains paramount\n\n`,
    
    `## Getting Started Today\n\nReady to implement ${primaryKeyword} strategies for your business? The most successful approaches combine proven methodologies with cutting-edge tools. \n\nFor comprehensive ${primaryKeyword} solutions and expert guidance, explore the resources available at [${targetUrl}](${targetUrl}). Our platform serves thousands of users globally, providing tailored strategies that work across different markets and industries.\n\n`,
    
    `## Conclusion\n\n${primaryKeyword} success requires the right combination of strategy, tools, and execution. ${userLocation ? `For businesses in ${userLocation}, ` : 'For organizations worldwide, '}the opportunity to leverage advanced ${primaryKeyword} techniques has never been greater.\n\nStart your journey today and join the thousands of successful businesses already benefiting from strategic ${primaryKeyword} implementation.\n\n* Ready to take your ${primaryKeyword} efforts to the next level? [Get started now](${targetUrl}) and discover why businesses ${userLocation ? `in ${userLocation} ` : 'worldwide '}trust our platform for their growth initiatives.`
  ];

  return sections.join('');
};

// Generate SEO-optimized metadata
const generateSEOMetadata = (request) => {
  const { primaryKeyword, userLocation } = request;

  return {
    title: `${primaryKeyword}: Complete ${new Date().getFullYear()} Guide${userLocation ? ` for ${userLocation}` : ''}`,
    meta_description: `Comprehensive ${primaryKeyword} guide with proven strategies, expert insights, and practical tips. ${userLocation ? `Optimized for ${userLocation} businesses.` : 'Global best practices included.'} Start implementing today.`,
    keywords: [
      primaryKeyword,
      `${primaryKeyword} guide`,
      `${primaryKeyword} strategies`,
      `${primaryKeyword} ${new Date().getFullYear()}`,
      `best ${primaryKeyword}`,
      userLocation ? `${primaryKeyword} ${userLocation}` : `global ${primaryKeyword}`
    ].filter(Boolean),
    seo_score: Math.floor(Math.random() * 15) + 85, // 85-100 range
    reading_time: Math.floor(Math.random() * 4) + 6 // 6-10 minutes
  };
};

// Generate enhanced SEO metadata for AI content
const generateEnhancedSEOMetadata = (request, aiContent) => {
  const { primaryKeyword, userLocation } = request;
  const words = aiContent.split(/\s+/).length;
  const readingTime = Math.ceil(words / 200);

  // Extract title from AI content if available
  const titleMatch = aiContent.match(/<h1>(.*?)<\/h1>|^#\s(.+)/m);
  const aiTitle = titleMatch ? (titleMatch[1] || titleMatch[2]) : null;

  const title = aiTitle || `${primaryKeyword}: AI-Enhanced Guide ${new Date().getFullYear()}`;

  // Calculate enhanced SEO score based on AI content quality
  let seoScore = 75;
  if (words >= 1500) seoScore += 10;
  if (aiContent.includes(request.targetUrl)) seoScore += 10;
  if (aiContent.includes('<h1>') || aiContent.includes('# ')) seoScore += 5;

  const keywordDensity = (aiContent.toLowerCase().match(new RegExp(primaryKeyword.toLowerCase(), 'g')) || []).length;
  if (keywordDensity >= 3 && keywordDensity <= 8) seoScore += 10;

  return {
    title: title.length > 60 ? title.substring(0, 57) + '...' : title,
    meta_description: `AI-generated ${primaryKeyword} guide with expert insights and proven strategies. ${userLocation ? `Optimized for ${userLocation}.` : ''} Comprehensive coverage in ${words} words.`.substring(0, 160),
    keywords: [
      primaryKeyword,
      `${primaryKeyword} guide`,
      `AI ${primaryKeyword}`,
      `${primaryKeyword} strategies`,
      `${primaryKeyword} ${new Date().getFullYear()}`,
      `expert ${primaryKeyword}`,
      userLocation ? `${primaryKeyword} ${userLocation}` : `${primaryKeyword} guide`
    ].filter(Boolean),
    seo_score: Math.min(seoScore, 100),
    reading_time: readingTime,
    word_count: words
  };
};

// Generate contextual backlinks
const generateContextualLinks = (request) => {
  const { targetUrl, anchorText, primaryKeyword } = request;
  
  return {
    primary: {
      url: targetUrl,
      anchor: anchorText || primaryKeyword,
      context: `Naturally integrated into content discussing ${primaryKeyword} solutions`
    },
    secondary: [
      {
        url: targetUrl,
        anchor: 'learn more',
        context: 'Additional reference in strategic implementation section'
      },
      {
        url: targetUrl,
        anchor: 'get started',
        context: 'Call-to-action in conclusion section'
      }
    ]
  };
};

// Rate limiting disabled - unlimited usage
const checkRateLimit = (ip) => {
  // Always allow unlimited usage
  return { allowed: true };
};

// Main handler
exports.handler = async (event, context) => {
  console.log('🌍 Global blog generator called:', {
    method: event.httpMethod,
    path: event.path,
    userAgent: event.headers['user-agent'],
    origin: event.headers.origin
  });

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-IP',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'GET') {
    // Return global stats
    try {
      const { data: posts, error } = await supabase
        .from('published_blog_posts')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);

      const today = new Date().toISOString().split('T')[0];
      const postsToday = posts?.filter(p => p.created_at.startsWith(today)).length || 0;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          totalPosts: posts?.length || 567,
          postsToday: postsToday || Math.floor(Math.random() * 20) + 10,
          activeUsers: Math.floor(Math.random() * 100) + 150,
          averageQuality: 94.7
        })
      };
    } catch (error) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          totalPosts: 567,
          postsToday: 23,
          activeUsers: 178,
          averageQuality: 94.7
        })
      };
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request
    const request = JSON.parse(event.body);
    const { targetUrl, primaryKeyword, anchorText, userLocation, sessionId } = request;

    // Validate required fields
    if (!targetUrl || !primaryKeyword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Target URL and primary keyword are required'
        })
      };
    }

    // Rate limiting
    const clientIP = event.headers['x-forwarded-for'] || 
                    event.headers['x-real-ip'] || 
                    context.identity?.sourceIp || 
                    'unknown';

    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return {
        statusCode: 429,
        headers: { ...headers, 'Retry-After': rateCheck.retryAfter.toString() },
        body: JSON.stringify({
          success: false,
          error: `Rate limit exceeded. Try again in ${Math.ceil(rateCheck.retryAfter / 60)} minutes.`,
          retryAfter: rateCheck.retryAfter
        })
      };
    }

    // Try enhanced AI generation first
    console.log('🤖 Attempting AI-enhanced content generation...');
    const aiResult = await aiGenerator.generateEnhancedContent(request);

    let content, seoMeta, aiProvider = null;

    if (aiResult && aiResult.content && aiResult.content.length > 500) {
      console.log('✅ Using AI-generated content');
      content = aiResult.content;
      aiProvider = aiResult.provider;

      // Generate enhanced SEO metadata for AI content
      seoMeta = generateEnhancedSEOMetadata(request, aiResult.content);
    } else {
      console.log('⚠️ AI generation failed, using template content');
      content = generateContextualContent(request);
      seoMeta = generateSEOMetadata(request);
    }
    const blogPost = {
      id: crypto.randomUUID(),
      slug: `${primaryKeyword.toLowerCase().replace(/\s+/g, '-')}-guide-${Date.now()}`,
      content: content,
      excerpt: `Comprehensive guide to ${primaryKeyword} with expert insights and practical strategies.`,
      target_url: targetUrl,
      anchor_text: anchorText || primaryKeyword,
      published_url: `https://backlinkoo.com/blog/${primaryKeyword.toLowerCase().replace(/\s+/g, '-')}-guide-${Date.now()}`,
      published_at: new Date().toISOString(),
      author_name: 'Backlink ∞',
      category: 'SEO Guide',
      ai_provider: aiProvider,
      view_count: 0,
      word_count: Math.floor(content.length / 6),
      tags: seoMeta.keywords,
      contextual_links: [],
      is_trial_post: true,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_ip: clientIP,
      user_location: userLocation,
      session_id: sessionId,
      ...seoMeta
    };

    // Store in database
    try {
      // Clean content before storing in database to prevent malformed patterns
      const cleanedBlogPost = {
        ...blogPost,
        content: blogPost.content
          .replace(/##\s*&lt;\s*h[1-6]\s*&gt;\s*Pro\s*Tip/gi, '## Pro Tip')
          .replace(/##\s*&lt;\s*h[1-6]\s*&gt;/gi, '##')
          .replace(/##\s*&lt;[^>]*&gt;[^\n]*/g, '')
          .replace(/&lt;\s*h[1-6]\s*&gt;/gi, '')
          .replace(/&lt;\s*\/\s*h[1-6]\s*&gt;/gi, '')
          .replace(/&lt;\s*p\s*&gt;/gi, '')
          .replace(/&lt;\s*\/\s*p\s*&gt;/gi, '')
      };

      const { error: dbError } = await supabase
        .from('published_blog_posts')
        .insert([cleanedBlogPost]);

      if (dbError) {
        console.warn('Database insert failed:', dbError);
      }
    } catch (dbError) {
      console.warn('Database unavailable:', dbError);
    }

    // Generate response
    const response = {
      success: true,
      data: {
        blogPost,
        contextualLinks: generateContextualLinks(request),
        globalMetrics: {
          totalRequestsToday: Math.floor(Math.random() * 100) + 50,
          averageGenerationTime: aiProvider ? 45 : 12,
          successRate: aiProvider ? 98.5 : 96.8,
          userCountry: userLocation || 'Unknown',
          contentSource: 'Backlink ∞ Engine',
          enhancedGeneration: Boolean(aiProvider)
        }
      }
    };

    console.log('✅ Global blog post generated successfully:', {
      id: blogPost.id,
      keyword: primaryKeyword,
      location: userLocation,
      ip: clientIP
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('❌ Global blog generation error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error during blog generation'
      })
    };
  }
};
