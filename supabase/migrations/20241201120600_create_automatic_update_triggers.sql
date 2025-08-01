-- Comprehensive trigger system for automatic updates

-- Trigger function to update blog post metrics when backlinks change
CREATE OR REPLACE FUNCTION update_blog_post_backlink_metrics()
RETURNS TRIGGER AS $$
DECLARE
  affected_post_id uuid;
BEGIN
  -- Get the affected post ID
  affected_post_id := COALESCE(NEW.blog_post_id, OLD.blog_post_id);
  
  -- Update backlinks count and related metrics
  UPDATE blog_posts 
  SET 
    backlinks_count = (
      SELECT COUNT(*) 
      FROM backlinks 
      WHERE blog_post_id = affected_post_id AND status = 'active'
    ),
    last_analytics_update = now()
  WHERE id = affected_post_id;
  
  -- Recalculate engagement score
  PERFORM update_blog_post_metrics(affected_post_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create backlinks trigger
DROP TRIGGER IF EXISTS trigger_update_backlink_metrics ON backlinks;
CREATE TRIGGER trigger_update_backlink_metrics
  AFTER INSERT OR UPDATE OR DELETE ON backlinks
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_post_backlink_metrics();

-- Trigger function to update blog post view count from interactions
CREATE OR REPLACE FUNCTION update_blog_post_view_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process view-related interactions
  IF NEW.interaction_type IN ('view', 'unique_view') THEN
    -- Update view count in blog_posts table
    UPDATE blog_posts 
    SET 
      view_count = view_count + 1,
      last_analytics_update = now()
    WHERE id = NEW.blog_post_id;
    
    -- Update daily analytics
    INSERT INTO blog_analytics (
      blog_post_id, 
      date, 
      daily_views, 
      unique_visitors
    ) 
    VALUES (
      NEW.blog_post_id, 
      current_date, 
      1, 
      CASE WHEN NEW.interaction_type = 'unique_view' THEN 1 ELSE 0 END
    )
    ON CONFLICT (blog_post_id, date)
    DO UPDATE SET 
      daily_views = blog_analytics.daily_views + 1,
      unique_visitors = blog_analytics.unique_visitors + 
        CASE WHEN NEW.interaction_type = 'unique_view' THEN 1 ELSE 0 END,
      updated_at = now();
  END IF;
  
  -- Update social shares
  IF NEW.interaction_type = 'share' THEN
    UPDATE blog_posts 
    SET 
      social_shares = social_shares + 1,
      last_analytics_update = now()
    WHERE id = NEW.blog_post_id;
    
    -- Update analytics table
    INSERT INTO blog_analytics (blog_post_id, date, social_shares)
    VALUES (NEW.blog_post_id, current_date, 1)
    ON CONFLICT (blog_post_id, date)
    DO UPDATE SET 
      social_shares = blog_analytics.social_shares + 1,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create interactions trigger
DROP TRIGGER IF EXISTS trigger_update_view_metrics ON blog_interactions;
CREATE TRIGGER trigger_update_view_metrics
  AFTER INSERT ON blog_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_post_view_metrics();

-- Trigger function to automatically refresh materialized views
CREATE OR REPLACE FUNCTION trigger_refresh_dashboard_views()
RETURNS TRIGGER AS $$
BEGIN
  -- Schedule a refresh of materialized views (use a job queue in production)
  -- For now, we'll use NOTIFY to signal that a refresh is needed
  PERFORM pg_notify('dashboard_refresh_needed', json_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'timestamp', extract(epoch from now())
  )::text);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for materialized view refresh on key table changes
DROP TRIGGER IF EXISTS trigger_blog_posts_dashboard_refresh ON blog_posts;
CREATE TRIGGER trigger_blog_posts_dashboard_refresh
  AFTER INSERT OR UPDATE OR DELETE ON blog_posts
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_dashboard_views();

DROP TRIGGER IF EXISTS trigger_blog_analytics_dashboard_refresh ON blog_analytics;
CREATE TRIGGER trigger_blog_analytics_dashboard_refresh
  AFTER INSERT OR UPDATE OR DELETE ON blog_analytics
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_dashboard_views();

DROP TRIGGER IF EXISTS trigger_backlinks_dashboard_refresh ON backlinks;
CREATE TRIGGER trigger_backlinks_dashboard_refresh
  AFTER INSERT OR UPDATE OR DELETE ON backlinks
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_dashboard_views();

