-- Create published blog posts table for the free backlink feature
CREATE TABLE IF NOT EXISTS published_blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    excerpt TEXT,
    keywords TEXT[] DEFAULT '{}',
    target_url TEXT NOT NULL,
    published_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    is_trial_post BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0,
    seo_score INTEGER DEFAULT 0,
    contextual_links JSONB DEFAULT '[]',
    reading_time INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    featured_image TEXT,
    author_name TEXT DEFAULT 'Backlinkoo Team',
    author_avatar TEXT,
    tags TEXT[] DEFAULT '{}',
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_published_blog_posts_user_id ON published_blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_published_blog_posts_slug ON published_blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_published_blog_posts_status ON published_blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_published_blog_posts_published_at ON published_blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_published_blog_posts_target_url ON published_blog_posts(target_url);
CREATE INDEX IF NOT EXISTS idx_published_blog_posts_trial ON published_blog_posts(is_trial_post, expires_at);

-- Enable RLS (Row Level Security)
ALTER TABLE published_blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public read access to published posts
CREATE POLICY "Anyone can view published blog posts" ON published_blog_posts
    FOR SELECT USING (status = 'published');

-- Users can view their own posts regardless of status
CREATE POLICY "Users can view own blog posts" ON published_blog_posts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own posts
CREATE POLICY "Users can insert own blog posts" ON published_blog_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own blog posts" ON published_blog_posts
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own blog posts" ON published_blog_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_published_blog_posts_updated_at 
    BEFORE UPDATE ON published_blog_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_blog_post_views(post_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE published_blog_posts 
    SET view_count = view_count + 1 
    WHERE slug = post_slug AND status = 'published';
END;
$$;

-- Create function to get blog post by slug
CREATE OR REPLACE FUNCTION get_blog_post_by_slug(post_slug TEXT)
RETURNS TABLE (
    id UUID,
    slug TEXT,
    title TEXT,
    content TEXT,
    meta_description TEXT,
    excerpt TEXT,
    keywords TEXT[],
    target_url TEXT,
    published_url TEXT,
    status TEXT,
    view_count INTEGER,
    seo_score INTEGER,
    contextual_links JSONB,
    reading_time INTEGER,
    word_count INTEGER,
    featured_image TEXT,
    author_name TEXT,
    author_avatar TEXT,
    tags TEXT[],
    category TEXT,
    created_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.id,
        bp.slug,
        bp.title,
        bp.content,
        bp.meta_description,
        bp.excerpt,
        bp.keywords,
        bp.target_url,
        bp.published_url,
        bp.status,
        bp.view_count,
        bp.seo_score,
        bp.contextual_links,
        bp.reading_time,
        bp.word_count,
        bp.featured_image,
        bp.author_name,
        bp.author_avatar,
        bp.tags,
        bp.category,
        bp.created_at,
        bp.published_at
    FROM published_blog_posts bp
    WHERE bp.slug = post_slug AND bp.status = 'published';
END;
$$;
