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
    const { targetUrls, campaignId } = JSON.parse(event.body || '{}');
    
    if (!targetUrls || !Array.isArray(targetUrls)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'targetUrls array is required' })
      };
    }

    console.log(`Detecting forms on ${targetUrls.length} URLs`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    const results = [];

    for (const url of targetUrls) {
      try {
        const detection = await detectCommentForm(url, context, campaignId);
        results.push(detection);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Form detection error for ${url}:`, error.message);
        results.push({
          url,
          success: false,
          error: error.message
        });
      }
    }

    await browser.close();

    const successfulDetections = results.filter(r => r.success);
    const formsFound = successfulDetections.filter(r => r.hasCommentForm);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        urlsProcessed: targetUrls.length,
        successfulDetections: successfulDetections.length,
        formsFound: formsFound.length,
        results
      })
    };

  } catch (error) {
    console.error('Form detector error:', error);
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

async function detectCommentForm(url, context, campaignId) {
  console.log(`Detecting comment form on: ${url}`);
  
  const page = await context.newPage();
  
  try {
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    });

    // Wait a moment for dynamic content
    await page.waitForTimeout(3000);

    const formAnalysis = await page.evaluate(() => {
      // Comprehensive comment form detection
      const commentFormSelectors = [
        // WordPress common selectors
        'form#commentform',
        'form[id*="comment"]',
        'form[class*="comment"]',
        'form[name="commentform"]',
        
        // Generic blog platforms
        '.comment-form form',
        '#comment-form form',
        '.comments form',
        '#comments form',
        '.comment-section form',
        
        // Medium, Substack patterns
        'form[action*="comment"]',
        'form[data-testid*="comment"]',
        
        // Catch-all for forms with comment textarea
        'form:has(textarea[name*="comment"])',
        'form:has(textarea[placeholder*="comment"])',
        'form:has(textarea[id*="comment"])',
        'form:has(input[name*="comment"])'
      ];

      const detectedForms = [];

      for (const selector of commentFormSelectors) {
        try {
          const forms = document.querySelectorAll(selector);
          
          forms.forEach((form, index) => {
            const formData = analyzeForm(form, `${selector}${index > 0 ? `:nth-of-type(${index + 1})` : ''}`);
            if (formData.score > 30) { // Minimum threshold
              detectedForms.push(formData);
            }
          });
        } catch (e) {
          // Some selectors might not be supported in all browsers
          continue;
        }
      }

      // Also check for forms that might not match our selectors but have comment-like fields
      const allForms = document.querySelectorAll('form');
      allForms.forEach((form, index) => {
        const hasCommentField = form.querySelector('textarea[name*="comment"], textarea[placeholder*="comment"], textarea[id*="comment"], input[name*="comment"]');
        if (hasCommentField) {
          const selector = `form:nth-of-type(${index + 1})`;
          const formData = analyzeForm(form, selector);
          if (formData.score > 30 && !detectedForms.some(f => f.selector === selector)) {
            detectedForms.push(formData);
          }
        }
      });

      // Sort by score and return best form
      detectedForms.sort((a, b) => b.score - a.score);

      return {
        hasCommentForm: detectedForms.length > 0,
        bestForm: detectedForms[0] || null,
        allForms: detectedForms,
        pageTitle: document.title,
        pageDescription: document.querySelector('meta[name="description"]')?.content || '',
        platform: detectBlogPlatform()
      };
    });

    // Store the best form if found
    if (formAnalysis.hasCommentForm && formAnalysis.bestForm) {
      const formData = formAnalysis.bestForm;
      
      await supabase.from('comment_forms').upsert({
        campaign_id: campaignId,
        url,
        domain: new URL(url).hostname,
        platform: formAnalysis.platform,
        form_selector: formData.selector,
        form_action: formData.action,
        form_method: formData.method,
        field_mappings: formData.fields,
        hidden_fields: formData.hiddenFields,
        submit_selector: formData.submitSelector,
        confidence_score: formData.score,
        requires_captcha: formData.hasCaptcha,
        page_title: formAnalysis.pageTitle,
        detected_at: new Date().toISOString(),
        status: formData.score > 70 ? 'validated' : 'needs_review'
      });
    }

    return {
      url,
      success: true,
      hasCommentForm: formAnalysis.hasCommentForm,
      formsDetected: formAnalysis.allForms.length,
      bestForm: formAnalysis.bestForm,
      pageTitle: formAnalysis.pageTitle,
      platform: formAnalysis.platform
    };

  } finally {
    await page.close();
  }
}

// Analyze individual form element
function analyzeForm(form, selector) {
  const formData = {
    selector,
    action: form.action || window.location.href,
    method: (form.method || 'POST').toUpperCase(),
    fields: {},
    hiddenFields: {},
    score: 0,
    hasCaptcha: false,
    submitSelector: null
  };

  // Analyze all inputs
  const inputs = form.querySelectorAll('input, textarea, select');
  
  inputs.forEach(input => {
    const name = input.name || input.id || '';
    const type = input.type || input.tagName.toLowerCase();
    const placeholder = input.placeholder || '';
    const nameAndPlaceholder = (name + ' ' + placeholder).toLowerCase();

    if (input.type === 'hidden') {
      formData.hiddenFields[name] = input.value || '';
      return;
    }

    // Comment field detection
    if (type === 'textarea' || nameAndPlaceholder.includes('comment') || nameAndPlaceholder.includes('message')) {
      if (!formData.fields.comment) {
        formData.fields.comment = name || input.id || 'textarea';
        formData.score += 40; // High priority for comment field
      }
    }
    
    // Email field detection
    else if (type === 'email' || nameAndPlaceholder.includes('email')) {
      if (!formData.fields.email) {
        formData.fields.email = name || input.id;
        formData.score += 25;
      }
    }
    
    // Name field detection
    else if (nameAndPlaceholder.includes('name') || nameAndPlaceholder.includes('author')) {
      if (!formData.fields.name) {
        formData.fields.name = name || input.id;
        formData.score += 20;
      }
    }
    
    // Website field detection
    else if (nameAndPlaceholder.includes('website') || nameAndPlaceholder.includes('url') || type === 'url') {
      if (!formData.fields.website) {
        formData.fields.website = name || input.id;
        formData.score += 10;
      }
    }

    // CAPTCHA detection
    if (nameAndPlaceholder.includes('captcha') || nameAndPlaceholder.includes('recaptcha')) {
      formData.hasCaptcha = true;
      formData.score -= 20; // Penalize forms with CAPTCHA
    }
  });

  // Find submit button
  const submitButton = form.querySelector('input[type="submit"], button[type="submit"], button:not([type="button"])');
  if (submitButton) {
    const submitId = submitButton.id;
    const submitClass = submitButton.className;
    const submitName = submitButton.name;
    
    if (submitId) {
      formData.submitSelector = `#${submitId}`;
    } else if (submitClass) {
      formData.submitSelector = `.${submitClass.split(' ').filter(c => c).join('.')}`;
    } else if (submitName) {
      formData.submitSelector = `[name="${submitName}"]`;
    } else {
      formData.submitSelector = 'input[type="submit"], button[type="submit"]';
    }
    formData.score += 15;
  }

  // Bonus points for having essential fields
  if (formData.fields.comment && formData.fields.email) {
    formData.score += 15;
  }
  if (formData.fields.comment && formData.fields.name) {
    formData.score += 10;
  }

  // Penalty for missing comment field (essential)
  if (!formData.fields.comment) {
    formData.score = Math.max(0, formData.score - 50);
  }

  return formData;
}

// Detect blog platform from page content
function detectBlogPlatform() {
  const html = document.documentElement.outerHTML.toLowerCase();
  const metaGenerator = document.querySelector('meta[name="generator"]')?.content?.toLowerCase() || '';
  
  if (html.includes('wp-content') || metaGenerator.includes('wordpress')) return 'wordpress';
  if (window.location.hostname.includes('medium.com')) return 'medium';
  if (window.location.hostname.includes('substack.com')) return 'substack';
  if (html.includes('blogspot') || window.location.hostname.includes('blogspot')) return 'blogspot';
  if (metaGenerator.includes('ghost')) return 'ghost';
  if (html.includes('squarespace')) return 'squarespace';
  if (html.includes('wix')) return 'wix';
  
  return 'unknown';
}
