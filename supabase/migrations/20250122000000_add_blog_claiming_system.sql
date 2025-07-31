-- Add claiming fields to existing published_blog_posts table
ALTER TABLE published_blog_posts 
ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS anchor_text TEXT;

-- Add indexes for claiming functionality
CREATE INDEX IF NOT EXISTS idx_published_blog_posts_claimed ON published_blog_posts(is_claimed, claimed_by);
CREATE INDEX IF NOT EXISTS idx_published_blog_posts_expiration ON published_blog_posts(is_claimed, expires_at);

-- Create user_claimed_posts tracking table
CREATE TABLE IF NOT EXISTS user_claimed_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    blog_id UUID REFERENCES published_blog_posts(id) ON DELETE CASCADE NOT NULL,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, blog_id)
);

CREATE INDEX IF NOT EXISTS idx_user_claimed_posts_user_id ON user_claimed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_claimed_posts_blog_id ON user_claimed_posts(blog_id);

-- Enable RLS on user_claimed_posts
ALTER TABLE user_claimed_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_claimed_posts
CREATE POLICY "Users can view own claimed posts" ON user_claimed_posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own claimed posts" ON user_claimed_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own claimed posts" ON user_claimed_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Update RLS policies for claimed posts
CREATE POLICY "Anyone can view claimed blog posts" ON published_blog_posts
    FOR SELECT USING (status = 'published' AND is_claimed = true);

-- Function to claim a blog post
CREATE OR REPLACE FUNCTION claim_blog_post(post_id UUID, user_id UUID)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    claimed_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_claimed_count INTEGER;
    post_exists BOOLEAN;
    already_claimed BOOLEAN;
BEGIN
    -- Check if user has reached claim limit (3 posts)
    SELECT COUNT(*) INTO current_claimed_count 
    FROM user_claimed_posts 
    WHERE user_claimed_posts.user_id = claim_blog_post.user_id;
    
    IF current_claimed_count >= 3 THEN
        RETURN QUERY SELECT false, 'You have reached the maximum limit of 3 claimed posts. Subscribe to Pro plan for unlimited posts.', current_claimed_count;
        RETURN;
    END IF;
    
    -- Check if post exists and is not already claimed
    SELECT EXISTS(
        SELECT 1 FROM published_blog_posts 
        WHERE id = post_id AND status = 'published' AND is_claimed = false
    ) INTO post_exists;
    
    IF NOT post_exists THEN
        RETURN QUERY SELECT false, 'Post not found or already claimed.', current_claimed_count;
        RETURN;
    END IF;
    
    -- Claim the post
    UPDATE published_blog_posts 
    SET 
        is_claimed = true,
        claimed_by = user_id,
        claimed_at = NOW(),
        expires_at = NULL -- Remove expiration for claimed posts
    WHERE id = post_id;
    
    -- Add to user_claimed_posts tracking table
    INSERT INTO user_claimed_posts (user_id, blog_id)
    VALUES (user_id, post_id);
    
    -- Update count
    current_claimed_count := current_claimed_count + 1;
    
    RETURN QUERY SELECT true, 'Blog post claimed successfully!', current_claimed_count;
END;
$$;

-- Function to get user's claimed posts count
CREATE OR REPLACE FUNCTION get_user_claimed_count(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    claimed_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO claimed_count
    FROM user_claimed_posts 
    WHERE user_claimed_posts.user_id = get_user_claimed_count.user_id;
    
    RETURN claimed_count;
END;
$$;

-- Function to clean up expired unclaimed posts (24 hours)
CREATE OR REPLACE FUNCTION cleanup_expired_posts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete unclaimed posts older than 24 hours
    DELETE FROM published_blog_posts 
    WHERE 
        is_claimed = false 
        AND expires_at IS NOT NULL 
        AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Function to get claimable posts with expiration logic
CREATE OR REPLACE FUNCTION get_claimable_posts(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    slug TEXT,
    title TEXT,
    excerpt TEXT,
    content TEXT,
    anchor_text TEXT,
    target_url TEXT,
    published_url TEXT,
    is_claimed BOOLEAN,
    claimed_by UUID,
    claimed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    view_count INTEGER,
    seo_score INTEGER,
    reading_time INTEGER,
    word_count INTEGER,
    author_name TEXT,
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
        bp.excerpt,
        bp.content,
        bp.anchor_text,
        bp.target_url,
        bp.published_url,
        bp.is_claimed,
        bp.claimed_by,
        bp.claimed_at,
        bp.expires_at,
        bp.view_count,
        bp.seo_score,
        bp.reading_time,
        bp.word_count,
        bp.author_name,
        bp.tags,
        bp.category,
        bp.created_at,
        bp.published_at
    FROM published_blog_posts bp
    WHERE 
        bp.status = 'published' 
        AND (
            bp.is_claimed = true 
            OR (bp.is_claimed = false AND (bp.expires_at IS NULL OR bp.expires_at > NOW()))
        )
    ORDER BY bp.published_at DESC
    LIMIT limit_count;
END;
$$;
