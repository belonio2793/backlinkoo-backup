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
    const { action, keyword, targetUrl, maxResults = 20, campaignId } = JSON.parse(event.body || '{}');
    
    console.log('Blog crawler request:', { action, keyword, targetUrl, maxResults, campaignId });

    if (action === 'discover') {
      return await discoverBlogTargets(keyword, maxResults, campaignId, headers);
    } else if (action === 'analyze') {
      return await analyzeBlogPage(targetUrl, headers);
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid action. Use "discover" or "analyze"' })
      };
    }

  } catch (error) {
    console.error('Blog crawler error:', error);
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

async function discoverBlogTargets(keyword, maxResults, campaignId, headers) {
  console.log(`Discovering blog targets for keyword: ${keyword}`);
  
  // Search queries targeting blog comment sections
  const searchQueries = [
    `"${keyword}" site:wordpress.com`,
    `"${keyword}" site:medium.com`,
    `"${keyword}" site:substack.com`,
    `"${keyword}" site:blogspot.com`,
    `"${keyword}" "leave a comment"`,
    `"${keyword}" "post a comment"`,
    `"${keyword}" "comments section"`,
    `"${keyword}" blog "reply"`,
    `"${keyword}" inurl:blog`,
    `"${keyword}" inurl:post`
  ];

  const discoveredUrls = new Set();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  });

  try {
    for (const query of searchQueries.slice(0, 5)) { // Limit to first 5 queries for speed
      try {
        const page = await context.newPage();
        
        // Use DuckDuckGo search (no API key required)
        await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=web`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });

        // Extract search results
        const results = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href]'));
          return links
            .map(link => {
              const href = link.href;
              const title = link.textContent.trim();
              return { href, title };
            })
            .filter(item => 
              item.href && 
              item.href.startsWith('http') &&
              !item.href.includes('duckduckgo.com') &&
              !item.href.includes('facebook.com') &&
              !item.href.includes('twitter.com') &&
              !item.href.includes('instagram.com') &&
              !item.href.includes('youtube.com') &&
              (item.href.includes('blog') || 
               item.href.includes('post') ||
               item.href.includes('article') ||
               item.title.toLowerCase().includes('blog') ||
               item.title.toLowerCase().includes('post'))
            )
            .slice(0, 5); // Top 5 results per query
        });

        for (const result of results) {
          discoveredUrls.add(result.href);
          if (discoveredUrls.size >= maxResults) break;
        }

        await page.close();
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (discoveredUrls.size >= maxResults) break;
        
      } catch (searchError) {
        console.error(`Search error for query "${query}":`, searchError.message);
        continue;
      }
    }

    // Convert to array and analyze each URL
    const urls = Array.from(discoveredUrls).slice(0, maxResults);
    const validTargets = [];

    for (const url of urls) {
      try {
        const analysis = await quickAnalyzeBlogPage(url, context);
        if (analysis.hasCommentForm) {
          validTargets.push({
            url,
            domain: new URL(url).hostname,
            title: analysis.title,
            hasCommentForm: true,
            formSelector: analysis.formSelector,
            confidence: analysis.confidence,
            discoveredAt: new Date().toISOString()
          });

          // Store in database
          await supabase.from('blog_targets').upsert({
            campaign_id: campaignId,
            url,
            domain: new URL(url).hostname,
            title: analysis.title,
            has_comment_form: true,
            form_selector: analysis.formSelector,
            confidence_score: analysis.confidence,
            discovered_at: new Date().toISOString(),
            status: 'discovered'
          });
        }
      } catch (analyzeError) {
        console.error(`Analysis error for ${url}:`, analyzeError.message);
        continue;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        keyword,
        searchQueries: searchQueries.length,
        urlsDiscovered: urls.length,
        validTargets: validTargets.length,
        targets: validTargets
      })
    };

  } finally {
    await browser.close();
  }
}

async function quickAnalyzeBlogPage(url, context) {
  const page = await context.newPage();
  
  try {
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 10000 
    });

    const analysis = await page.evaluate(() => {
      // Common comment form selectors
      const commentSelectors = [
        'form#commentform',
        'form[id*="comment"]',
        'form[class*="comment"]',
        'form[action*="comment"]',
        '.comment-form form',
        '#comment-form form',
        '.comments form',
        '#comments form',
        'form[name="commentform"]',
        'form textarea[name*="comment"]',
        'form textarea[placeholder*="comment"]'
      ];

      let formSelector = null;
      let confidence = 0;

      // Check for comment forms
      for (const selector of commentSelectors) {
        const form = document.querySelector(selector);
        if (form) {
          // Check if form has required fields
          const hasTextField = form.querySelector('textarea') || form.querySelector('input[type="text"]');
          const hasEmailField = form.querySelector('input[type="email"]') || form.querySelector('input[name*="email"]');
          const hasNameField = form.querySelector('input[name*="name"]') || form.querySelector('input[name*="author"]');
          
          if (hasTextField) {
            formSelector = selector;
            confidence = 60;
            
            if (hasEmailField) confidence += 20;
            if (hasNameField) confidence += 15;
            if (form.querySelector('input[type="submit"]') || form.querySelector('button[type="submit"]')) confidence += 5;
            
            break;
          }
        }
      }

      // Get page title
      const title = document.title || document.querySelector('h1')?.textContent || 'Unknown';

      return {
        hasCommentForm: !!formSelector,
        formSelector,
        confidence: Math.min(confidence, 100),
        title: title.slice(0, 100),
        url: window.location.href
      };
    });

    return analysis;

  } finally {
    await page.close();
  }
}

async function analyzeBlogPage(targetUrl, headers) {
  console.log(`Analyzing blog page: ${targetUrl}`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  try {
    const page = await context.newPage();
    await page.goto(targetUrl, { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    });

    const detailedAnalysis = await page.evaluate(() => {
      const commentSelectors = [
        'form#commentform',
        'form[id*="comment"]',
        'form[class*="comment"]',
        'form[action*="comment"]',
        '.comment-form form',
        '#comment-form form',
        '.comments form',
        '#comments form',
        'form[name="commentform"]'
      ];

      let bestForm = null;
      let bestScore = 0;

      for (const selector of commentSelectors) {
        const form = document.querySelector(selector);
        if (!form) continue;

        const analysis = {
          selector,
          action: form.action || window.location.href,
          method: form.method || 'POST',
          fields: {},
          score: 0
        };

        // Analyze form fields
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
          const name = input.name || input.id || '';
          const type = input.type || input.tagName.toLowerCase();
          
          if (name.toLowerCase().includes('comment') || name.toLowerCase().includes('message')) {
            analysis.fields.comment = name;
            analysis.score += 30;
          } else if (name.toLowerCase().includes('email')) {
            analysis.fields.email = name;
            analysis.score += 20;
          } else if (name.toLowerCase().includes('name') || name.toLowerCase().includes('author')) {
            analysis.fields.name = name;
            analysis.score += 15;
          } else if (name.toLowerCase().includes('website') || name.toLowerCase().includes('url')) {
            analysis.fields.website = name;
            analysis.score += 10;
          }
        });

        // Check for submit button
        const submitBtn = form.querySelector('input[type="submit"], button[type="submit"], button');
        if (submitBtn) {
          analysis.submitSelector = submitBtn.tagName.toLowerCase() + 
            (submitBtn.id ? `#${submitBtn.id}` : '') +
            (submitBtn.className ? `.${submitBtn.className.split(' ').join('.')}` : '');
          analysis.score += 10;
        }

        if (analysis.score > bestScore) {
          bestForm = analysis;
          bestScore = analysis.score;
        }
      }

      return {
        hasCommentForm: !!bestForm,
        bestForm,
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || '',
        platform: detectPlatform(),
        url: window.location.href
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analysis: detailedAnalysis
      })
    };

  } finally {
    await browser.close();
  }
}

// Helper function to detect blog platform
function detectPlatform() {
  const html = document.documentElement.outerHTML.toLowerCase();
  
  if (html.includes('wordpress')) return 'wordpress';
  if (html.includes('medium.com')) return 'medium';
  if (html.includes('substack')) return 'substack';
  if (html.includes('blogspot')) return 'blogspot';
  if (html.includes('ghost')) return 'ghost';
  
  return 'unknown';
}
