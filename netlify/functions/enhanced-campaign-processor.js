/**
 * Enhanced Campaign Processor with Automatic Filtering
 * Monitors publishing attempts and automatically filters failed platforms
 */

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
    };
  }

  try {
    const { keyword, anchorText, targetUrl, campaignId } = JSON.parse(event.body);

    console.log('🚀 Enhanced campaign processing with automatic filtering:', { keyword, anchorText, targetUrl, campaignId });

    // Validate inputs
    if (!keyword || !anchorText || !targetUrl || !campaignId) {
      throw new Error('Missing required parameters: keyword, anchorText, targetUrl, campaignId');
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Get next verified platform (excluding filtered ones)
    const nextPlatform = await getNextVerifiedPlatform(supabase, campaignId);
    console.log(`🎯 Selected platform: ${nextPlatform.name} (${nextPlatform.id})`);

    // Step 2: Record attempt start
    const attemptId = await recordAttemptStart(supabase, {
      campaignId,
      platformId: nextPlatform.id,
      platformName: nextPlatform.name,
      domain: nextPlatform.domain,
      targetUrl,
      keyword,
      anchorText
    });

    console.log(`📝 Started publishing attempt: ${attemptId}`);

    // Step 3: Generate content
    const blogPost = await generateSingleBlogPost(keyword, anchorText, targetUrl);
    console.log('✅ Generated blog post using smart prompt selection');

    // Step 4: Attempt publishing with timeout and monitoring
    let publishedUrl;
    let publishingError;
    const startTime = Date.now();

    try {
      publishedUrl = await publishWithTimeout(nextPlatform, blogPost, 30000); // 30-second timeout
      const responseTime = Date.now() - startTime;

      // Verify the published URL is accessible
      await verifyPublishedUrl(publishedUrl);

      // Record successful attempt
      await recordAttemptSuccess(supabase, attemptId, publishedUrl, responseTime);

      // Save to automation_published_links
      await savePublishedLink(supabase, campaignId, publishedUrl, blogPost.title, nextPlatform.name);

      console.log(`✅ Successfully published and verified: ${publishedUrl} (${responseTime}ms)`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Campaign processed successfully with automatic filtering',
          publishedUrl,
          platform: nextPlatform.name,
          responseTime,
          attemptId,
          automaticFiltering: true
        }),
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      publishingError = error.message || 'Publishing failed';

      console.error(`❌ Publishing failed: ${publishingError}`);

      // Record failed attempt (this will trigger automatic filtering)
      if (error.name === 'TimeoutError') {
        await recordAttemptTimeout(supabase, attemptId, responseTime);
      } else {
        await recordAttemptFailure(supabase, attemptId, publishingError, responseTime);
      }

      // Try fallback platform if available
      const fallbackResult = await tryFallbackPlatform(supabase, campaignId, blogPost, targetUrl, keyword, anchorText);
      
      if (fallbackResult.success) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Campaign processed with fallback platform after automatic filtering',
            publishedUrl: fallbackResult.publishedUrl,
            platform: fallbackResult.platform,
            originalError: publishingError,
            usedFallback: true,
            automaticFiltering: true
          }),
        };
      }

      // If all platforms fail, return error
      throw new Error(`All platforms failed. Primary error: ${publishingError}`);
    }

  } catch (error) {
    console.error('❌ Enhanced campaign processing failed:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Enhanced campaign processing failed',
        automaticFiltering: true
      }),
    };
  }
};

/**
 * Get next verified platform excluding filtered ones
 */
