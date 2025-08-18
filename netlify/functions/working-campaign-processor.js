/**
 * Working Campaign Processor - Simplified content generation + Telegraph publishing
 * Randomly selects one of 3 prompts to generate a single blog post and publishes to Telegraph
 * This prevents content footprints and allows rotation across different platforms
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

    // Step 1: Generate a single blog post using randomly selected prompt
    const blogPost = await generateSingleBlogPost(keyword, anchorText, targetUrl);
    console.log('✅ Generated blog post using random prompt');

    // Step 2: Publish the post using proper platform rotation
    const publishedUrls = [];

    // Get next platform from orchestrator for proper rotation
    const nextPlatform = await getNextAvailablePlatform(supabase, campaignId);
    console.log(`📡 Next platform for rotation: ${nextPlatform}`);

    try {
      let publishedUrl;
      let platform;

      if (nextPlatform === 'telegraph') {
        publishedUrl = await publishToTelegraph(blogPost.title, blogPost.content);
        platform = 'Telegraph.ph';
        await validateTelegraphUrl(publishedUrl);
      } else if (nextPlatform === 'writeas') {
        publishedUrl = await publishToWriteAs(blogPost.title, blogPost.content);
        platform = 'writeas';
        await validateWriteAsUrl(publishedUrl);
      } else {
        // Fallback to Telegraph if no specific platform determined
        publishedUrl = await publishToTelegraph(blogPost.title, blogPost.content);
        platform = 'Telegraph.ph';
        await validateTelegraphUrl(publishedUrl);
      }

      publishedUrls.push(publishedUrl);
      console.log(`✅ Published post to ${platform}:`, publishedUrl);

      // Save to database with platform tracking
      await savePublishedLink(supabase, campaignId, publishedUrl, blogPost.title, platform);
      console.log(`✅ Saved post to database`);

      // Track platform usage for rotation
      await trackPlatformUsage(supabase, campaignId, nextPlatform);

    } catch (error) {
      console.error(`❌ Failed to publish post:`, error);
      throw new Error(`Failed to publish post to ${nextPlatform || 'platform'}`);
    }

    if (publishedUrls.length === 0) {
      throw new Error('Failed to publish post to any platform');
    }

    // Step 3: Check if all platforms have completed before marking campaign as completed
    const shouldComplete = await checkAllPlatformsCompleted(supabase, campaignId);

    if (shouldComplete) {
      await updateCampaignStatus(supabase, campaignId, 'completed', publishedUrls);
      console.log('✅ Campaign marked as completed - all platforms have published content');
    } else {
      // Continue to next platform automatically instead of just pausing
      await updateCampaignStatus(supabase, campaignId, 'active', publishedUrls);
      console.log('🔄 Campaign continuing to next platform - auto-resuming...');

      try {
        // Trigger the next platform processing automatically
        const nextResult = await processNextPlatform(supabase, campaignId, keyword, anchorText, targetUrl);
        console.log('✅ Next platform processing triggered:', nextResult.success ? 'Success' : 'Failed');

        if (!nextResult.success) {
          console.warn('⚠️ Next platform processing failed, campaign will remain active for manual retry');
        }
      } catch (error) {
        console.error('❌ Failed to auto-continue to next platform:', error);
        await updateCampaignStatus(supabase, campaignId, 'paused', publishedUrls);
        console.log('⏸️ Campaign paused due to auto-continue failure');
      }
    }

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
          promptUsed: blogPost.promptIndex,
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
 * Generate a single blog post using randomly selected prompt from the 3 variations
 */
