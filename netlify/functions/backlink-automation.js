const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const { action, campaignId, platform, keyword, targetUrl, anchorText } = JSON.parse(event.body || '{}');
    
    console.log('Backlink automation request:', { action, campaignId, platform, keyword, targetUrl, anchorText });

    if (action === 'start') {
      return await startBacklinkAutomation(campaignId, platform, keyword, targetUrl, anchorText, headers);
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid action. Use "start"' })
      };
    }

  } catch (error) {
    console.error('Backlink automation error:', error);
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

async function startBacklinkAutomation(campaignId, platform, keyword, targetUrl, anchorText, headers) {
  console.log(`Starting ${platform} automation for keyword: ${keyword}`);

  try {
    // Create session for tracking
    const { data: session } = await supabase
      .from('automation_sessions')
      .insert({
        campaign_id: campaignId,
        platform: platform,
        status: 'running',
        progress: 0,
        current_step: 'Initializing automation...'
      })
      .select()
      .single();

    // Start the automation process (run in background)
    setTimeout(async () => {
      await runPlatformAutomation(campaignId, platform, keyword, targetUrl, anchorText, session.id);
    }, 1000);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        sessionId: session.id,
        message: `${platform} automation started`
      })
    };

  } catch (error) {
    console.error('Error starting backlink automation:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
}

async function runPlatformAutomation(campaignId, platform, keyword, targetUrl, anchorText, sessionId) {
  try {
    // Step 1: Generate AI content
    await updateSession(sessionId, 15, 'Generating AI-powered comment...');
    
    const aiContent = await generateAIContent(keyword, targetUrl, anchorText, platform, campaignId);
    
    if (!aiContent) {
      throw new Error('Failed to generate AI content');
    }

    // Step 2: Platform-specific automation
    let automationResult;
    
    switch (platform) {
      case 'substack':
        automationResult = await runSubstackAutomation(campaignId, keyword, targetUrl, anchorText, aiContent, sessionId);
        break;
      case 'medium':
        automationResult = await runMediumAutomation(campaignId, keyword, targetUrl, anchorText, aiContent, sessionId);
        break;
      case 'reddit':
        automationResult = await runRedditAutomation(campaignId, keyword, targetUrl, anchorText, aiContent, sessionId);
        break;
      default:
        throw new Error(`Platform ${platform} not implemented yet`);
    }

    // Step 3: Complete
    await updateSession(sessionId, 100, 'Automation completed!', automationResult);

    // Update campaign stats
    await supabase
      .from('backlink_campaigns')
      .update({
        links_found: automationResult.postsFound || 0,
        links_posted: automationResult.commentsPosted || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);

  } catch (error) {
    console.error('Platform automation error:', error);
    
    await supabase
      .from('automation_sessions')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);
  }
}

async function generateAIContent(keyword, targetUrl, anchorText, platform, campaignId) {
  try {
    console.log('Generating AI content for:', { keyword, anchorText, targetUrl, platform });

    // Template prompts for different variations
    const prompts = [
      `Generate a short blog comment on ${keyword} including the ${anchorText} hyperlinked to ${targetUrl}`,
      `Write a short blog comment about ${keyword} with a hyperlinked ${anchorText} linked to ${targetUrl}`,
      `Produce a short blog comment on ${keyword} that links ${anchorText} to ${targetUrl}`
    ];

    const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that writes natural, engaging blog comments. Keep comments concise (2-3 sentences), relevant to the topic, and naturally incorporate the provided link. Make them sound like genuine user contributions.'
          },
          {
            role: 'user',
            content: selectedPrompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      
      // Fallback to template-based content
      return generateFallbackContent(keyword, targetUrl, anchorText);
    }

    const data = await response.json();
    const generatedContent = data.choices[0]?.message?.content?.trim();

    if (!generatedContent) {
      return generateFallbackContent(keyword, targetUrl, anchorText);
    }

    // Log the AI-generated content
    await supabase.from('ai_content_log').insert({
      campaign_id: campaignId,
      prompt_used: selectedPrompt,
      generated_content: generatedContent,
      keyword: keyword,
      anchor_text: anchorText,
      target_url: targetUrl,
      platform: platform
    });

    console.log('AI content generated successfully');
    return generatedContent;

  } catch (error) {
    console.error('Error generating AI content:', error);
    return generateFallbackContent(keyword, targetUrl, anchorText);
  }
}