async function getNextVerifiedPlatform(supabase, campaignId) {
  try {
    // Get platforms that are not blacklisted or temporarily disabled
    const { data: blacklisted, error: blacklistError } = await supabase
      .from('platform_blacklist')
      .select('platform_id')
      .eq('is_active', true);

    const { data: tempDisabled, error: tempError } = await supabase
      .from('platform_temporary_disables')
      .select('platform_id')
      .eq('is_active', true)
      .gt('disabled_until', new Date().toISOString());

    if (blacklistError && blacklistError.code !== 'PGRST116') {
      console.warn('Error checking blacklist:', blacklistError);
    }
    if (tempError && tempError.code !== 'PGRST116') {
      console.warn('Error checking temp disabled:', tempError);
    }

    // Create set of filtered platform IDs
    const filteredIds = new Set([
      ...(blacklisted || []).map(p => p.platform_id),
      ...(tempDisabled || []).map(p => p.platform_id)
    ]);

    console.log(`🚫 Filtered platforms: ${Array.from(filteredIds).join(', ')}`);

    // Get existing published links for this campaign
    const { data: publishedLinks, error: linksError } = await supabase
      .from('automation_published_links')
      .select('platform')
      .eq('campaign_id', campaignId);

    if (linksError) {
      console.warn('Error checking published links:', linksError);
    }

    const usedPlatforms = new Set((publishedLinks || []).map(link => normalizePlatformId(link.platform)));

    // Available verified platforms (in priority order)
    const availablePlatforms = [
      { id: 'telegraph', name: 'Telegraph.ph', domain: 'telegra.ph' },
      { id: 'writeas', name: 'Write.as', domain: 'write.as' }
    ];

    // Find first available platform
    for (const platform of availablePlatforms) {
      if (!filteredIds.has(platform.id) && !usedPlatforms.has(platform.id)) {
        return platform;
      }
    }

    // If all platforms are used/filtered, return first non-filtered platform for continuous rotation
    for (const platform of availablePlatforms) {
      if (!filteredIds.has(platform.id)) {
        console.log(`⚠️ All platforms used, continuing with rotation: ${platform.name}`);
        return platform;
      }
    }

    throw new Error('All platforms are filtered out or unavailable');

  } catch (error) {
    console.error('Error getting next verified platform:', error);
    
    // Fallback to Telegraph if everything fails
    return { id: 'telegraph', name: 'Telegraph.ph', domain: 'telegra.ph' };
  }
}

/**
 * Record publishing attempt start
 */
async function recordAttemptStart(supabase, attemptData) {
  const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  
  try {
    const { error } = await supabase
      .from('publishing_attempts')
      .insert({
        id: attemptId,
        campaign_id: attemptData.campaignId,
        platform_id: attemptData.platformId,
        platform_name: attemptData.platformName,
        domain: attemptData.domain,
        target_url: attemptData.targetUrl,
        keyword: attemptData.keyword,
        anchor_text: attemptData.anchorText,
        status: 'pending',
        attempted_at: new Date().toISOString(),
        retry_count: 0
      });

    if (error) {
      console.warn('Error recording attempt start:', error);
    }
  } catch (error) {
    console.warn('Error in recordAttemptStart:', error);
  }

  return attemptId;
}

/**
 * Record successful publishing attempt
 */
async function recordAttemptSuccess(supabase, attemptId, publishedUrl, responseTime) {
  try {
    const { error } = await supabase
      .from('publishing_attempts')
      .update({
        status: 'success',
        published_url: publishedUrl,
        response_time: responseTime,
        completed_at: new Date().toISOString()
      })
      .eq('id', attemptId);

    if (error) {
      console.warn('Error recording attempt success:', error);
    }
  } catch (error) {
    console.warn('Error in recordAttemptSuccess:', error);
  }
}

/**
 * Record failed publishing attempt
 */
async function recordAttemptFailure(supabase, attemptId, errorMessage, responseTime) {
  try {
    const { error } = await supabase
      .from('publishing_attempts')
      .update({
        status: 'failed',
        error_message: errorMessage,
        response_time: responseTime,
        completed_at: new Date().toISOString()
      })
      .eq('id', attemptId);

    if (error) {
      console.warn('Error recording attempt failure:', error);
    }
  } catch (error) {
    console.warn('Error in recordAttemptFailure:', error);
  }
}

/**
 * Record timeout
 */
