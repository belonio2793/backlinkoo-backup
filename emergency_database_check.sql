-- Emergency check to see what's in the database
-- Check if tables exist
SELECT 
    'Table Status' as check_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('blog_posts', 'published_blog_posts')
ORDER BY table_name;

-- Count records in each table
SELECT 'blog_posts' as table_name, COUNT(*) as record_count
FROM blog_posts
UNION ALL
SELECT 'published_blog_posts', COUNT(*)
FROM published_blog_posts;

-- Check structure of blog_posts
SELECT 
    'blog_posts columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'blog_posts'
ORDER BY ordinal_position;

-- Check structure of published_blog_posts  
SELECT 
    'published_blog_posts columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'published_blog_posts'
ORDER BY ordinal_position;

-- Sample data from blog_posts (if any)
SELECT 'Sample blog_posts data:' as info;
SELECT id, title, slug, status, created_at
FROM blog_posts 
LIMIT 5;

-- Sample data from published_blog_posts (if any)
SELECT 'Sample published_blog_posts data:' as info;
SELECT id, title, slug, status, created_at
FROM published_blog_posts 
LIMIT 5;

-- Check for the specific blog post mentioned in error
SELECT 'Searching for specific post:' as info;
SELECT id, title, slug, status 
FROM blog_posts 
WHERE slug LIKE '%pastebin%' OR title ILIKE '%pastebin%'
UNION ALL
SELECT id, title, slug, status 
FROM published_blog_posts 
WHERE slug LIKE '%pastebin%' OR title ILIKE '%pastebin%';
