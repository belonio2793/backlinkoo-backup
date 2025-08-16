-- Step 1: Discover the actual structure of your blog_posts table
-- Run this first to see exactly which columns exist

-- Check what columns actually exist in blog_posts
SELECT 
    'blog_posts table columns:' as info,
    '' as column_name,
    '' as data_type,
    '' as is_nullable
UNION ALL
SELECT 
    '',
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
ORDER BY column_name;

-- Check published_blog_posts structure for comparison
SELECT 
    'published_blog_posts table columns:' as info,
    '' as column_name,
    '' as data_type,
    '' as is_nullable
UNION ALL
SELECT 
    '',
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'published_blog_posts' 
ORDER BY column_name;

-- Check if tables exist
SELECT 
    'Table existence check:' as info,
    table_name,
    table_type,
    ''
FROM information_schema.tables 
WHERE table_name IN ('blog_posts', 'published_blog_posts');

-- Count records in each table
SELECT 'blog_posts record count:' as info, COUNT(*)::text as count, '', '' FROM blog_posts
UNION ALL
SELECT 'published_blog_posts record count:' as info, COUNT(*)::text as count, '', '' FROM published_blog_posts;

-- Sample blog_posts data to see actual structure
SELECT 'Sample blog_posts record (first 3 columns):' as info;
-- This will show the first few columns of a sample record
SELECT * FROM blog_posts LIMIT 1;
