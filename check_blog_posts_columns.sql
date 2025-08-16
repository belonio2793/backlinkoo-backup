-- Check the actual columns that exist in the blog_posts table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
ORDER BY ordinal_position;

-- Also check published_blog_posts for comparison
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'published_blog_posts' 
ORDER BY ordinal_position;

-- Check if the tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('blog_posts', 'published_blog_posts');
