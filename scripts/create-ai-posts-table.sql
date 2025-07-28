-- Create table for AI generated blog posts
CREATE TABLE IF NOT EXISTS ai_generated_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    anchor_text VARCHAR(255),
    target_url TEXT,
    ai_provider VARCHAR(50) NOT NULL,
    prompt_index INTEGER,
    word_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    auto_delete_at TIMESTAMP WITH TIME ZONE,
    is_claimed BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claimed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for performance
    INDEX idx_ai_posts_slug (slug),
    INDEX idx_ai_posts_status (status),
    INDEX idx_ai_posts_auto_delete (auto_delete_at),
    INDEX idx_ai_posts_user (user_id),
    INDEX idx_ai_posts_created (created_at)
);

-- Enable RLS (Row Level Security)
ALTER TABLE ai_generated_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published posts
CREATE POLICY "Anyone can read published posts" ON ai_generated_posts
    FOR SELECT USING (status = 'published');

-- Policy: Users can claim unclaimed posts
CREATE POLICY "Users can claim unclaimed posts" ON ai_generated_posts
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        is_claimed = FALSE AND 
        auto_delete_at > NOW()
    );

-- Policy: Users can view their own claimed posts
CREATE POLICY "Users can view their own posts" ON ai_generated_posts
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all posts" ON ai_generated_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Function to auto-delete expired posts
CREATE OR REPLACE FUNCTION cleanup_expired_ai_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM ai_generated_posts 
    WHERE auto_delete_at < NOW() 
    AND is_claimed = FALSE;
    
    -- Log cleanup
    INSERT INTO system_logs (event_type, message, created_at)
    VALUES ('ai_post_cleanup', 'Auto-deleted expired unclaimed AI posts', NOW());
END;
$$;

-- Create a cron job to run cleanup daily (if pg_cron is available)
-- SELECT cron.schedule('cleanup-ai-posts', '0 2 * * *', 'SELECT cleanup_expired_ai_posts();');

-- Update function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_posts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger to auto-update the updated_at column
CREATE TRIGGER ai_posts_updated_at
    BEFORE UPDATE ON ai_generated_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_posts_updated_at();

-- Create system_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
