-- Create ai_generated_posts table for managing AI content generation
CREATE TABLE IF NOT EXISTS public.ai_generated_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    keyword TEXT NOT NULL,
    anchor_text TEXT NOT NULL,
    target_url TEXT NOT NULL,
    word_count INTEGER NOT NULL DEFAULT 0,
    provider TEXT NOT NULL CHECK (provider IN ('huggingface', 'cohere', 'openai', 'grok')),
    generation_time INTEGER NOT NULL DEFAULT 0, -- milliseconds
    seo_score INTEGER NOT NULL DEFAULT 0 CHECK (seo_score >= 0 AND seo_score <= 100),
    reading_time INTEGER NOT NULL DEFAULT 0, -- minutes
    keyword_density DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    claimed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'claimed', 'expired', 'deleted')),
    generated_by_account UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_generated_posts_slug ON public.ai_generated_posts(slug);
CREATE INDEX IF NOT EXISTS idx_ai_generated_posts_status ON public.ai_generated_posts(status);
CREATE INDEX IF NOT EXISTS idx_ai_generated_posts_created_at ON public.ai_generated_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generated_posts_expires_at ON public.ai_generated_posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_generated_posts_claimed_by ON public.ai_generated_posts(claimed_by);
CREATE INDEX IF NOT EXISTS idx_ai_generated_posts_generated_by ON public.ai_generated_posts(generated_by_account);
CREATE INDEX IF NOT EXISTS idx_ai_generated_posts_provider ON public.ai_generated_posts(provider);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_generated_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_ai_generated_posts_updated_at_trigger
    BEFORE UPDATE ON public.ai_generated_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_generated_posts_updated_at();

-- Enable Row Level Security
ALTER TABLE public.ai_generated_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public can read published posts
CREATE POLICY "Anyone can view published posts" ON public.ai_generated_posts
    FOR SELECT USING (status = 'published');

-- Users can claim posts
CREATE POLICY "Users can claim posts" ON public.ai_generated_posts
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND status = 'published' 
        AND expires_at > NOW()
        AND claimed_by IS NULL
    ) WITH CHECK (
        claimed_by = auth.uid()
        AND status = 'claimed'
    );

-- Users can view their own claimed posts
CREATE POLICY "Users can view their claimed posts" ON public.ai_generated_posts
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND claimed_by = auth.uid()
    );

-- Admin access (service role or admin users)
CREATE POLICY "Service role has full access" ON public.ai_generated_posts
    FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically expire posts
CREATE OR REPLACE FUNCTION expire_ai_generated_posts()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE public.ai_generated_posts 
    SET status = 'expired'
    WHERE status = 'published' 
    AND expires_at <= NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check user generation limit
CREATE OR REPLACE FUNCTION check_user_generation_limit(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.ai_generated_posts 
        WHERE generated_by_account = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_generated_posts TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_generation_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_ai_generated_posts() TO service_role;

-- Insert some example data for testing (optional)
INSERT INTO public.ai_generated_posts (
    title, 
    slug, 
    content, 
    keyword, 
    anchor_text, 
    target_url, 
    word_count, 
    provider, 
    generation_time, 
    seo_score, 
    reading_time, 
    keyword_density,
    expires_at,
    status
) VALUES (
    'The Ultimate Guide to Digital Marketing in 2024',
    'ultimate-guide-digital-marketing-2024-' || extract(epoch from now())::text,
    '<h1>The Ultimate Guide to Digital Marketing in 2024</h1><p>Digital marketing has evolved significantly over the past few years...</p><p>One of the most effective strategies is using <a href="https://example.com/marketing-tools">professional marketing tools</a> to streamline your campaigns.</p>',
    'digital marketing',
    'professional marketing tools',
    'https://example.com/marketing-tools',
    1000,
    'huggingface',
    2500,
    85,
    5,
    2.5,
    NOW() + INTERVAL '24 hours',
    'published'
) ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE public.ai_generated_posts IS 'Stores AI-generated blog posts with automatic expiration and claim functionality';
COMMENT ON COLUMN public.ai_generated_posts.expires_at IS 'Posts automatically expire 24 hours after creation unless claimed';
COMMENT ON COLUMN public.ai_generated_posts.claimed_by IS 'User who claimed this post to prevent deletion';
COMMENT ON COLUMN public.ai_generated_posts.generated_by_account IS 'User account that generated this post (for one-per-account limit)';
COMMENT ON COLUMN public.ai_generated_posts.status IS 'Post lifecycle: published -> claimed/expired -> deleted';
