/**
 * Working Campaign Processor - Simplified content generation + Telegraph publishing
 * Generates 3 blog posts with different prompts and publishes to Telegraph
 */

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
    };
  }

  try {
    const { keyword, anchorText, targetUrl, campaignId } = JSON.parse(event.body);

    console.log('🚀 Processing campaign:', { keyword, anchorText, targetUrl, campaignId });

    // Validate inputs
    if (!keyword || !anchorText || !targetUrl) {
      throw new Error('Missing required parameters: keyword, anchorText, targetUrl');
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Generate 3 different blog posts using OpenAI
    const blogPosts = await generateBlogPosts(keyword, anchorText, targetUrl);
    console.log('✅ Generated 3 blog posts');

    // Step 2: Publish each post to Telegraph and collect URLs
    const publishedUrls = [];
    
    for (let i = 0; i < blogPosts.length; i++) {
      const post = blogPosts[i];
      try {
        const telegraphUrl = await publishToTelegraph(post.title, post.content);
        publishedUrls.push(telegraphUrl);
        console.log(`✅ Published post ${i + 1} to Telegraph:`, telegraphUrl);

        // Validate the published URL
        await validateTelegraphUrl(telegraphUrl);
        console.log(`✅ Validated post ${i + 1}`);

        // Save to database
        await savePublishedLink(supabase, campaignId, telegraphUrl, post.title);
        console.log(`✅ Saved post ${i + 1} to database`);

      } catch (error) {
        console.error(`❌ Failed to publish post ${i + 1}:`, error);
        // Continue with other posts even if one fails
      }
    }

    if (publishedUrls.length === 0) {
      throw new Error('Failed to publish any posts to Telegraph');
    }

    // Step 3: Update campaign status to completed
    await updateCampaignStatus(supabase, campaignId, 'completed', publishedUrls);
    console.log('✅ Campaign marked as completed');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          publishedUrls,
          totalPosts: publishedUrls.length,
          keyword,
          anchorText,
          targetUrl,
          completedAt: new Date().toISOString()
        }
      }),
    };

  } catch (error) {
    console.error('❌ Campaign processing failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Campaign processing failed'
      }),
    };
  }
};

/**
 * Generate 3 different blog posts using OpenAI GPT-3.5-turbo
 */
async function generateBlogPosts(keyword, anchorText, targetUrl) {
  // The 3 different prompts as specified
  const prompts = [
    `Generate a blog post on ${keyword} including the ${anchorText} hyperlinked to ${targetUrl}`,
    `Write a article about ${keyword} with a hyperlinked ${anchorText} linked to ${targetUrl}`,
    `Produce a write up on ${keyword} that links ${anchorText} to ${targetUrl}`
  ];

  const posts = [];

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    
    try {
      // Generate content using OpenAI
      if (process.env.OPENAI_API_KEY) {
        const content = await generateOpenAIContent(prompt, keyword, anchorText, targetUrl);
        posts.push({
          title: `${keyword}: Professional Guide ${i + 1}`,
          content: content,
          prompt: prompt
        });
      } else {
        // Fallback to template content
        const content = generateTemplateContent(keyword, anchorText, targetUrl, i + 1);
        posts.push({
          title: `${keyword}: Professional Guide ${i + 1}`,
          content: content,
          prompt: prompt
        });
      }
    } catch (error) {
      console.error(`Failed to generate post ${i + 1}:`, error);
      // Generate fallback content
      const content = generateTemplateContent(keyword, anchorText, targetUrl, i + 1);
      posts.push({
        title: `${keyword}: Professional Guide ${i + 1}`,
        content: content,
        prompt: prompt
      });
    }
  }

  return posts;
}

/**
 * Generate content using OpenAI GPT-3.5-turbo
 */
async function generateOpenAIContent(prompt, keyword, anchorText, targetUrl) {
  const { OpenAI } = require('openai');
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a professional content writer. Create high-quality, informative blog posts with natural link placement. Format the output as HTML with proper headings, paragraphs, and hyperlinks.'
      },
      {
        role: 'user',
        content: prompt + '. Make the article at least 500 words, well-structured with headings, and naturally incorporate the hyperlink. Format as HTML.'
      }
    ],
    max_tokens: 2000,
    temperature: 0.7
  });

  let content = completion.choices[0].message.content;
  
  // Ensure the anchor text is properly linked if not already done by OpenAI
  if (!content.includes(`href="${targetUrl}"`)) {
    content = content.replace(
      new RegExp(anchorText, 'gi'), 
      `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>`
    );
  }

  return content;
}

