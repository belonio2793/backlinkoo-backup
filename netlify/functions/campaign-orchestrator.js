const { createClient } = require('@supabase/supabase-js');

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
    const { action, campaignId, settings = {} } = JSON.parse(event.body || '{}');
    
    console.log('Campaign orchestrator request:', { action, campaignId, settings });

    switch (action) {
      case 'start_campaign':
        return await startFullCampaign(campaignId, settings, headers);
      case 'discover_targets':
        return await discoverTargets(campaignId, settings, headers);
      case 'detect_forms':
        return await detectForms(campaignId, settings, headers);
      case 'post_comments':
        return await postComments(campaignId, settings, headers);
      case 'get_status':
        return await getCampaignStatus(campaignId, headers);
      case 'get_results':
        return await getCampaignResults(campaignId, headers);
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

  } catch (error) {
    console.error('Campaign orchestrator error:', error);
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

async function startFullCampaign(campaignId, settings, headers) {
  console.log(`Starting full campaign: ${campaignId}`);

  // Get campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('blog_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Campaign not found' })
    };
  }

  // Create automation job
  const { data: job } = await supabase
    .from('automation_jobs')
    .insert({
      campaign_id: campaignId,
      job_type: 'discover',
      status: 'pending',
      payload: { settings, fullCampaign: true }
    })
    .select()
    .single();

  // Step 1: Discover targets
  console.log('Step 1: Discovering targets...');
  const discoverResult = await callFunction('blog-crawler', {
    action: 'discover',
    keyword: campaign.keyword,
    maxResults: settings.maxTargets || 20,
    campaignId
  });

  if (!discoverResult.success) {
    await updateJobStatus(job.id, 'failed', discoverResult.error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Target discovery failed', details: discoverResult.error })
    };
  }

  await updateJobProgress(job.id, 25);

  // Step 2: Detect forms
  console.log('Step 2: Detecting comment forms...');
  
  const { data: targets } = await supabase
    .from('blog_targets')
    .select('url')
    .eq('campaign_id', campaignId)
    .eq('has_comment_form', true);

  if (!targets || targets.length === 0) {
    await updateJobStatus(job.id, 'completed', 'No suitable targets found');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Campaign completed - no suitable targets found',
        results: { targetsFound: 0, formsDetected: 0, commentsPosted: 0 }
      })
    };
  }

  const detectResult = await callFunction('form-detector', {
    targetUrls: targets.map(t => t.url),
    campaignId
  });

  await updateJobProgress(job.id, 50);

  // Step 3: Post comments (if auto-posting is enabled)
  let postingResults = { posted: 0, failed: 0 };
  
  if (campaign.automation_enabled && settings.autoPost !== false) {
    console.log('Step 3: Posting comments...');
    
    const { data: forms } = await supabase
      .from('comment_forms')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'validated')
      .order('confidence_score', { ascending: false })
      .limit(settings.maxPosts || 10);

    if (forms && forms.length > 0) {
      // Get posting accounts
      const { data: accounts } = await supabase
        .from('posting_accounts')
        .select('*')
        .eq('user_id', campaign.user_id)
        .eq('is_active', true);

      if (accounts && accounts.length > 0) {
        for (const form of forms) {
          try {
            const account = accounts[Math.floor(Math.random() * accounts.length)];
            
            const postResult = await callFunction('comment-poster', {
              formId: form.id,
              campaignId,
              accountId: account.id,
              dryRun: settings.dryRun || false
            });

            if (postResult.success && postResult.result.success) {
              postingResults.posted++;
            } else {
              postingResults.failed++;
            }

            // Rate limiting between posts
            await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000));
            
          } catch (postError) {
            console.error('Posting error:', postError);
            postingResults.failed++;
          }
        }
      }
    }
  }

  await updateJobProgress(job.id, 100);
  await updateJobStatus(job.id, 'completed', {
    targetsFound: discoverResult.validTargets,
    formsDetected: detectResult.formsFound,
    commentsPosted: postingResults.posted,
    commentsFailed: postingResults.failed
  });

  // Update campaign status
  await supabase
    .from('blog_campaigns')
    .update({ 
      status: 'completed',
      links_found: discoverResult.validTargets || 0,
      links_posted: postingResults.posted,
      updated_at: new Date().toISOString()
    })
    .eq('id', campaignId);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      jobId: job.id,
      results: {
        targetsFound: discoverResult.validTargets || 0,
        formsDetected: detectResult.formsFound || 0,
        commentsPosted: postingResults.posted,
        commentsFailed: postingResults.failed
      },
      message: 'Campaign completed successfully'
    })
  };
}

