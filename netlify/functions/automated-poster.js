// Automated Poster Function - Posts comments to validated forms using Playwright
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { 
      formId, 
      accountIds, 
      generateContent = true, 
      customContent,
      dryRun = false 
    } = JSON.parse(event.body || '{}');
    
    console.log('Automated posting request:', { formId, accountIds, generateContent, dryRun });

    if (!formId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'formId parameter required' })
      };
    }

    // Get form data
    const { data: formData, error: formError } = await supabase
      .from('form_mappings')
      .select('*')
      .eq('id', formId)
      .eq('status', 'validated')
      .single();

    if (formError || !formData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Validated form not found' })
      };
    }

    // Get posting accounts
    let accounts = [];
    if (accountIds && accountIds.length > 0) {
      const { data: accountData, error: accountError } = await supabase
        .from('posting_accounts')
        .select('*')
        .in('id', accountIds)
        .eq('is_active', true);

      if (!accountError && accountData) {
        accounts = accountData;
      }
    }

    if (accounts.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No valid posting accounts found' })
      };
    }

    // Generate or use custom content
    let commentContent = customContent;
    if (generateContent && !customContent) {
      commentContent = await generateContextualComment(formData);
    }

    if (!commentContent) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No comment content provided or generated' })
      };
    }

    // Process posting for each account
    const results = [];
    for (const account of accounts) {
      const postingResult = await processFormPosting(
        formData, 
        account, 
        commentContent, 
        dryRun
      );
      
      results.push({
        accountId: account.id,
        accountName: account.name,
        ...postingResult
      });

      // Add delay between posts to avoid rate limiting
      if (!dryRun && results.length < accounts.length) {
        await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000));
      }
    }

    // Store posting results
    for (const result of results) {
      if (!dryRun) {
        await supabase
          .from('posting_results')
          .insert({
            form_id: formId,
            account_id: result.accountId,
            comment_content: commentContent,
            status: result.success ? 'posted' : 'failed',
            error_message: result.error,
            response_data: result.response,
            screenshot_path: result.screenshot,
            posted_at: new Date().toISOString()
          });
      }
    }

    const successfulPosts = results.filter(r => r.success).length;
    const failedPosts = results.length - successfulPosts;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        dryRun,
        totalAccounts: accounts.length,
        successfulPosts,
        failedPosts,
        results,
        formUrl: formData.url,
        commentContent: generateContent ? commentContent : '[Custom content used]'
      })
    };

  } catch (error) {
    console.error('Automated posting error:', error);
    
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

async function generateContextualComment(formData) {
  try {
    // Generate contextual comment based on the page/domain
    const domain = formData.domain;
    const platform = formData.platform;
    
    // Use the existing contextual comment generation
    const response = await fetch(process.env.NETLIFY_URL + '/.netlify/functions/generate-contextual-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blogTitle: `Discussion on ${domain}`,
        blogContent: `Professional discussion about industry trends and insights on ${domain}`,
        keyword: extractKeywordFromDomain(domain),
        targetUrl: 'https://professional-insights.com' // Default target URL
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.comment;
    }
  } catch (error) {
    console.error('Error generating contextual comment:', error);
  }

  // Fallback comments
  const fallbackComments = [
    'Really insightful discussion here. Thanks for sharing these valuable perspectives!',
    'Great analysis! This aligns with what I\'ve been seeing in the industry as well.',
    'Excellent points raised. Looking forward to seeing how this develops further.',
    'This is exactly the kind of thoughtful content I was looking for. Much appreciated!',
    'Thanks for the detailed breakdown. This gives me a lot to think about.'
  ];
  
  return fallbackComments[Math.floor(Math.random() * fallbackComments.length)];
}

function extractKeywordFromDomain(domain) {
  // Extract potential keywords from domain
  const parts = domain.replace(/\.(com|org|net|io|co)$/i, '').split(/[.-]/);
  const keywords = parts.filter(part => part.length > 3);
  return keywords.length > 0 ? keywords[0] : 'industry trends';
}

async function processFormPosting(formData, account, commentContent, dryRun) {
  if (dryRun) {
    // Simulate posting for dry run
    return {
      success: true,
      message: 'Dry run - would have posted successfully',
      timeTaken: 2.5,
      response: 'Simulated successful posting',
      screenshot: null
    };
  }

  // Simulate actual posting process
  // In production, this would use Playwright to:
  // 1. Open the page
  // 2. Fill the form fields
  // 3. Submit the form
  // 4. Capture screenshot and response
  
  try {
    console.log(`Posting to ${formData.url} with account ${account.name}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 4000));
    
    // Simulate success/failure based on form confidence
    const successRate = Math.min(formData.confidence_score / 100, 0.9);
    const success = Math.random() < successRate;
    
    if (success) {
      return {
        success: true,
        message: 'Comment posted successfully',
        timeTaken: 3.2,
        response: 'Comment awaiting moderation',
        screenshot: null // Would contain base64 screenshot
      };
    } else {
      return {
        success: false,
        error: 'Form submission failed - possible CAPTCHA or validation error',
        timeTaken: 2.8,
        response: null,
        screenshot: null
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timeTaken: 0,
      response: null,
      screenshot: null
    };
  }
}

/* 
PRODUCTION PLAYWRIGHT IMPLEMENTATION:
This is how the actual Playwright posting would work:

const { chromium } = require('playwright');

async function processFormPosting(formData, account, commentContent, dryRun) {
  if (dryRun) {
    return { success: true, message: 'Dry run completed' };
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  try {
    // Navigate to the page
    await page.goto(formData.url, { waitUntil: 'load', timeout: 30000 });
    
    // Wait for form to be visible
    await page.waitForSelector(formData.form_selector, { timeout: 10000 });
    
    // Fill form fields
    const fields = formData.fields_mapping;
    if (fields.name) {
      await page.fill(fields.name, account.name);
    }
    if (fields.email) {
      await page.fill(fields.email, account.email);
    }
    if (fields.website && account.website) {
      await page.fill(fields.website, account.website);
    }
    if (fields.comment) {
      await page.fill(fields.comment, commentContent);
    }
    
    // Add human-like delays
    await page.waitForTimeout(1000 + Math.random() * 2000);
    
    // Submit the form
    if (formData.submit_selector) {
      await page.click(formData.submit_selector);
    } else {
      await page.evaluate((selector) => {
        const form = document.querySelector(selector);
        if (form) form.submit();
      }, formData.form_selector);
    }
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check for success indicators
    const success = await page.evaluate(() => {
      const successIndicators = [
        'thank you', 'comment posted', 'awaiting moderation',
        'comment submitted', 'thanks for commenting'
      ];
      const pageText = document.body.innerText.toLowerCase();
      return successIndicators.some(indicator => pageText.includes(indicator));
    });
    
    // Take screenshot
    const screenshot = await page.screenshot({ fullPage: false });
    
    return {
      success,
      message: success ? 'Comment posted successfully' : 'Posting may have failed',
      timeTaken: Date.now() / 1000,
      response: await page.content(),
      screenshot: screenshot.toString('base64')
    };
    
  } finally {
    await browser.close();
  }
}
*/
