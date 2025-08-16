-- Complete migration from blog_posts to published_blog_posts
-- This handles all missing columns and data type differences

-- First, let's check what we have in blog_posts
SELECT COUNT(*) as total_blog_posts FROM blog_posts;

-- Migrate all existing blog posts from blog_posts to published_blog_posts
INSERT INTO published_blog_posts (
    user_id,
    slug,
    title,
    content,
    meta_description,
    excerpt,
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
    meta_description,
    excerpt,
    -- Convert TEXT keywords to TEXT[] array
    CASE 
        WHEN keywords IS NOT NULL AND keywords != '' THEN 
            string_to_array(keywords, ',')
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
        ELSE 5
    END as reading_time,
    COALESCE(word_count, 500) as word_count,
    COALESCE('Backlinkoo Team') as author_name,
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
AND slug NOT IN (
    SELECT slug FROM published_blog_posts WHERE slug IS NOT NULL
)
ON CONFLICT (slug) DO NOTHING;

-- Verify the migration
SELECT COUNT(*) as migrated_posts FROM published_blog_posts;

-- Show some examples of migrated posts with all key fields
SELECT 
    slug, 
    title, 
    status, 
    is_claimed,
    array_length(keywords, 1) as keywords_count,
    reading_time,
    word_count,
    created_at 
FROM published_blog_posts 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for any posts that failed to migrate due to missing slug
SELECT COUNT(*) as posts_without_slug 
FROM blog_posts 
WHERE slug IS NULL OR slug = '';

-- Show migration summary
SELECT 
    'blog_posts' as table_name,
    COUNT(*) as total_records
FROM blog_posts
UNION ALL
SELECT 
    'published_blog_posts' as table_name,
    COUNT(*) as total_records
FROM published_blog_posts;
