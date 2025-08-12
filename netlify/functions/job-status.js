import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { id } = event.queryStringParameters || {};

    if (id) {
      // Get specific job status
      return await getJobStatus(id);
    } else {
      // Get overall system status
      return await getSystemStatus();
    }
  } catch (error) {
    console.error('Job status error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function getJobStatus(jobId) {
  try {
    // Get job details
    const { data: job, error } = await supabase
      .from('automation_jobs')
      .select(`
        *,
        blog_campaigns (name, keyword)
      `)
      .eq('id', jobId)
      .single();

    if (error) throw error;

    if (!job) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Job not found' })
      };
    }

    // Calculate progress based on job type
    let progress = job.progress || 0;
    let estimatedCompletion = null;

    if (job.status === 'processing') {
      // Estimate progress based on job type and elapsed time
      const startTime = new Date(job.started_at || job.created_at);
      const elapsed = Date.now() - startTime.getTime();
      
      switch (job.job_type) {
        case 'discover_targets':
          // Target discovery usually takes 2-5 minutes
          progress = Math.min(90, (elapsed / (4 * 60 * 1000)) * 100);
          estimatedCompletion = new Date(startTime.getTime() + (5 * 60 * 1000));
          break;
        case 'detect_forms':
          // Form detection is faster, 1-3 minutes per 10 targets
          const targetCount = job.payload?.targetIds?.length || 10;
          const estimatedDuration = (targetCount / 10) * 2 * 60 * 1000;
          progress = Math.min(90, (elapsed / estimatedDuration) * 100);
          estimatedCompletion = new Date(startTime.getTime() + estimatedDuration);
          break;
        case 'post_comments':
          // Posting takes longer due to rate limits, ~30 seconds per post
          const formCount = job.payload?.formIds?.length || 5;
          const estimatedDuration2 = formCount * 30 * 1000;
          progress = Math.min(90, (elapsed / estimatedDuration2) * 100);
          estimatedCompletion = new Date(startTime.getTime() + estimatedDuration2);
          break;
      }
    } else if (job.status === 'completed') {
      progress = 100;
    } else if (job.status === 'failed') {
      progress = 0;
    }

    // Get related statistics
    const stats = await getJobTypeStats(job.job_type, job.campaign_id);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job: {
          id: job.id,
          type: job.job_type,
          status: job.status,
          progress: Math.round(progress),
          created_at: job.created_at,
          started_at: job.started_at,
          completed_at: job.completed_at,
          estimated_completion: estimatedCompletion,
          result: job.result,
          error: job.error_message,
          campaign: job.blog_campaigns
        },
        stats,
        active_jobs: await getActiveJobsCount()
      })
    };

  } catch (error) {
    throw error;
  }
}

async function getSystemStatus() {
  try {
    // Get active jobs
    const { data: activeJobs, error: jobsError } = await supabase
      .from('automation_jobs')
      .select(`
        *,
        blog_campaigns (name, keyword)
      `)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (jobsError) throw jobsError;

    // Get recent completed jobs
    const { data: recentJobs, error: recentError } = await supabase
      .from('automation_jobs')
      .select(`
        *,
        blog_campaigns (name, keyword)
      `)
      .in('status', ['completed', 'failed'])
      .order('completed_at', { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    // Get overall system stats
    const stats = await getOverallStats();

    // Calculate system health
    const systemHealth = calculateSystemHealth(stats);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        active: activeJobs?.length > 0,
        active_jobs: activeJobs?.length || 0,
        processing_jobs: activeJobs?.filter(j => j.status === 'processing').length || 0,
        pending_jobs: activeJobs?.filter(j => j.status === 'pending').length || 0,
        system_health: systemHealth,
        stats,
        instances: activeJobs || [],
        recent_completions: recentJobs || []
      })
    };

  } catch (error) {
    throw error;
  }
}

async function getJobTypeStats(jobType, campaignId) {
  const stats = {};

  try {
    switch (jobType) {
      case 'discover_targets':
        // Get target discovery stats
        const { data: targetStats } = await supabase
          .from('crawler_targets')
          .select('crawl_status')
          .limit(1000);

        if (targetStats) {
          stats.total_targets = targetStats.length;
          stats.checked_targets = targetStats.filter(t => t.crawl_status === 'checked').length;
          stats.blocked_targets = targetStats.filter(t => t.crawl_status === 'blocked').length;
        }
        break;

      case 'detect_forms':
        // Get form detection stats
        const { data: formStats } = await supabase
          .from('form_maps')
          .select('status, confidence')
          .limit(1000);

        if (formStats) {
          stats.total_forms = formStats.length;
          stats.vetted_forms = formStats.filter(f => f.status === 'vetted').length;
          stats.high_confidence = formStats.filter(f => f.confidence >= 15).length;
          stats.avg_confidence = formStats.reduce((sum, f) => sum + f.confidence, 0) / formStats.length;
        }
        break;

      case 'post_comments':
        // Get posting stats for this campaign
        const { data: postStats } = await supabase
          .from('blog_posts')
          .select('status')
          .eq('campaign_id', campaignId);

        if (postStats) {
          stats.total_attempts = postStats.length;
          stats.successful_posts = postStats.filter(p => p.status === 'posted').length;
          stats.failed_posts = postStats.filter(p => p.status === 'failed').length;
          stats.captcha_encounters = postStats.filter(p => p.status === 'captcha').length;
          stats.success_rate = postStats.length > 0 
            ? Math.round((stats.successful_posts / postStats.length) * 100) 
            : 0;
        }
        break;
    }
  } catch (error) {
    console.error('Error getting job type stats:', error);
  }

  return stats;
}

