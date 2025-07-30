-- Create blog_posts table for Builder.io AI blog management
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT NOT NULL,
  keywords TEXT[],
  meta_description TEXT,
  published_url TEXT,
  word_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_trial_post BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'unclaimed' CHECK (status IN ('unclaimed', 'claimed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  claimed_by UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_trial ON blog_posts(is_trial_post);
CREATE INDEX IF NOT EXISTS idx_blog_posts_expires ON blog_posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_user ON blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

-- Enable Row Level Security (RLS)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public can read trial posts" ON blog_posts
  FOR SELECT USING (is_trial_post = true);

CREATE POLICY "Users can manage their own posts" ON blog_posts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all posts" ON blog_posts
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      'admin@backlinkoo.com',
      'support@backlinkoo.com'
    )
  );

-- Insert a test record (optional)
INSERT INTO blog_posts (
  title,
  slug,
  content,
  target_url,
  anchor_text,
  meta_description,
  published_url,
  word_count,
  is_trial_post,
  status
) VALUES (
  'Test Blog Post',
  'test-blog-post',
  '<h1>Test Blog Post</h1><p>This is a test blog post created during table setup.</p>',
  'https://example.com',
  'example link',
  'This is a test blog post for the Builder.io AI system.',
  '/blog/test-blog-post',
  50,
  true,
  'unclaimed'
) ON CONFLICT (slug) DO NOTHING;

-- Verify table creation
SELECT 'Table created successfully!' as status;
SELECT COUNT(*) as record_count FROM blog_posts;
