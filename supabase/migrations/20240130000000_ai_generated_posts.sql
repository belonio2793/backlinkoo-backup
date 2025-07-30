-- Create table for AI-generated blog posts
CREATE TABLE IF NOT EXISTS ai_generated_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    published_url TEXT NOT NULL,
    meta_description TEXT,
    keywords TEXT[] DEFAULT '{}',
    word_count INTEGER NOT NULL DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_posts_user_id ON ai_generated_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_posts_session_id ON ai_generated_posts(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_posts_expires_at ON ai_generated_posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_posts_is_claimed ON ai_generated_posts(is_claimed);
CREATE INDEX IF NOT EXISTS idx_ai_posts_created_at ON ai_generated_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_posts_slug ON ai_generated_posts(slug);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_ai_posts_updated_at 
    BEFORE UPDATE ON ai_generated_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE ai_generated_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own posts" ON ai_generated_posts
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own posts" ON ai_generated_posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow insert for authenticated and anonymous users" ON ai_generated_posts
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (auth.uid() IS NULL AND user_id IS NULL)
    );

-- Admin can see all posts
CREATE POLICY "Admins can view all posts" ON ai_generated_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create function to auto-delete expired posts
CREATE OR REPLACE FUNCTION cleanup_expired_ai_posts()
RETURNS void AS $$
BEGIN
    DELETE FROM ai_generated_posts 
    WHERE is_claimed = FALSE 
    AND expires_at < timezone('utc'::text, now());
    
    -- Log the cleanup
    INSERT INTO admin_logs (action, details, created_at)
    VALUES (
        'auto_cleanup', 
        'Cleaned up expired AI-generated posts', 
        timezone('utc'::text, now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run cleanup (if pg_cron extension is available)
-- SELECT cron.schedule('cleanup-expired-ai-posts', '0 */6 * * *', 'SELECT cleanup_expired_ai_posts();');

-- Grant necessary permissions
GRANT ALL ON ai_generated_posts TO authenticated;
GRANT ALL ON ai_generated_posts TO anon;
