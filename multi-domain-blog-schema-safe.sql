-- Multi-Domain Blog System Schema (Conflict-Free & Safe)
-- This script safely creates a separate blog system for domains, handling existing objects

-- Step 1: Add blog configuration columns to domains table only (safe)
DO $$ 
BEGIN
    -- Add site_url column to domains table for full blog URL generation
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'domains' AND column_name = 'site_url'
    ) THEN
        ALTER TABLE domains 
        ADD COLUMN site_url TEXT;
        
        -- Update existing domains with their site_url
        UPDATE domains 
        SET site_url = 'https://' || domain 
        WHERE site_url IS NULL;
    END IF;
    
    -- Add blog_enabled flag to domains
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'domains' AND column_name = 'blog_enabled'
    ) THEN
        ALTER TABLE domains 
        ADD COLUMN blog_enabled BOOLEAN DEFAULT true;
    END IF;
    
    -- Add blog_subdirectory to domains (e.g., /blog, /news, /articles)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'domains' AND column_name = 'blog_subdirectory'
    ) THEN
        ALTER TABLE domains 
        ADD COLUMN blog_subdirectory TEXT DEFAULT '/blog';
    END IF;
END $$;

-- Step 2: Create separate domain_blog_posts table (completely independent)
CREATE TABLE IF NOT EXISTS domain_blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES domains(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    meta_description TEXT,
    target_url TEXT,
    anchor_text TEXT,
    keywords TEXT[] DEFAULT '{}',
    author_name TEXT DEFAULT 'Blog Author',
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    featured_image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    seo_score INTEGER DEFAULT 0,
    reading_time INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    published_url TEXT,
    is_trial_post BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint safely
DO $$
BEGIN
    -- Check if unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'domain_blog_posts' 
        AND constraint_name = 'domain_blog_posts_domain_id_slug_key'
    ) THEN
        ALTER TABLE domain_blog_posts 
        ADD CONSTRAINT domain_blog_posts_domain_id_slug_key UNIQUE(domain_id, slug);
    END IF;
END $$;

-- Create indexes for domain_blog_posts (safe)
CREATE INDEX IF NOT EXISTS idx_domain_blog_posts_domain_id ON domain_blog_posts(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_blog_posts_user_id ON domain_blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_domain_blog_posts_status ON domain_blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_domain_blog_posts_domain_status ON domain_blog_posts(domain_id, status);
CREATE INDEX IF NOT EXISTS idx_domain_blog_posts_published ON domain_blog_posts(domain_id, published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_domain_blog_posts_slug ON domain_blog_posts(domain_id, slug);

-- Step 3: Create domain_blog_settings table for per-domain blog configuration
CREATE TABLE IF NOT EXISTS domain_blog_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
    blog_title TEXT DEFAULT 'Blog',
    blog_description TEXT DEFAULT 'Latest articles and updates',
    blog_logo_url TEXT,
    theme_primary_color TEXT DEFAULT '#3b82f6',
    theme_secondary_color TEXT DEFAULT '#1e40af',
    posts_per_page INTEGER DEFAULT 10,
    enable_comments BOOLEAN DEFAULT false,
    enable_social_sharing BOOLEAN DEFAULT true,
    enable_rss BOOLEAN DEFAULT true,
    custom_css TEXT,
    custom_header_html TEXT,
    custom_footer_html TEXT,
    meta_tags JSONB DEFAULT '{}',
    navigation_links JSONB DEFAULT '[]',
    social_links JSONB DEFAULT '{}',
    analytics_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for domain_blog_settings safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'domain_blog_settings' 
        AND constraint_name = 'domain_blog_settings_domain_id_key'
    ) THEN
        ALTER TABLE domain_blog_settings 
        ADD CONSTRAINT domain_blog_settings_domain_id_key UNIQUE(domain_id);
    END IF;
END $$;

-- Create index for domain_blog_settings (safe)
CREATE INDEX IF NOT EXISTS idx_domain_blog_settings_domain_id ON domain_blog_settings(domain_id);

-- Step 4: Create domain_blog_categories table
CREATE TABLE IF NOT EXISTS domain_blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6b7280',
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for domain_blog_categories safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'domain_blog_categories' 
        AND constraint_name = 'domain_blog_categories_domain_id_slug_key'
    ) THEN
        ALTER TABLE domain_blog_categories 
        ADD CONSTRAINT domain_blog_categories_domain_id_slug_key UNIQUE(domain_id, slug);
    END IF;
END $$;

