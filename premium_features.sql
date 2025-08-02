-- Premium Features Database Schema
-- Tables required for Premium Plan and SEO Academy functionality

-- 1. Premium Subscriptions Table
-- Tracks user premium subscriptions and billing cycles
CREATE TABLE IF NOT EXISTS premium_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL DEFAULT 'premium' CHECK (plan_type IN ('premium')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    stripe_subscription_id TEXT UNIQUE, -- For Stripe integration
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_id ON premium_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status ON premium_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_period ON premium_subscriptions(current_period_start, current_period_end);

-- 2. SEO Course Modules Table
-- Defines the structure of the SEO Academy course
CREATE TABLE IF NOT EXISTS seo_course_modules (
    id TEXT PRIMARY KEY, -- e.g., 'fundamentals', 'keyword-research'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL, -- Lucide icon name
    estimated_time TEXT NOT NULL, -- e.g., '8 hours'
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default course modules
INSERT INTO seo_course_modules (id, title, description, icon_name, estimated_time, sort_order) VALUES
('fundamentals', 'SEO Fundamentals', 'Master the basics of search engine optimization', 'Search', '8 hours', 1),
('keyword-research', 'Keyword Research Mastery', 'Find and target the right keywords for your business', 'Target', '12 hours', 2),
('on-page-seo', 'On-Page SEO', 'Optimize your content and website structure', 'BookOpen', '15 hours', 3),
('technical-seo', 'Technical SEO', 'Optimize your website''s technical foundation', 'BarChart3', '18 hours', 4),
('link-building', 'Link Building Strategies', 'Build high-quality backlinks that boost rankings', 'Link', '20 hours', 5),
('analytics', 'SEO Analytics & Reporting', 'Measure and improve your SEO performance', 'TrendingUp', '10 hours', 6)
ON CONFLICT (id) DO NOTHING;

-- 3. SEO Course Lessons Table
-- Individual lessons within each module
CREATE TABLE IF NOT EXISTS seo_course_lessons (
    id TEXT PRIMARY KEY, -- e.g., 'seo-intro', 'keyword-basics'
    module_id TEXT NOT NULL REFERENCES seo_course_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration TEXT NOT NULL, -- e.g., '15 min'
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    video_url TEXT, -- YouTube or Vimeo URL
    content TEXT, -- Lesson content in markdown
    resources JSONB DEFAULT '[]', -- Array of resource links/names
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_seo_lessons_module_id ON seo_course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_seo_lessons_sort_order ON seo_course_lessons(sort_order);

-- Insert sample lessons for fundamentals module
INSERT INTO seo_course_lessons (id, module_id, title, description, duration, difficulty, resources, sort_order) VALUES
('seo-intro', 'fundamentals', 'What is SEO and Why It Matters', 'Understanding search engines and organic traffic', '15 min', 'Beginner', '["SEO Glossary", "Search Engine Guide"]', 1),
('search-engines', 'fundamentals', 'How Search Engines Work', 'Crawling, indexing, and ranking explained', '20 min', 'Beginner', '["Google Algorithm Overview", "Crawler Documentation"]', 2),
('ranking-factors', 'fundamentals', 'Top 200 Ranking Factors', 'Complete breakdown of what affects rankings', '45 min', 'Intermediate', '["Ranking Factors Checklist", "Google Guidelines"]', 3),
('seo-tools', 'fundamentals', 'Essential SEO Tools', 'Free and paid tools for SEO success', '30 min', 'Beginner', '["Tools Comparison Chart", "Setup Guides"]', 4),
('keyword-basics', 'keyword-research', 'Keyword Research Fundamentals', 'Understanding search intent and keyword types', '25 min', 'Beginner', '[]', 1),
('keyword-tools', 'keyword-research', 'Keyword Research Tools', 'Master Google Keyword Planner, Ahrefs, and more', '40 min', 'Intermediate', '[]', 2),
('title-tags', 'on-page-seo', 'Writing Perfect Title Tags', 'Craft compelling titles that rank and convert', '30 min', 'Beginner', '[]', 1),
('meta-descriptions', 'on-page-seo', 'Meta Descriptions That Convert', 'Write descriptions that improve click-through rates', '25 min', 'Beginner', '[]', 2)
ON CONFLICT (id) DO NOTHING;

-- 4. User Progress Table
-- Tracks individual user progress through lessons
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL REFERENCES seo_course_lessons(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL REFERENCES seo_course_modules(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    time_spent INTEGER DEFAULT 0, -- seconds
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_id ON user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON user_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(completed);

-- 5. User Certificates Table
-- Tracks earned certificates for completed modules
CREATE TABLE IF NOT EXISTS user_certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL REFERENCES seo_course_modules(id) ON DELETE CASCADE,
    certificate_url TEXT NOT NULL, -- URL to generated certificate PDF
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_certificates_user_id ON user_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_certificates_module_id ON user_certificates(module_id);

-- 6. Premium Features Access Log (optional - for analytics)
-- Tracks usage of premium features for analytics
CREATE TABLE IF NOT EXISTS premium_feature_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL, -- e.g., 'seo_academy', 'unlimited_backlinks', 'advanced_analytics'
    action TEXT NOT NULL, -- e.g., 'accessed', 'completed', 'downloaded'
    metadata JSONB DEFAULT '{}', -- Additional data about the action
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_premium_usage_user_id ON premium_feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_usage_feature ON premium_feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_premium_usage_created_at ON premium_feature_usage(created_at);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_feature_usage ENABLE ROW LEVEL SECURITY;

-- Policies for premium_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON premium_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON premium_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for user_progress
CREATE POLICY "Users can view their own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON user_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for user_certificates
CREATE POLICY "Users can view their own certificates" ON user_certificates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certificates" ON user_certificates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for premium_feature_usage
CREATE POLICY "Users can view their own usage" ON premium_feature_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON premium_feature_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Course modules and lessons are public (read-only)
ALTER TABLE seo_course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Course modules are publicly readable" ON seo_course_modules
    FOR SELECT USING (true);

CREATE POLICY "Course lessons are publicly readable" ON seo_course_lessons
    FOR SELECT USING (true);

-- Functions for convenience

-- Function to check if user has active premium subscription
CREATE OR REPLACE FUNCTION is_premium_user(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM premium_subscriptions
        WHERE user_id = user_uuid
        AND status = 'active'
        AND current_period_end > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's course completion percentage
CREATE OR REPLACE FUNCTION get_course_completion_percentage(user_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_lessons FROM seo_course_lessons WHERE is_active = true;
    
    SELECT COUNT(*) INTO completed_lessons 
    FROM user_progress 
    WHERE user_id = user_uuid AND completed = true;
    
    IF total_lessons = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND((completed_lessons::NUMERIC / total_lessons::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically issue certificate when module is completed
CREATE OR REPLACE FUNCTION check_and_issue_certificate()
RETURNS TRIGGER AS $$
DECLARE
    module_lessons_count INTEGER;
    completed_lessons_count INTEGER;
BEGIN
    -- Only proceed if lesson was marked as completed
    IF NEW.completed = true THEN
        -- Count total lessons in the module
        SELECT COUNT(*) INTO module_lessons_count
        FROM seo_course_lessons
        WHERE module_id = NEW.module_id AND is_active = true;
        
        -- Count completed lessons by this user in the module
        SELECT COUNT(*) INTO completed_lessons_count
        FROM user_progress
        WHERE user_id = NEW.user_id 
        AND module_id = NEW.module_id 
        AND completed = true;
        
        -- If all lessons completed, issue certificate
        IF completed_lessons_count >= module_lessons_count THEN
            INSERT INTO user_certificates (user_id, module_id, certificate_url)
            VALUES (
                NEW.user_id,
                NEW.module_id,
                '/api/certificates/' || NEW.user_id || '/' || NEW.module_id
            )
            ON CONFLICT (user_id, module_id) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic certificate issuance
DROP TRIGGER IF EXISTS trigger_check_certificate ON user_progress;
CREATE TRIGGER trigger_check_certificate
    AFTER INSERT OR UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION check_and_issue_certificate();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
DROP TRIGGER IF EXISTS update_premium_subscriptions_updated_at ON premium_subscriptions;
CREATE TRIGGER update_premium_subscriptions_updated_at
    BEFORE UPDATE ON premium_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON seo_course_modules TO anon, authenticated;
GRANT SELECT ON seo_course_lessons TO anon, authenticated;
GRANT ALL ON premium_subscriptions TO authenticated;
GRANT ALL ON user_progress TO authenticated;
GRANT ALL ON user_certificates TO authenticated;
GRANT ALL ON premium_feature_usage TO authenticated;

-- Analytics view for admin dashboard
CREATE OR REPLACE VIEW premium_analytics AS
SELECT 
    COUNT(*) as total_subscriptions,
    COUNT(*) FILTER (WHERE status = 'active' AND current_period_end > NOW()) as active_subscriptions,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_subscriptions,
    COUNT(*) FILTER (WHERE current_period_end < NOW()) as expired_subscriptions,
    ROUND(AVG(EXTRACT(EPOCH FROM (current_period_end - current_period_start)) / 86400), 2) as avg_subscription_days
FROM premium_subscriptions;

-- Course analytics view
CREATE OR REPLACE VIEW course_analytics AS
SELECT 
    m.id as module_id,
    m.title as module_title,
    COUNT(DISTINCT p.user_id) as enrolled_users,
    COUNT(DISTINCT CASE WHEN p.completed THEN p.user_id END) as completed_users,
    COUNT(p.id) as total_progress_records,
    COUNT(CASE WHEN p.completed THEN 1 END) as completed_lessons,
    ROUND(
        COUNT(CASE WHEN p.completed THEN 1 END)::NUMERIC / 
        NULLIF(COUNT(p.id)::NUMERIC, 0) * 100, 2
    ) as completion_rate
FROM seo_course_modules m
LEFT JOIN user_progress p ON m.id = p.module_id
GROUP BY m.id, m.title
ORDER BY m.sort_order;

-- User engagement view
CREATE OR REPLACE VIEW user_engagement AS
SELECT 
    u.id as user_id,
    u.email,
    ps.status as subscription_status,
    COUNT(DISTINCT up.lesson_id) as lessons_started,
    COUNT(DISTINCT CASE WHEN up.completed THEN up.lesson_id END) as lessons_completed,
    COUNT(DISTINCT uc.module_id) as certificates_earned,
    MAX(up.updated_at) as last_activity,
    SUM(up.time_spent) as total_time_spent_seconds
FROM auth.users u
LEFT JOIN premium_subscriptions ps ON u.id = ps.user_id AND ps.status = 'active'
LEFT JOIN user_progress up ON u.id = up.user_id
LEFT JOIN user_certificates uc ON u.id = uc.user_id
GROUP BY u.id, u.email, ps.status
ORDER BY lessons_completed DESC;

COMMENT ON TABLE premium_subscriptions IS 'Tracks user premium subscriptions and billing information';
COMMENT ON TABLE seo_course_modules IS 'Defines the structure and metadata of SEO course modules';
COMMENT ON TABLE seo_course_lessons IS 'Individual lessons within each course module';
COMMENT ON TABLE user_progress IS 'Tracks user progress through individual lessons';
COMMENT ON TABLE user_certificates IS 'Stores earned certificates for completed course modules';
COMMENT ON TABLE premium_feature_usage IS 'Logs usage of premium features for analytics and billing';
