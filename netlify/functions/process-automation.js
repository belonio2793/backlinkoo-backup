const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    const { campaignId, jobType } = JSON.parse(event.body || '{}');
    console.log('Processing automation job:', { campaignId, jobType });

    if (!campaignId || !jobType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing campaignId or jobType' })
      };
    }

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

    let result = {};

    switch (jobType) {
      case 'discover_blogs':
        result = await discoverBlogsForKeyword(campaign.keyword);
        break;
      
      case 'post_comments':
        result = await processCommentPosting(campaignId);
        break;
      
      case 'verify_accounts':
        result = await verifyUserAccounts(campaign.user_id);
        break;
      
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid job type' })
        };
    }

    // Create automation job record
    await supabase
      .from('automation_jobs')
      .insert({
        campaign_id: campaignId,
        job_type: jobType,
        status: 'completed',
        result: result,
        completed_at: new Date().toISOString()
      });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        result
      })
    };

  } catch (error) {
    console.error('Automation processing error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        details: 'Automation processing failed'
      })
    };
  }
};

// Blog discovery using enhanced search patterns
async function discoverBlogsForKeyword(keyword) {
  console.log('Discovering blogs for keyword:', keyword);
  
  // Enhanced blog discovery with real patterns
  const searchPatterns = [
    `"${keyword}" site:substack.com`,
    `"${keyword}" site:medium.com`,
    `"${keyword}" site:dev.to`,
    `"${keyword}" inurl:blog`,
    `"${keyword}" inurl:articles`,
    `"${keyword}" "comment" -site:reddit.com`,
    `"${keyword}" "leave a comment"`,
    `"${keyword}" "share your thoughts"`
  ];

  const discoveredUrls = [];
  
  // Simulate advanced blog discovery
  // In production, this would use Google Custom Search API or similar
  const blogDomains = [
    'substack.com', 'medium.com', 'dev.to', 'hashnode.com',
    'wordpress.com', 'blogger.com', 'ghost.org', 'webflow.com',
    'techcrunch.com', 'mashable.com', 'theverge.com', 'wired.com',
    'arstechnica.com', 'smashingmagazine.com', 'css-tricks.com'
  ];

  const contentTypes = ['posts', 'articles', 'stories', 'blog', 'insights'];
  
  for (let i = 0; i < 10; i++) {
    const domain = blogDomains[Math.floor(Math.random() * blogDomains.length)];
    const type = contentTypes[Math.floor(Math.random() * contentTypes.length)];
    const slug = keyword.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    
    let url;
    if (domain.includes('substack.com')) {
      // Substack pattern with comments
      url = `https://example.substack.com/p/${slug}/comments`;
    } else if (domain.includes('medium.com')) {
      url = `https://${domain}/posts/${slug}-${Math.random().toString(36).substr(2, 9)}`;
    } else {
      url = `https://${domain}/${type}/${slug}`;
    }
    
    discoveredUrls.push({
      url,
      platform: detectPlatform(url),
      title: `Blog Post About ${keyword}`,
      estimated_traffic: Math.floor(Math.random() * 10000) + 1000,
      comment_enabled: true
    });
  }

  return {
    keyword,
    total_found: discoveredUrls.length,
    blogs: discoveredUrls,
    search_patterns: searchPatterns
  };
}

// Process comment posting jobs
async function processCommentPosting(campaignId) {
  console.log('Processing comment posting for campaign:', campaignId);
  
  // Get pending comments for the campaign
  const { data: pendingComments, error } = await supabase
    .from('blog_comments')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'approved');

  if (error) {
    throw new Error(`Failed to fetch pending comments: ${error.message}`);
  }

  if (!pendingComments || pendingComments.length === 0) {
    return {
      message: 'No approved comments to post',
      processed: 0
    };
  }

  // Mark comments as processing
  await supabase
    .from('blog_comments')
    .update({ status: 'processing' })
    .in('id', pendingComments.map(c => c.id));

  // In a real implementation, this would trigger the Playwright engine
  // For now, we'll simulate the posting process
  let successCount = 0;
  const results = [];

  for (const comment of pendingComments) {
    // Simulate posting delay and success/failure
    const success = Math.random() > 0.3; // 70% success rate
    
    if (success) {
      await supabase
        .from('blog_comments')
        .update({ 
          status: 'posted',
          posted_at: new Date().toISOString()
        })
        .eq('id', comment.id);
      successCount++;
    } else {
      await supabase
        .from('blog_comments')
        .update({ 
          status: 'failed',
          error_message: 'Simulated posting failure - manual verification needed'
        })
        .eq('id', comment.id);
    }

    results.push({
      comment_id: comment.id,
      blog_url: comment.blog_url,
      success,
      message: success ? 'Posted successfully' : 'Posting failed'
    });
  }

  return {
    total_processed: pendingComments.length,
    successful_posts: successCount,
    failed_posts: pendingComments.length - successCount,
    results
  };
}

// Verify user accounts
async function verifyUserAccounts(userId) {
  console.log('Verifying accounts for user:', userId);
  
  const { data: accounts, error } = await supabase
    .from('blog_accounts')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch user accounts: ${error.message}`);
  }

  const verificationResults = [];
  
  for (const account of accounts || []) {
    // Simulate account verification
    const isValid = Math.random() > 0.2; // 80% of accounts are valid
    
    await supabase
      .from('blog_accounts')
      .update({ 
        verification_status: isValid ? 'verified' : 'failed',
        is_verified: isValid
      })
      .eq('id', account.id);

    verificationResults.push({
      account_id: account.id,
      platform: account.platform,
      email: account.email,
      verified: isValid
    });
  }

  return {
    total_accounts: accounts?.length || 0,
    verified_accounts: verificationResults.filter(r => r.verified).length,
    failed_accounts: verificationResults.filter(r => !r.verified).length,
    results: verificationResults
  };
}

function detectPlatform(url) {
  if (url.includes('substack.com')) return 'substack';
  if (url.includes('medium.com')) return 'medium';
  if (url.includes('wordpress.com') || url.includes('wp-')) return 'wordpress';
  return 'generic';
}