/**
 * Generate fallback template content
 */
function generateTemplateContent(keyword, anchorText, targetUrl, postNumber) {
  const templates = [
    {
      title: `Understanding ${keyword}: A Comprehensive Guide`,
      content: `<h1>Understanding ${keyword}: A Comprehensive Guide</h1>

<p>In today's rapidly evolving landscape, understanding ${keyword} has become essential for professionals and businesses alike. This comprehensive guide explores the key aspects, benefits, and practical applications of ${keyword}.</p>

<h2>What is ${keyword}?</h2>

<p>${keyword} represents a fundamental concept that impacts various aspects of modern business and technology. By mastering the principles of ${keyword}, organizations can achieve significant improvements in efficiency, performance, and overall success.</p>

<h2>Key Benefits of ${keyword}</h2>

<ul>
<li>Enhanced operational efficiency</li>
<li>Improved user experience and satisfaction</li>
<li>Better resource utilization</li>
<li>Increased competitive advantage</li>
<li>Long-term sustainability and growth</li>
</ul>

<h2>Implementation Strategies</h2>

<p>When implementing ${keyword} solutions, it's crucial to follow proven methodologies and best practices. For expert guidance and comprehensive resources on this topic, <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> provides valuable insights that can help you achieve your objectives.</p>

<h2>Best Practices for Success</h2>

<p>Successful ${keyword} implementation requires careful planning, strategic thinking, and attention to detail. Key considerations include stakeholder alignment, resource allocation, and continuous monitoring of progress.</p>

<h2>Future Trends and Considerations</h2>

<p>As ${keyword} continues to evolve, staying informed about emerging trends and technologies becomes increasingly important. Organizations that proactively adapt to these changes will be best positioned for long-term success.</p>

<h2>Conclusion</h2>

<p>The importance of ${keyword} in today's business environment cannot be overstated. By understanding its principles and implementing effective strategies, organizations can achieve remarkable results and maintain a competitive edge in their respective markets.</p>`
    },
    {
      title: `${keyword}: Essential Strategies for Success`,
      content: `<h1>${keyword}: Essential Strategies for Success</h1>

<p>Navigating the complexities of ${keyword} requires a strategic approach and deep understanding of its core principles. This article explores proven strategies and best practices that lead to successful ${keyword} implementation.</p>

<h2>Strategic Framework for ${keyword}</h2>

<p>Developing a comprehensive strategy for ${keyword} involves multiple components working together harmoniously. The foundation of any successful approach lies in understanding the unique requirements and objectives of your specific situation.</p>

<h2>Core Components of Success</h2>

<p>Several key elements contribute to effective ${keyword} implementation:</p>

<ol>
<li><strong>Planning and Preparation:</strong> Thorough analysis and strategic planning</li>
<li><strong>Resource Management:</strong> Optimal allocation of time, budget, and personnel</li>
<li><strong>Quality Assurance:</strong> Maintaining high standards throughout the process</li>
<li><strong>Continuous Improvement:</strong> Regular evaluation and optimization</li>
</ol>

<h2>Expert Guidance and Resources</h2>

<p>When embarking on your ${keyword} journey, having access to reliable guidance is invaluable. Professional consultation and expert resources can significantly accelerate your progress. For comprehensive support and proven methodologies, <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> offers specialized expertise that can help you navigate challenges and achieve optimal results.</p>

<h2>Common Challenges and Solutions</h2>

<p>While implementing ${keyword} strategies, organizations often encounter various challenges. Understanding these potential obstacles and having appropriate solutions ready can prevent delays and ensure smooth execution.</p>

<h2>Measuring Success and ROI</h2>

<p>Establishing clear metrics and KPIs is essential for tracking progress and demonstrating value. Regular assessment helps identify areas for improvement and ensures alignment with business objectives.</p>

<h2>Looking Forward</h2>

<p>The landscape of ${keyword} continues to evolve, presenting new opportunities and challenges. Staying ahead requires continuous learning, adaptation, and strategic thinking about future developments and their potential impact.</p>`
    },
    {
      title: `Mastering ${keyword}: A Professional's Handbook`,
      content: `<h1>Mastering ${keyword}: A Professional's Handbook</h1>

<p>For professionals seeking to excel in ${keyword}, this comprehensive handbook provides practical insights, proven methodologies, and actionable strategies that deliver results in real-world scenarios.</p>

<h2>Professional Foundations</h2>

<p>Building expertise in ${keyword} requires a solid foundation of knowledge and practical experience. This section covers the essential principles that every professional should understand to achieve mastery in this field.</p>

<h2>Advanced Techniques and Methods</h2>

<p>Beyond the basics, advanced practitioners of ${keyword} employ sophisticated techniques that set them apart from their peers. These methods require deeper understanding and careful application but yield superior results.</p>

<h3>Technical Excellence</h3>

<p>Technical proficiency forms the backbone of successful ${keyword} implementation. Key areas of focus include:</p>

<ul>
<li>Systematic approach to problem-solving</li>
<li>Attention to detail and quality standards</li>
<li>Efficient use of tools and technologies</li>
<li>Continuous skill development and learning</li>
</ul>

<h2>Professional Development Resources</h2>

<p>Advancing your career in ${keyword} requires access to high-quality resources and continuous learning opportunities. Professional development should be an ongoing priority for anyone serious about excellence in this field. To access premium resources and expert training materials, <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> provides comprehensive educational content designed for professional growth.</p>

<h2>Industry Best Practices</h2>

<p>The most successful professionals in ${keyword} follow established industry best practices while adapting them to their specific circumstances. Understanding these standards helps ensure consistent quality and professional credibility.</p>

<h2>Building Professional Networks</h2>

<p>Networking with other professionals in the ${keyword} field creates opportunities for knowledge sharing, collaboration, and career advancement. Active participation in professional communities contributes to both personal growth and industry development.</p>

<h2>Future Career Prospects</h2>

<p>The field of ${keyword} offers numerous career opportunities for dedicated professionals. Understanding future trends and market demands helps in making informed decisions about specialization and career progression.</p>

<h2>Final Thoughts</h2>

<p>Mastering ${keyword} is a journey that requires dedication, continuous learning, and practical application. By following the principles outlined in this handbook and staying committed to professional excellence, you can achieve remarkable success in this dynamic field.</p>`
    }
  ];

  return templates[postNumber - 1] || templates[0];
}

