import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Import form detection utilities
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';

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
    const { action, campaignId, keywords, targetIds, settings } = JSON.parse(event.body);

    switch (action) {
      case 'discover_targets':
        return await discoverTargets(campaignId, keywords, settings);
      case 'detect_forms':
        return await detectForms(targetIds, settings);
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error) {
    console.error('Crawler control error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function discoverTargets(campaignId, keywords, settings) {
  const jobId = `discover_${Date.now()}`;
  
  // Create automation job record
  const { data: job } = await supabase
    .from('automation_jobs')
    .insert([{
      campaign_id: campaignId,
      job_type: 'discover_targets',
      status: 'processing',
      payload: { keywords, settings }
    }])
    .select()
    .single();

  // Start discovery process (would typically be async/queue-based)
  try {
    const discoveredTargets = [];

    for (const keyword of keywords) {
      // Simulate search API results - in production, use real search APIs
      const searchResults = await simulateSearchResults(keyword, settings.max_targets_per_keyword || 20);
      
      for (const result of searchResults) {
        try {
          // Check robots.txt if enabled
          if (settings.respect_robots_txt) {
            const robotsAllowed = await checkRobotsTxt(result.url);
            if (!robotsAllowed) continue;
          }

          // Extract domain and create target record
          const domain = extractDomain(result.url);
          const targetData = {
            url: result.url,
            domain: domain,
            canonical_url: result.url,
            crawl_status: 'pending',
            robots_allowed: true,
            score: result.relevanceScore || 0,
            page_title: result.title,
            meta_description: result.description,
            discovered_by_keywords: [keyword],
            discovery_method: 'search_simulation'
          };

          // Insert target (ignore conflicts)
          const { data: target, error } = await supabase
            .from('crawler_targets')
            .upsert([targetData], { onConflict: 'url' })
            .select()
            .single();

          if (!error && target) {
            discoveredTargets.push(target);
          }
        } catch (error) {
          console.error(`Error processing target ${result.url}:`, error);
        }
      }

      // Rate limiting
      if (settings.rate_limit_delay) {
        await delay(settings.rate_limit_delay);
      }
    }

    // Update job completion
    await supabase
      .from('automation_jobs')
      .update({
        status: 'completed',
        result: {
          targets_found: discoveredTargets.length,
          summary: `Discovered ${discoveredTargets.length} targets for keywords: ${keywords.join(', ')}`
        },
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    // Update campaign stats
    await supabase
      .from('blog_campaigns')
      .update({
        links_found: discoveredTargets.length
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
        estimated_targets: discoveredTargets.length,
        targets: discoveredTargets
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

async function detectForms(targetIds, settings) {
  const jobId = `detect_${Date.now()}`;
  const detectedForms = [];

  // Create automation job record
  const { data: job } = await supabase
    .from('automation_jobs')
    .insert([{
      job_type: 'detect_forms',
      status: 'processing',
      payload: { targetIds, settings }
    }])
    .select()
    .single();

  try {
    // Get target URLs
    const { data: targets } = await supabase
      .from('crawler_targets')
      .select('*')
      .in('id', targetIds);

    if (!targets || targets.length === 0) {
      throw new Error('No targets found for form detection');
    }

    for (const target of targets) {
      try {
        console.log(`Detecting forms on: ${target.url}`);

        // Fetch and analyze page
        const html = await fetchPageContent(target.url, settings.enable_js_rendering);
        const forms = await detectCommentForms(html, target.url);

        for (const formMap of forms) {
          const formData = {
            target_id: target.id,
            form_selector: formMap.formSelector,
            action_url: formMap.actionUrl,
            method: formMap.method,
            fields: formMap.fields,
            hidden_fields: formMap.hiddenFields,
            submit_selector: formMap.submitSelector,
            confidence: formMap.confidence,
            status: formMap.confidence >= (settings.min_confidence_score || 12) ? 'vetted' : 'detected',
            needs_human_review: formMap.confidence < (settings.min_confidence_score || 12),
            detection_method: 'html_parse'
          };

          const { data: savedForm, error } = await supabase
            .from('form_maps')
            .insert([formData])
            .select()
            .single();

          if (!error && savedForm) {
            detectedForms.push(savedForm);
          }
        }

        // Update target status
        await supabase
          .from('crawler_targets')
          .update({
            crawl_status: 'checked',
            last_checked: new Date().toISOString()
          })
          .eq('id', target.id);

        // Rate limiting
        if (settings.rate_limit_delay) {
          await delay(settings.rate_limit_delay);
        }

      } catch (error) {
        console.error(`Error detecting forms on ${target.url}:`, error);
        
        // Mark target as error
        await supabase
          .from('crawler_targets')
          .update({
            crawl_status: 'error',
            last_checked: new Date().toISOString()
          })
          .eq('id', target.id);
      }
    }

    // Update job completion
    await supabase
      .from('automation_jobs')
      .update({
        status: 'completed',
        result: {
          forms_detected: detectedForms.length,
          targets_processed: targets.length,
          summary: `Detected ${detectedForms.length} forms across ${targets.length} targets`
        },
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        jobId: job.id,
        forms_detected: detectedForms.length,
        forms: detectedForms
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

// Helper functions
async function simulateSearchResults(keyword, maxResults) {
  // In production, replace with real search API (Bing, SerpAPI, etc.)
  const commonBlogPlatforms = [
    'medium.com', 'dev.to', 'hashnode.com', 'substack.com',
    'wordpress.com', 'blogger.com', 'ghost.org', 'webflow.com',
    'techcrunch.com', 'theverge.com', 'arstechnica.com'
  ];

  const results = [];
  const keywordSlug = keyword.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

  for (let i = 0; i < Math.min(maxResults, 10); i++) {
    const platform = commonBlogPlatforms[Math.floor(Math.random() * commonBlogPlatforms.length)];
    const result = {
      url: `https://${platform}/${keywordSlug}-${i + 1}`,
      title: `Article about ${keyword} - ${i + 1}`,
      description: `This is a sample article about ${keyword} that would contain comments`,
      relevanceScore: Math.floor(Math.random() * 20) + 10
    };
    results.push(result);
  }

  return results;
}

async function checkRobotsTxt(url) {
  try {
    const domain = extractDomain(url);
    const robotsUrl = `https://${domain}/robots.txt`;
    
    const response = await fetch(robotsUrl, { 
      timeout: 5000,
      headers: { 'User-Agent': 'BacklinkooBot/1.0' }
    });
    
    if (!response.ok) return true; // If no robots.txt, assume allowed
    
    const robotsText = await response.text();
    
    // Simple robots.txt parsing (in production, use a proper parser)
    const lines = robotsText.split('\n');
    let currentUserAgent = '';
    let isRelevantSection = false;
    
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      
      if (trimmed.startsWith('user-agent:')) {
        currentUserAgent = trimmed.split(':')[1].trim();
        isRelevantSection = currentUserAgent === '*' || currentUserAgent === 'backlinkoobot';
      }
      
      if (isRelevantSection && trimmed.startsWith('disallow:')) {
        const disallowPath = trimmed.split(':')[1].trim();
        if (disallowPath === '/' || url.includes(disallowPath)) {
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.warn(`Error checking robots.txt for ${url}:`, error);
    return true; // Default to allowed if check fails
  }
}

async function fetchPageContent(url, enableJsRendering = false) {
  if (enableJsRendering) {
    // Use Playwright for JS-heavy sites
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000); // Allow dynamic content to load
      const html = await page.content();
      await browser.close();
      return html;
    } catch (error) {
      await browser.close();
      throw error;
    }
  } else {
    // Fast static fetch for most sites
    const response = await fetch(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'BacklinkooBot/1.0' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.text();
  }
}

async function detectCommentForms(html, baseUrl) {
  const $ = cheerio.load(html);
  const forms = [];

  $('form').each((i, el) => {
    const form = $(el);
    const formSelector = `form:nth-of-type(${i + 1})`;
    
    // Analyze form inputs
    const inputs = form.find('input, textarea, select, button');
    const fields = {};
    const hiddenFields = {};
    const labels = [];
    let submitSelector = '';
    
    inputs.each((j, inp) => {
      const $inp = $(inp);
      const tagName = inp.tagName.toLowerCase();
      const type = ($inp.attr('type') || '').toLowerCase();
      const name = $inp.attr('name') || '';
      const id = $inp.attr('id') || '';
      const placeholder = $inp.attr('placeholder') || '';
      
      // Get associated label text
      let labelText = '';
      if (id) {
        const label = $(`label[for="${id}"]`);
        if (label.length) labelText = label.text().trim();
      }
      if (!labelText) {
        const prevLabel = $inp.prev('label');
        if (prevLabel.length) labelText = prevLabel.text().trim();
      }
      
      const combinedText = `${labelText} ${placeholder} ${name} ${id}`.toLowerCase();
      labels.push(combinedText);
      
      // Classify input fields
      if (type === 'hidden') {
        hiddenFields[name || id || `hidden_${j}`] = $inp.attr('value') || '';
      } else if (tagName === 'textarea' || combinedText.includes('comment') || combinedText.includes('message')) {
        fields.comment = `${formSelector} ${tagName}${name ? `[name="${name}"]` : id ? `#${id}` : ''}`;
      } else if (combinedText.includes('name') || combinedText.includes('author')) {
        fields.name = `${formSelector} ${tagName}${name ? `[name="${name}"]` : id ? `#${id}` : ''}`;
      } else if (combinedText.includes('email') || combinedText.includes('e-mail')) {
        fields.email = `${formSelector} ${tagName}${name ? `[name="${name}"]` : id ? `#${id}` : ''}`;
      } else if (combinedText.includes('website') || combinedText.includes('url') || type === 'url') {
        fields.website = `${formSelector} ${tagName}${name ? `[name="${name}"]` : id ? `#${id}` : ''}`;
      }
      
      // Find submit button
      if (type === 'submit' || (tagName === 'button' && /submit|post|comment/i.test($inp.text() || $inp.attr('value') || ''))) {
        submitSelector = `${formSelector} ${tagName}${name ? `[name="${name}"]` : id ? `#${id}` : ''}`;
      }
    });
    
    // Calculate confidence score
    let confidence = 0;
    
    // Core requirements
    if (fields.comment) confidence += 15; // Must have comment field
    if (fields.email) confidence += 10;   // Email usually required
    if (fields.name) confidence += 8;     // Name often required
    if (fields.website) confidence += 3;  // Website is bonus
    if (submitSelector) confidence += 5;  // Must have submit button
    
    // Keyword analysis
    const formHtml = form.html() || '';
    if (/comment|reply|respond/i.test(formHtml)) confidence += 5;
    if (/leave.*comment|post.*comment|add.*comment/i.test(formHtml)) confidence += 3;
    
    // Must meet minimum threshold
    if (confidence >= 8 && fields.comment) {
      const actionUrl = form.attr('action');
      const method = (form.attr('method') || 'POST').toUpperCase();
      
      forms.push({
        formSelector,
        actionUrl: actionUrl ? new URL(actionUrl, baseUrl).href : baseUrl,
        method,
        fields,
        hiddenFields,
        submitSelector: submitSelector || `${formSelector} button[type="submit"], ${formSelector} input[type="submit"]`,
        confidence,
        labels: labels.filter(Boolean)
      });
    }
  });
  
  return forms.sort((a, b) => b.confidence - a.confidence);
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
