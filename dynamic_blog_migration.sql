-- Dynamic migration that discovers actual table structure and migrates accordingly
-- This will work regardless of which columns exist in blog_posts

-- First, let's see what columns actually exist in both tables
SELECT 'blog_posts columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
ORDER BY ordinal_position;

SELECT 'published_blog_posts columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'published_blog_posts' 
ORDER BY ordinal_position;

-- Check current record counts
SELECT 
    'blog_posts' as table_name,
    COUNT(*) as record_count
FROM blog_posts
UNION ALL
SELECT 
    'published_blog_posts' as table_name,
    COUNT(*) as record_count
FROM published_blog_posts;

-- Sample a few records to see actual data structure
SELECT 'Sample blog_posts record:' as info;
SELECT * FROM blog_posts LIMIT 1;

-- Now create a minimal migration using only guaranteed columns
-- This uses the most basic columns that should exist in any blog_posts table
INSERT INTO published_blog_posts (
    user_id,
    slug,
    title,
    content,
    target_url,
    published_url,
    status,
    is_trial_post,
    view_count,
    seo_score,
    reading_time,
    word_count,
    author_name,
    tags,
    category,
    created_at,
    updated_at,
    published_at,
    is_claimed,
    claimed_by,
    claimed_at
)
SELECT 
    user_id,
    slug,
    title,
    content,
    target_url,
    COALESCE(published_url, 'https://backlinkoo.com/blog/' || slug) as published_url,
    COALESCE(status, 'published') as status,
    COALESCE(is_trial_post, false) as is_trial_post,
    COALESCE(view_count, 0) as view_count,
    COALESCE(seo_score, 75) as seo_score,
    -- Calculate reading time from content length
    CASE 
        WHEN length(content) > 0 THEN CEIL(length(content)::numeric / 1000.0)::integer
        ELSE 5
    END as reading_time,
    COALESCE(word_count, length(content) / 5) as word_count,
    'Backlinkoo Team' as author_name,
    ARRAY[]::text[] as tags,
    'General' as category,
    created_at,
    updated_at,
    COALESCE(published_at, created_at) as published_at,
    COALESCE(claimed, false) as is_claimed,
    CASE WHEN claimed = true THEN user_id ELSE NULL END as claimed_by,
    CASE WHEN claimed = true THEN updated_at ELSE NULL END as claimed_at
FROM blog_posts
WHERE slug IS NOT NULL 
AND slug != ''
AND slug NOT IN (
    SELECT slug FROM published_blog_posts WHERE slug IS NOT NULL
)
ON CONFLICT (slug) DO NOTHING;

-- Now update optional fields that might exist
DO $$
DECLARE
    col_exists boolean;
BEGIN
    -- Check and update meta_description if it exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'meta_description'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE 'Updating meta_description from blog_posts';
        UPDATE published_blog_posts 
        SET meta_description = bp.meta_description
        FROM blog_posts bp
        WHERE published_blog_posts.slug = bp.slug
        AND bp.meta_description IS NOT NULL
        AND bp.meta_description != '';
    ELSE
        RAISE NOTICE 'meta_description column not found in blog_posts, generating from content';
        UPDATE published_blog_posts 
        SET meta_description = substring(content, 1, 160) || '...'
        WHERE meta_description IS NULL OR meta_description = '';
    END IF;
    
    -- Check and update excerpt if it exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'excerpt'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE 'Updating excerpt from blog_posts';
        UPDATE published_blog_posts 
        SET excerpt = bp.excerpt
        FROM blog_posts bp
        WHERE published_blog_posts.slug = bp.slug
        AND bp.excerpt IS NOT NULL
        AND bp.excerpt != '';
    ELSE
        RAISE NOTICE 'excerpt column not found in blog_posts, generating from content';
        UPDATE published_blog_posts 
        SET excerpt = substring(content, 1, 200) || '...'
        WHERE excerpt IS NULL OR excerpt = '';
    END IF;
    
    -- Check and update keywords if it exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'keywords'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE 'Updating keywords from blog_posts';
        UPDATE published_blog_posts 
        SET keywords = CASE 
            WHEN bp.keywords IS NOT NULL AND bp.keywords != '' THEN 
                string_to_array(trim(bp.keywords), ',')
            ELSE 
                ARRAY[]::text[]
        END
        FROM blog_posts bp
        WHERE published_blog_posts.slug = bp.slug;
    ELSE
        RAISE NOTICE 'keywords column not found in blog_posts, leaving as empty array';
    END IF;
    
    -- Check and update anchor_text if it exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'anchor_text'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE 'Updating anchor_text from blog_posts';
        UPDATE published_blog_posts 
        SET anchor_text = bp.anchor_text
        FROM blog_posts bp
        WHERE published_blog_posts.slug = bp.slug
        AND bp.anchor_text IS NOT NULL;
    ELSE
        RAISE NOTICE 'anchor_text column not found in blog_posts';
    END IF;
    
    -- Check and update expires_at if it exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'expires_at'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE 'Updating expires_at from blog_posts';
        UPDATE published_blog_posts 
        SET expires_at = bp.expires_at
        FROM blog_posts bp
        WHERE published_blog_posts.slug = bp.slug
        AND bp.expires_at IS NOT NULL;
    ELSE
        RAISE NOTICE 'expires_at column not found in blog_posts';
    END IF;
END $$;

-- Final verification and results
SELECT COUNT(*) as total_migrated_posts FROM published_blog_posts;

SELECT 
    'Migration Summary' as info,
    COUNT(*) as migrated_posts,
    COUNT(CASE WHEN meta_description IS NOT NULL THEN 1 END) as posts_with_meta_desc,
    COUNT(CASE WHEN excerpt IS NOT NULL THEN 1 END) as posts_with_excerpt,
    COUNT(CASE WHEN array_length(keywords, 1) > 0 THEN 1 END) as posts_with_keywords,
    COUNT(CASE WHEN anchor_text IS NOT NULL THEN 1 END) as posts_with_anchor_text
FROM published_blog_posts;

-- Show sample migrated posts
SELECT 
    slug, 
    title, 
    status,
    CASE WHEN meta_description IS NOT NULL THEN 'Yes' ELSE 'No' END as has_meta_desc,
    CASE WHEN excerpt IS NOT NULL THEN 'Yes' ELSE 'No' END as has_excerpt,
    array_length(keywords, 1) as keywords_count,
    reading_time,
    word_count,
    created_at 
FROM published_blog_posts 
ORDER BY created_at DESC 
LIMIT 10;