async function generateSingleBlogPost(keyword, anchorText, targetUrl) {
  // The 3 different prompts as specified - randomly select one to prevent footprints
  const prompts = [
    `Generate a blog post on ${keyword} including the ${anchorText} hyperlinked to ${targetUrl}`,
    `Write a article about ${keyword} with a hyperlinked ${anchorText} linked to ${targetUrl}`,
    `Produce a write up on ${keyword} that links ${anchorText} to ${targetUrl}`
  ];

  // Randomly select one of the 3 prompts
  const randomIndex = Math.floor(Math.random() * prompts.length);
  const selectedPrompt = prompts[randomIndex];

  console.log(`🎲 Using prompt ${randomIndex + 1} of 3: "${selectedPrompt}"`);

  try {
    // Generate content using OpenAI
    if (process.env.OPENAI_API_KEY) {
      const content = await generateOpenAIContent(selectedPrompt, keyword, anchorText, targetUrl);
      return {
        title: `${keyword}: Professional Guide`,
        content: content,
        prompt: selectedPrompt,
        promptIndex: randomIndex + 1
      };
    } else {
      // Fallback to template content
      const content = generateTemplateContent(keyword, anchorText, targetUrl, randomIndex + 1);
      return {
        title: `${keyword}: Professional Guide`,
        content: content,
        prompt: selectedPrompt,
        promptIndex: randomIndex + 1
      };
    }
  } catch (error) {
    console.error(`Failed to generate post with selected prompt:`, error);
    // Generate fallback content
    const content = generateTemplateContent(keyword, anchorText, targetUrl, randomIndex + 1);
    return {
      title: `${keyword}: Professional Guide`,
      content: content,
      prompt: selectedPrompt,
      promptIndex: randomIndex + 1
    };
  }
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
  console.log('🔄 Converting content to Telegraph format...');
  console.log('Original content sample:', content.substring(0, 300) + '...');

  const telegraphContent = convertToTelegraphFormat(content);

  console.log('✅ Telegraph conversion complete. Nodes:', telegraphContent.length);
  console.log('First few nodes:', JSON.stringify(telegraphContent.slice(0, 2), null, 2));

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
      // Handle paragraphs with links and formatting
      const processedText = processHTMLContent(trimmed.replace(/<\/?p>/g, ''));
      if (processedText.length > 0) {
        telegraphNodes.push({
          tag: 'p',
          children: processedText
        });
      }
    } else if (trimmed.startsWith('<li>')) {
      // Handle list items with formatting
      const processedText = processHTMLContent(trimmed.replace(/<\/?li>/g, ''));
      if (processedText.length > 0) {
        telegraphNodes.push({
          tag: 'p',
          children: ['• ', ...processedText]
        });
      }
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
 * Process HTML content for Telegraph format with bold text support
 */
function processHTMLContent(text) {
  const result = [];
  let currentIndex = 0;

  // Enhanced regex to handle links, bold, and strong tags
  const formatRegex = /(<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>|<strong>([^<]+)<\/strong>|<b>([^<]+)<\/b>)/gi;
  let match;

  while ((match = formatRegex.exec(text)) !== null) {
    // Add any text before this match
    if (match.index > currentIndex) {
      const beforeText = text.substring(currentIndex, match.index);
      if (beforeText.trim()) {
        result.push(beforeText);
      }
    }

    // Determine what type of formatting we found
    if (match[0].startsWith('<a')) {
      // Link
      result.push({
        tag: 'a',
        attrs: { href: match[2] },
        children: [match[3]]
      });
    } else if (match[0].startsWith('<strong>') || match[0].startsWith('<b>')) {
      // Bold text
      const content = match[4] || match[5];
      result.push({
        tag: 'b',
        children: [content]
      });
    }

    currentIndex = match.index + match[0].length;
  }

  // Add any remaining text
  if (currentIndex < text.length) {
    const remainingText = text.substring(currentIndex);
    if (remainingText.trim()) {
      result.push(remainingText);
    }
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
 * Publish content to Write.as
 */
async function publishToWriteAs(title, content) {
  const fetch = require('node-fetch');

  // Convert HTML content to markdown format for Write.as
  const writeasContent = convertToWriteasFormat(content);

  console.log('🔄 Publishing to Write.as...');
  console.log('Content sample:', writeasContent.substring(0, 200) + '...');

  const postResponse = await fetch('https://write.as/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title,
      body: writeasContent
    })
  });

  const responseData = await postResponse.json();

  if (!postResponse.ok || responseData.code !== 201) {
    throw new Error(`Write.as post creation failed: ${responseData.error || responseData.message || 'Unknown error'}`);
  }

  const postData = responseData.data;
  const postUrl = `https://write.as/${postData.id}`;

  console.log('✅ Write.as post created:', postUrl);

  return postUrl;
}

