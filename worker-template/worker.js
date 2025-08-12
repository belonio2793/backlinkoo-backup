// Blog Comment Automation Worker
// This processes jobs from the Supabase jobs table

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Job locking - simple optimistic approach
async function lockNextJob() {
  console.log('🔍 Looking for next job...');
  
  const { data: candidate } = await supabase
    .from('jobs')
    .select('id')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1);

  if (!candidate || candidate.length === 0) return null;
  
  const id = candidate[0].id;
  console.log(`🔒 Attempting to lock job ${id}`);

  const { data, error } = await supabase
    .from('jobs')
    .update({ 
      status: 'running', 
      updated_at: new Date().toISOString()
    })
    .match({ id, status: 'queued' })
    .select('*')
    .single();

  if (error || !data) {
    console.log(`❌ Failed to lock job ${id}:`, error?.message);
    return null;
  }

  console.log(`✅ Locked job ${id} (${data.job_type})`);
  return data;
}

async function finishJob(id, status, extra = {}) {
  console.log(`📝 Finishing job ${id} with status: ${status}`);
  
  await supabase.from('jobs').update({
    status,
    updated_at: new Date().toISOString(),
    ...extra,
  }).eq('id', id);
}

// Discovery job processor - simplified demo version
async function processDiscoveryJob(job) {
  const { payload } = job;
  const { campaign_id, keyword, destination_url } = payload;
  
  console.log(`🔍 Processing discovery for keyword: ${keyword}`);
  
  try {
    // Demo: Create some sample discovered URLs
    // In production, this would use real search APIs or scraping
    const sampleUrls = [
      `https://example-blog-1.com/posts/about-${keyword.replace(/\s+/g, '-')}`,
      `https://example-blog-2.com/articles/${keyword.replace(/\s+/g, '-')}-guide`,
      `https://example-blog-3.com/reviews/${keyword.replace(/\s+/g, '-')}-tools`
    ];

    for (const url of sampleUrls) {
      // Check if URL already exists
      const { data: existing } = await supabase
        .from('blog_urls_discovery')
        .select('id')
        .eq('url', url)
        .single();

      if (!existing) {
        await supabase.from('blog_urls_discovery').insert([{
          url,
          discovered_for: [keyword],
          is_active: true
        }]);
        
        console.log(`📌 Discovered: ${url}`);
      }
    }

    // Log discovery completion
    await supabase.from('campaign_logs').insert([{
      campaign_id,
      level: 'success',
      message: `Discovery completed for keyword: ${keyword}`,
      meta: { keyword, urls_found: sampleUrls.length }
    }]);

    return { ok: true, urls_found: sampleUrls.length };
    
  } catch (error) {
    console.error('Discovery error:', error);
    
    await supabase.from('campaign_logs').insert([{
      campaign_id,
      level: 'error',
      message: `Discovery failed for keyword: ${keyword}`,
      meta: { error: error.message }
    }]);
    
    return { ok: false, error: error.message };
  }
}

