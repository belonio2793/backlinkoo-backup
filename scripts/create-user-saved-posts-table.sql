-- Create user_saved_posts table for dashboard functionality
-- This table tracks which blog posts users have saved to their dashboard

CREATE TABLE IF NOT EXISTS user_saved_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can't save the same post multiple times
    UNIQUE(user_id, post_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_saved_posts_user_id ON user_saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_posts_post_id ON user_saved_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_posts_saved_at ON user_saved_posts(saved_at);

-- Enable Row Level Security
ALTER TABLE user_saved_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own saved posts" ON user_saved_posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts to their dashboard" ON user_saved_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own saved posts" ON user_saved_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Create admin policy for full access
CREATE POLICY "Admins can manage all saved posts" ON user_saved_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

COMMENT ON TABLE user_saved_posts IS 'Tracks blog posts saved to user dashboards';
COMMENT ON COLUMN user_saved_posts.user_id IS 'Reference to the user who saved the post';
COMMENT ON COLUMN user_saved_posts.post_id IS 'Reference to the saved blog post';
COMMENT ON COLUMN user_saved_posts.saved_at IS 'When the post was saved to dashboard';