/**
 * Convert HTML content to Write.as markdown format
 */
function convertToWriteasFormat(htmlContent) {
  let markdown = htmlContent;

  // Convert HTML headings to markdown
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1');

  // Convert HTML paragraphs to markdown (just remove p tags)
  markdown = markdown.replace(/<p[^>]*>/gi, '');
  markdown = markdown.replace(/<\/p>/gi, '\n\n');

  // Convert bold text to markdown
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');

  // Convert italic text to markdown
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Convert links to markdown
  markdown = markdown.replace(/<a[^>]*href\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Clean up list items
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1');
  markdown = markdown.replace(/<\/?[uo]l[^>]*>/gi, '');

  // Remove any remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, '');

  // Clean up multiple newlines
  markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');

  // Trim whitespace
  return markdown.trim();
}

/**
 * Validate Write.as URL by making a request
 */
async function validateWriteAsUrl(url) {
  const fetch = require('node-fetch');

  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error(`Write.as URL validation failed: ${response.status}`);
    }
    console.log('✅ Write.as URL validated successfully');
    return true;
  } catch (error) {
    console.warn('Write.as URL validation failed:', error);
    // Don't throw - URL might still be valid even if HEAD request fails
    return false;
  }
}

/**
 * Get next available platform for campaign rotation
 */
async function getNextAvailablePlatform(supabase, campaignId) {
  try {
    // Get available platforms from centralized configuration
    // This ensures new platforms are automatically included when activated
    const availablePlatforms = await getActivePlatforms();

    // Get existing published links for this campaign from database
    const { data: publishedLinks, error } = await supabase
      .from('automation_published_links')
      .select('platform')
      .eq('campaign_id', campaignId);

    if (error) {
      console.warn('Error checking published links, using fallback platform selection:', error);
      // Fallback to first platform if database check fails
      return availablePlatforms[0].id;
    }

    // Create set of used platforms (normalize legacy platform names)
    const usedPlatforms = new Set(
      (publishedLinks || []).map(link => {
        const platform = link.platform.toLowerCase();
        // Normalize legacy platform names
        if (platform === 'write.as' || platform === 'writeas') return 'writeas';
        if (platform === 'telegraph.ph' || platform === 'telegraph') return 'telegraph';
        return platform;
      })
    );

    console.log(`📊 Campaign ${campaignId} - Used platforms:`, Array.from(usedPlatforms));

    // Find first available platform that hasn't been used
    for (const platform of availablePlatforms) {
      if (!usedPlatforms.has(platform.id)) {
        console.log(`✅ Selected next platform: ${platform.id} (${platform.name})`);
        return platform.id;
      }
    }

    // All platforms have been used
    console.log(`⚠️ All platforms used for campaign ${campaignId}`);
    throw new Error('All available platforms have been used for this campaign');

  } catch (error) {
    console.error('Error getting next platform:', error);
    throw error;
  }
}

/**
 * Track platform usage for proper rotation
 */
async function trackPlatformUsage(supabase, campaignId, platformId) {
  try {
    // This could be enhanced to track in a separate table for rotation logic
    console.log(`📊 Tracked platform usage: ${platformId} for campaign ${campaignId}`);
    return true;
  } catch (error) {
    console.warn('Failed to track platform usage:', error);
    return false;
  }
}

/**
 * Save published link to database
 */