async function discoverTargets(campaignId, settings, headers) {
  const { data: campaign } = await supabase
    .from('blog_campaigns')
    .select('keyword')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Campaign not found' })
    };
  }

  const result = await callFunction('blog-crawler', {
    action: 'discover',
    keyword: campaign.keyword,
    maxResults: settings.maxTargets || 20,
    campaignId
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result)
  };
}

async function detectForms(campaignId, settings, headers) {
  const { data: targets } = await supabase
    .from('blog_targets')
    .select('url')
    .eq('campaign_id', campaignId)
    .eq('has_comment_form', true);

  if (!targets || targets.length === 0) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'No targets found for form detection',
        formsFound: 0 
      })
    };
  }

  const result = await callFunction('form-detector', {
    targetUrls: targets.map(t => t.url),
    campaignId
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result)
  };
}

async function postComments(campaignId, settings, headers) {
  const { data: campaign } = await supabase
    .from('blog_campaigns')
    .select('user_id')
    .eq('id', campaignId)
    .single();

  const { data: forms } = await supabase
    .from('comment_forms')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'validated')
    .order('confidence_score', { ascending: false })
    .limit(settings.maxPosts || 5);

  const { data: accounts } = await supabase
    .from('posting_accounts')
    .select('*')
    .eq('user_id', campaign.user_id)
    .eq('is_active', true);

  if (!forms || forms.length === 0) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'No validated forms found for posting',
        results: { posted: 0, failed: 0 }
      })
    };
  }

  if (!accounts || accounts.length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'No posting accounts found' })
    };
  }

  const results = { posted: 0, failed: 0, details: [] };

  for (const form of forms) {
    try {
      const account = accounts[Math.floor(Math.random() * accounts.length)];
      
      const postResult = await callFunction('comment-poster', {
        formId: form.id,
        campaignId,
        accountId: account.id,
        dryRun: settings.dryRun || false
      });

      if (postResult.success && postResult.result.success) {
        results.posted++;
        results.details.push({
          url: form.url,
          status: 'success',
          liveUrl: postResult.result.liveUrl
        });
      } else {
        results.failed++;
        results.details.push({
          url: form.url,
          status: 'failed',
          error: postResult.result?.error || 'Unknown error'
        });
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      results.failed++;
      results.details.push({
        url: form.url,
        status: 'error',
        error: error.message
      });
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      results
    })
  };
}

async function getCampaignStatus(campaignId, headers) {
  const { data: campaign } = await supabase
    .from('blog_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  const { data: targets } = await supabase
    .from('blog_targets')
    .select('status')
    .eq('campaign_id', campaignId);

  const { data: forms } = await supabase
    .from('comment_forms')
    .select('status')
    .eq('campaign_id', campaignId);

  const { data: results } = await supabase
    .from('posting_results')
    .select('status')
    .eq('campaign_id', campaignId);

  const { data: jobs } = await supabase
    .from('automation_jobs')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(1);

  const status = {
    campaign,
    stats: {
      targetsFound: targets?.length || 0,
      formsDetected: forms?.length || 0,
      formsValidated: forms?.filter(f => f.status === 'validated').length || 0,
      commentsPosted: results?.filter(r => r.status === 'posted').length || 0,
      commentsFailed: results?.filter(r => r.status === 'failed').length || 0
    },
    latestJob: jobs?.[0] || null
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, status })
  };
}

async function getCampaignResults(campaignId, headers) {
  const { data: results } = await supabase
    .from('posting_results')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('posted_at', { ascending: false });

  const liveUrls = results
    ?.filter(r => r.status === 'posted' && r.live_url)
    .map(r => ({
      url: r.live_url,
      targetUrl: r.target_url,
      postedAt: r.posted_at,
      content: r.comment_content?.substring(0, 100) + '...'
    })) || [];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      results: {
        totalResults: results?.length || 0,
        successfulPosts: results?.filter(r => r.status === 'posted').length || 0,
        failedPosts: results?.filter(r => r.status === 'failed').length || 0,
        liveUrls,
        allResults: results
      }
    })
  };
}

// Helper functions
async function callFunction(functionName, payload) {
  try {
    const response = await fetch(`${process.env.NETLIFY_URL}/.netlify/functions/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return { success: response.ok, ...data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateJobStatus(jobId, status, result) {
  await supabase
    .from('automation_jobs')
    .update({
      status,
      result: typeof result === 'object' ? result : { message: result },
      completed_at: new Date().toISOString()
    })
    .eq('id', jobId);
}

async function updateJobProgress(jobId, progress) {
  await supabase
    .from('automation_jobs')
    .update({ progress })
    .eq('id', jobId);
}
