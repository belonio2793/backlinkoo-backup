-- Simple check to see what columns exist in blog_posts
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
ORDER BY column_name;
