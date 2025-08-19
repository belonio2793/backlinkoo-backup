const { createClient } = require('@supabase/supabase-js');

// Conditional Playwright import to prevent bundling errors
let chromium;
try {
  chromium = require('playwright').chromium;
} catch (error) {
  console.warn('Playwright not available, browser automation disabled');
}

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
    const { formId, campaignId, accountId, content, targetUrl, dryRun = false } = JSON.parse(event.body || '{}');
    
    if (!formId && !targetUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Either formId or targetUrl is required' })
      };
    }

    console.log('Comment posting request:', { formId, campaignId, accountId, targetUrl, dryRun });

    let formData;
    
    if (formId) {
      // Get validated form data from database
      const { data, error } = await supabase
        .from('comment_forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (error || !data) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Form not found' })
        };
      }
      formData = data;
    } else {
      // Direct URL posting - detect form on the fly
      formData = await quickDetectForm(targetUrl);
      if (!formData) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'No comment form detected on target URL' })
        };
      }
    }

    // Get campaign details
    let campaign = null;
    if (campaignId) {
      const { data: campaignData } = await supabase
        .from('blog_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
      campaign = campaignData;
    }

    // Get account details for personalization
    let account = null;
    if (accountId) {
      const { data: accountData } = await supabase
        .from('posting_accounts')
        .select('*')
        .eq('id', accountId)
        .single();
      account = accountData;
    }

    // Generate content if not provided
    if (!content) {
      content = await generateCommentContent(formData, campaign, account);
    }

    // Perform the actual posting
    const postingResult = await postComment(formData, content, account, dryRun);

    // Store the result
    if (!dryRun) {
      await supabase.from('posting_results').insert({
        campaign_id: campaignId,
        form_id: formId,
        account_id: accountId,
        target_url: formData.url || targetUrl,
        comment_content: content,
        status: postingResult.success ? 'posted' : 'failed',
        error_message: postingResult.error,
        response_data: postingResult.response,
        screenshot_url: postingResult.screenshotUrl,
        live_url: postingResult.liveUrl,
        posted_at: new Date().toISOString()
      });

      // Update campaign stats
      if (campaignId && postingResult.success) {
        await supabase.rpc('increment_campaign_posts', { campaign_id: campaignId });
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        dryRun,
        result: postingResult,
        formUrl: formData.url || targetUrl,
        content: content.substring(0, 100) + '...',
        liveUrl: postingResult.liveUrl
      })
    };

  } catch (error) {
    console.error('Comment posting error:', error);
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

async function postComment(formData, content, account, dryRun) {
  if (dryRun) {
    return {
      success: true,
      message: 'Dry run - would have posted successfully',
      timeTaken: 2.5,
      response: 'Simulated posting',
      liveUrl: formData.url + '#comment-simulated'
    };
  }

  if (!chromium) {
    throw new Error('Browser automation not available - Playwright not installed');
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  });

  let page;
  const startTime = Date.now();

  try {
    page = await context.newPage();
    
    console.log(`Navigating to ${formData.url}`);
    await page.goto(formData.url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 20000 
    });

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Check if form exists
    const formExists = await page.locator(formData.form_selector).count() > 0;
    if (!formExists) {
      throw new Error('Comment form not found on page');
    }

    console.log('Form found, filling fields...');

    // Fill form fields with human-like behavior
    const fieldMappings = formData.field_mappings || {};

    // Fill name field
    if (fieldMappings.name && account?.name) {
      await fillFieldHumanLike(page, fieldMappings.name, account.name);
      await page.waitForTimeout(500 + Math.random() * 1000);
    }

    // Fill email field
    if (fieldMappings.email && account?.email) {
      await fillFieldHumanLike(page, fieldMappings.email, account.email);
      await page.waitForTimeout(500 + Math.random() * 1000);
    }

    // Fill website field
    if (fieldMappings.website && account?.website) {
      await fillFieldHumanLike(page, fieldMappings.website, account.website);
      await page.waitForTimeout(500 + Math.random() * 1000);
    }

    // Fill comment field (most important)
    if (fieldMappings.comment) {
      await fillFieldHumanLike(page, fieldMappings.comment, content);
      await page.waitForTimeout(1000 + Math.random() * 2000);
    } else {
      throw new Error('Comment field mapping not found');
    }

    // Fill any hidden fields
    if (formData.hidden_fields) {
      for (const [field, value] of Object.entries(formData.hidden_fields)) {
        try {
          await page.fill(`[name="${field}"]`, value);
        } catch (e) {
          console.log(`Could not fill hidden field ${field}: ${e.message}`);
        }
      }
    }

    // Take screenshot before submission
    const beforeScreenshot = await page.screenshot({ fullPage: false });
    const screenshotUrl = await uploadScreenshot(beforeScreenshot, 'before-submit');

    // Check for CAPTCHA
    const hasCaptcha = await page.locator('iframe[src*="recaptcha"], .g-recaptcha, .h-captcha, [data-captcha]').count() > 0;
    if (hasCaptcha) {
      console.log('CAPTCHA detected - flagging for manual review');
      return {
        success: false,
        error: 'CAPTCHA detected - requires manual intervention',
        requiresManualReview: true,
        screenshotUrl,
        timeTaken: (Date.now() - startTime) / 1000
      };
    }

    // Submit the form
    console.log('Submitting form...');
    if (formData.submit_selector) {
      await page.click(formData.submit_selector);
    } else {
      // Fallback: look for submit button in the form
      await page.locator(`${formData.form_selector} input[type="submit"], ${formData.form_selector} button[type="submit"]`).first().click();
    }

    // Wait for submission response
    await Promise.race([
      page.waitForURL('**', { timeout: 10000 }),
      page.waitForTimeout(8000)
    ]);

    // Check for success indicators
    const pageContent = await page.content();
    const pageText = await page.textContent('body');
    
    const successIndicators = [
      'thank you',
      'comment posted',
      'comment submitted',
      'awaiting moderation',
      'comment awaiting',
      'successfully posted',
      'comment received',
      'thanks for commenting',
      'your comment has been',
      'moderation queue'
    ];

    const errorIndicators = [
      'error',
      'invalid',
      'required field',
      'please fill',
      'captcha',
      'try again',
      'failed to post',
      'spam detected'
    ];

    const pageTextLower = pageText.toLowerCase();
    
    const hasSuccessIndicator = successIndicators.some(indicator => 
      pageTextLower.includes(indicator)
    );
    
    const hasErrorIndicator = errorIndicators.some(indicator => 
      pageTextLower.includes(indicator)
    );

    // Take screenshot after submission
    const afterScreenshot = await page.screenshot({ fullPage: false });
    const afterScreenshotUrl = await uploadScreenshot(afterScreenshot, 'after-submit');

    // Determine success
    const success = hasSuccessIndicator && !hasErrorIndicator;
    
    // Try to find the live comment URL
    let liveUrl = page.url();
    
    // Look for anchor links to the new comment
    try {
      const commentLinks = await page.locator('a[href*="#comment"], a[href*="#respond"]').all();
      if (commentLinks.length > 0) {
        const href = await commentLinks[0].getAttribute('href');
        if (href.startsWith('#')) {
          liveUrl = page.url() + href;
        } else if (href.startsWith('http')) {
          liveUrl = href;
        }
      }
    } catch (e) {
      console.log('Could not find comment anchor link');
    }

    const result = {
      success,
      message: success ? 'Comment posted successfully' : 'Comment posting may have failed',
      timeTaken: (Date.now() - startTime) / 1000,
      response: pageContent.substring(0, 1000), // Truncate for storage
      screenshotUrl: afterScreenshotUrl,
      liveUrl: success ? liveUrl : null,
      hasSuccessIndicator,
      hasErrorIndicator,
      pageUrl: page.url()
    };

    console.log('Posting result:', { success, hasSuccessIndicator, hasErrorIndicator, liveUrl });
    
    return result;

  } catch (error) {
    console.error('Error during comment posting:', error);
    
    // Take error screenshot if possible
    let errorScreenshotUrl = null;
    if (page) {
      try {
        const errorScreenshot = await page.screenshot({ fullPage: false });
        errorScreenshotUrl = await uploadScreenshot(errorScreenshot, 'error');
      } catch (screenshotError) {
        console.log('Could not take error screenshot');
      }
    }

    return {
      success: false,
      error: error.message,
      timeTaken: (Date.now() - startTime) / 1000,
      screenshotUrl: errorScreenshotUrl,
      response: null
    };

  } finally {
    await browser.close();
  }
}

