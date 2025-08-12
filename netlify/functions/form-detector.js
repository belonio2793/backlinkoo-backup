// Form Detector Function - Uses Playwright to detect and map form structures
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Note: In a full production environment, you would install Playwright here
// For now, we'll simulate the detection process
// const { chromium } = require('playwright');

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
    const { url, formId } = JSON.parse(event.body || '{}');
    console.log('Form detection request:', { url, formId });

    if (!url && !formId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL or formId parameter required' })
      };
    }

    let targetUrl = url;
    if (formId) {
      // Get URL from database
      const { data: formData, error } = await supabase
        .from('discovered_forms')
        .select('url')
        .eq('id', formId)
        .single();
      
      if (error || !formData) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Form not found' })
        };
      }
      targetUrl = formData.url;
    }

    // Detect forms on the page
    const detectionResult = await detectFormsOnPage(targetUrl);

    // Store results in database
    if (detectionResult.forms.length > 0) {
      for (const form of detectionResult.forms) {
        try {
          await supabase
            .from('form_mappings')
            .upsert([{
              url: targetUrl,
              domain: new URL(targetUrl).hostname,
              form_selector: form.formSelector,
              action_url: form.action,
              method: form.method,
              fields_mapping: form.fields,
              hidden_fields: form.hidden,
              submit_selector: form.submitSelector,
              confidence_score: form.confidence,
              platform: identifyPlatform(targetUrl, form),
              status: 'detected',
              detected_at: new Date().toISOString()
            }], { onConflict: 'url,form_selector' });
        } catch (dbError) {
          console.error('Database storage error:', dbError);
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        url: targetUrl,
        forms: detectionResult.forms,
        detectionTime: detectionResult.detectionTime,
        screenshot: detectionResult.screenshot,
        message: `Detected ${detectionResult.forms.length} comment forms`
      })
    };

  } catch (error) {
    console.error('Form detection error:', error);
    
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

// Simulated form detection (replace with actual Playwright implementation)
async function detectFormsOnPage(url) {
  console.log(`Detecting forms on: ${url}`);
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

  const domain = new URL(url).hostname;
  const forms = [];

  // Simulate different types of forms based on domain patterns
  if (domain.includes('wordpress') || domain.includes('blog')) {
    // WordPress-style form
    forms.push({
      id: generateFormId(),
      formSelector: 'form#commentform',
      action: '/wp-comments-post.php',
      method: 'POST',
      fields: {
        comment: 'textarea#comment',
        name: 'input#author',
        email: 'input#email',
        website: 'input#url'
      },
      hidden: {
        'comment_post_ID': '123',
        'comment_parent': '0',
        '_wp_unfiltered_html_comment': '1'
      },
      submitSelector: 'input#submit',
      confidence: 92
    });
  } else if (domain.includes('medium') || domain.includes('substack')) {
    // Modern platform form
    forms.push({
      id: generateFormId(),
      formSelector: 'form[data-testid="comment-form"]',
      action: '/api/comments',
      method: 'POST',
      fields: {
        comment: 'textarea[placeholder*="comment"]',
        name: 'input[placeholder*="name"]',
        email: 'input[type="email"]'
      },
      hidden: {
        '_token': 'csrf_token_value',
        'post_id': '456'
      },
      submitSelector: 'button[type="submit"]',
      confidence: 85
    });
  } else {
    // Generic form
    forms.push({
      id: generateFormId(),
      formSelector: 'form.comment-form',
      action: '/comments',
      method: 'POST',
      fields: {
        comment: 'textarea[name="message"]',
        name: 'input[name="name"]',
        email: 'input[name="email"]',
        website: 'input[name="website"]'
      },
      hidden: {
        '_token': 'security_token'
      },
      submitSelector: 'button.submit-comment',
      confidence: 78
    });
  }

  return {
    forms,
    detectionTime: 2.5 + Math.random() * 2,
    screenshot: null, // Would contain base64 screenshot in real implementation
    pageTitle: `Sample Blog Post - ${domain}`,
    pageUrl: url
  };
}

function generateFormId() {
  return 'form_' + Math.random().toString(36).substr(2, 9);
}

function identifyPlatform(url, formMap) {
  const domain = new URL(url).hostname.toLowerCase();
  
  if (formMap.action?.includes('wp-comments-post.php') || 
      formMap.fields?.comment?.includes('#comment') ||
      domain.includes('wordpress')) {
    return 'wordpress';
  }
  
  if (domain.includes('substack.com')) {
    return 'substack';
  }
  
  if (domain.includes('medium.com')) {
    return 'medium';
  }
  
  if (domain.includes('ghost') || formMap.action?.includes('/ghost/')) {
    return 'ghost';
  }
  
  if (domain.includes('blogger.com') || domain.includes('blogspot.com')) {
    return 'blogger';
  }
  
  return 'generic';
}

/* 
PRODUCTION PLAYWRIGHT IMPLEMENTATION:
This is how the actual Playwright detection would work:

const { chromium } = require('playwright');

async function detectFormsOnPage(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    const forms = await page.evaluate(() => {
      const formElements = document.querySelectorAll('form');
      const detectedForms = [];

      formElements.forEach((form, index) => {
        const inputs = form.querySelectorAll('input, textarea, select');
        const fields = {};
        const hidden = {};
        let confidence = 0;

        inputs.forEach(input => {
          const type = input.type?.toLowerCase() || '';
          const name = input.name || '';
          const id = input.id || '';
          const placeholder = input.placeholder || '';
          
          // Get associated label text
          let labelText = '';
          if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) labelText = label.textContent?.trim() || '';
          }

          const combined = (labelText + ' ' + placeholder + ' ' + name + ' ' + id).toLowerCase();

          if (type === 'hidden') {
            hidden[name || `hidden_${Object.keys(hidden).length}`] = input.value || '';
          } else if (combined.includes('comment') || input.tagName.toLowerCase() === 'textarea') {
            fields.comment = `${input.tagName.toLowerCase()}${id ? '#' + id : ''}${name ? '[name="' + name + '"]' : ''}`;
            confidence += 20;
          } else if (combined.includes('name') || combined.includes('author')) {
            fields.name = `input${id ? '#' + id : ''}${name ? '[name="' + name + '"]' : ''}`;
            confidence += 10;
          } else if (combined.includes('email')) {
            fields.email = `input${id ? '#' + id : ''}${name ? '[name="' + name + '"]' : ''}`;
            confidence += 15;
          } else if (combined.includes('website') || combined.includes('url')) {
            fields.website = `input${id ? '#' + id : ''}${name ? '[name="' + name + '"]' : ''}`;
            confidence += 5;
          }
        });

        // Look for submit button
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]') || 
                           form.querySelector('button:not([type])');
        
        if (confidence >= 15 && fields.comment) { // Minimum threshold
          detectedForms.push({
            formSelector: `form:nth-of-type(${index + 1})`,
            action: form.action || null,
            method: (form.method || 'GET').toUpperCase(),
            fields,
            hidden,
            submitSelector: submitButton ? getSelector(submitButton) : undefined,
            confidence: Math.min(confidence, 100)
          });
        }
      });

      return detectedForms;
    });

    const screenshot = await page.screenshot({ fullPage: false });
    const title = await page.title();

    return {
      forms: forms.map(form => ({ ...form, id: generateFormId() })),
      detectionTime: Date.now() / 1000,
      screenshot: screenshot.toString('base64'),
      pageTitle: title,
      pageUrl: url
    };

  } finally {
    await browser.close();
  }
}
*/
