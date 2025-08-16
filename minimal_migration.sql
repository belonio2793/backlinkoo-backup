-- Minimal migration using only basic columns that should exist
-- This assumes blog_posts has at least: id, title, content, user_id, created_at

INSERT INTO published_blog_posts (
    user_id,
    slug,
    title,
    content,
    target_url,
    published_url,
    status,
    keywords,
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
    COALESCE(id::text, 'post-' || EXTRACT(EPOCH FROM NOW())::text) as slug,
    title,
    content,
    'https://example.com' as target_url,
    'https://backlinkoo.com/blog/' || COALESCE(id::text, 'post-' || EXTRACT(EPOCH FROM NOW())::text) as published_url,
    'published' as status,
    ARRAY[]::text[] as keywords,
    false as is_trial_post,
    0 as view_count,
    75 as seo_score,
    5 as reading_time,
    500 as word_count,
    'Backlinkoo Team' as author_name,
    ARRAY[]::text[] as tags,
    'General' as category,
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(created_at, NOW()) as updated_at,
    COALESCE(created_at, NOW()) as published_at,
    false as is_claimed,
    NULL as claimed_by,
    NULL as claimed_at
FROM blog_posts
WHERE title IS NOT NULL 
AND content IS NOT NULL
LIMIT 10; -- Start with just 10 records

-- Check results
SELECT COUNT(*) as total_migrated FROM published_blog_posts;
SELECT slug, title FROM published_blog_posts ORDER BY created_at DESC LIMIT 5;
