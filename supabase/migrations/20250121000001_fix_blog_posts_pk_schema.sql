-- Fix blog_posts table primary key schema inconsistency
-- This resolves "duplicate key value violates unique constraint blog_posts_pkey" errors

-- First, check if there are any existing records and handle them
DO $$
BEGIN
  -- If the table exists with TEXT id, we need to migrate carefully
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_posts' AND column_name = 'id' AND data_type = 'text'
  ) THEN
    -- Create a backup of existing data if any
    CREATE TABLE IF NOT EXISTS blog_posts_backup_20250121 AS
    SELECT * FROM blog_posts WHERE 1=0; -- Structure only initially
    
    -- Copy any existing data to backup
    INSERT INTO blog_posts_backup_20250121 SELECT * FROM blog_posts;
    
    -- Drop and recreate the table with proper UUID primary key
    DROP TABLE IF EXISTS blog_posts CASCADE;
  END IF;
END $$;

-- Create the blog_posts table with proper UUID primary key and default generation
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  meta_description TEXT,
  slug TEXT UNIQUE NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  keywords TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'saved', 'published')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Only for trial posts
  word_count INTEGER NOT NULL DEFAULT 0,
  is_guest BOOLEAN NOT NULL DEFAULT false,
  is_trial_post BOOLEAN NOT NULL DEFAULT false,
  claimed BOOLEAN NOT NULL DEFAULT false,
  published_url TEXT,
  
  -- Additional fields for enhanced functionality
  tags TEXT[],
  category TEXT,
  seo_score INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  contextual_links JSONB DEFAULT '[]'::jsonb,
  
  -- Performance and analytics
  google_analytics_id TEXT,
  utm_parameters JSONB DEFAULT '{}'::jsonb,
  social_media_meta JSONB DEFAULT '{}'::jsonb,
  
  -- Content management
  approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  content_hash TEXT,
  last_modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_user_id ON blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_expires_at ON blog_posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_trial_post ON blog_posts(is_trial_post);
CREATE INDEX IF NOT EXISTS idx_blog_posts_claimed ON blog_posts(claimed);

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_posts
CREATE POLICY "Users can view published blog posts" ON blog_posts
  FOR SELECT USING (status = 'published' OR user_id = auth.uid());

CREATE POLICY "Users can insert their own blog posts" ON blog_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own blog posts" ON blog_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blog posts" ON blog_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Policy for guest/anonymous blog post creation (trial posts)
CREATE POLICY "Anyone can insert guest blog posts" ON blog_posts
  FOR INSERT WITH CHECK (user_id IS NULL AND is_trial_post = true);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to generate unique slugs
CREATE OR REPLACE FUNCTION ensure_unique_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    counter INTEGER := 1;
    new_slug TEXT;
BEGIN
    -- If slug is not provided, generate one from title
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := regexp_replace(
            lower(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g')),
            '\s+', '-', 'g'
        );
    END IF;
    
    base_slug := NEW.slug;
    new_slug := base_slug;
    
    -- Ensure slug uniqueness
    WHILE EXISTS (SELECT 1 FROM blog_posts WHERE slug = new_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
        new_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    NEW.slug := new_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_unique_slug_trigger
    BEFORE INSERT OR UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION ensure_unique_slug();

-- Grant necessary permissions
GRANT ALL ON blog_posts TO authenticated;
GRANT ALL ON blog_posts TO service_role;

-- Restore data from backup if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_posts_backup_20250121') THEN
    -- Insert backed up data with new UUIDs
    INSERT INTO blog_posts (
      title, content, excerpt, meta_description, slug, target_url, anchor_text,
      keywords, status, user_id, created_at, updated_at, published_at, expires_at,
      word_count, is_guest, is_trial_post, claimed, published_url
    )
    SELECT 
      title, content, excerpt, meta_description, 
      slug || '-migrated-' || extract(epoch from now())::text, -- Ensure unique slug
      target_url, anchor_text, keywords, status, 
      CASE WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
           THEN user_id::uuid 
           ELSE NULL END, -- Only valid UUIDs
      created_at, updated_at, published_at, expires_at,
      word_count, is_guest, is_trial_post, claimed, published_url
    FROM blog_posts_backup_20250121;
    
    -- Drop the backup table after successful migration
    DROP TABLE blog_posts_backup_20250121;
  END IF;
END $$;
