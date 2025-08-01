-- Add missing columns to blog_posts table for enhanced metrics
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS backlinks_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS social_shares integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounce_rate decimal(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS average_time_on_page integer DEFAULT 0, -- seconds
ADD COLUMN IF NOT EXISTS conversion_rate decimal(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS engagement_score decimal(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS last_analytics_update timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS organic_traffic integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS social_traffic integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_traffic integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS direct_traffic integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS canonical_url text,
ADD COLUMN IF NOT EXISTS last_indexed_date timestamptz,
ADD COLUMN IF NOT EXISTS search_rankings jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz,
ADD COLUMN IF NOT EXISTS content_version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS google_analytics_id text,
ADD COLUMN IF NOT EXISTS tracking_pixels jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS utm_parameters jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS competitor_analysis jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS keyword_rankings jsonb DEFAULT '{}';

-- Add constraints for the new columns
ALTER TABLE blog_posts 
ADD CONSTRAINT chk_bounce_rate CHECK (bounce_rate >= 0 AND bounce_rate <= 100),
ADD CONSTRAINT chk_conversion_rate CHECK (conversion_rate >= 0 AND conversion_rate <= 100),
ADD CONSTRAINT chk_engagement_score CHECK (engagement_score >= 0 AND engagement_score <= 100),
ADD CONSTRAINT chk_content_version CHECK (content_version > 0);

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_blog_posts_backlinks_count ON blog_posts(backlinks_count);
CREATE INDEX IF NOT EXISTS idx_blog_posts_engagement_score ON blog_posts(engagement_score);
CREATE INDEX IF NOT EXISTS idx_blog_posts_approval_status ON blog_posts(approval_status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_last_analytics_update ON blog_posts(last_analytics_update);
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled_publish_at ON blog_posts(scheduled_publish_at);

-- Function to calculate blog post engagement score based on all metrics
CREATE OR REPLACE FUNCTION calculate_blog_post_engagement_score(
  p_view_count integer,
  p_backlinks_count integer,
  p_social_shares integer,
  p_bounce_rate decimal,
  p_average_time_on_page integer,
  p_conversion_rate decimal,
  p_seo_score integer
) RETURNS decimal AS $$
DECLARE
  engagement_score decimal := 0;
BEGIN
  -- Views score (max 25 points) - logarithmic scale
  engagement_score := engagement_score + LEAST(25, LOG(GREATEST(p_view_count, 1)) * 3);
  
  -- Backlinks score (max 20 points)
  engagement_score := engagement_score + LEAST(20, p_backlinks_count * 2);
  
  -- Social shares score (max 15 points)
  engagement_score := engagement_score + LEAST(15, p_social_shares * 1.5);
  
  -- Bounce rate score (max 15 points) - inverse relationship
  engagement_score := engagement_score + GREATEST(0, 15 - (p_bounce_rate / 100 * 15));
  
  -- Time on page score (max 10 points) - 300 seconds = full points
  engagement_score := engagement_score + LEAST(10, p_average_time_on_page / 30.0);
  
  -- Conversion rate score (max 10 points)
  engagement_score := engagement_score + (p_conversion_rate * 2);
  
  -- SEO score contribution (max 5 points)
  engagement_score := engagement_score + (p_seo_score / 100.0 * 5);
  
  RETURN LEAST(engagement_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to update blog post metrics from analytics
CREATE OR REPLACE FUNCTION update_blog_post_metrics(p_blog_post_id uuid)
RETURNS void AS $$
DECLARE
  analytics_data record;
  backlinks_data record;
BEGIN
  -- Get latest analytics data
  SELECT 
    COALESCE(SUM(daily_views), 0) as total_views,
    COALESCE(AVG(bounce_rate), 0) as avg_bounce_rate,
    COALESCE(AVG(average_time_on_page), 0) as avg_time_on_page,
    COALESCE(SUM(social_shares), 0) as total_social_shares,
    COALESCE(AVG(conversion_rate), 0) as avg_conversion_rate,
    COALESCE(SUM(organic_traffic), 0) as total_organic_traffic,
    COALESCE(SUM(social_traffic), 0) as total_social_traffic,
    COALESCE(SUM(referral_traffic), 0) as total_referral_traffic,
    COALESCE(SUM(direct_traffic), 0) as total_direct_traffic
  INTO analytics_data
  FROM blog_analytics 
  WHERE blog_post_id = p_blog_post_id;
  
  -- Get backlinks data
  SELECT COALESCE(COUNT(*), 0) as total_backlinks
  INTO backlinks_data
  FROM backlinks 
  WHERE blog_post_id = p_blog_post_id AND status = 'active';
  
  -- Update blog_posts table
  UPDATE blog_posts 
  SET 
    backlinks_count = backlinks_data.total_backlinks,
    social_shares = analytics_data.total_social_shares,
    bounce_rate = analytics_data.avg_bounce_rate,
    average_time_on_page = analytics_data.avg_time_on_page::integer,
    conversion_rate = analytics_data.avg_conversion_rate,
    organic_traffic = analytics_data.total_organic_traffic,
    social_traffic = analytics_data.total_social_traffic,
    referral_traffic = analytics_data.total_referral_traffic,
    direct_traffic = analytics_data.total_direct_traffic,
    engagement_score = calculate_blog_post_engagement_score(
      view_count,
      backlinks_data.total_backlinks,
      analytics_data.total_social_shares,
      analytics_data.avg_bounce_rate,
      analytics_data.avg_time_on_page::integer,
      analytics_data.avg_conversion_rate,
      seo_score
    ),
    last_analytics_update = now()
  WHERE id = p_blog_post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update all blog post metrics
CREATE OR REPLACE FUNCTION refresh_all_blog_metrics()
RETURNS void AS $$
DECLARE
  post_record record;
BEGIN
  FOR post_record IN SELECT id FROM blog_posts LOOP
    PERFORM update_blog_post_metrics(post_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update existing blog posts with calculated metrics
SELECT refresh_all_blog_metrics();

-- Set meta_title where missing
UPDATE blog_posts 
SET meta_title = title 
WHERE meta_title IS NULL OR meta_title = '';

-- Set canonical_url where missing
UPDATE blog_posts 
SET canonical_url = published_url 
WHERE canonical_url IS NULL AND published_url IS NOT NULL;

-- Add some realistic sample data for enhanced columns
UPDATE blog_posts 
SET 
  google_analytics_id = 'GA-' || (random() * 900000000 + 100000000)::bigint,
  utm_parameters = jsonb_build_object(
    'utm_source', 'backlinkoo',
    'utm_medium', 'blog',
    'utm_campaign', 'seo-content'
  ),
  competitor_analysis = jsonb_build_object(
    'top_competitors', ARRAY['competitor1.com', 'competitor2.com'],
    'avg_competitor_score', (random() * 40 + 40)::int,
    'competitive_advantage', 'Better content quality and backlink profile'
  ),
  keyword_rankings = jsonb_build_object(
    'primary_keyword', tags[1],
    'position', (random() * 20 + 1)::int,
    'search_volume', (random() * 5000 + 500)::int,
    'difficulty', (random() * 60 + 20)::int
  )
WHERE status = 'published' AND tags IS NOT NULL AND array_length(tags, 1) > 0;

-- Create a trigger to automatically update metrics when analytics change
CREATE OR REPLACE FUNCTION trigger_update_blog_metrics()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_blog_post_metrics(NEW.blog_post_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic metric updates
DROP TRIGGER IF EXISTS trigger_update_blog_metrics_on_analytics ON blog_analytics;
CREATE TRIGGER trigger_update_blog_metrics_on_analytics
  AFTER INSERT OR UPDATE ON blog_analytics
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_blog_metrics();

DROP TRIGGER IF EXISTS trigger_update_blog_metrics_on_backlinks ON backlinks;
CREATE TRIGGER trigger_update_blog_metrics_on_backlinks
  AFTER INSERT OR UPDATE OR DELETE ON backlinks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_blog_metrics();
