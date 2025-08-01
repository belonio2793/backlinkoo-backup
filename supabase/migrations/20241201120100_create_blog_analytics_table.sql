-- Create blog analytics table for real engagement metrics
CREATE TABLE IF NOT EXISTS blog_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  date date DEFAULT current_date,
  daily_views integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  bounce_rate decimal(5,2) DEFAULT 0.00 CHECK (bounce_rate >= 0 AND bounce_rate <= 100),
  average_time_on_page integer DEFAULT 0, -- seconds
  social_shares integer DEFAULT 0,
  organic_traffic integer DEFAULT 0,
  direct_traffic integer DEFAULT 0,
  referral_traffic integer DEFAULT 0,
  email_traffic integer DEFAULT 0,
  social_traffic integer DEFAULT 0,
  conversion_count integer DEFAULT 0,
  conversion_rate decimal(5,2) DEFAULT 0.00 CHECK (conversion_rate >= 0 AND conversion_rate <= 100),
  click_through_rate decimal(5,2) DEFAULT 0.00 CHECK (click_through_rate >= 0 AND click_through_rate <= 100),
  engagement_score decimal(5,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(blog_post_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_analytics_blog_post_id ON blog_analytics(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_analytics_date ON blog_analytics(date);
CREATE INDEX IF NOT EXISTS idx_blog_analytics_daily_views ON blog_analytics(daily_views);
CREATE INDEX IF NOT EXISTS idx_blog_analytics_engagement_score ON blog_analytics(engagement_score);

-- Create RLS policies for security
ALTER TABLE blog_analytics ENABLE ROW LEVEL SECURITY;

-- Users can view analytics for their own blog posts
CREATE POLICY "Users can view analytics for their own posts" ON blog_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts bp 
      WHERE bp.id = blog_analytics.blog_post_id 
      AND bp.user_id = auth.uid()
    )
  );

-- Users can insert analytics for their own blog posts
CREATE POLICY "Users can insert analytics for their own posts" ON blog_analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM blog_posts bp 
      WHERE bp.id = blog_analytics.blog_post_id 
      AND bp.user_id = auth.uid()
    )
  );

-- Users can update analytics for their own blog posts
CREATE POLICY "Users can update analytics for their own posts" ON blog_analytics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM blog_posts bp 
      WHERE bp.id = blog_analytics.blog_post_id 
      AND bp.user_id = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_blog_analytics_updated_at
  BEFORE UPDATE ON blog_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_analytics_updated_at();

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_daily_views integer,
  p_average_time_on_page integer,
  p_bounce_rate decimal,
  p_social_shares integer,
  p_conversion_rate decimal
) RETURNS decimal AS $$
DECLARE
  engagement_score decimal := 0;
BEGIN
  -- Base score from views (max 30 points)
  engagement_score := engagement_score + LEAST(p_daily_views / 10.0, 30);
  
  -- Time on page score (max 25 points) - 300 seconds = full points
  engagement_score := engagement_score + LEAST(p_average_time_on_page / 12.0, 25);
  
  -- Bounce rate score (max 20 points) - lower bounce rate = higher score
  engagement_score := engagement_score + GREATEST(20 - (p_bounce_rate / 5.0), 0);
  
  -- Social shares score (max 15 points)
  engagement_score := engagement_score + LEAST(p_social_shares * 2.0, 15);
  
  -- Conversion rate score (max 10 points)
  engagement_score := engagement_score + (p_conversion_rate * 2.0);
  
  RETURN LEAST(engagement_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate engagement score
CREATE OR REPLACE FUNCTION update_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.engagement_score := calculate_engagement_score(
    NEW.daily_views,
    NEW.average_time_on_page,
    NEW.bounce_rate,
    NEW.social_shares,
    NEW.conversion_rate
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_engagement_score
  BEFORE INSERT OR UPDATE ON blog_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_score();

-- Insert sample analytics data for existing blog posts
INSERT INTO blog_analytics (
  blog_post_id, 
  date, 
  daily_views, 
  unique_visitors, 
  bounce_rate, 
  average_time_on_page, 
  social_shares, 
  organic_traffic,
  conversion_count,
  conversion_rate
)
SELECT 
  bp.id,
  current_date - (random() * 30)::int, -- Random date within last 30 days
  (random() * 500 + 50)::int, -- 50-550 daily views
  (random() * 400 + 40)::int, -- 40-440 unique visitors
  (random() * 60 + 20)::decimal(5,2), -- 20-80% bounce rate
  (random() * 300 + 60)::int, -- 60-360 seconds average time
  (random() * 20)::int, -- 0-20 social shares
  (random() * 300 + 30)::int, -- 30-330 organic traffic
  (random() * 10)::int, -- 0-10 conversions
  (random() * 5)::decimal(5,2) -- 0-5% conversion rate
FROM blog_posts bp
WHERE bp.status = 'published'
ORDER BY random()
LIMIT 100; -- Add analytics for published posts
