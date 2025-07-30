-- Create blog_posts table for managing user-generated blog content
CREATE TABLE blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    meta_description TEXT,
    keywords TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    category TEXT DEFAULT 'General',
    target_url TEXT NOT NULL,
    anchor_text TEXT,
    published_url TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_trial_post BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0,
    seo_score INTEGER DEFAULT 0,
    reading_time INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    featured_image TEXT,
    author_name TEXT DEFAULT 'AI Generator',
    author_avatar TEXT,
    contextual_links JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX idx_blog_posts_user_id ON blog_posts(user_id);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX idx_blog_posts_is_trial_post ON blog_posts(is_trial_post);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_blog_post_views(post_slug TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE blog_posts 
    SET view_count = view_count + 1 
    WHERE slug = post_slug AND status = 'published';
END;
$$ LANGUAGE plpgsql;

-- Create function to generate unique slug
CREATE OR REPLACE FUNCTION generate_unique_slug(base_slug TEXT)
RETURNS TEXT AS $$
DECLARE
    unique_slug TEXT;
    counter INTEGER := 0;
BEGIN
    unique_slug := base_slug;
    
    -- Check if slug exists and increment counter until unique
    WHILE EXISTS (SELECT 1 FROM blog_posts WHERE slug = unique_slug) LOOP
        counter := counter + 1;
        unique_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN unique_slug;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Users can view published posts
CREATE POLICY "Published blog posts are viewable by everyone" ON blog_posts
    FOR SELECT USING (status = 'published');

-- Users can view their own posts regardless of status
CREATE POLICY "Users can view their own blog posts" ON blog_posts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own posts
CREATE POLICY "Users can create their own blog posts" ON blog_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update their own blog posts" ON blog_posts
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own blog posts" ON blog_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Admin users can do everything
CREATE POLICY "Admins can manage all blog posts" ON blog_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );
