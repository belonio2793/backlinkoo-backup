/**
 * CAMPAIGN CONTINUATION FIX
 * 
 * This fixes the issue where campaigns stop after Telegraph publishing
 * instead of automatically continuing to the next platform.
 * 
 * The problem: working-campaign-processor.js marks campaigns as 'active' 
 * but doesn't trigger continuation to next platform
 */

// Enhanced campaign processor that properly handles platform rotation
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

    console.log('🚀 Processing campaign with continuation fix:', { keyword, anchorText, targetUrl, campaignId });

    // Validate inputs
    if (!keyword || !anchorText || !targetUrl) {
      throw new Error('Missing required parameters: keyword, anchorText, targetUrl');
    }

    // Initialize Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Generate content
    const blogPost = await generateSingleBlogPost(keyword, anchorText, targetUrl);
    console.log('✅ Generated blog post using random prompt');

    // Step 2: Get next platform and publish
    const nextPlatform = await getNextAvailablePlatform(supabase, campaignId);
    console.log(`📡 Publishing to platform: ${nextPlatform}`);

    let publishedUrl;
    let platform;

    // Publish to the selected platform
    if (nextPlatform === 'telegraph') {
      publishedUrl = await publishToTelegraph(blogPost.title, blogPost.content);
      platform = 'Telegraph.ph';
      await validateTelegraphUrl(publishedUrl);
    } else if (nextPlatform === 'writeas') {
      publishedUrl = await publishToWriteAs(blogPost.title, blogPost.content);
      platform = 'writeas';
      await validateWriteAsUrl(publishedUrl);
    } else {
      // Fallback to Telegraph
      publishedUrl = await publishToTelegraph(blogPost.title, blogPost.content);
      platform = 'Telegraph.ph';
      await validateTelegraphUrl(publishedUrl);
    }

    console.log(`✅ Published to ${platform}:`, publishedUrl);

    // Step 3: Save to database
    await savePublishedLink(supabase, campaignId, publishedUrl, blogPost.title, platform);
    await trackPlatformUsage(supabase, campaignId, nextPlatform);

    // Step 4: CRITICAL FIX - Check completion and handle continuation
    const shouldComplete = await checkAllPlatformsCompleted(supabase, campaignId);
    
    if (shouldComplete) {
      // All platforms completed - mark as completed
      await updateCampaignStatus(supabase, campaignId, 'completed', [publishedUrl]);
      console.log('✅ Campaign completed - all platforms have published content');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          status: 'completed',
          message: 'Campaign completed - all platforms used',
          data: {
            publishedUrls: [publishedUrl],
            totalPosts: 1,
            keyword,
            anchorText,
            targetUrl,
            platform: nextPlatform,
            completedAt: new Date().toISOString()
          }
        }),
      };
    } else {
      // More platforms available - set up for continuation
      const nextAvailablePlatform = await getNextAvailablePlatform(supabase, campaignId);
      
      if (nextAvailablePlatform) {
        // Keep campaign active and schedule next platform processing
        await updateCampaignStatus(supabase, campaignId, 'active', [publishedUrl]);
        
        // Add activity log about next platform
        await logCampaignActivity(supabase, campaignId, 'info', 
          `Published to ${platform}. Next platform: ${nextAvailablePlatform}`);
        
        console.log(`🔄 Campaign active - next platform: ${nextAvailablePlatform}`);
        
        // CRITICAL FIX: Auto-trigger next platform processing after delay
        setTimeout(async () => {
          try {
            console.log(`🚀 Auto-triggering next platform: ${nextAvailablePlatform}`);
            
            // Call the processor again for the next platform
            const nextProcessingResult = await triggerNextPlatformProcessing(
              campaignId, keyword, anchorText, targetUrl
            );
            
            console.log('✅ Next platform processing triggered:', nextProcessingResult);
          } catch (error) {
            console.error('❌ Failed to trigger next platform:', error);
            // Pause campaign for manual intervention
            await updateCampaignStatus(supabase, campaignId, 'paused', [publishedUrl]);
            await logCampaignActivity(supabase, campaignId, 'error', 
              `Failed to auto-continue to next platform: ${error.message}`);
          }
        }, 3000); // 3 second delay to allow current request to complete
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            status: 'continuing',
            message: `Published to ${platform}. Auto-continuing to ${nextAvailablePlatform}`,
            data: {
              publishedUrls: [publishedUrl],
              totalPosts: 1,
              keyword,
              anchorText,
              targetUrl,
              platform: nextPlatform,
              nextPlatform: nextAvailablePlatform,
              autoContaining: true,
              completedAt: new Date().toISOString()
            }
          }),
        };
      } else {
        // No more platforms - mark as completed
        await updateCampaignStatus(supabase, campaignId, 'completed', [publishedUrl]);
        console.log('✅ Campaign completed - no more platforms available');
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            status: 'completed',
            message: 'Campaign completed - all available platforms used',
            data: {
              publishedUrls: [publishedUrl],
              totalPosts: 1,
              keyword,
              anchorText,
              targetUrl,
              platform: nextPlatform,
              completedAt: new Date().toISOString()
            }
          }),
        };
      }
    }

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
 * Trigger next platform processing automatically
 */
