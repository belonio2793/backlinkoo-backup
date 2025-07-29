-- Create SEO subscriptions table
CREATE TABLE IF NOT EXISTS seo_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    plan TEXT NOT NULL DEFAULT 'no_hands_seo',
    amount INTEGER NOT NULL DEFAULT 2900, -- $29.00 in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Backlink ∞ Automation Link Building (beta) projects table
CREATE TABLE IF NOT EXISTS no_hands_seo_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_url TEXT NOT NULL,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    blogs_found INTEGER DEFAULT 0,
    successful_posts INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_run TIMESTAMPTZ
);

-- Create blog posts table for tracking successful posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES no_hands_seo_projects(id) ON DELETE CASCADE,
    blog_url TEXT NOT NULL,
    post_url TEXT,
    keyword TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed')),
    name_used TEXT,
    website_field TEXT,
    email_used TEXT,
    comment_content TEXT,
    error_message TEXT,
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scraped blogs table for discovered blogs
CREATE TABLE IF NOT EXISTS scraped_blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES no_hands_seo_projects(id) ON DELETE CASCADE,
    blog_url TEXT NOT NULL,
    domain TEXT NOT NULL,
    page_title TEXT,
    allows_comments BOOLEAN DEFAULT FALSE,
    has_name_field BOOLEAN DEFAULT FALSE,
    has_website_field BOOLEAN DEFAULT FALSE,
    has_email_field BOOLEAN DEFAULT FALSE,
    domain_authority INTEGER,
    page_authority INTEGER,
    last_checked TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'found' CHECK (status IN ('found', 'attempted', 'posted', 'failed', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seo_subscriptions_user_id ON seo_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_subscriptions_status ON seo_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_no_hands_seo_projects_user_id ON no_hands_seo_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_no_hands_seo_projects_status ON no_hands_seo_projects(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_user_id ON blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_project_id ON blog_posts(project_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_scraped_blogs_user_id ON scraped_blogs(user_id);
CREATE INDEX IF NOT EXISTS idx_scraped_blogs_project_id ON scraped_blogs(project_id);
CREATE INDEX IF NOT EXISTS idx_scraped_blogs_domain ON scraped_blogs(domain);

-- Enable RLS (Row Level Security)
ALTER TABLE seo_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE no_hands_seo_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_blogs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seo_subscriptions
CREATE POLICY "Users can view own subscriptions" ON seo_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON seo_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON seo_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for no_hands_seo_projects
CREATE POLICY "Users can view own projects" ON no_hands_seo_projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON no_hands_seo_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON no_hands_seo_projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON no_hands_seo_projects
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for blog_posts
CREATE POLICY "Users can view own blog posts" ON blog_posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blog posts" ON blog_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blog posts" ON blog_posts
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for scraped_blogs
CREATE POLICY "Users can view own scraped blogs" ON scraped_blogs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scraped blogs" ON scraped_blogs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scraped blogs" ON scraped_blogs
    FOR UPDATE USING (auth.uid() = user_id);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_seo_subscriptions_updated_at 
    BEFORE UPDATE ON seo_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_no_hands_seo_projects_updated_at 
    BEFORE UPDATE ON no_hands_seo_projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