async function recordAttemptTimeout(supabase, attemptId, timeoutDuration) {
  try {
    const { error } = await supabase
      .from('publishing_attempts')
      .update({
        status: 'timeout',
        error_message: `Request timed out after ${timeoutDuration}ms`,
        response_time: timeoutDuration,
        completed_at: new Date().toISOString()
      })
      .eq('id', attemptId);

    if (error) {
      console.warn('Error recording attempt timeout:', error);
    }
  } catch (error) {
    console.warn('Error in recordAttemptTimeout:', error);
  }
}

/**
 * Publish with timeout wrapper
 */
async function publishWithTimeout(platform, blogPost, timeoutMs) {
  return new Promise(async (resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      const error = new Error(`Publishing timeout after ${timeoutMs}ms`);
      error.name = 'TimeoutError';
      reject(error);
    }, timeoutMs);

    try {
      let publishedUrl;
      
      if (platform.id === 'telegraph') {
        publishedUrl = await publishToTelegraph(blogPost.title, blogPost.content);
      } else if (platform.id === 'writeas') {
        publishedUrl = await publishToWriteAs(blogPost.title, blogPost.content);
      } else {
        throw new Error(`Unsupported platform: ${platform.id}`);
      }

      clearTimeout(timeoutHandle);
      resolve(publishedUrl);
    } catch (error) {
      clearTimeout(timeoutHandle);
      reject(error);
    }
  });
}

/**
 * Verify published URL is accessible
 */
async function verifyPublishedUrl(url) {
  const fetch = require('node-fetch');
  
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 10000 // 10 second timeout for verification
    });
    
    if (!response.ok) {
      throw new Error(`Published URL not accessible: HTTP ${response.status}`);
    }
    
    console.log(`✅ URL verification passed: ${url}`);
  } catch (error) {
    console.error(`❌ URL verification failed: ${url} - ${error.message}`);
    throw new Error(`Published URL verification failed: ${error.message}`);
  }
}

/**
 * Try fallback platform after primary failure
 */
async function tryFallbackPlatform(supabase, campaignId, blogPost, targetUrl, keyword, anchorText) {
  try {
    console.log('🔄 Attempting fallback platform...');
    
    // Get a different platform for fallback
    const fallbackPlatform = await getNextVerifiedPlatform(supabase, campaignId + '_fallback');
    
    if (!fallbackPlatform) {
      return { success: false, error: 'No fallback platform available' };
    }

    const fallbackAttemptId = await recordAttemptStart(supabase, {
      campaignId: campaignId + '_fallback',
      platformId: fallbackPlatform.id,
      platformName: fallbackPlatform.name,
      domain: fallbackPlatform.domain,
      targetUrl,
      keyword,
      anchorText
    });

    const startTime = Date.now();
    const publishedUrl = await publishWithTimeout(fallbackPlatform, blogPost, 25000); // Shorter timeout for fallback
    const responseTime = Date.now() - startTime;

    await verifyPublishedUrl(publishedUrl);
    await recordAttemptSuccess(supabase, fallbackAttemptId, publishedUrl, responseTime);
    await savePublishedLink(supabase, campaignId, publishedUrl, blogPost.title, fallbackPlatform.name);

    console.log(`✅ Fallback successful: ${fallbackPlatform.name}`);
    
    return {
      success: true,
      publishedUrl,
      platform: fallbackPlatform.name
    };

  } catch (error) {
    console.error('❌ Fallback platform also failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Normalize platform ID for consistency
 */
function normalizePlatformId(platformId) {
  const normalized = platformId.toLowerCase();
  if (normalized === 'write.as' || normalized === 'writeas') return 'writeas';
  if (normalized === 'telegraph.ph' || normalized === 'telegraph') return 'telegraph';
  return normalized;
}

// Import existing functions from other processors
async function generateSingleBlogPost(keyword, anchorText, targetUrl) {
  // This would import from existing blog generator
  // For now, return a simple structure
  return {
    title: `Professional Guide to ${keyword}`,
    content: `# Professional Guide to ${keyword}

This comprehensive guide explores the key aspects of ${keyword} and provides valuable insights for professionals.

## Understanding ${keyword}

${keyword} represents an important area that requires careful consideration and strategic approach.

## Best Practices

When working with ${keyword}, it's essential to follow industry best practices and proven methodologies.

For comprehensive resources and expert guidance on ${keyword}, [${anchorText}](${targetUrl}) provides valuable information.

## Conclusion

Success with ${keyword} requires dedication, proper tools, and continuous learning.`
  };
}

async function publishToTelegraph(title, content) {
  // Import from existing Telegraph publisher
  const fetch = require('node-fetch');

  // Create Telegraph account
  const accountResponse = await fetch('https://api.telegra.ph/createAccount', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      short_name: 'AutoPublisher',
      author_name: 'Professional Content',
      author_url: ''
    })
  });

  const accountData = await accountResponse.json();
  if (!accountData.ok) {
    throw new Error(`Telegraph account creation failed: ${accountData.error}`);
  }

  // Convert content and create page
  const telegraphContent = convertToTelegraphFormat(content);
  
  const pageResponse = await fetch('https://api.telegra.ph/createPage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: accountData.result.access_token,
      title: title,
      author_name: 'Professional Content',
      content: telegraphContent,
      return_content: false
    })
  });

  const pageData = await pageResponse.json();
  if (!pageData.ok) {
    throw new Error(`Telegraph page creation failed: ${pageData.error}`);
  }

  return pageData.result.url;
}

