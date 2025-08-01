-- Database functions for real-time blog metrics aggregation

-- Function to get comprehensive blog post statistics
CREATE OR REPLACE FUNCTION get_blog_post_stats(p_blog_post_id uuid)
RETURNS TABLE(
  total_views bigint,
  unique_visitors bigint,
  backlinks_count bigint,
  social_shares bigint,
  avg_bounce_rate decimal,
  avg_time_on_page decimal,
  conversion_rate decimal,
  engagement_score decimal,
  traffic_sources jsonb,
  top_referrers jsonb,
  device_breakdown jsonb,
  browser_breakdown jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH analytics_summary AS (
    SELECT 
      COALESCE(SUM(ba.daily_views), 0) as total_views,
      COALESCE(SUM(ba.unique_visitors), 0) as unique_visitors,
      COALESCE(AVG(ba.bounce_rate), 0) as avg_bounce_rate,
      COALESCE(AVG(ba.average_time_on_page), 0) as avg_time_on_page,
      COALESCE(AVG(ba.conversion_rate), 0) as avg_conversion_rate,
      COALESCE(SUM(ba.social_shares), 0) as social_shares,
      jsonb_build_object(
        'organic', COALESCE(SUM(ba.organic_traffic), 0),
        'social', COALESCE(SUM(ba.social_traffic), 0),
        'referral', COALESCE(SUM(ba.referral_traffic), 0),
        'direct', COALESCE(SUM(ba.direct_traffic), 0),
        'email', COALESCE(SUM(ba.email_traffic), 0)
      ) as traffic_sources
    FROM blog_analytics ba
    WHERE ba.blog_post_id = p_blog_post_id
  ),
  backlinks_summary AS (
    SELECT COALESCE(COUNT(*), 0) as backlinks_count
    FROM backlinks b
    WHERE b.blog_post_id = p_blog_post_id AND b.status = 'active'
  ),
  referrers_summary AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'referrer', referrer_domain,
        'visits', visit_count
      ) ORDER BY visit_count DESC
    ) as top_referrers
    FROM (
      SELECT 
        COALESCE(split_part(bi.referrer_url, '/', 3), 'direct') as referrer_domain,
        COUNT(*) as visit_count
      FROM blog_interactions bi
      WHERE bi.blog_post_id = p_blog_post_id 
        AND bi.interaction_type IN ('view', 'unique_view')
      GROUP BY referrer_domain
      ORDER BY visit_count DESC
      LIMIT 10
    ) ref
  ),
  device_summary AS (
    SELECT jsonb_object_agg(device_type, device_count) as device_breakdown
    FROM (
      SELECT 
        COALESCE(bi.device_type, 'unknown') as device_type,
        COUNT(*) as device_count
      FROM blog_interactions bi
      WHERE bi.blog_post_id = p_blog_post_id 
        AND bi.interaction_type IN ('view', 'unique_view')
      GROUP BY device_type
    ) dev
  ),
  browser_summary AS (
    SELECT jsonb_object_agg(browser, browser_count) as browser_breakdown
    FROM (
      SELECT 
        COALESCE(bi.browser, 'unknown') as browser,
        COUNT(*) as browser_count
      FROM blog_interactions bi
      WHERE bi.blog_post_id = p_blog_post_id 
        AND bi.interaction_type IN ('view', 'unique_view')
      GROUP BY browser
    ) brow
  ),
  engagement_summary AS (
    SELECT 
      calculate_blog_post_engagement_score(
        COALESCE(bp.view_count, 0),
        COALESCE(bs.backlinks_count, 0),
        COALESCE(as_data.social_shares, 0),
        COALESCE(as_data.avg_bounce_rate, 0),
        COALESCE(as_data.avg_time_on_page, 0),
        COALESCE(as_data.avg_conversion_rate, 0),
        COALESCE(bp.seo_score, 0)
      ) as engagement_score
    FROM blog_posts bp, analytics_summary as_data, backlinks_summary bs
    WHERE bp.id = p_blog_post_id
  )
  SELECT 
    as_data.total_views,
    as_data.unique_visitors,
    bs.backlinks_count,
    as_data.social_shares,
    as_data.avg_bounce_rate,
    as_data.avg_time_on_page,
    as_data.avg_conversion_rate,
    es.engagement_score,
    as_data.traffic_sources,
    COALESCE(rs.top_referrers, '[]'::jsonb),
    COALESCE(ds.device_breakdown, '{}'::jsonb),
    COALESCE(brs.browser_breakdown, '{}'::jsonb)
  FROM analytics_summary as_data
  CROSS JOIN backlinks_summary bs
  CROSS JOIN engagement_summary es
  LEFT JOIN referrers_summary rs ON true
  LEFT JOIN device_summary ds ON true
  LEFT JOIN browser_summary brs ON true;
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard summary statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  total_posts bigint,
  published_posts bigint,
  draft_posts bigint,
  claimed_posts bigint,
  unclaimed_posts bigint,
  trial_posts bigint,
  total_views bigint,
  total_backlinks bigint,
  avg_engagement_score decimal,
  top_performing_posts jsonb,
  recent_activity jsonb,
  traffic_trend jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH post_summary AS (
    SELECT 
      COUNT(*) as total_posts,
      COUNT(*) FILTER (WHERE status = 'published') as published_posts,
      COUNT(*) FILTER (WHERE status = 'draft') as draft_posts,
      COUNT(*) FILTER (WHERE status = 'claimed') as claimed_posts,
      COUNT(*) FILTER (WHERE status = 'unclaimed') as unclaimed_posts,
      COUNT(*) FILTER (WHERE is_trial_post = true) as trial_posts,
      COALESCE(SUM(view_count), 0) as total_views,
      COALESCE(SUM(backlinks_count), 0) as total_backlinks,
      COALESCE(AVG(engagement_score), 0) as avg_engagement_score
    FROM blog_posts bp
    WHERE (p_user_id IS NULL OR bp.user_id = p_user_id)
  ),
  top_posts AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', bp.id,
        'title', bp.title,
        'slug', bp.slug,
        'views', bp.view_count,
        'engagement_score', bp.engagement_score,
        'backlinks', bp.backlinks_count
      ) ORDER BY bp.engagement_score DESC
    ) as top_performing_posts
    FROM (
      SELECT bp.*
      FROM blog_posts bp
      WHERE (p_user_id IS NULL OR bp.user_id = p_user_id)
        AND bp.status = 'published'
      ORDER BY bp.engagement_score DESC
      LIMIT 5
    ) bp
  ),
  recent_activity AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'type', activity_type,
        'post_title', post_title,
        'post_id', post_id,
        'created_at', created_at,
        'details', details
      ) ORDER BY created_at DESC
    ) as recent_activity
    FROM (
      -- Recent posts
      SELECT 
        'post_created' as activity_type,
        bp.title as post_title,
        bp.id as post_id,
        bp.created_at,
        jsonb_build_object('status', bp.status) as details
      FROM blog_posts bp
      WHERE (p_user_id IS NULL OR bp.user_id = p_user_id)
        AND bp.created_at > now() - interval '7 days'
      
      UNION ALL
      
      -- Recent backlinks
      SELECT 
        'backlink_added' as activity_type,
        bp.title as post_title,
        bp.id as post_id,
        b.created_at,
        jsonb_build_object('source_url', b.source_url, 'domain_authority', b.domain_authority) as details
      FROM backlinks b
      JOIN blog_posts bp ON b.blog_post_id = bp.id
      WHERE (p_user_id IS NULL OR bp.user_id = p_user_id)
        AND b.created_at > now() - interval '7 days'
      
      ORDER BY created_at DESC
      LIMIT 10
    ) activities
  ),
  traffic_trend AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'date', trend_date,
        'views', daily_views,
        'unique_visitors', unique_visitors
      ) ORDER BY trend_date
    ) as traffic_trend
    FROM (
      SELECT 
        ba.date as trend_date,
        SUM(ba.daily_views) as daily_views,
        SUM(ba.unique_visitors) as unique_visitors
      FROM blog_analytics ba
      JOIN blog_posts bp ON ba.blog_post_id = bp.id
      WHERE (p_user_id IS NULL OR bp.user_id = p_user_id)
        AND ba.date > current_date - interval '30 days'
      GROUP BY ba.date
      ORDER BY ba.date
    ) trends
  )
  SELECT 
    ps.total_posts,
    ps.published_posts,
    ps.draft_posts,
    ps.claimed_posts,
    ps.unclaimed_posts,
    ps.trial_posts,
    ps.total_views,
    ps.total_backlinks,
    ps.avg_engagement_score,
    COALESCE(tp.top_performing_posts, '[]'::jsonb),
    COALESCE(ra.recent_activity, '[]'::jsonb),
    COALESCE(tt.traffic_trend, '[]'::jsonb)
  FROM post_summary ps
  LEFT JOIN top_posts tp ON true
  LEFT JOIN recent_activity ra ON true
  LEFT JOIN traffic_trend tt ON true;