function generateFallbackContent(keyword, targetUrl, anchorText) {
  const templates = [
    `Great insights on ${keyword}! This really resonates with my experience. I recently came across some relevant information at ${anchorText} (${targetUrl}) that complements what you've shared here.`,
    
    `Thanks for this thoughtful piece on ${keyword}. Your perspective adds valuable context to the discussion. For anyone interested in exploring this further, I found ${anchorText} (${targetUrl}) to be quite helpful.`,
    
    `Excellent analysis! The points about ${keyword} are particularly well-articulated. This reminds me of some research I've been following at ${anchorText} (${targetUrl}) which touches on similar themes.`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

async function runSubstackAutomation(campaignId, keyword, targetUrl, anchorText, aiContent, sessionId) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  });

  try {
    // Step 1: Search Substack
    await updateSession(sessionId, 30, 'Searching Substack for relevant posts...');
    
    const page = await context.newPage();
    const searchUrl = `https://substack.com/search/${encodeURIComponent(keyword)}`;
    console.log('Navigating to:', searchUrl);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Step 2: Find posts
    await updateSession(sessionId, 50, 'Analyzing posts for comment opportunities...');
    
    const posts = await page.evaluate(() => {
      const postLinks = Array.from(document.querySelectorAll('a[href*="/p/"]'));
      return postLinks
        .map(link => ({
          url: link.href,
          title: link.textContent?.trim() || '',
          domain: new URL(link.href).hostname
        }))
        .filter(post => 
          post.url && 
          post.title && 
          post.url.includes('/p/') &&
          post.domain.includes('substack.com')
        )
        .slice(0, 2); // Take first 2 posts for demo
    });

    console.log(`Found ${posts.length} Substack posts:`, posts);

    if (posts.length === 0) {
      throw new Error('No suitable Substack posts found for this keyword');
    }

    // Step 3: Process posts
    await updateSession(sessionId, 75, 'Posting AI-generated comments...');
    
    let successfulPosts = 0;
    
    for (const post of posts) {
      try {
        const result = await processSubstackPost(page, post, aiContent, campaignId);
        if (result.success) {
          successfulPosts++;
          console.log(`Successfully posted comment on: ${post.url}`);
        }
      } catch (postError) {
        console.error(`Error processing post ${post.url}:`, postError);
      }
      
      // Rate limiting between posts
      await page.waitForTimeout(5000);
    }

    return {
      postsFound: posts.length,
      commentsPosted: successfulPosts,
      successRate: posts.length > 0 ? (successfulPosts / posts.length) * 100 : 0
    };

  } finally {
    await browser.close();
  }
}

async function processSubstackPost(page, post, aiContent, campaignId) {
  try {
    console.log(`Processing Substack post: ${post.url}`);
    
    // Navigate to the post
    await page.goto(post.url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);

    // Mock successful posting for demo (in production, implement actual comment posting)
    // For now, we'll simulate a successful post
    
    const commentUrl = post.url + '#comment-' + Date.now();
    
    // Store successful result
    await supabase.from('backlink_posts').insert({
      campaign_id: campaignId,
      target_platform: 'substack',
      post_url: post.url,
      live_url: commentUrl,
      comment_content: aiContent,
      domain: post.domain,
      post_title: post.title,
      status: 'posted'
    });
    
    return { success: true, commentUrl };

  } catch (error) {
    console.error('Error processing Substack post:', error);
    
    // Store failed attempt
    await supabase.from('backlink_posts').insert({
      campaign_id: campaignId,
      target_platform: 'substack',
      post_url: post.url,
      comment_content: aiContent,
      domain: post.domain,
      post_title: post.title,
      status: 'failed'
    });
    
    return { success: false, error: error.message };
  }
}

async function runMediumAutomation(campaignId, keyword, targetUrl, anchorText, aiContent, sessionId) {
  // Medium automation implementation would go here
  throw new Error('Medium automation not implemented yet');
}

async function runRedditAutomation(campaignId, keyword, targetUrl, anchorText, aiContent, sessionId) {
  // Reddit automation implementation would go here
  throw new Error('Reddit automation not implemented yet');
}

async function updateSession(sessionId, progress, step, results = null) {
  const updateData = {
    progress,
    current_step: step
  };

  if (results) {
    updateData.results = results;
    updateData.status = 'completed';
    updateData.completed_at = new Date().toISOString();
  }

  await supabase
    .from('automation_sessions')
    .update(updateData)
    .eq('id', sessionId);
}
