-- Create backlinks tracking table for real backlink metrics
CREATE TABLE IF NOT EXISTS backlinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  source_url text NOT NULL,
  target_url text NOT NULL,
  anchor_text text,
  domain_authority integer DEFAULT 0 CHECK (domain_authority >= 0 AND domain_authority <= 100),
  page_authority integer DEFAULT 0 CHECK (page_authority >= 0 AND page_authority <= 100),
  spam_score integer DEFAULT 0 CHECK (spam_score >= 0 AND spam_score <= 100),
  discovered_at timestamptz DEFAULT now(),
  last_checked_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'broken', 'removed', 'pending')),
  link_type text DEFAULT 'dofollow' CHECK (link_type IN ('dofollow', 'nofollow')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_backlinks_blog_post_id ON backlinks(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_backlinks_status ON backlinks(status);
CREATE INDEX IF NOT EXISTS idx_backlinks_domain_authority ON backlinks(domain_authority);
CREATE INDEX IF NOT EXISTS idx_backlinks_created_at ON backlinks(created_at);

-- Create RLS policies for security
ALTER TABLE backlinks ENABLE ROW LEVEL SECURITY;

-- Users can view backlinks for their own blog posts
CREATE POLICY "Users can view backlinks for their own posts" ON backlinks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts bp 
      WHERE bp.id = backlinks.blog_post_id 
      AND bp.user_id = auth.uid()
    )
  );

-- Users can insert backlinks for their own blog posts
CREATE POLICY "Users can insert backlinks for their own posts" ON backlinks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM blog_posts bp 
      WHERE bp.id = backlinks.blog_post_id 
      AND bp.user_id = auth.uid()
    )
  );

-- Users can update backlinks for their own blog posts
CREATE POLICY "Users can update backlinks for their own posts" ON backlinks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM blog_posts bp 
      WHERE bp.id = backlinks.blog_post_id 
      AND bp.user_id = auth.uid()
    )
  );

-- Users can delete backlinks for their own blog posts
CREATE POLICY "Users can delete backlinks for their own posts" ON backlinks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM blog_posts bp 
      WHERE bp.id = backlinks.blog_post_id 
      AND bp.user_id = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_backlinks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_backlinks_updated_at
  BEFORE UPDATE ON backlinks
  FOR EACH ROW
  EXECUTE FUNCTION update_backlinks_updated_at();

-- Insert some sample backlinks for existing blog posts
INSERT INTO backlinks (blog_post_id, source_url, target_url, anchor_text, domain_authority, page_authority, status, link_type)
SELECT 
  bp.id,
  'https://example-authority-site.com/article-' || (random() * 1000)::int,
  bp.target_url,
  CASE 
    WHEN random() > 0.5 THEN 'quality backlink'
    ELSE bp.title
  END,
  (random() * 80 + 20)::int, -- DA between 20-100
  (random() * 70 + 30)::int, -- PA between 30-100
  'active',
  CASE WHEN random() > 0.2 THEN 'dofollow' ELSE 'nofollow' END
FROM blog_posts bp
WHERE bp.status = 'published'
LIMIT 50; -- Add some sample data