async function getOverallStats() {
  try {
    // Get comprehensive stats
    const [targetStats, formStats, postStats, jobStats] = await Promise.all([
      supabase.from('crawler_targets').select('crawl_status').limit(5000),
      supabase.from('form_maps').select('status, confidence').limit(5000),
      supabase.from('blog_posts').select('status, created_at').limit(5000),
      supabase.from('automation_jobs').select('job_type, status, created_at').limit(1000)
    ]);

    const stats = {
      targets: {
        total: targetStats.data?.length || 0,
        checked: targetStats.data?.filter(t => t.crawl_status === 'checked').length || 0,
        pending: targetStats.data?.filter(t => t.crawl_status === 'pending').length || 0,
        blocked: targetStats.data?.filter(t => t.crawl_status === 'blocked').length || 0
      },
      forms: {
        total: formStats.data?.length || 0,
        vetted: formStats.data?.filter(f => f.status === 'vetted').length || 0,
        detected: formStats.data?.filter(f => f.status === 'detected').length || 0,
        flagged: formStats.data?.filter(f => f.status === 'flagged').length || 0,
        avg_confidence: formStats.data?.length > 0 
          ? Math.round(formStats.data.reduce((sum, f) => sum + f.confidence, 0) / formStats.data.length)
          : 0
      },
      posts: {
        total: postStats.data?.length || 0,
        successful: postStats.data?.filter(p => p.status === 'posted').length || 0,
        failed: postStats.data?.filter(p => p.status === 'failed').length || 0,
        captcha: postStats.data?.filter(p => p.status === 'captcha').length || 0,
        pending: postStats.data?.filter(p => p.status === 'pending').length || 0,
        success_rate: 0
      },
      jobs: {
        total: jobStats.data?.length || 0,
        completed: jobStats.data?.filter(j => j.status === 'completed').length || 0,
        failed: jobStats.data?.filter(j => j.status === 'failed').length || 0,
        processing: jobStats.data?.filter(j => j.status === 'processing').length || 0,
        pending: jobStats.data?.filter(j => j.status === 'pending').length || 0
      }
    };

    // Calculate success rate
    const totalAttempts = stats.posts.successful + stats.posts.failed;
    if (totalAttempts > 0) {
      stats.posts.success_rate = Math.round((stats.posts.successful / totalAttempts) * 100);
    }

    // Calculate recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    stats.recent_activity = {
      posts_24h: postStats.data?.filter(p => p.created_at >= yesterday).length || 0,
      jobs_24h: jobStats.data?.filter(j => j.created_at >= yesterday).length || 0
    };

    return stats;

  } catch (error) {
    console.error('Error getting overall stats:', error);
    return {
      targets: { total: 0, checked: 0, pending: 0, blocked: 0 },
      forms: { total: 0, vetted: 0, detected: 0, flagged: 0, avg_confidence: 0 },
      posts: { total: 0, successful: 0, failed: 0, captcha: 0, pending: 0, success_rate: 0 },
      jobs: { total: 0, completed: 0, failed: 0, processing: 0, pending: 0 },
      recent_activity: { posts_24h: 0, jobs_24h: 0 }
    };
  }
}

async function getActiveJobsCount() {
  try {
    const { count, error } = await supabase
      .from('automation_jobs')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'processing']);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting active jobs count:', error);
    return 0;
  }
}

function calculateSystemHealth(stats) {
  let health = 100;
  let issues = [];

  // Check success rate
  if (stats.posts.success_rate < 50 && stats.posts.total > 10) {
    health -= 20;
    issues.push('Low posting success rate');
  }

  // Check for too many failed jobs
  const totalJobs = stats.jobs.completed + stats.jobs.failed;
  if (totalJobs > 0) {
    const jobFailureRate = (stats.jobs.failed / totalJobs) * 100;
    if (jobFailureRate > 25) {
      health -= 15;
      issues.push('High job failure rate');
    }
  }

  // Check for CAPTCHA issues
  if (stats.posts.captcha > stats.posts.successful && stats.posts.total > 5) {
    health -= 10;
    issues.push('High CAPTCHA encounter rate');
  }

  // Check for stalled processing
  if (stats.jobs.processing > 5) {
    health -= 10;
    issues.push('Multiple jobs processing simultaneously');
  }

  // Check recent activity
  if (stats.recent_activity.posts_24h === 0 && stats.recent_activity.jobs_24h === 0) {
    health -= 5;
    issues.push('No recent activity');
  }

  return {
    score: Math.max(0, health),
    status: health >= 80 ? 'healthy' : health >= 60 ? 'warning' : 'critical',
    issues: issues
  };
}
