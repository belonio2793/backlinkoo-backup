-- Create unified blog posts table that consolidates all blog post types
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_url TEXT NOT NULL,
  keywords TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'saved', 'published')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Only for draft posts
  word_count INTEGER NOT NULL DEFAULT 0,
  is_guest BOOLEAN NOT NULL DEFAULT false,
  
  -- Indexes for performance
  INDEX idx_blog_posts_user_id (user_id),
  INDEX idx_blog_posts_status (status),
  INDEX idx_blog_posts_expires_at (expires_at),
  INDEX idx_blog_posts_created_at (created_at)
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see their own posts
CREATE POLICY "Users can view own posts" ON blog_posts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own posts
CREATE POLICY "Users can insert own posts" ON blog_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON blog_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON blog_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Guest posts (where user_id is null) can be accessed by anyone
CREATE POLICY "Anyone can view guest posts" ON blog_posts
  FOR SELECT USING (user_id IS NULL);

CREATE POLICY "Anyone can insert guest posts" ON blog_posts
  FOR INSERT WITH CHECK (user_id IS NULL);

CREATE POLICY "Anyone can update guest posts" ON blog_posts
  FOR UPDATE USING (user_id IS NULL);

CREATE POLICY "Anyone can delete guest posts" ON blog_posts
  FOR DELETE USING (user_id IS NULL);

-- Function to cleanup expired drafts (called by scheduled function)
CREATE OR REPLACE FUNCTION cleanup_expired_blog_drafts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM blog_posts 
  WHERE status = 'draft' 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to enforce user post limits
CREATE OR REPLACE FUNCTION check_user_post_limit()
RETURNS TRIGGER AS $$
DECLARE
  post_count INTEGER;
BEGIN
  -- Only check limit for saved posts with a user_id
  IF NEW.status = 'saved' AND NEW.user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO post_count
    FROM blog_posts
    WHERE user_id = NEW.user_id AND status = 'saved';
    
    IF post_count >= 5 THEN
      RAISE EXCEPTION 'User cannot have more than 5 saved posts';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_user_post_limit
  BEFORE INSERT OR UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION check_user_post_limit();

-- Migration: Move existing data if tables exist
-- This handles existing ai_posts, published_blogs, or other blog tables
DO $$
BEGIN
  -- Check if ai_posts table exists and migrate data
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_posts') THEN
    INSERT INTO blog_posts (
      id, title, content, target_url, keywords, status, user_id, 
      created_at, expires_at, word_count, is_guest
    )
    SELECT 
      id,
      COALESCE(title, 'Untitled Post'),
      content,
      COALESCE(target_url, ''),
      COALESCE(keywords, ''),
      CASE 
        WHEN is_trial_post = true THEN 'draft'
        ELSE 'saved'
      END,
      user_id,
      created_at,
      CASE 
        WHEN is_trial_post = true THEN created_at + INTERVAL '24 hours'
        ELSE NULL
      END,
      COALESCE(word_count, 0),
      (user_id IS NULL)
    FROM ai_posts
    WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE blog_posts.id = ai_posts.id);
  END IF;

  -- Check if published_blogs table exists and migrate data  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'published_blogs') THEN
    INSERT INTO blog_posts (
      id, title, content, target_url, keywords, status, user_id,
      created_at, word_count, is_guest
    )
    SELECT 
      'pb_' || id::text,
      title,
      content,
      target_url,
      keywords,
      'published',
      user_id,
      created_at,
      COALESCE(word_count, 0),
      (user_id IS NULL)
    FROM published_blogs
    WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE blog_posts.id = 'pb_' || published_blogs.id::text);
  END IF;
END $$;