async function fillFieldHumanLike(page, selector, value) {
  // Human-like typing with random delays
  await page.click(selector);
  await page.waitForTimeout(200 + Math.random() * 300);
  
  // Clear existing content
  await page.fill(selector, '');
  
  // Type with random speed
  for (const char of value) {
    await page.type(selector, char, { delay: 50 + Math.random() * 100 });
  }
}

async function uploadScreenshot(screenshotBuffer, type) {
  try {
    const fileName = `screenshots/${type}-${Date.now()}.png`;
    
    const { data, error } = await supabase.storage
      .from('automation-assets')
      .upload(fileName, screenshotBuffer, {
        contentType: 'image/png',
        cacheControl: '3600'
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('automation-assets')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Screenshot upload error:', error);
    return null;
  }
}

async function quickDetectForm(url) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    const formData = await page.evaluate(() => {
      const commentSelectors = [
        'form#commentform',
        'form[id*="comment"]',
        'form[class*="comment"]',
        '.comment-form form',
        '#comment-form form'
      ];

      for (const selector of commentSelectors) {
        const form = document.querySelector(selector);
        if (form) {
          const fields = {};
          
          // Find comment field
          const commentField = form.querySelector('textarea[name*="comment"], textarea[id*="comment"], textarea');
          if (commentField) fields.comment = commentField.name || commentField.id;
          
          // Find email field
          const emailField = form.querySelector('input[type="email"], input[name*="email"]');
          if (emailField) fields.email = emailField.name || emailField.id;
          
          // Find name field
          const nameField = form.querySelector('input[name*="name"], input[name*="author"]');
          if (nameField) fields.name = nameField.name || nameField.id;
          
          if (fields.comment) {
            return {
              url: window.location.href,
              form_selector: selector,
              field_mappings: fields,
              confidence_score: 80
            };
          }
        }
      }
      return null;
    });

    return formData;

  } finally {
    await browser.close();
  }
}

