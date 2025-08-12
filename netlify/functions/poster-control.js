import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { action, campaignId, formIds, accountPool, settings } = JSON.parse(event.body);

    switch (action) {
      case 'start_posting':
        return await startAutomatedPosting(campaignId, formIds, accountPool, settings);
      case 'test_form':
        return await testFormSubmission(event.body);
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error) {
    console.error('Poster control error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function startAutomatedPosting(campaignId, formIds, accountPool, settings) {
  const jobId = `post_${Date.now()}`;
  const results = [];

  // Create automation job record
  const { data: job } = await supabase
    .from('automation_jobs')
    .insert([{
      campaign_id: campaignId,
      job_type: 'post_comments',
      status: 'processing',
      payload: { formIds, settings }
    }])
    .select()
    .single();

  try {
    // Get campaign details
    const { data: campaign } = await supabase
      .from('blog_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get form maps with target URLs
    const { data: formMaps } = await supabase
      .from('form_maps')
      .select(`
        *,
        crawler_targets (url, domain)
      `)
      .in('id', formIds)
      .eq('status', 'vetted');

    if (!formMaps || formMaps.length === 0) {
      throw new Error('No vetted forms found');
    }

    // Filter out recently posted domains (respect max_posts_per_domain)
    const recentPosts = await supabase
      .from('blog_posts')
      .select('target_url, created_at')
      .eq('campaign_id', campaignId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

    const recentDomains = new Map();
    recentPosts.data?.forEach(post => {
      const domain = extractDomain(post.target_url);
      const count = recentDomains.get(domain) || 0;
      recentDomains.set(domain, count + 1);
    });

    const availableForms = formMaps.filter(form => {
      const domain = form.crawler_targets.domain;
      const postCount = recentDomains.get(domain) || 0;
      return postCount < (campaign.max_posts_per_domain || 1);
    });

    console.log(`Processing ${availableForms.length} forms for posting`);

    // Process each form
    for (const formMap of availableForms) {
      try {
        const targetUrl = formMap.crawler_targets.url;
        
        // Select account from pool (rotate)
        const account = accountPool[Math.floor(Math.random() * accountPool.length)];
        
        // Generate comment content
        const commentContent = await generateCommentContent(campaign.keyword, targetUrl);
        
        // Create blog post record
        const { data: blogPost } = await supabase
          .from('blog_posts')
          .insert([{
            campaign_id: campaignId,
            form_id: formMap.id,
            target_url: targetUrl,
            account_id: account?.id,
            content: commentContent,
            status: 'pending'
          }])
          .select()
          .single();

        // Attempt posting with Playwright
        const postResult = await attemptFormSubmission(
          targetUrl,
          formMap,
          {
            name: campaign.anchor_text || account?.display_name || 'Anonymous',
            email: account?.email || 'example@email.com',
            website: campaign.target_url,
            comment: commentContent
          },
          settings
        );

        // Update blog post with result
        await supabase
          .from('blog_posts')
          .update({
            status: postResult.status,
            response_data: postResult.responseData,
            screenshot_url: postResult.screenshotUrl,
            error_message: postResult.errorMessage,
            posted_at: postResult.status === 'posted' ? new Date().toISOString() : null
          })
          .eq('id', blogPost.id);

        results.push({
          targetUrl,
          status: postResult.status,
          message: postResult.message
        });

        // Update form last_posted_at if successful
        if (postResult.status === 'posted') {
          await supabase
            .from('form_maps')
            .update({ last_posted_at: new Date().toISOString() })
            .eq('id', formMap.id);

          // Update account last_used
          if (account?.id) {
            await supabase
              .from('blog_accounts')
              .update({ last_used: new Date().toISOString() })
              .eq('id', account.id);
          }
        }

        // Rate limiting between posts
        if (settings.rate_limit) {
          await delay(settings.rate_limit);
        }

        // Honor max concurrent limit
        if (results.length >= (settings.max_concurrent || 10)) {
          break;
        }

      } catch (error) {
        console.error(`Error posting to ${formMap.crawler_targets.url}:`, error);
        results.push({
          targetUrl: formMap.crawler_targets.url,
          status: 'failed',
          message: error.message
        });
      }
    }

    const successCount = results.filter(r => r.status === 'posted').length;
    const failureCount = results.filter(r => r.status === 'failed').length;
    const captchaCount = results.filter(r => r.status === 'captcha').length;

    // Update job completion
    await supabase
      .from('automation_jobs')
      .update({
        status: 'completed',
        result: {
          successful_posts: successCount,
          failed_posts: failureCount,
          captcha_encounters: captchaCount,
          total_attempts: results.length,
          summary: `Posted ${successCount} comments successfully, ${failureCount} failed, ${captchaCount} CAPTCHA encounters`
        },
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    // Update campaign stats
    const { data: campaignStats } = await supabase
      .from('blog_posts')
      .select('status')
      .eq('campaign_id', campaignId);

    const totalPosted = campaignStats?.filter(p => p.status === 'posted').length || 0;

    await supabase
      .from('blog_campaigns')
      .update({
        links_posted: totalPosted
      })
      .eq('id', campaignId);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        jobId: job.id,
        results: {
          successful_posts: successCount,
          failed_posts: failureCount,
          captcha_encounters: captchaCount,
          total_attempts: results.length
        },
        details: results
      })
    };

  } catch (error) {
    // Update job failure
    await supabase
      .from('automation_jobs')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    throw error;
  }
}

async function attemptFormSubmission(targetUrl, formMap, payload, settings) {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  try {
    console.log(`Attempting to post to: ${targetUrl}`);

    // Navigate to target page
    await page.goto(targetUrl, { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });

    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    // Check for CAPTCHA before proceeding
    const hasCaptcha = await page.evaluate(() => {
      const captchaSelectors = [
        'iframe[src*="captcha"]',
        'iframe[src*="recaptcha"]',
        '.g-recaptcha',
        '.h-captcha',
        '.captcha',
        '[data-sitekey]'
      ];
      return captchaSelectors.some(selector => document.querySelector(selector));
    });

    if (hasCaptcha) {
      const screenshot = await page.screenshot({ fullPage: false });
      await browser.close();
      
      return {
        status: 'captcha',
        message: 'CAPTCHA detected - requires human intervention',
        screenshotUrl: await uploadScreenshot(screenshot),
        responseData: { captcha_detected: true }
      };
    }

    // Wait for form to be present
    try {
      await page.waitForSelector(formMap.form_selector, { timeout: 10000 });
    } catch (error) {
      throw new Error(`Form not found with selector: ${formMap.form_selector}`);
    }

    // Fill form fields with randomized delays
    const fields = formMap.fields;
    
    if (fields.name) {
      await page.fill(fields.name, payload.name);
      await page.waitForTimeout(500 + Math.random() * 1000);
    }
    
    if (fields.email) {
      await page.fill(fields.email, payload.email);
      await page.waitForTimeout(500 + Math.random() * 1000);
    }
    
    if (fields.website && payload.website) {
      await page.fill(fields.website, payload.website);
      await page.waitForTimeout(500 + Math.random() * 1000);
    }
    
    if (fields.comment) {
      await page.fill(fields.comment, payload.comment);
      await page.waitForTimeout(1000 + Math.random() * 2000);
    }

    // Handle hidden fields (CSRF tokens, etc.)
    if (formMap.hidden_fields) {
      for (const [name, value] of Object.entries(formMap.hidden_fields)) {
        try {
          await page.evaluate(({ name, value }) => {
            const input = document.querySelector(`input[name="${name}"]`);
            if (input) input.value = value;
          }, { name, value });
        } catch (error) {
          console.warn(`Failed to set hidden field ${name}:`, error);
        }
      }
    }

    // Take screenshot before submission if enabled
    let preSubmitScreenshot = null;
    if (settings.capture_screenshots) {
      preSubmitScreenshot = await page.screenshot({ fullPage: false });
    }

    // Submit form
    if (formMap.submit_selector) {
      try {
        await page.click(formMap.submit_selector);
      } catch (error) {
        // Fallback: submit form via JavaScript
        await page.evaluate((selector) => {
          const form = document.querySelector(selector);
          if (form) form.submit();
        }, formMap.form_selector);
      }
    } else {
      // Try to submit the form element directly
      await page.evaluate((selector) => {
        const form = document.querySelector(selector);
        if (form) form.submit();
      }, formMap.form_selector);
    }

    // Wait for response
    await page.waitForTimeout(3000);

    // Check for success indicators
    const pageContent = await page.textContent('body');
    const currentUrl = page.url();
    
    const successIndicators = [
      /thank you/i,
      /comment posted/i,
      /comment added/i,
      /awaiting moderation/i,
      /your comment is pending/i,
      /comment submitted/i,
      /successfully posted/i
    ];

    const isSuccess = successIndicators.some(pattern => pattern.test(pageContent || ''));
    
    // Check if comment appears in DOM (immediate posting)
    const commentVisible = await page.evaluate((commentText) => {
      const bodyText = document.body.innerText.toLowerCase();
      const searchText = commentText.toLowerCase().substring(0, 50);
      return bodyText.includes(searchText);
    }, payload.comment);

    // Take final screenshot
    const finalScreenshot = settings.capture_screenshots 
      ? await page.screenshot({ fullPage: false })
      : null;

    await browser.close();

    // Determine final status
    let status = 'failed';
    let message = 'Comment submission failed';

    if (isSuccess || commentVisible) {
      status = 'posted';
      message = 'Comment posted successfully';
    } else if (pageContent && /moderation|pending|review/i.test(pageContent)) {
      status = 'moderation';
      message = 'Comment submitted for moderation';
    } else if (currentUrl !== targetUrl) {
      status = 'posted';
      message = 'Redirected after submission (likely successful)';
    }

    return {
      status,
      message,
      screenshotUrl: finalScreenshot ? await uploadScreenshot(finalScreenshot) : null,
      responseData: {
        url_changed: currentUrl !== targetUrl,
        success_text_found: isSuccess,
        comment_visible: commentVisible,
        page_text_sample: (pageContent || '').substring(0, 500)
      }
    };

  } catch (error) {
    console.error(`Form submission error for ${targetUrl}:`, error);
    
    try {
      const errorScreenshot = await page.screenshot({ fullPage: false });
      await browser.close();
      
      return {
        status: 'failed',
        message: `Submission failed: ${error.message}`,
        screenshotUrl: await uploadScreenshot(errorScreenshot),
        errorMessage: error.message,
        responseData: { error: error.message }
      };
    } catch (screenshotError) {
      await browser.close();
      
      return {
        status: 'failed',
        message: `Submission failed: ${error.message}`,
        errorMessage: error.message,
        responseData: { error: error.message }
      };
    }
  }
}

async function generateCommentContent(keyword, targetUrl) {
  // Generate contextual comment using multiple templates
  const templates = [
    `Great insights about ${keyword}! This really helped clarify some concepts I was struggling with.`,
    `Thanks for sharing this perspective on ${keyword}. I hadn't considered this angle before.`,
    `Excellent breakdown of ${keyword}. The practical examples make it much easier to understand.`,
    `This article on ${keyword} addresses exactly what I've been researching. Very timely!`,
    `Really appreciate the detailed explanation of ${keyword}. Bookmarking this for future reference.`,
    `Your approach to ${keyword} is refreshing. Have you written more content on this topic?`,
    `The section about ${keyword} was particularly enlightening. Thanks for the great content!`,
    `As someone working with ${keyword}, I found this incredibly useful and actionable.`,
    `This ${keyword} guide is going straight to my resource collection. Much appreciated!`,
    `Valuable insights about ${keyword}. The real-world applications you mention are spot-on.`
  ];

  // Add some variation based on content length
  const shortTemplates = [
    `Great points about ${keyword}!`,
    `Very helpful insights on ${keyword}.`,
    `Excellent ${keyword} resource, thanks!`,
    `Perfect timing for this ${keyword} content.`,
    `Bookmarked this ${keyword} article.`
  ];

  // Randomly choose between long and short comments
  const useShort = Math.random() < 0.3;
  const templateArray = useShort ? shortTemplates : templates;
  
  return templateArray[Math.floor(Math.random() * templateArray.length)];
}

async function uploadScreenshot(screenshot) {
  // In production, upload to S3, Cloudinary, or similar
  // For now, return a placeholder URL
  const filename = `screenshot_${Date.now()}.png`;
  
  try {
    // Simulate upload - replace with actual upload logic
    const uploadUrl = `https://your-storage.com/screenshots/${filename}`;
    return uploadUrl;
  } catch (error) {
    console.error('Screenshot upload failed:', error);
    return null;
  }
}

function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (error) {
    console.error('Error extracting domain from URL:', url, error);
    return '';
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test form submission function for manual testing
async function testFormSubmission(requestBody) {
  const { targetUrl, formSelector, testPayload } = JSON.parse(requestBody);
  
  const mockFormMap = {
    form_selector: formSelector,
    fields: {
      name: 'input[name="name"]',
      email: 'input[name="email"]',
      comment: 'textarea[name="comment"]'
    },
    hidden_fields: {},
    submit_selector: 'button[type="submit"]'
  };

  const result = await attemptFormSubmission(
    targetUrl,
    mockFormMap,
    testPayload,
    { capture_screenshots: true }
  );

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: true,
      test_result: result
    })
  };
}