END;
$$ LANGUAGE plpgsql;

-- Function to get blog performance trends
CREATE OR REPLACE FUNCTION get_blog_performance_trends(
  p_blog_post_id uuid,
  p_days_back integer DEFAULT 30
)
RETURNS TABLE(
  date date,
  daily_views integer,
  unique_visitors integer,
  bounce_rate decimal,
  average_time_on_page integer,
  social_shares integer,
  new_backlinks integer,
  engagement_score decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ba.date,
    COALESCE(ba.daily_views, 0) as daily_views,
    COALESCE(ba.unique_visitors, 0) as unique_visitors,
    COALESCE(ba.bounce_rate, 0) as bounce_rate,
    COALESCE(ba.average_time_on_page, 0) as average_time_on_page,
    COALESCE(ba.social_shares, 0) as social_shares,
    COALESCE(bl.new_backlinks, 0) as new_backlinks,
    COALESCE(ba.engagement_score, 0) as engagement_score
  FROM blog_analytics ba
  LEFT JOIN (
    SELECT 
      DATE(b.created_at) as date,
      COUNT(*) as new_backlinks
    FROM backlinks b
    WHERE b.blog_post_id = p_blog_post_id
      AND b.created_at > current_date - p_days_back
    GROUP BY DATE(b.created_at)
  ) bl ON ba.date = bl.date
  WHERE ba.blog_post_id = p_blog_post_id
    AND ba.date > current_date - p_days_back
  ORDER BY ba.date;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate SEO metrics for a blog post
CREATE OR REPLACE FUNCTION calculate_seo_metrics(p_blog_post_id uuid)
RETURNS TABLE(
  seo_score integer,
  keyword_density decimal,
  content_quality_score integer,
  readability_score integer,
  meta_optimization_score integer,
  backlink_quality_score integer,
  recommendations jsonb
) AS $$
DECLARE
  post_record record;
  content_length integer;
  title_length integer;
  meta_desc_length integer;
  avg_domain_authority decimal;
  recommendations_array jsonb := '[]'::jsonb;
BEGIN
  -- Get blog post data
  SELECT * INTO post_record
  FROM blog_posts bp
  WHERE bp.id = p_blog_post_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  content_length := LENGTH(post_record.content);
  title_length := LENGTH(post_record.title);
  meta_desc_length := LENGTH(COALESCE(post_record.meta_description, ''));
  
  -- Calculate average domain authority of backlinks
  SELECT COALESCE(AVG(domain_authority), 0) INTO avg_domain_authority
  FROM backlinks 
  WHERE blog_post_id = p_blog_post_id AND status = 'active';
  
  -- Generate recommendations
  IF content_length < 1500 THEN
    recommendations_array := recommendations_array || jsonb_build_array('Increase content length to at least 1500 words for better SEO');
  END IF;
  
  IF title_length > 60 THEN
    recommendations_array := recommendations_array || jsonb_build_array('Shorten title to under 60 characters');
  END IF;
  
  IF meta_desc_length = 0 THEN
    recommendations_array := recommendations_array || jsonb_build_array('Add a meta description');
  ELSIF meta_desc_length > 160 THEN
    recommendations_array := recommendations_array || jsonb_build_array('Shorten meta description to under 160 characters');
  END IF;
  
  IF post_record.backlinks_count < 5 THEN
    recommendations_array := recommendations_array || jsonb_build_array('Acquire more high-quality backlinks');
  END IF;
  
  RETURN QUERY
  SELECT 
    LEAST(100, GREATEST(0, 
      -- Content length score (25 points max)
      LEAST(25, content_length / 60) +
      -- Backlinks score (25 points max)
      LEAST(25, post_record.backlinks_count * 3) +
      -- Title optimization (15 points max)
      CASE WHEN title_length BETWEEN 30 AND 60 THEN 15 ELSE 10 END +
      -- Meta description (15 points max)
      CASE WHEN meta_desc_length BETWEEN 120 AND 160 THEN 15 ELSE 10 END +
      -- Domain authority score (20 points max)
      LEAST(20, avg_domain_authority / 5)
    ))::integer as seo_score,
    -- Keyword density (placeholder calculation)
    LEAST(3.0, (LENGTH(post_record.content) - LENGTH(REPLACE(LOWER(post_record.content), LOWER(post_record.title), ''))) * 100.0 / LENGTH(post_record.content))::decimal(5,2) as keyword_density,
    -- Content quality score
    LEAST(100, GREATEST(20, content_length / 30 + post_record.backlinks_count * 2))::integer as content_quality_score,
    -- Readability score (Flesch reading ease approximation)
    GREATEST(0, LEAST(100, 100 - (content_length / 100)))::integer as readability_score,
    -- Meta optimization score
    CASE 
      WHEN title_length BETWEEN 30 AND 60 AND meta_desc_length BETWEEN 120 AND 160 THEN 100
      WHEN title_length BETWEEN 20 AND 70 AND meta_desc_length BETWEEN 100 AND 180 THEN 80
      ELSE 60
    END::integer as meta_optimization_score,
    -- Backlink quality score
    LEAST(100, avg_domain_authority + post_record.backlinks_count * 5)::integer as backlink_quality_score,
    -- Recommendations
    recommendations_array as recommendations;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized view safely
CREATE OR REPLACE FUNCTION safe_refresh_materialized_view(view_name text)
RETURNS boolean AS $$
BEGIN
  EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I', view_name);
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  -- If concurrent refresh fails, try regular refresh
  BEGIN
    EXECUTE format('REFRESH MATERIALIZED VIEW %I', view_name);
    RETURN true;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old analytics data
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data(days_to_keep integer DEFAULT 365)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM blog_interactions 
  WHERE created_at < now() - (days_to_keep || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  DELETE FROM blog_analytics 
  WHERE date < current_date - days_to_keep;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