async function generateCommentContent(formData, campaign, account) {
  // Generate contextual, relevant comment content
  const templates = [
    "Great insights in this post! I particularly found the points about {topic} very valuable. Thanks for sharing your expertise on this.",
    "This is exactly what I was looking for. Your analysis on {topic} really helps clarify some misconceptions I had. Much appreciated!",
    "Excellent article! The way you explained {topic} makes it so much easier to understand. Looking forward to more content like this.",
    "Really thoughtful perspective on {topic}. I've been thinking about this topic lately and your insights add a lot of value to the discussion.",
    "Thanks for this comprehensive breakdown. Your approach to {topic} is refreshing and practical. Bookmarking this for future reference!"
  ];

  let topic = 'the industry trends';
  if (campaign?.keyword) {
    topic = campaign.keyword;
  } else if (formData.page_title) {
    // Extract topic from page title
    const titleWords = formData.page_title.toLowerCase().split(' ');
    const relevantWords = titleWords.filter(word => 
      word.length > 4 && 
      !['about', 'guide', 'tutorial', 'article', 'blog'].includes(word)
    );
    if (relevantWords.length > 0) {
      topic = relevantWords[0];
    }
  }

  const template = templates[Math.floor(Math.random() * templates.length)];
  let content = template.replace('{topic}', topic);

  // Add target URL naturally if provided
  if (campaign?.target_url && campaign?.anchor_text) {
    const urlPhrases = [
      `You might also find this resource helpful: ${campaign.target_url}`,
      `For more insights on this topic, I recommend checking out ${campaign.target_url}`,
      `I wrote about a similar topic here: ${campaign.target_url}`,
      `Related reading: ${campaign.target_url}`
    ];
    
    const urlPhrase = urlPhrases[Math.floor(Math.random() * urlPhrases.length)];
    content += '\n\n' + urlPhrase;
  }

  return content;
}
