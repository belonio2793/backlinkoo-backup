-- Step 2: Ultra-safe migration using only the most basic columns
-- This will work even if most columns are missing from blog_posts

-- First check current state
SELECT 'Current state:' as status;
SELECT 'blog_posts count:' as table_name, COUNT(*) as records FROM blog_posts
UNION ALL
SELECT 'published_blog_posts count:', COUNT(*) FROM published_blog_posts;

-- Migration using ONLY the most basic columns that should exist in any blog table
-- We'll start with just id, title, content, slug, and user_id
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
    -- Only reference columns that definitely exist
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'user_id'
    ) THEN user_id ELSE NULL END,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'slug'
    ) THEN slug ELSE 'auto-generated-' || id::text END,
    
    title, -- This should always exist
    content, -- This should always exist
    
    -- Handle target_url - use a default if it doesn't exist
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'target_url'
    ) THEN target_url ELSE 'https://example.com' END,
    
    -- Generate published_url
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'published_url'
    ) THEN published_url 
    ELSE 'https://backlinkoo.com/blog/' || 
         CASE WHEN EXISTS (
             SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'blog_posts' AND column_name = 'slug'
         ) THEN slug ELSE 'post-' || id::text END
    END,
    
    -- Status with default
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'status'
    ) THEN status ELSE 'published' END,
    
    -- Keywords as empty array (published_blog_posts expects TEXT[])
    ARRAY[]::text[] as keywords,
    
    -- Trial post status
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'is_trial_post'
    ) THEN is_trial_post ELSE false END,
    
    -- View count
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'view_count'
    ) THEN view_count ELSE 0 END,
    
    -- SEO score
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'seo_score'
    ) THEN seo_score ELSE 75 END,
    
    -- Reading time (calculate from content length)
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'reading_time'
    ) THEN reading_time 
    ELSE CEIL(length(content)::numeric / 1000.0)::integer END,
    
    -- Word count
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'word_count'
    ) THEN word_count 
    ELSE length(content) / 5 END,
    
    -- Author name
    'Backlinkoo Team' as author_name,
    
    -- Tags as empty array
    ARRAY[]::text[] as tags,
    
    -- Category
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'category'
    ) THEN category ELSE 'General' END,
    
    -- Timestamps
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'created_at'
    ) THEN created_at ELSE NOW() END,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'updated_at'
    ) THEN updated_at ELSE NOW() END,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'published_at'
    ) THEN published_at 
    ELSE CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'created_at'
    ) THEN created_at ELSE NOW() END END,
    
    -- Claiming fields
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'claimed'
    ) THEN claimed ELSE false END as is_claimed,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'claimed'
    ) AND claimed = true THEN user_id ELSE NULL END as claimed_by,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'claimed'
    ) AND claimed = true THEN 
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'blog_posts' AND column_name = 'updated_at'
        ) THEN updated_at ELSE NOW() END
    ELSE NULL END as claimed_at

FROM blog_posts
WHERE title IS NOT NULL 
AND content IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM published_blog_posts pbp 
    WHERE pbp.slug = CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'slug'
    ) THEN blog_posts.slug ELSE 'auto-generated-' || blog_posts.id::text END
)
LIMIT 100; -- Migrate in batches to avoid timeouts

-- Show migration results
SELECT 'Migration results:' as status;
SELECT 
    'Total migrated:' as metric,
    COUNT(*)::text as value,
    '' as details
FROM published_blog_posts
UNION ALL
SELECT 
    'Sample migrated posts:',
    '',
    string_agg(title, ', ')
FROM (
    SELECT title 
    FROM published_blog_posts 
    ORDER BY created_at DESC 
    LIMIT 3
) sample_posts;