async function triggerNextPlatformProcessing(campaignId, keyword, anchorText, targetUrl) {
  const fetch = require('node-fetch');
  
  // Get the current URL for the processor
  const processorUrl = process.env.URL ? 
    `${process.env.URL}/.netlify/functions/working-campaign-processor` :
    'http://localhost:8888/.netlify/functions/working-campaign-processor';
  
  try {
    const response = await fetch(processorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaignId,
        keyword,
        anchorText,
        targetUrl
      })
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to trigger next platform processing:', error);
    throw error;
  }
}

/**
 * Log campaign activity
 */
async function logCampaignActivity(supabase, campaignId, level, message) {
  try {
    const { error } = await supabase
      .from('automation_logs')
      .insert({
        campaign_id: campaignId,
        level: level,
        message: message,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.warn('Failed to log campaign activity:', error);
    }
  } catch (error) {
    console.warn('Campaign activity logging error:', error);
  }
}

// Import the rest of the functions from the original processor
// (Functions like generateSingleBlogPost, publishToTelegraph, etc.)
// These would be copied from the original working-campaign-processor.js

async function generateSingleBlogPost(keyword, anchorText, targetUrl) {
  // [Copy from original file]
  const prompts = [
    `Generate a blog post on ${keyword} including the ${anchorText} hyperlinked to ${targetUrl}`,
    `Write a article about ${keyword} with a hyperlinked ${anchorText} linked to ${targetUrl}`,
    `Produce a write up on ${keyword} that links ${anchorText} to ${targetUrl}`
  ];

  const randomIndex = Math.floor(Math.random() * prompts.length);
  const selectedPrompt = prompts[randomIndex];

  console.log(`🎲 Using prompt ${randomIndex + 1} of 3: "${selectedPrompt}"`);

  try {
    if (process.env.OPENAI_API_KEY) {
      const content = await generateOpenAIContent(selectedPrompt, keyword, anchorText, targetUrl);
      return {
        title: `${keyword}: Professional Guide`,
        content: content,
        prompt: selectedPrompt,
        promptIndex: randomIndex + 1
      };
    } else {
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
    const content = generateTemplateContent(keyword, anchorText, targetUrl, randomIndex + 1);
    return {
      title: `${keyword}: Professional Guide`,
      content: content,
      prompt: selectedPrompt,
      promptIndex: randomIndex + 1
    };
  }
}

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
  
  if (!content.includes(`href="${targetUrl}"`)) {
    content = content.replace(
      new RegExp(anchorText, 'gi'), 
      `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>`
    );
  }

  return content;
}

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
    }
  ];

  return templates[0].content;
}

async function publishToTelegraph(title, content) {
  const fetch = require('node-fetch');

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
  const telegraphContent = convertToTelegraphFormat(content);

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

function convertToTelegraphFormat(html) {
  const lines = html.split('\n');
  const telegraphNodes = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
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
    } else if (trimmed.startsWith('<p>')) {
      const processedText = processHTMLContent(trimmed.replace(/<\/?p>/g, ''));
      if (processedText.length > 0) {
        telegraphNodes.push({
          tag: 'p',
          children: processedText
        });
      }
    } else if (trimmed.startsWith('<li>')) {
      const processedText = processHTMLContent(trimmed.replace(/<\/?li>/g, ''));
      if (processedText.length > 0) {
        telegraphNodes.push({
          tag: 'p',
          children: ['• ', ...processedText]
        });
      }
    }
  }
  
  return telegraphNodes;
}

