-- Create materialized views for fast dashboard metrics

-- Materialized view for blog dashboard statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS blog_dashboard_stats AS
SELECT 
  bp.id,
  bp.user_id,
  bp.title,
  bp.slug,
  bp.status,
  bp.is_trial_post,
  bp.view_count,
  bp.seo_score,
  bp.reading_time,
  bp.created_at,
  bp.published_at,
  bp.tags,
  bp.category,
  bp.target_url,
  -- Real metrics from related tables
  COALESCE(bl.backlinks_count, 0) as backlinks,
  COALESCE(ba.total_views, bp.view_count) as analytics_views,
  COALESCE(ba.unique_visitors, 0) as unique_visitors,
  COALESCE(ba.avg_bounce_rate, bp.bounce_rate) as bounce_rate,
  COALESCE(ba.avg_time_on_page, bp.average_time_on_page) as average_time_on_page,
  COALESCE(ba.total_social_shares, bp.social_shares) as social_shares,
  COALESCE(ba.avg_conversion_rate, bp.conversion_rate) as conversion_rate,
  COALESCE(bp.engagement_score, 0) as engagement_score,
  -- Traffic breakdown
  COALESCE(ba.organic_traffic, bp.organic_traffic) as organic_traffic,
  COALESCE(ba.social_traffic, bp.social_traffic) as social_traffic,
  COALESCE(ba.referral_traffic, bp.referral_traffic) as referral_traffic,
  COALESCE(ba.direct_traffic, bp.direct_traffic) as direct_traffic,
  -- Recent activity indicators
  CASE WHEN bp.created_at > now() - interval '7 days' THEN true ELSE false END as is_recent,
  CASE WHEN ba.last_update > now() - interval '24 hours' THEN true ELSE false END as has_recent_activity,
  -- Performance indicators
  CASE 
    WHEN bp.engagement_score >= 80 THEN 'excellent'
    WHEN bp.engagement_score >= 60 THEN 'good'
    WHEN bp.engagement_score >= 40 THEN 'average'
    ELSE 'needs_improvement'
  END as performance_category
FROM blog_posts bp
LEFT JOIN (
  -- Aggregate backlinks per post
  SELECT 
    blog_post_id,
    COUNT(*) as backlinks_count,
    AVG(domain_authority) as avg_domain_authority,
    COUNT(*) FILTER (WHERE link_type = 'dofollow') as dofollow_count
  FROM backlinks 
  WHERE status = 'active'
  GROUP BY blog_post_id
) bl ON bp.id = bl.blog_post_id
LEFT JOIN (
  -- Aggregate analytics per post
  SELECT 
    blog_post_id,
    SUM(daily_views) as total_views,
    SUM(unique_visitors) as unique_visitors,
    AVG(bounce_rate) as avg_bounce_rate,
    AVG(average_time_on_page) as avg_time_on_page,
    SUM(social_shares) as total_social_shares,
    AVG(conversion_rate) as avg_conversion_rate,
    SUM(organic_traffic) as organic_traffic,
    SUM(social_traffic) as social_traffic,
    SUM(referral_traffic) as referral_traffic,
    SUM(direct_traffic) as direct_traffic,
    MAX(updated_at) as last_update
  FROM blog_analytics
  WHERE date > current_date - interval '90 days' -- Last 90 days
  GROUP BY blog_post_id
) ba ON bp.id = ba.blog_post_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_dashboard_stats_id ON blog_dashboard_stats (id);

-- Additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_blog_dashboard_stats_user_id ON blog_dashboard_stats (user_id);
CREATE INDEX IF NOT EXISTS idx_blog_dashboard_stats_status ON blog_dashboard_stats (status);
CREATE INDEX IF NOT EXISTS idx_blog_dashboard_stats_engagement ON blog_dashboard_stats (engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_blog_dashboard_stats_performance ON blog_dashboard_stats (performance_category);
CREATE INDEX IF NOT EXISTS idx_blog_dashboard_stats_recent ON blog_dashboard_stats (is_recent) WHERE is_recent = true;

-- Materialized view for user-specific blog statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS user_blog_summary AS
SELECT 
  bp.user_id,
  COUNT(*) as total_posts,
  COUNT(*) FILTER (WHERE bp.status = 'published') as published_posts,
  COUNT(*) FILTER (WHERE bp.status = 'draft') as draft_posts,
  COUNT(*) FILTER (WHERE bp.status = 'claimed') as claimed_posts,
  COUNT(*) FILTER (WHERE bp.status = 'unclaimed') as unclaimed_posts,
  COUNT(*) FILTER (WHERE bp.is_trial_post = true) as trial_posts,
  COALESCE(SUM(bp.view_count), 0) as total_views,
  COALESCE(SUM(bp.backlinks_count), 0) as total_backlinks,
  COALESCE(SUM(bp.social_shares), 0) as total_social_shares,
  COALESCE(AVG(bp.engagement_score), 0) as avg_engagement_score,
  COALESCE(AVG(bp.seo_score), 0) as avg_seo_score,
  COALESCE(AVG(bp.bounce_rate), 0) as avg_bounce_rate,
  MAX(bp.created_at) as last_post_created,
  MAX(bp.published_at) as last_post_published,
  -- Performance metrics
  COUNT(*) FILTER (WHERE bp.engagement_score >= 80) as excellent_posts,
  COUNT(*) FILTER (WHERE bp.engagement_score >= 60 AND bp.engagement_score < 80) as good_posts,
  COUNT(*) FILTER (WHERE bp.engagement_score >= 40 AND bp.engagement_score < 60) as average_posts,
  COUNT(*) FILTER (WHERE bp.engagement_score < 40) as poor_posts,
  -- Recent activity
  COUNT(*) FILTER (WHERE bp.created_at > now() - interval '7 days') as posts_last_week,
  COUNT(*) FILTER (WHERE bp.created_at > now() - interval '30 days') as posts_last_month
FROM blog_posts bp
WHERE bp.user_id IS NOT NULL
GROUP BY bp.user_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_blog_summary_user_id ON user_blog_summary (user_id);

-- Materialized view for trending posts
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_posts AS
SELECT 
  bp.id,
  bp.title,
  bp.slug,
  bp.status,
  bp.created_at,
  bp.view_count,
  bp.engagement_score,
  -- Trending score calculation
  (
    -- Recent views weight (50%)
    COALESCE(recent_ba.recent_views, 0) * 0.5 +
    -- Engagement score weight (30%)
    COALESCE(bp.engagement_score, 0) * 0.3 +
    -- Social shares weight (10%)
    COALESCE(bp.social_shares, 0) * 2 * 0.1 +
    -- Recent backlinks weight (10%)
    COALESCE(recent_bl.recent_backlinks, 0) * 5 * 0.1
  ) as trending_score,
  -- Growth indicators
  COALESCE(recent_ba.recent_views, 0) as views_last_7_days,
  COALESCE(recent_bl.recent_backlinks, 0) as backlinks_last_7_days,
  COALESCE(recent_int.recent_interactions, 0) as interactions_last_7_days,
  -- Velocity (growth rate)
  CASE 
    WHEN bp.created_at > now() - interval '7 days' THEN NULL
    ELSE COALESCE(recent_ba.recent_views, 0) / GREATEST(EXTRACT(epoch FROM (now() - bp.created_at)) / 86400, 1)
  END as daily_view_velocity
FROM blog_posts bp
LEFT JOIN (
  -- Recent analytics (last 7 days)
  SELECT 
    blog_post_id,
    SUM(daily_views) as recent_views,
    SUM(unique_visitors) as recent_unique_visitors
  FROM blog_analytics
  WHERE date > current_date - interval '7 days'
  GROUP BY blog_post_id
) recent_ba ON bp.id = recent_ba.blog_post_id
LEFT JOIN (
  -- Recent backlinks (last 7 days)
  SELECT 
    blog_post_id,
    COUNT(*) as recent_backlinks
  FROM backlinks
  WHERE created_at > now() - interval '7 days' AND status = 'active'
  GROUP BY blog_post_id
) recent_bl ON bp.id = recent_bl.blog_post_id
LEFT JOIN (
  -- Recent interactions (last 7 days)
  SELECT 
    blog_post_id,
    COUNT(*) as recent_interactions
  FROM blog_interactions
  WHERE created_at > now() - interval '7 days'
  GROUP BY blog_post_id
) recent_int ON bp.id = recent_int.blog_post_id
WHERE bp.status = 'published';

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_posts_id ON trending_posts (id);
CREATE INDEX IF NOT EXISTS idx_trending_posts_score ON trending_posts (trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_posts_velocity ON trending_posts (daily_view_velocity DESC NULLS LAST);

-- Materialized view for content performance analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS content_performance_analytics AS
SELECT 
  bp.category,
  bp.status,
  COUNT(*) as post_count,
  AVG(bp.view_count) as avg_views,
  AVG(bp.engagement_score) as avg_engagement,
  AVG(bp.seo_score) as avg_seo_score,
  AVG(bp.reading_time) as avg_reading_time,
  AVG(bp.word_count) as avg_word_count,
  AVG(bp.backlinks_count) as avg_backlinks,
  AVG(bp.social_shares) as avg_social_shares,
  AVG(bp.bounce_rate) as avg_bounce_rate,
  AVG(bp.conversion_rate) as avg_conversion_rate,
  -- Top performing posts in category
  array_agg(
    jsonb_build_object(
      'id', bp.id,
      'title', bp.title,
      'engagement_score', bp.engagement_score
    ) ORDER BY bp.engagement_score DESC
  )[1:5] as top_posts,
  -- Content insights
  mode() WITHIN GROUP (ORDER BY bp.reading_time) as most_common_reading_time,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY bp.word_count) as median_word_count,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY bp.engagement_score) as median_engagement
FROM blog_posts bp
WHERE bp.status IN ('published', 'claimed')
GROUP BY bp.category, bp.status;

-- Create indexes for content performance analytics
CREATE INDEX IF NOT EXISTS idx_content_performance_category ON content_performance_analytics (category);
CREATE INDEX IF NOT EXISTS idx_content_performance_engagement ON content_performance_analytics (avg_engagement DESC);

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_dashboard_views()
RETURNS void AS $$
BEGIN
  -- Refresh blog dashboard stats
  PERFORM safe_refresh_materialized_view('blog_dashboard_stats');
  
  -- Refresh user blog summary
  PERFORM safe_refresh_materialized_view('user_blog_summary');
  
  -- Refresh trending posts
  PERFORM safe_refresh_materialized_view('trending_posts');
  
  -- Refresh content performance analytics
  PERFORM safe_refresh_materialized_view('content_performance_analytics');
  
  RAISE NOTICE 'All dashboard materialized views refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to schedule automatic view refresh
CREATE OR REPLACE FUNCTION schedule_view_refresh()
RETURNS void AS $$
BEGIN
  -- This would typically be called by a scheduled job (pg_cron or external scheduler)
  PERFORM refresh_all_dashboard_views();
  
  -- Log the refresh
  INSERT INTO security_audit_log (action, resource, details)
  VALUES (
    'materialized_view_refresh',
    'dashboard_views',
    jsonb_build_object(
      'refreshed_at', now(),
      'views', ARRAY['blog_dashboard_stats', 'user_blog_summary', 'trending_posts', 'content_performance_analytics']
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Initial refresh of all views
SELECT refresh_all_dashboard_views();