-- Trigger function to validate and enhance blog post data
CREATE OR REPLACE FUNCTION validate_and_enhance_blog_post()
RETURNS TRIGGER AS $$
BEGIN
  -- Set meta_title if not provided
  IF NEW.meta_title IS NULL OR NEW.meta_title = '' THEN
    NEW.meta_title := NEW.title;
  END IF;
  
  -- Set canonical_url if not provided
  IF NEW.canonical_url IS NULL AND NEW.published_url IS NOT NULL THEN
    NEW.canonical_url := NEW.published_url;
  END IF;
  
  -- Auto-generate excerpt if not provided
  IF NEW.excerpt IS NULL OR NEW.excerpt = '' THEN
    NEW.excerpt := LEFT(regexp_replace(NEW.content, '<[^>]*>', '', 'g'), 300) || '...';
  END IF;
  
  -- Update word count and reading time
  NEW.word_count := array_length(string_to_array(regexp_replace(NEW.content, '<[^>]*>', '', 'g'), ' '), 1);
  NEW.reading_time := GREATEST(1, NEW.word_count / 200); -- 200 words per minute
  
  -- Initialize engagement score for new posts
  IF TG_OP = 'INSERT' THEN
    NEW.engagement_score := calculate_blog_post_engagement_score(
      COALESCE(NEW.view_count, 0),
      COALESCE(NEW.backlinks_count, 0),
      COALESCE(NEW.social_shares, 0),
      COALESCE(NEW.bounce_rate, 0),
      COALESCE(NEW.average_time_on_page, 0),
      COALESCE(NEW.conversion_rate, 0),
      COALESCE(NEW.seo_score, 0)
    );
  END IF;
  
  -- Update timestamps
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create blog post validation trigger
DROP TRIGGER IF EXISTS trigger_validate_blog_post ON blog_posts;
CREATE TRIGGER trigger_validate_blog_post
  BEFORE INSERT OR UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_and_enhance_blog_post();

