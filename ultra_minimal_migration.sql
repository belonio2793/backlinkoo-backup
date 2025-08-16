-- Ultra minimal migration - only the absolutely essential fields
-- This will work even if most columns are missing

INSERT INTO published_blog_posts (
    slug,
    title,
    content,
    target_url,
    published_url,
    status,
    keywords,
    author_name,
    tags,
    category
)
SELECT 
    id::text as slug,
    title,
    content,
    'https://example.com' as target_url,
    'https://backlinkoo.com/blog/' || id::text as published_url,
    'published' as status,
    ARRAY[]::text[] as keywords,
    'Backlinkoo Team' as author_name,
    ARRAY[]::text[] as tags,
    'General' as category
FROM blog_posts
WHERE title IS NOT NULL 
AND content IS NOT NULL
LIMIT 5; -- Start with just 5 records

-- Check what was migrated
SELECT slug, title FROM published_blog_posts ORDER BY created_at DESC LIMIT 5;