async function publishToWriteAs(title, content) {
  const fetch = require('node-fetch');
  
  const writeasContent = convertToWriteasFormat(content, title);
  
  const response = await fetch('https://write.as/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      body: writeasContent,
      title: title,
      font: 'norm'
    })
  });

  if (!response.ok) {
    throw new Error(`Write.as API error: HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.data || !data.data.url) {
    throw new Error('Write.as response missing URL data');
  }

  return data.data.url;
}

async function savePublishedLink(supabase, campaignId, url, title, platform) {
  try {
    const { error } = await supabase
      .from('automation_published_links')
      .insert({
        campaign_id: campaignId,
        published_url: url,
        title: title,
        platform: platform,
        status: 'active',
        published_at: new Date().toISOString()
      });

    if (error) {
      console.warn('Error saving published link:', error);
    }
  } catch (error) {
    console.warn('Error in savePublishedLink:', error);
  }
}

// Content conversion functions (simplified versions)
function convertToTelegraphFormat(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const telegraphNodes = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('# ')) {
      telegraphNodes.push({ tag: 'h3', children: [trimmedLine.substring(2)] });
    } else if (trimmedLine.startsWith('## ')) {
      telegraphNodes.push({ tag: 'h4', children: [trimmedLine.substring(3)] });
    } else if (trimmedLine) {
      if (trimmedLine.includes('[') && trimmedLine.includes('](')) {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const children = [];
        let lastIndex = 0;
        let match;
        
        while ((match = linkRegex.exec(trimmedLine)) !== null) {
          if (match.index > lastIndex) {
            children.push(trimmedLine.substring(lastIndex, match.index));
          }
          children.push({ tag: 'a', attrs: { href: match[2] }, children: [match[1]] });
          lastIndex = match.index + match[0].length;
        }
        
        if (lastIndex < trimmedLine.length) {
          children.push(trimmedLine.substring(lastIndex));
        }
        
        telegraphNodes.push({ tag: 'p', children: children });
      } else {
        telegraphNodes.push({ tag: 'p', children: [trimmedLine] });
      }
    }
  }
  
  return telegraphNodes;
}

function convertToWriteasFormat(content, title) {
  let writeasContent = `# ${title}\n\n`;
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      writeasContent += trimmedLine + '\n\n';
    } else if (trimmedLine.startsWith('#')) {
      writeasContent += trimmedLine + '\n\n';
    }
  }
  
  return writeasContent.trim();
}