async function savePublishedLink(supabase, campaignId, url, title, platform = 'Telegraph.ph') {
  try {
    const { error } = await supabase
      .from('automation_published_links')
      .insert({
        campaign_id: campaignId,
        published_url: url,
        platform: platform,
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
          platform: platform,
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

/**
 * Get active platforms from centralized configuration
 */
async function getActivePlatforms() {
  // Centralized platform configuration - single source of truth
  const allPlatforms = [
    { id: 'telegraph', name: 'Telegraph.ph', isActive: true, priority: 1 },
    { id: 'writeas', name: 'Write.as', isActive: true, priority: 2 },
    { id: 'medium', name: 'Medium.com', isActive: false, priority: 3 },
    { id: 'devto', name: 'Dev.to', isActive: false, priority: 4 },
    { id: 'linkedin', name: 'LinkedIn Articles', isActive: false, priority: 5 },
    { id: 'hashnode', name: 'Hashnode', isActive: false, priority: 6 },
    { id: 'substack', name: 'Substack', isActive: false, priority: 7 }
  ];

  return allPlatforms
    .filter(p => p.isActive)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Normalize platform ID for consistency
 */
function normalizePlatformId(platformId) {
  const normalized = platformId.toLowerCase();

  // Handle legacy platform names
  if (normalized === 'write.as' || normalized === 'writeas') return 'writeas';
  if (normalized === 'telegraph.ph' || normalized === 'telegraph') return 'telegraph';
  if (normalized === 'medium.com') return 'medium';
  if (normalized === 'dev.to') return 'devto';

  return normalized;
}

/**
 * Process next platform automatically for campaign continuation
 */
async function processNextPlatform(supabase, campaignId, keyword, anchorText, targetUrl) {
  try {
    console.log(`🔄 Auto-processing next platform for campaign ${campaignId}...`);

    // Small delay to ensure database updates are processed
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get the next available platform
    const nextPlatform = await getNextAvailablePlatform(supabase, campaignId);

    if (!nextPlatform) {
      console.log('ℹ️ No more platforms available for processing');
      return { success: true, message: 'All platforms completed' };
    }

    console.log(`📝 Processing next platform: ${nextPlatform}`);

    // Generate content for the next platform
    const blogPost = await generateSingleBlogPost(keyword, anchorText, targetUrl);

    // Publish to the next platform
    let publishedUrl;
    let platform;

    if (nextPlatform === 'telegraph') {
      publishedUrl = await publishToTelegraph(blogPost.title, blogPost.content);
      platform = 'Telegraph.ph';
      await validateTelegraphUrl(publishedUrl);
    } else if (nextPlatform === 'writeas') {
      publishedUrl = await publishToWriteAs(blogPost.title, blogPost.content);
      platform = 'writeas';
      await validateWriteAsUrl(publishedUrl);
    } else {
      throw new Error(`Unsupported platform: ${nextPlatform}`);
    }

    console.log(`✅ Published to ${platform}:`, publishedUrl);

    // Save to database
    await savePublishedLink(supabase, campaignId, publishedUrl, blogPost.title, platform);
    console.log(`✅ Saved ${platform} post to database`);

    // Track platform usage
    await trackPlatformUsage(supabase, campaignId, nextPlatform);

    // Check if all platforms are now completed
    const allCompleted = await checkAllPlatformsCompleted(supabase, campaignId);

    if (allCompleted) {
      await updateCampaignStatus(supabase, campaignId, 'completed', [publishedUrl]);
      console.log('🎉 All platforms completed - campaign finished!');
    } else {
      // Recursively continue to next platform if more remain
      console.log('🔄 More platforms remain, continuing...');
      await processNextPlatform(supabase, campaignId, keyword, anchorText, targetUrl);
    }

    return { success: true, publishedUrl, platform };

  } catch (error) {
    console.error('❌ Next platform processing error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if all active platforms have completed for a campaign
 */
async function checkAllPlatformsCompleted(supabase, campaignId) {
  try {
    // Get active platforms from centralized configuration
    const activePlatforms = await getActivePlatforms();

    // Get published links for this campaign
    const { data: publishedLinks, error } = await supabase
      .from('automation_published_links')
      .select('platform, published_url')
      .eq('campaign_id', campaignId)
      .eq('status', 'active');

    if (error) {
      console.warn('Failed to fetch published links:', error);
      return false; // Default to not completing if we can't check
    }

    // Check if all active platforms have published content using normalized IDs
    const publishedPlatforms = new Set(
      (publishedLinks || []).map(link => normalizePlatformId(link.platform))
    );
    const activePlatformIds = activePlatforms.map(p => p.id);

    const allCompleted = activePlatformIds.every(platformId =>
      publishedPlatforms.has(platformId)
    );

    console.log(`🔍 Platform completion check:`, {
      activePlatforms: activePlatformIds,
      publishedPlatforms: Array.from(publishedPlatforms),
      allCompleted
    });

    return allCompleted;
  } catch (error) {
    console.warn('Failed to check platform completion:', error);
    return false; // Default to not completing if check fails
  }
}