// Comment posting job processor
async function processPostCommentJob(job) {
  const { payload } = job;
  const { campaign_id, candidate_url, comment_text, anchor_text, name = 'Guest', email = 'noreply@example.com' } = payload;
  
  console.log(`💬 Processing comment post to: ${candidate_url}`);
  
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // Navigate to the page
    await page.goto(candidate_url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    
    console.log(`📄 Loaded page: ${candidate_url}`);

    // Look for comment forms
    await page.waitForTimeout(2000); // Wait for dynamic content
    
    // Try to find comment form elements
    const forms = await page.$$('form');
    console.log(`📋 Found ${forms.length} forms on page`);
    
    // Look for WordPress-style comment forms
    let commentForm = null;
    
    for (const form of forms) {
      const formHTML = await form.innerHTML();
      if (formHTML.includes('comment') || 
          formHTML.includes('name') && formHTML.includes('email') ||
          formHTML.includes('author') ||
          formHTML.includes('respond')) {
        commentForm = form;
        console.log('📝 Found potential comment form');
        break;
      }
    }
    
    if (!commentForm) {
      console.log('❌ No comment form found');
      return { ok: false, reason: 'no_form' };
    }

    // Try to fill the form
    const filled = await tryFillCommentForm(page, commentForm, {
      name,
      email,
      comment: comment_text,
      url: anchor_text.startsWith('http') ? anchor_text : `https://${anchor_text}`
    });
    
    if (!filled) {
      console.log('❌ Could not fill comment form');
      return { ok: false, reason: 'form_fill_failed' };
    }

    // Submit the form
    const submitButton = await commentForm.$('button[type="submit"], input[type="submit"], button');
    if (!submitButton) {
      console.log('❌ No submit button found');
      return { ok: false, reason: 'no_submit' };
    }

    console.log('🚀 Submitting comment...');
    await Promise.all([
      submitButton.click(),
      page.waitForTimeout(3000) // Wait for submission
    ]);

    // Check for CAPTCHA
    const pageContent = await page.content();
    if (pageContent.toLowerCase().includes('captcha') || 
        pageContent.toLowerCase().includes('recaptcha')) {
      console.log('🤖 CAPTCHA detected - flagging for manual review');
      return { ok: false, reason: 'captcha' };
    }

    // Verify the comment was posted
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
    const newContent = await page.content();
    
    const verified = newContent.includes(comment_text) || 
                    newContent.includes(name) ||
                    newContent.includes('comment is awaiting moderation');

    if (verified) {
      console.log('✅ Comment posted successfully');
      
      // Update backlink record
      await supabase
        .from('backlinks')
        .update({
          posted_at: new Date().toISOString(),
          indexed_status: 'indexed'
        })
        .eq('campaign_id', campaign_id)
        .eq('candidate_url', candidate_url);

      // Add to successful blogs
      await supabase.from('successful_blogs').insert([{
        campaign_id,
        url: candidate_url,
        verified_at: new Date().toISOString(),
        proof: { snippet: newContent.slice(0, 1000) }
      }]);

      // Log success
      await supabase.from('campaign_logs').insert([{
        campaign_id,
        level: 'success',
        message: `Comment posted successfully to ${candidate_url}`,
        meta: { candidate_url }
      }]);

      return { ok: true };
    } else {
      console.log('⚠️ Comment post unverified');
      return { ok: false, reason: 'unverified' };
    }

  } catch (error) {
    console.error('Comment posting error:', error);
    
    await supabase.from('campaign_logs').insert([{
      campaign_id,
      level: 'error',
      message: `Error posting comment to ${candidate_url}: ${error.message}`,
      meta: { error: error.message }
    }]);
    
    return { ok: false, error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Helper function to fill comment forms
async function tryFillCommentForm(page, form, data) {
  try {
    // Common field selectors for WordPress and other blog platforms
    const fieldMappings = [
      { pattern: /name|author/i, value: data.name, type: 'input' },
      { pattern: /email/i, value: data.email, type: 'input' },
      { pattern: /url|website|site/i, value: data.url, type: 'input' },
      { pattern: /comment|message/i, value: data.comment, type: 'textarea' }
    ];

    for (const mapping of fieldMappings) {
      const fields = await form.$$(`${mapping.type}[name], ${mapping.type}[id], ${mapping.type}[placeholder]`);
      
      for (const field of fields) {
        const name = await field.getAttribute('name') || '';
        const id = await field.getAttribute('id') || '';
        const placeholder = await field.getAttribute('placeholder') || '';
        
        if (mapping.pattern.test(name) || mapping.pattern.test(id) || mapping.pattern.test(placeholder)) {
          await field.fill(mapping.value);
          console.log(`✅ Filled ${mapping.type} field: ${name || id}`);
          break;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Form filling error:', error);
    return false;
  }
}

// Main worker loop
async function workerLoop() {
  console.log('🚀 Blog Comment Worker started');
  console.log('📡 Connected to Supabase:', SUPABASE_URL);
  
  while (true) {
    try {
      const job = await lockNextJob();
      
      if (!job) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        continue;
      }

      const jobId = job.id;
      console.log(`⚡ Processing job ${jobId} (${job.job_type})`);

      let result;
      if (job.job_type === 'discover') {
        result = await processDiscoveryJob(job);
      } else if (job.job_type === 'post_comment') {
        result = await processPostCommentJob(job);
      } else {
        console.log(`❓ Unknown job type: ${job.job_type}`);
        result = { ok: false, reason: 'unknown_job_type' };
      }

      // Update job status
      if (result.ok) {
        await finishJob(jobId, 'done');
        console.log(`✅ Job ${jobId} completed successfully`);
      } else {
        const attempts = (job.attempts || 0) + 1;
        const maxAttempts = 3;
        
        if (attempts >= maxAttempts) {
          await finishJob(jobId, 'failed', { 
            last_error: JSON.stringify(result),
            attempts
          });
          console.log(`❌ Job ${jobId} failed after ${attempts} attempts`);
        } else {
          await finishJob(jobId, 'queued', { 
            last_error: JSON.stringify(result),
            attempts
          });
          console.log(`🔄 Job ${jobId} will be retried (attempt ${attempts}/${maxAttempts})`);
        }
      }

    } catch (error) {
      console.error('💥 Worker loop error:', error);
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds on error
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Worker shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Worker terminated gracefully...');
  process.exit(0);
});

// Start the worker
workerLoop().catch(error => {
  console.error('💥 Fatal worker error:', error);
  process.exit(1);
});
