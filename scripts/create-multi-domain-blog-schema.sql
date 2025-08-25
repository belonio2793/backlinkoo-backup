-- Multi-Domain Blog System Schema Migration
-- This script adds multi-domain support to the existing blog system

-- Step 1: Add domain_id to blog_posts table to link posts to specific domains
DO $$ 
BEGIN
    -- Add domain_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'domain_id'
    ) THEN
        ALTER TABLE blog_posts 
        ADD COLUMN domain_id UUID REFERENCES domains(id) ON DELETE CASCADE;
        
        -- Create index for better performance
        CREATE INDEX idx_blog_posts_domain_id ON blog_posts(domain_id);
    END IF;
    
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

-- Step 2: Create domain_blog_settings table for per-domain blog configuration
CREATE TABLE IF NOT EXISTS domain_blog_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES domains(id) ON DELETE CASCADE UNIQUE,
    blog_title TEXT DEFAULT 'Blog',
    blog_description TEXT DEFAULT 'Latest articles and updates',
    blog_logo_url TEXT,
    theme_primary_color TEXT DEFAULT '#3b82f6',
    theme_secondary_color TEXT DEFAULT '#1e40af',
    posts_per_page INTEGER DEFAULT 10,
    enable_comments BOOLEAN DEFAULT false,
    enable_social_sharing BOOLEAN DEFAULT true,
    custom_css TEXT,
    meta_tags JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for domain_blog_settings
CREATE INDEX IF NOT EXISTS idx_domain_blog_settings_domain_id ON domain_blog_settings(domain_id);

-- Step 3: Update blog_posts constraints to ensure slug uniqueness per domain
-- Drop existing slug unique constraint if it exists
DO $$
BEGIN
    -- Drop the global unique constraint on slug
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'blog_posts' AND constraint_name = 'blog_posts_slug_key'
    ) THEN
        ALTER TABLE blog_posts DROP CONSTRAINT blog_posts_slug_key;
    END IF;
    
    -- Create new unique constraint on (domain_id, slug) combination
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'blog_posts' AND constraint_name = 'blog_posts_domain_slug_unique'
    ) THEN
        ALTER TABLE blog_posts 
        ADD CONSTRAINT blog_posts_domain_slug_unique UNIQUE (domain_id, slug);
    END IF;
END $$;

-- Step 4: Create domain blog categories table
CREATE TABLE IF NOT EXISTS domain_blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6b7280',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(domain_id, slug)
);

-- Create index for domain_blog_categories
CREATE INDEX IF NOT EXISTS idx_domain_blog_categories_domain_id ON domain_blog_categories(domain_id);

-- Step 5: Add category_id to blog_posts
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE blog_posts 
        ADD COLUMN category_id UUID REFERENCES domain_blog_categories(id) ON DELETE SET NULL;
        
        -- Create index for better performance
        CREATE INDEX idx_blog_posts_category_id ON blog_posts(category_id);
    END IF;
END $$;

-- Step 6: Create RLS policies for multi-domain blog system
-- Enable RLS on new tables
ALTER TABLE domain_blog_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_blog_categories ENABLE ROW LEVEL SECURITY;

-- Domain blog settings policies
CREATE POLICY "Users can view blog settings for their domains" ON domain_blog_settings
    FOR SELECT USING (
        domain_id IN (
            SELECT id FROM domains WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage blog settings for their domains" ON domain_blog_settings
    FOR ALL USING (
        domain_id IN (
            SELECT id FROM domains WHERE user_id = auth.uid()
        )
    );

-- Domain blog categories policies  
CREATE POLICY "Users can view categories for their domains" ON domain_blog_categories
    FOR SELECT USING (
        domain_id IN (
            SELECT id FROM domains WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage categories for their domains" ON domain_blog_categories
    FOR ALL USING (
        domain_id IN (
            SELECT id FROM domains WHERE user_id = auth.uid()
        )
    );

-- Update blog_posts RLS policies to include domain filtering
DROP POLICY IF EXISTS "Users can view their own blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can manage their own blog posts" ON blog_posts;

CREATE POLICY "Users can view their domain blog posts" ON blog_posts
    FOR SELECT USING (
        user_id = auth.uid() OR 
        domain_id IN (
            SELECT id FROM domains WHERE user_id = auth.uid()
        ) OR
        is_trial_post = true
    );

CREATE POLICY "Users can manage their domain blog posts" ON blog_posts
    FOR ALL USING (
        user_id = auth.uid() OR 
        domain_id IN (
            SELECT id FROM domains WHERE user_id = auth.uid()
        )
    );

-- Step 7: Create functions for domain blog management

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
CREATE OR REPLACE FUNCTION generate_blog_url(domain_hostname TEXT, post_slug TEXT)
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
    );
    
    -- Create default "General" category
    INSERT INTO domain_blog_categories (domain_id, name, slug, description)
    VALUES (
        NEW.id,
        'General',
        'general',
        'General articles and updates'
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger to auto-initialize blog settings for new domains
DROP TRIGGER IF EXISTS trigger_init_domain_blog_settings ON domains;
CREATE TRIGGER trigger_init_domain_blog_settings
    AFTER INSERT ON domains
    FOR EACH ROW
    EXECUTE FUNCTION init_domain_blog_settings();

-- Step 8: Insert sample data for existing domains
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
        );
        
        -- Create default category
        INSERT INTO domain_blog_categories (domain_id, name, slug, description)
        VALUES (
            domain_record.id,
            'General',
            'general',
            'General articles and updates'
        )
        RETURNING id INTO general_category_id;
        
        -- Update existing blog posts for this domain to have the default category
        UPDATE blog_posts 
        SET category_id = general_category_id 
        WHERE domain_id = domain_record.id AND category_id IS NULL;
    END LOOP;
END $$;

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_domain_status ON blog_posts(domain_id, status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_domain_published ON blog_posts(domain_id, published_at DESC) WHERE status = 'published';

-- Final: Print completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Multi-domain blog schema migration completed successfully!';
    RAISE NOTICE 'Schema includes:';
    RAISE NOTICE '  - domain_id column in blog_posts';
    RAISE NOTICE '  - domain_blog_settings table';
    RAISE NOTICE '  - domain_blog_categories table';
    RAISE NOTICE '  - Updated RLS policies';
    RAISE NOTICE '  - Helper functions for domain routing';
    RAISE NOTICE '  - Automatic initialization triggers';
END $$;
