-- Create missing functions for the blog_posts table

-- Function to generate unique slugs
CREATE OR REPLACE FUNCTION generate_unique_slug(base_slug TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    unique_slug TEXT;
    counter INTEGER := 0;
    slug_exists BOOLEAN := TRUE;
BEGIN
    unique_slug := base_slug;
    
    -- Keep trying until we find a unique slug
    WHILE slug_exists LOOP
        -- Check if the current slug exists
        SELECT EXISTS(SELECT 1 FROM blog_posts WHERE slug = unique_slug) INTO slug_exists;
        
        IF slug_exists THEN
            counter := counter + 1;
            unique_slug := base_slug || '-' || counter;
        END IF;
    END LOOP;
    
    RETURN unique_slug;
END;
$$;

-- Function to increment view count for blog posts
CREATE OR REPLACE FUNCTION increment_blog_post_views(post_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE blog_posts 
    SET view_count = view_count + 1 
    WHERE slug = post_slug AND status = 'published';
END;
$$;

-- Function to cleanup expired trial posts
CREATE OR REPLACE FUNCTION cleanup_expired_posts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM blog_posts 
    WHERE is_trial_post = true 
      AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Function to get blog post by slug
CREATE OR REPLACE FUNCTION get_blog_post_by_slug(post_slug TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    slug TEXT,
    content TEXT,
    excerpt TEXT,
    meta_description TEXT,
    keywords TEXT[],
    tags TEXT[],
    category TEXT,
    target_url TEXT,
    anchor_text TEXT,
    published_url TEXT,
    status TEXT,
    is_trial_post BOOLEAN,
    expires_at TIMESTAMPTZ,
    view_count INTEGER,
    seo_score NUMERIC,
    reading_time INTEGER,
    word_count INTEGER,
    featured_image TEXT,
    author_name TEXT,
    author_avatar TEXT,
    contextual_links JSON,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.id,
        bp.user_id,
        bp.title,
        bp.slug,
        bp.content,
        bp.excerpt,
        bp.meta_description,
        bp.keywords,
        bp.tags,
        bp.category,
        bp.target_url,
        bp.anchor_text,
        bp.published_url,
        bp.status,
        bp.is_trial_post,
        bp.expires_at,
        bp.view_count,
        bp.seo_score,
        bp.reading_time,
        bp.word_count,
        bp.featured_image,
        bp.author_name,
        bp.author_avatar,
        bp.contextual_links,
        bp.created_at,
        bp.updated_at,
        bp.published_at
    FROM blog_posts bp
    WHERE bp.slug = post_slug AND bp.status = 'published';
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION generate_unique_slug(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_blog_post_views(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_posts() TO authenticated;
GRANT EXECUTE ON FUNCTION get_blog_post_by_slug(TEXT) TO anon, authenticated;