-- Create indexes for domain_blog_categories (safe)
CREATE INDEX IF NOT EXISTS idx_domain_blog_categories_domain_id ON domain_blog_categories(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_blog_categories_active ON domain_blog_categories(domain_id, is_active);

-- Step 5: Add category relationship to domain_blog_posts (safe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'domain_blog_posts' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE domain_blog_posts 
        ADD COLUMN category_id UUID REFERENCES domain_blog_categories(id) ON DELETE SET NULL;
        
        -- Create index for better performance
        CREATE INDEX idx_domain_blog_posts_category_id ON domain_blog_posts(category_id);
    END IF;
END $$;

-- Step 6: Create domain_blog_comments table (optional)
CREATE TABLE IF NOT EXISTS domain_blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES domain_blog_posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES domain_blog_comments(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    author_website TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'spam', 'rejected')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for domain_blog_comments (safe)
CREATE INDEX IF NOT EXISTS idx_domain_blog_comments_post_id ON domain_blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_domain_blog_comments_status ON domain_blog_comments(status);
CREATE INDEX IF NOT EXISTS idx_domain_blog_comments_created_at ON domain_blog_comments(created_at DESC);

-- Step 7: Enable RLS on all new tables (safe)
DO $$
BEGIN
    -- Enable RLS only if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'domain_blog_posts' AND relrowsecurity = true
    ) THEN
        ALTER TABLE domain_blog_posts ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'domain_blog_settings' AND relrowsecurity = true
    ) THEN
        ALTER TABLE domain_blog_settings ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'domain_blog_categories' AND relrowsecurity = true
    ) THEN
        ALTER TABLE domain_blog_categories ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'domain_blog_comments' AND relrowsecurity = true
    ) THEN
        ALTER TABLE domain_blog_comments ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Step 8: Create RLS policies for domain blog system (safe - drop existing first)

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
    -- Domain blog posts policies
    DROP POLICY IF EXISTS "Public can view published domain blog posts" ON domain_blog_posts;
    DROP POLICY IF EXISTS "Users can view their domain blog posts" ON domain_blog_posts;
    DROP POLICY IF EXISTS "Users can manage their domain blog posts" ON domain_blog_posts;
    
    -- Domain blog settings policies
    DROP POLICY IF EXISTS "Public can view domain blog settings" ON domain_blog_settings;
    DROP POLICY IF EXISTS "Users can manage blog settings for their domains" ON domain_blog_settings;
    
    -- Domain blog categories policies
    DROP POLICY IF EXISTS "Public can view active domain blog categories" ON domain_blog_categories;
    DROP POLICY IF EXISTS "Users can manage categories for their domains" ON domain_blog_categories;
    
    -- Domain blog comments policies
    DROP POLICY IF EXISTS "Public can view approved comments" ON domain_blog_comments;
    DROP POLICY IF EXISTS "Users can manage comments on their domain posts" ON domain_blog_comments;
END $$;