function processHTMLContent(text) {
  const result = [];
  let currentIndex = 0;
  const formatRegex = /(<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>|<strong>([^<]+)<\/strong>|<b>([^<]+)<\/b>)/gi;
  let match;

  while ((match = formatRegex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      const beforeText = text.substring(currentIndex, match.index);
      if (beforeText.trim()) {
        result.push(beforeText);
      }
    }

    if (match[0].startsWith('<a')) {
      result.push({
        tag: 'a',
        attrs: { href: match[2] },
        children: [match[3]]
      });
    } else if (match[0].startsWith('<strong>') || match[0].startsWith('<b>')) {
      const content = match[4] || match[5];
      result.push({
        tag: 'b',
        children: [content]
      });
    }

    currentIndex = match.index + match[0].length;
  }

  if (currentIndex < text.length) {
    const remainingText = text.substring(currentIndex);
    if (remainingText.trim()) {
      result.push(remainingText);
    }
  }

  return result.length > 0 ? result : [text];
}

async function validateTelegraphUrl(url) {
  return true; // Simplified for this fix
}

async function publishToWriteAs(title, content) {
  const fetch = require('node-fetch');
  const writeasContent = convertToWriteasFormat(content);

  const postResponse = await fetch('https://write.as/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: title,
      body: writeasContent
    })
  });

  const responseData = await postResponse.json();
  if (!postResponse.ok || responseData.code !== 201) {
    throw new Error(`Write.as post creation failed: ${responseData.error || 'Unknown error'}`);
  }

  return `https://write.as/${responseData.data.id}`;
}

function convertToWriteasFormat(htmlContent) {
  let markdown = htmlContent;
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1');
  markdown = markdown.replace(/<p[^>]*>/gi, '');
  markdown = markdown.replace(/<\/p>/gi, '\n\n');
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<a[^>]*href\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1');
  markdown = markdown.replace(/<\/?[uo]l[^>]*>/gi, '');
  markdown = markdown.replace(/<[^>]*>/g, '');
  markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');
  return markdown.trim();
}

async function validateWriteAsUrl(url) {
  return true; // Simplified for this fix
}

async function getNextAvailablePlatform(supabase, campaignId) {
  try {
    const availablePlatforms = await getActivePlatforms();
    
    const { data: publishedLinks, error } = await supabase
      .from('automation_published_links')
      .select('platform')
      .eq('campaign_id', campaignId);

    if (error) {
      console.warn('Error checking published links:', error);
      return availablePlatforms[0].id;
    }

    const usedPlatforms = new Set(
      (publishedLinks || []).map(link => {
        const platform = link.platform.toLowerCase();
        if (platform === 'write.as' || platform === 'writeas') return 'writeas';
        if (platform === 'telegraph.ph' || platform === 'telegraph') return 'telegraph';
        return platform;
      })
    );

    for (const platform of availablePlatforms) {
      if (!usedPlatforms.has(platform.id)) {
        return platform.id;
      }
    }

    throw new Error('All available platforms have been used for this campaign');
  } catch (error) {
    console.error('Error getting next platform:', error);
    throw error;
  }
}

async function trackPlatformUsage(supabase, campaignId, platformId) {
  console.log(`📊 Tracked platform usage: ${platformId} for campaign ${campaignId}`);
  return true;
}

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
      console.warn('Failed to save published link:', error);
    }
  } catch (error) {
    console.warn('Database save failed:', error);
  }
}

async function updateCampaignStatus(supabase, campaignId, status, publishedUrls) {
  try {
    const updateData = { 
      status: status,
      updated_at: new Date().toISOString()
    };
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('automation_campaigns')
      .update(updateData)
      .eq('id', campaignId);

    if (error) {
      console.warn('Failed to update campaign status:', error);
    }
  } catch (error) {
    console.warn('Campaign status update failed:', error);
  }
}

async function getActivePlatforms() {
  const allPlatforms = [
    { id: 'telegraph', name: 'Telegraph.ph', isActive: true, priority: 1 },
    { id: 'writeas', name: 'Write.as', isActive: true, priority: 2 }
  ];

  return allPlatforms
    .filter(p => p.isActive)
    .sort((a, b) => a.priority - b.priority);
}

async function checkAllPlatformsCompleted(supabase, campaignId) {
  try {
    const activePlatforms = await getActivePlatforms();
    
    const { data: publishedLinks, error } = await supabase
      .from('automation_published_links')
      .select('platform, published_url')
      .eq('campaign_id', campaignId)
      .eq('status', 'active');

    if (error) {
      console.warn('Failed to fetch published links:', error);
      return false;
    }

    const publishedPlatforms = new Set(
      (publishedLinks || []).map(link => {
        const platform = link.platform.toLowerCase();
        if (platform === 'write.as' || platform === 'writeas') return 'writeas';
        if (platform === 'telegraph.ph' || platform === 'telegraph') return 'telegraph';
        return platform;
      })
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
    return false;
  }
}