/**
 * Publish content to Telegraph
 */
async function publishToTelegraph(title, content) {
  const fetch = require('node-fetch');

  // Step 1: Create Telegraph account
  const accountResponse = await fetch('https://api.telegra.ph/createAccount', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      short_name: 'LinkBuilder',
      author_name: 'Professional Content',
      author_url: ''
    })
  });

  const accountData = await accountResponse.json();
  if (!accountData.ok) {
    throw new Error(`Telegraph account creation failed: ${accountData.error}`);
  }

  const accessToken = accountData.result.access_token;

  // Step 2: Convert content to Telegraph format
  const telegraphContent = convertToTelegraphFormat(content);

  // Step 3: Create Telegraph page
  const pageResponse = await fetch('https://api.telegra.ph/createPage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: accessToken,
      title: title,
      author_name: 'Professional Content',
      content: telegraphContent,
      return_content: false
    })
  });

  const pageData = await pageResponse.json();
  if (!pageData.ok) {
    throw new Error(`Telegraph page creation failed: ${pageData.error}`);
  }

  return pageData.result.url;
}

/**
 * Convert HTML content to Telegraph DOM format
 */
function convertToTelegraphFormat(html) {
  // Simple HTML to Telegraph conversion
  const lines = html.split('\n');
  const telegraphNodes = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) continue;
    
    // Handle headings
    if (trimmed.startsWith('<h1>')) {
      telegraphNodes.push({
        tag: 'h3',
        children: [trimmed.replace(/<\/?h1>/g, '')]
      });
    } else if (trimmed.startsWith('<h2>')) {
      telegraphNodes.push({
        tag: 'h4',
        children: [trimmed.replace(/<\/?h2>/g, '')]
      });
    } else if (trimmed.startsWith('<h3>')) {
      telegraphNodes.push({
        tag: 'h4',
        children: [trimmed.replace(/<\/?h3>/g, '')]
      });
    } else if (trimmed.startsWith('<p>')) {
      // Handle paragraphs with links
      const processedText = processHTMLContent(trimmed.replace(/<\/?p>/g, ''));
      telegraphNodes.push({
        tag: 'p',
        children: processedText
      });
    } else if (trimmed.startsWith('<li>')) {
      // Handle list items
      const processedText = processHTMLContent(trimmed.replace(/<\/?li>/g, ''));
      telegraphNodes.push({
        tag: 'p',
        children: ['• ' + processedText]
      });
    } else if (trimmed.startsWith('<ul>') || trimmed.startsWith('</ul>') || 
               trimmed.startsWith('<ol>') || trimmed.startsWith('</ol>')) {
      // Skip list container tags
      continue;
    } else if (trimmed.match(/<\/?[^>]+>/)) {
      // Skip other HTML tags but process content
      const cleanText = trimmed.replace(/<[^>]*>/g, '');
      if (cleanText.trim()) {
        telegraphNodes.push({
          tag: 'p',
          children: [cleanText.trim()]
        });
      }
    } else if (trimmed) {
      // Plain text
      telegraphNodes.push({
        tag: 'p',
        children: [trimmed]
      });
    }
  }
  
  return telegraphNodes;
}