-- Trigger function to handle blog post status changes
CREATE OR REPLACE FUNCTION handle_blog_post_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When a post is published for the first time
  IF OLD.status != 'published' AND NEW.status = 'published' THEN
    NEW.published_at := now();
    
    -- Log the publication event
    INSERT INTO security_audit_log (action, resource, user_id, details)
    VALUES (
      'blog_post_published',
      'blog_posts',
      NEW.user_id,
      jsonb_build_object(
        'post_id', NEW.id,
        'title', NEW.title,
        'slug', NEW.slug
      )
    );
  END IF;
  
  -- When a trial post is claimed
  IF OLD.is_trial_post = true AND NEW.is_trial_post = false AND NEW.user_id IS NOT NULL THEN
    -- Remove expiration
    NEW.expires_at := NULL;
    
    -- Log the claim event
    INSERT INTO security_audit_log (action, resource, user_id, details)
    VALUES (
      'trial_post_claimed',
      'blog_posts',
      NEW.user_id,
      jsonb_build_object(
        'post_id', NEW.id,
        'title', NEW.title,
        'slug', NEW.slug
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create status change trigger
DROP TRIGGER IF EXISTS trigger_blog_post_status_change ON blog_posts;
CREATE TRIGGER trigger_blog_post_status_change
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION handle_blog_post_status_change();

-- Trigger function to clean up expired trial posts
CREATE OR REPLACE FUNCTION cleanup_expired_trial_posts()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete expired trial posts
  DELETE FROM blog_posts
  WHERE is_trial_post = true 
    AND expires_at IS NOT NULL 
    AND expires_at < now();
  
  -- Log cleanup activity
  INSERT INTO security_audit_log (action, resource, details)
  VALUES (
    'expired_trial_posts_cleanup',
    'blog_posts',
    jsonb_build_object(
      'cleaned_at', now(),
      'trigger', 'automatic'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update analytics aggregates
CREATE OR REPLACE FUNCTION update_analytics_aggregates()
RETURNS TRIGGER AS $$
DECLARE
  post_id uuid;
BEGIN
  post_id := COALESCE(NEW.blog_post_id, OLD.blog_post_id);
  
  -- Recalculate engagement score for the affected post
  PERFORM update_blog_post_metrics(post_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create analytics aggregation trigger
DROP TRIGGER IF EXISTS trigger_update_analytics_aggregates ON blog_analytics;
CREATE TRIGGER trigger_update_analytics_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON blog_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_aggregates();

-- Trigger function to maintain data consistency
CREATE OR REPLACE FUNCTION maintain_data_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure view_count is never negative
  IF NEW.view_count < 0 THEN
    NEW.view_count := 0;
  END IF;
  
  -- Ensure backlinks_count is never negative
  IF NEW.backlinks_count < 0 THEN
    NEW.backlinks_count := 0;
  END IF;
  
  -- Ensure social_shares is never negative
  IF NEW.social_shares < 0 THEN
    NEW.social_shares := 0;
  END IF;
  
  -- Ensure bounce_rate is within valid range
  IF NEW.bounce_rate < 0 THEN
    NEW.bounce_rate := 0;
  ELSIF NEW.bounce_rate > 100 THEN
    NEW.bounce_rate := 100;
  END IF;
  
  -- Ensure conversion_rate is within valid range
  IF NEW.conversion_rate < 0 THEN
    NEW.conversion_rate := 0;
  ELSIF NEW.conversion_rate > 100 THEN
    NEW.conversion_rate := 100;
  END IF;
  
  -- Ensure engagement_score is within valid range
  IF NEW.engagement_score < 0 THEN
    NEW.engagement_score := 0;
  ELSIF NEW.engagement_score > 100 THEN
    NEW.engagement_score := 100;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create data consistency trigger
DROP TRIGGER IF EXISTS trigger_maintain_data_consistency ON blog_posts;
CREATE TRIGGER trigger_maintain_data_consistency
  BEFORE INSERT OR UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION maintain_data_consistency();

-- Function to manually trigger all metric updates
CREATE OR REPLACE FUNCTION recalculate_all_metrics()
RETURNS void AS $$
DECLARE
  post_record record;
  total_posts integer;
  processed_posts integer := 0;
BEGIN
  -- Get total count for progress tracking
  SELECT COUNT(*) INTO total_posts FROM blog_posts;
  
  -- Update metrics for all posts
  FOR post_record IN SELECT id FROM blog_posts LOOP
    PERFORM update_blog_post_metrics(post_record.id);
    processed_posts := processed_posts + 1;
    
    -- Log progress every 100 posts
    IF processed_posts % 100 = 0 THEN
      RAISE NOTICE 'Processed % of % posts', processed_posts, total_posts;
    END IF;
  END LOOP;
  
  -- Refresh materialized views
  PERFORM refresh_all_dashboard_views();
  
  -- Log completion
  INSERT INTO security_audit_log (action, resource, details)
  VALUES (
    'metrics_recalculation_complete',
    'blog_posts',
    jsonb_build_object(
      'total_posts_processed', processed_posts,
      'completed_at', now()
    )
  );
  
  RAISE NOTICE 'All metrics recalculated successfully for % posts', processed_posts;
END;
$$ LANGUAGE plpgsql;

-- Create a notification function for real-time updates
CREATE OR REPLACE FUNCTION notify_blog_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification for real-time dashboard updates
  PERFORM pg_notify('blog_update', json_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'post_id', COALESCE(NEW.blog_post_id, NEW.id, OLD.blog_post_id, OLD.id),
    'timestamp', extract(epoch from now())
  )::text);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create notification triggers for real-time updates
DROP TRIGGER IF EXISTS trigger_notify_blog_post_update ON blog_posts;
CREATE TRIGGER trigger_notify_blog_post_update
  AFTER INSERT OR UPDATE OR DELETE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_blog_update();

DROP TRIGGER IF EXISTS trigger_notify_analytics_update ON blog_analytics;
CREATE TRIGGER trigger_notify_analytics_update
  AFTER INSERT OR UPDATE OR DELETE ON blog_analytics
  FOR EACH ROW
  EXECUTE FUNCTION notify_blog_update();

DROP TRIGGER IF EXISTS trigger_notify_backlinks_update ON backlinks;
CREATE TRIGGER trigger_notify_backlinks_update
  AFTER INSERT OR UPDATE OR DELETE ON backlinks
  FOR EACH ROW
  EXECUTE FUNCTION notify_blog_update();

-- Initial metrics calculation for existing posts
SELECT recalculate_all_metrics();