-- Create fresh policies
CREATE POLICY "Public can view published domain blog posts" ON domain_blog_posts
    FOR SELECT USING (status = 'published' AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Users can view their domain blog posts" ON domain_blog_posts
    FOR SELECT USING (
        user_id = auth.uid() OR 
        domain_id IN (
            SELECT id FROM domains WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their domain blog posts" ON domain_blog_posts
    FOR ALL USING (
        user_id = auth.uid() OR 
        domain_id IN (
            SELECT id FROM domains WHERE user_id = auth.uid()
        )
    );

-- Domain blog settings policies
CREATE POLICY "Public can view domain blog settings" ON domain_blog_settings
    FOR SELECT USING (true);

CREATE POLICY "Users can manage blog settings for their domains" ON domain_blog_settings
    FOR ALL USING (
        domain_id IN (
            SELECT id FROM domains WHERE user_id = auth.uid()
        )
    );

-- Domain blog categories policies  
CREATE POLICY "Public can view active domain blog categories" ON domain_blog_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage categories for their domains" ON domain_blog_categories
    FOR ALL USING (
        domain_id IN (
            SELECT id FROM domains WHERE user_id = auth.uid()
        )
    );

-- Domain blog comments policies
CREATE POLICY "Public can view approved comments" ON domain_blog_comments
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can manage comments on their domain posts" ON domain_blog_comments
    FOR ALL USING (
        post_id IN (
            SELECT id FROM domain_blog_posts 
            WHERE domain_id IN (
                SELECT id FROM domains WHERE user_id = auth.uid()
            )
        )
    );

-- Step 9: Create functions for domain blog management (safe - replace existing)

-- Function to get domain from hostname
CREATE OR REPLACE FUNCTION get_domain_by_hostname(hostname TEXT)
RETURNS TABLE(domain_id UUID, domain_name TEXT, site_url TEXT, blog_subdirectory TEXT) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT d.id, d.domain, d.site_url, d.blog_subdirectory
    FROM domains d
    WHERE d.domain = hostname AND d.blog_enabled = true
    LIMIT 1;
END;
$$;

-- Function to generate domain-scoped blog URL
CREATE OR REPLACE FUNCTION generate_domain_blog_url(domain_hostname TEXT, post_slug TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    domain_info RECORD;
BEGIN
    SELECT site_url, blog_subdirectory INTO domain_info
    FROM domains 
    WHERE domain = domain_hostname AND blog_enabled = true
    LIMIT 1;
    
    IF domain_info IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN domain_info.site_url || domain_info.blog_subdirectory || '/' || post_slug;
END;
$$;

-- Function to update category post count
CREATE OR REPLACE FUNCTION update_category_post_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update post count for affected categories
    IF TG_OP = 'INSERT' THEN
        UPDATE domain_blog_categories 
        SET post_count = (
            SELECT COUNT(*) FROM domain_blog_posts 
            WHERE category_id = NEW.category_id AND status = 'published'
        )
        WHERE id = NEW.category_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update old category if changed
        IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
            IF OLD.category_id IS NOT NULL THEN
                UPDATE domain_blog_categories 
                SET post_count = (
                    SELECT COUNT(*) FROM domain_blog_posts 
                    WHERE category_id = OLD.category_id AND status = 'published'
                )
                WHERE id = OLD.category_id;
            END IF;
            
            IF NEW.category_id IS NOT NULL THEN
                UPDATE domain_blog_categories 
                SET post_count = (
                    SELECT COUNT(*) FROM domain_blog_posts 
                    WHERE category_id = NEW.category_id AND status = 'published'
                )
                WHERE id = NEW.category_id;
            END IF;
        ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
            -- Status changed, update count
            UPDATE domain_blog_categories 
            SET post_count = (
                SELECT COUNT(*) FROM domain_blog_posts 
                WHERE category_id = NEW.category_id AND status = 'published'
            )
            WHERE id = NEW.category_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.category_id IS NOT NULL THEN
            UPDATE domain_blog_categories 
            SET post_count = (
                SELECT COUNT(*) FROM domain_blog_posts 
                WHERE category_id = OLD.category_id AND status = 'published'
            )
            WHERE id = OLD.category_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create trigger for category post count updates (safe - drop first)
DROP TRIGGER IF EXISTS trigger_update_category_post_count ON domain_blog_posts;
CREATE TRIGGER trigger_update_category_post_count
    AFTER INSERT OR UPDATE OR DELETE ON domain_blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_category_post_count();

-- Function to initialize default blog settings for new domains
CREATE OR REPLACE FUNCTION init_domain_blog_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Create default blog settings for the new domain
    INSERT INTO domain_blog_settings (domain_id, blog_title, blog_description)
    VALUES (
        NEW.id,
        'Blog - ' || NEW.domain,
        'Latest articles and updates from ' || NEW.domain
    )
    ON CONFLICT (domain_id) DO NOTHING;
    
    -- Create default "General" category
    INSERT INTO domain_blog_categories (domain_id, name, slug, description)
    VALUES (
        NEW.id,
        'General',
        'general',
        'General articles and updates'
    )
    ON CONFLICT (domain_id, slug) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Create trigger to auto-initialize blog settings for new domains (safe - drop first)
DROP TRIGGER IF EXISTS trigger_init_domain_blog_settings ON domains;
CREATE TRIGGER trigger_init_domain_blog_settings
    AFTER INSERT ON domains
    FOR EACH ROW
    EXECUTE FUNCTION init_domain_blog_settings();

-- Step 10: Initialize blog settings for existing domains (safe)
DO $$
DECLARE
    domain_record RECORD;
    general_category_id UUID;
BEGIN
    -- Initialize blog settings for existing domains that don't have them
    FOR domain_record IN 
        SELECT d.id, d.domain 
        FROM domains d 
        LEFT JOIN domain_blog_settings dbs ON d.id = dbs.domain_id 
        WHERE dbs.domain_id IS NULL
    LOOP
        -- Create blog settings
        INSERT INTO domain_blog_settings (domain_id, blog_title, blog_description)
        VALUES (
            domain_record.id,
            'Blog - ' || domain_record.domain,
            'Latest articles and updates from ' || domain_record.domain
        )
        ON CONFLICT (domain_id) DO NOTHING;
        
        -- Create default category
        INSERT INTO domain_blog_categories (domain_id, name, slug, description)
        VALUES (
            domain_record.id,
            'General',
            'general',
            'General articles and updates'
        )
        ON CONFLICT (domain_id, slug) DO NOTHING;
    END LOOP;
END $$;

-- Final: Print completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Conflict-free multi-domain blog schema migration completed successfully!';
    RAISE NOTICE 'Schema includes:';
    RAISE NOTICE '  - domain_blog_posts table (separate from blog_posts)';
    RAISE NOTICE '  - domain_blog_settings table';
    RAISE NOTICE '  - domain_blog_categories table';
    RAISE NOTICE '  - domain_blog_comments table';
    RAISE NOTICE '  - Fresh RLS policies (existing ones replaced)';
    RAISE NOTICE '  - Helper functions for domain routing';
    RAISE NOTICE '  - Automatic initialization triggers';
    RAISE NOTICE '  - NO modifications to existing blog_posts or published_blog_posts tables';
    RAISE NOTICE '  - SAFE to run multiple times!';
END $$;