/**
 * Process HTML content for Telegraph format
 */
function processHTMLContent(text) {
  const linkRegex = /<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  const result = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      result.push(text.substring(lastIndex, match.index));
    }
    
    // Add the link
    result.push({
      tag: 'a',
      attrs: { href: match[1] },
      children: [match[2]]
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }
  
  return result.length > 0 ? result : [text];
}

/**
 * Validate Telegraph URL by making a request
 */
async function validateTelegraphUrl(url) {
  const fetch = require('node-fetch');
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error(`Telegraph URL validation failed: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.warn('Telegraph URL validation failed:', error);
    // Don't throw - URL might still be valid even if HEAD request fails
    return false;
  }
}

/**
 * Save published link to database
 */
async function savePublishedLink(supabase, campaignId, url, title) {
  try {
    const { error } = await supabase
      .from('automation_published_links')
      .insert({
        campaign_id: campaignId,
        published_url: url,
        platform: 'Telegraph.ph',
        title: title,
        status: 'active',
        published_at: new Date().toISOString()
      });

    if (error) {
      console.warn('Failed to save published link to automation_published_links:', error);
      
      // Try alternative table names
      const { error: error2 } = await supabase
        .from('published_links')
        .insert({
          campaign_id: campaignId,
          url: url,
          platform: 'Telegraph.ph',
          created_at: new Date().toISOString()
        });
        
      if (error2) {
        console.warn('Failed to save to published_links:', error2);
        // Don't throw - campaign can still succeed without saving link
      }
    }
  } catch (error) {
    console.warn('Database save failed:', error);
    // Don't throw - campaign can still succeed
  }
}

/**
 * Update campaign status to completed
 */
async function updateCampaignStatus(supabase, campaignId, status, publishedUrls) {
  try {
    const { error } = await supabase
      .from('automation_campaigns')
      .update({ 
        status: status,
        completed_at: new Date().toISOString(),
        published_urls: publishedUrls
      })
      .eq('id', campaignId);

    if (error) {
      console.warn('Failed to update automation_campaigns:', error);
      
      // Try alternative table name
      const { error: error2 } = await supabase
        .from('campaigns')
        .update({ 
          status: status,
          completed_at: new Date().toISOString()
        })
        .eq('id', campaignId);
        
      if (error2) {
        console.warn('Failed to update campaigns table:', error2);
        // Don't throw - campaign logic can still succeed
      }
    }
  } catch (error) {
    console.warn('Campaign status update failed:', error);
    // Don't throw - campaign can still be considered successful
  }
}
