-- Safe migration from blog_posts to published_blog_posts
-- This query only uses columns that definitely exist

-- First, let's see what we have in blog_posts
SELECT COUNT(*) as total_blog_posts FROM blog_posts;

-- Get a sample row to see available columns
SELECT * FROM blog_posts LIMIT 1;

-- Basic migration using only core columns that should exist
INSERT INTO published_blog_posts (
    user_id,
    slug,
    title,
    content,
    keywords,
    target_url,
    published_url,
    status,
    is_trial_post,
    expires_at,
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
    anchor_text,
    is_claimed,
    claimed_by,
    claimed_at
)
SELECT 
    user_id,
    slug,
    title,
    content,
    -- Convert TEXT keywords to TEXT[] array
    CASE 
        WHEN keywords IS NOT NULL AND keywords != '' THEN 
            string_to_array(trim(keywords), ',')
        ELSE 
            ARRAY[]::text[]
    END as keywords,
    target_url,
    COALESCE(published_url, 'https://backlinkoo.com/blog/' || slug) as published_url,
    COALESCE(status, 'published') as status,
    COALESCE(is_trial_post, false) as is_trial_post,
    expires_at,
    COALESCE(view_count, 0) as view_count,
    COALESCE(seo_score, 75) as seo_score,
    -- Calculate reading time based on word count (average 200 words per minute)
    CASE 
        WHEN word_count > 0 THEN CEIL(word_count::numeric / 200.0)::integer
        ELSE CEIL(length(content)::numeric / 1000.0)::integer
    END as reading_time,
    COALESCE(word_count, length(split_part(content, ' ', 100))) as word_count,
    'Backlinkoo Team' as author_name,
    COALESCE(tags, ARRAY[]::text[]) as tags,
    COALESCE(category, 'General') as category,
    created_at,
    updated_at,
    COALESCE(published_at, created_at) as published_at,
    anchor_text,
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

-- Update meta_description and excerpt separately if they exist in blog_posts
DO $$
BEGIN
    -- Check if meta_description exists in blog_posts and update
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'meta_description'
    ) THEN
        UPDATE published_blog_posts 
        SET meta_description = bp.meta_description
        FROM blog_posts bp
        WHERE published_blog_posts.slug = bp.slug
        AND bp.meta_description IS NOT NULL;
    END IF;
    
    -- Check if excerpt exists in blog_posts and update
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'excerpt'
    ) THEN
        UPDATE published_blog_posts 
        SET excerpt = bp.excerpt
        FROM blog_posts bp
        WHERE published_blog_posts.slug = bp.slug
        AND bp.excerpt IS NOT NULL;
    ELSE
        -- Generate excerpt from content if not available
        UPDATE published_blog_posts 
        SET excerpt = substring(content, 1, 200) || '...'
        WHERE excerpt IS NULL OR excerpt = '';
    END IF;
END $$;

-- Verify the migration
SELECT COUNT(*) as migrated_posts FROM published_blog_posts;

-- Show migration results
SELECT 
    slug, 
    title, 
    status, 
    is_claimed,
    CASE WHEN meta_description IS NOT NULL THEN 'Yes' ELSE 'No' END as has_meta_desc,
    CASE WHEN excerpt IS NOT NULL THEN 'Yes' ELSE 'No' END as has_excerpt,
    array_length(keywords, 1) as keywords_count,
    reading_time,
    word_count,
    created_at 
FROM published_blog_posts 
ORDER BY created_at DESC 
LIMIT 10;
