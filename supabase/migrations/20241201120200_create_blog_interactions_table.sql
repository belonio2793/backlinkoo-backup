-- Create blog interactions table for real engagement tracking
CREATE TABLE IF NOT EXISTS blog_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text, -- For anonymous users
  interaction_type text NOT NULL CHECK (interaction_type IN (
    'view', 'unique_view', 'share', 'bookmark', 'comment', 'like', 
    'click_target_link', 'scroll_50', 'scroll_75', 'scroll_100',
    'time_30s', 'time_60s', 'time_300s', 'conversion'
  )),
  ip_address inet,
  user_agent text,
  referrer_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  device_type text CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  browser text,
  operating_system text,
  country_code text,
  city text,
  page_load_time integer, -- milliseconds
  interaction_data jsonb, -- Additional data for specific interactions
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_interactions_blog_post_id ON blog_interactions(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_interactions_user_id ON blog_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_interactions_type ON blog_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_blog_interactions_created_at ON blog_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_blog_interactions_session_id ON blog_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_blog_interactions_utm_source ON blog_interactions(utm_source);

-- Create RLS policies for security
ALTER TABLE blog_interactions ENABLE ROW LEVEL SECURITY;

-- Users can view interactions for their own blog posts
CREATE POLICY "Users can view interactions for their own posts" ON blog_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts bp 
      WHERE bp.id = blog_interactions.blog_post_id 
      AND bp.user_id = auth.uid()
    )
  );

-- Anyone can insert interactions (for tracking)
CREATE POLICY "Anyone can insert interactions" ON blog_interactions
  FOR INSERT WITH CHECK (true);

-- Only system can update interactions
CREATE POLICY "System can update interactions" ON blog_interactions
  FOR UPDATE USING (false);

-- Function to get device type from user agent
CREATE OR REPLACE FUNCTION get_device_type(user_agent_string text)
RETURNS text AS $$
BEGIN
  IF user_agent_string ILIKE '%mobile%' OR user_agent_string ILIKE '%android%' OR user_agent_string ILIKE '%iphone%' THEN
    RETURN 'mobile';
  ELSIF user_agent_string ILIKE '%tablet%' OR user_agent_string ILIKE '%ipad%' THEN
    RETURN 'tablet';
  ELSE
    RETURN 'desktop';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get browser from user agent
CREATE OR REPLACE FUNCTION get_browser(user_agent_string text)
RETURNS text AS $$
BEGIN
  IF user_agent_string ILIKE '%chrome%' THEN
    RETURN 'Chrome';
  ELSIF user_agent_string ILIKE '%firefox%' THEN
    RETURN 'Firefox';
  ELSIF user_agent_string ILIKE '%safari%' THEN
    RETURN 'Safari';
  ELSIF user_agent_string ILIKE '%edge%' THEN
    RETURN 'Edge';
  ELSIF user_agent_string ILIKE '%opera%' THEN
    RETURN 'Opera';
  ELSE
    RETURN 'Other';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set device type and browser
CREATE OR REPLACE FUNCTION set_interaction_metadata()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_agent IS NOT NULL THEN
    NEW.device_type := COALESCE(NEW.device_type, get_device_type(NEW.user_agent));
    NEW.browser := COALESCE(NEW.browser, get_browser(NEW.user_agent));
  END IF;
  
  -- Set session_id if not provided and user is anonymous
  IF NEW.session_id IS NULL AND NEW.user_id IS NULL THEN
    NEW.session_id := 'anon_' || extract(epoch from now())::text || '_' || (random() * 10000)::int;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_interaction_metadata
  BEFORE INSERT ON blog_interactions
  FOR EACH ROW
  EXECUTE FUNCTION set_interaction_metadata();

-- Function to track page view and update analytics
CREATE OR REPLACE FUNCTION track_page_view(
  p_blog_post_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_referrer_url text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  is_unique_view boolean := false;
  today_date date := current_date;
BEGIN
  -- Check if this is a unique view (new session for this post today)
  IF NOT EXISTS (
    SELECT 1 FROM blog_interactions 
    WHERE blog_post_id = p_blog_post_id 
    AND DATE(created_at) = today_date
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id) OR
      (p_session_id IS NOT NULL AND session_id = p_session_id)
    )
  ) THEN
    is_unique_view := true;
  END IF;
  
  -- Insert interaction record
  INSERT INTO blog_interactions (
    blog_post_id, user_id, session_id, interaction_type, 
    ip_address, user_agent, referrer_url
  ) VALUES (
    p_blog_post_id, p_user_id, p_session_id, 
    CASE WHEN is_unique_view THEN 'unique_view' ELSE 'view' END,
    p_ip_address, p_user_agent, p_referrer_url
  );
  
  -- Update blog_analytics table
  INSERT INTO blog_analytics (blog_post_id, date, daily_views, unique_visitors)
  VALUES (p_blog_post_id, today_date, 1, CASE WHEN is_unique_view THEN 1 ELSE 0 END)
  ON CONFLICT (blog_post_id, date)
  DO UPDATE SET 
    daily_views = blog_analytics.daily_views + 1,
    unique_visitors = blog_analytics.unique_visitors + CASE WHEN is_unique_view THEN 1 ELSE 0 END,
    updated_at = now();
    
  -- Update blog_posts view_count
  UPDATE blog_posts 
  SET view_count = view_count + 1
  WHERE id = p_blog_post_id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample interaction data for existing blog posts
DO $$
DECLARE
  post_record record;
  i integer;
  interaction_types text[] := ARRAY['view', 'unique_view', 'share', 'bookmark', 'click_target_link', 'scroll_50', 'scroll_75', 'scroll_100'];
  devices text[] := ARRAY['desktop', 'mobile', 'tablet'];
  browsers text[] := ARRAY['Chrome', 'Firefox', 'Safari', 'Edge'];
  utm_sources text[] := ARRAY['google', 'facebook', 'twitter', 'direct', 'email', 'linkedin'];
BEGIN
  FOR post_record IN SELECT id FROM blog_posts WHERE status = 'published' LIMIT 10 LOOP
    FOR i IN 1..50 LOOP -- 50 interactions per post
      INSERT INTO blog_interactions (
        blog_post_id,
        interaction_type,
        device_type,
        browser,
        utm_source,
        country_code,
        created_at
      ) VALUES (
        post_record.id,
        interaction_types[1 + (random() * array_length(interaction_types, 1))::int],
        devices[1 + (random() * array_length(devices, 1))::int],
        browsers[1 + (random() * array_length(browsers, 1))::int],
        utm_sources[1 + (random() * array_length(utm_sources, 1))::int],
        'US',
        now() - (random() * interval '30 days')
      );
    END LOOP;
  END LOOP;
END $$;
