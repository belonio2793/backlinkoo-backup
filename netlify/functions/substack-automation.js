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
    const { action, campaignId, keyword, targetUrl } = JSON.parse(event.body || '{}');
    
    console.log('Substack automation request:', { action, campaignId, keyword, targetUrl });

    if (action === 'start') {
      return await startSubstackAutomation(campaignId, keyword, targetUrl, headers);
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid action. Use "start"' })
      };
    }

  } catch (error) {
    console.error('Substack automation error:', error);
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

async function startSubstackAutomation(campaignId, keyword, targetUrl, headers) {
  console.log(`Starting Substack automation for keyword: ${keyword}`);

  try {
    // Create session for tracking
    const { data: session } = await supabase
      .from('substack_sessions')
      .insert({
        campaign_id: campaignId,
        status: 'running',
        progress: 0,
        current_step: 'Initializing browser...'
      })
      .select()
      .single();

    // Start the automation process (run in background)
    setTimeout(async () => {
      await runSubstackAutomation(campaignId, keyword, targetUrl, session.id);
    }, 1000);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        sessionId: session.id,
        message: 'Substack automation started'
      })
    };

  } catch (error) {
    console.error('Error starting Substack automation:', error);
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

async function runSubstackAutomation(campaignId, keyword, targetUrl, sessionId) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  });

  try {
    // Step 1: Search Substack
    await updateSession(sessionId, 10, 'Searching Substack for keyword...');
    
    const page = await context.newPage();
    const searchUrl = `https://substack.com/search/${encodeURIComponent(keyword)}`;
    console.log('Navigating to:', searchUrl);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Step 2: Find posts
    await updateSession(sessionId, 25, 'Finding relevant posts...');
    
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
        .slice(0, 3); // Take first 3 posts
    });

    console.log(`Found ${posts.length} posts:`, posts);

    if (posts.length === 0) {
      throw new Error('No suitable Substack posts found for this keyword');
    }

    // Step 3: Process each post
    let successfulPosts = 0;
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const progress = 30 + (i / posts.length) * 60;
      
      await updateSession(sessionId, progress, `Processing post ${i + 1}/${posts.length}...`);
      
      try {
        const result = await processSubstackPost(page, post, keyword, targetUrl, campaignId);
        if (result.success) {
          successfulPosts++;
          console.log(`Successfully posted comment on: ${post.url}`);
        } else {
          console.log(`Failed to post on: ${post.url} - ${result.error}`);
        }
      } catch (postError) {
        console.error(`Error processing post ${post.url}:`, postError);
      }
      
      // Rate limiting between posts
      await page.waitForTimeout(5000);
    }

    // Step 4: Complete
    await updateSession(sessionId, 100, 'Automation completed!', {
      postsFound: posts.length,
      commentsPosted: successfulPosts,
      successRate: posts.length > 0 ? (successfulPosts / posts.length) * 100 : 0
    });

    // Update campaign stats
    await supabase
      .from('substack_campaigns')
      .update({
        posts_found: posts.length,
        comments_posted: successfulPosts,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);

  } catch (error) {
    console.error('Substack automation error:', error);
    
    await supabase
      .from('substack_sessions')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);

  } finally {
    await browser.close();
  }
}

async function processSubstackPost(page, post, keyword, targetUrl, campaignId) {
  try {
    console.log(`Processing Substack post: ${post.url}`);
    
    // Navigate to the post
    await page.goto(post.url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);

    // Look for comment section
    const hasCommentSection = await page.locator('textarea[placeholder*="comment"], textarea[placeholder*="Write"], .comment-input, [data-testid="comment-input"]').count() > 0;
    
    if (!hasCommentSection) {
      console.log('No comment section found');
      return { success: false, error: 'No comment section found' };
    }

    // Generate contextual comment
    const postTitle = await page.title();
    const comment = generateContextualComment(postTitle, keyword, targetUrl);
    
    // Find and fill comment textarea
    const commentSelector = 'textarea[placeholder*="comment"], textarea[placeholder*="Write"], .comment-input textarea, [data-testid="comment-input"]';
    await page.waitForSelector(commentSelector, { timeout: 10000 });
    
    // Type the comment with human-like delays
    await page.click(commentSelector);
    await page.waitForTimeout(1000);
    await page.fill(commentSelector, comment);
    await page.waitForTimeout(2000);

    // Look for submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Post"), button:has-text("Comment"), button:has-text("Publish")').first();
    
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      // Check for success indicators
      const successIndicators = [
        'comment posted',
        'thank you',
        'comment submitted',
        'awaiting moderation',
        'comment will appear'
      ];
      
      const pageText = await page.textContent('body');
      const success = successIndicators.some(indicator => 
        pageText.toLowerCase().includes(indicator)
      );
      
      if (success) {
        // Store successful result
        const commentUrl = page.url() + '#comments';
        
        await supabase.from('substack_posts').insert({
          campaign_id: campaignId,
          substack_post_url: post.url,
          comment_url: commentUrl,
          comment_content: comment,
          substack_domain: post.domain,
          substack_title: postTitle,
          status: 'posted'
        });
        
        return { success: true, commentUrl };
      } else {
        // Store failed attempt
        await supabase.from('substack_posts').insert({
          campaign_id: campaignId,
          substack_post_url: post.url,
          comment_content: comment,
          substack_domain: post.domain,
          substack_title: postTitle,
          status: 'failed'
        });
        
        return { success: false, error: 'Comment submission may have failed' };
      }
    } else {
      return { success: false, error: 'Submit button not found' };
    }

  } catch (error) {
    console.error('Error processing Substack post:', error);
    return { success: false, error: error.message };
  }
}

function generateContextualComment(postTitle, keyword, targetUrl) {
  const templates = [
    `Great insights on ${keyword}! This really resonates with my experience. I recently came across some relevant information at ${targetUrl} that complements what you've shared here.`,
    
    `Thanks for this thoughtful piece on ${keyword}. Your perspective adds valuable context to the discussion. For anyone interested in exploring this further, I found ${targetUrl} to be quite helpful.`,
    
    `Excellent analysis! The points about ${keyword} are particularly well-articulated. This reminds me of some research I've been following at ${targetUrl} which touches on similar themes.`,
    
    `Really appreciate this deep dive into ${keyword}. Your approach to the topic is refreshing. I've been working on related content and found ${targetUrl} to be a valuable resource for additional context.`,
    
    `This is exactly the kind of thoughtful commentary on ${keyword} that I was hoping to find. The insights here align well with some findings I've explored at ${targetUrl}.`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
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
    .from('substack_sessions')
    .update(updateData)
    .eq('id', sessionId);
}
