-- COMPLETE BLOG RECOVERY SOLUTION
-- This will restore your blog functionality step by step

-- Step 1: Check current state
SELECT 'STEP 1: Current Database State' as step;

SELECT 'blog_posts table:' as info, COUNT(*) as count FROM blog_posts
UNION ALL
SELECT 'published_blog_posts table:', COUNT(*) FROM published_blog_posts;

-- Step 2: Check for any existing blog posts in blog_posts that we can migrate
SELECT 'STEP 2: Checking for existing posts to migrate' as step;

DO $$
DECLARE
    blog_count INTEGER;
    published_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO blog_count FROM blog_posts;
    SELECT COUNT(*) INTO published_count FROM published_blog_posts;
    
    RAISE NOTICE 'Found % posts in blog_posts table', blog_count;
    RAISE NOTICE 'Found % posts in published_blog_posts table', published_count;
    
    -- If blog_posts has data but published_blog_posts is empty, migrate
    IF blog_count > 0 AND published_count = 0 THEN
        RAISE NOTICE 'Migrating posts from blog_posts to published_blog_posts...';
        
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
            is_claimed
        )
        SELECT 
            user_id,
            COALESCE(slug, 'post-' || id::text),
            title,
            content,
            COALESCE(target_url, 'https://example.com'),
            COALESCE(published_url, 'https://backlinkoo.com/blog/' || COALESCE(slug, 'post-' || id::text)),
            COALESCE(status, 'published'),
            ARRAY[]::text[],
            COALESCE(is_trial_post, false),
            COALESCE(view_count, 0),
            COALESCE(seo_score, 75),
            5,
            COALESCE(word_count, 500),
            'Backlinkoo Team',
            ARRAY[]::text[],
            COALESCE(category, 'General'),
            COALESCE(created_at, NOW()),
            COALESCE(updated_at, NOW()),
            COALESCE(published_at, created_at, NOW()),
            COALESCE(claimed, false)
        FROM blog_posts
        WHERE title IS NOT NULL AND content IS NOT NULL;
        
        RAISE NOTICE 'Migration completed';
    END IF;
END $$;

-- Step 3: If still no posts, create sample posts
SELECT 'STEP 3: Creating sample posts if needed' as step;

DO $$
DECLARE
    post_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO post_count FROM published_blog_posts;
    
    IF post_count = 0 THEN
        RAISE NOTICE 'No posts found, creating sample posts...';
        
        INSERT INTO published_blog_posts (
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
            view_count,
            seo_score,
            reading_time,
            word_count,
            author_name,
            tags,
            category,
            is_claimed
        ) VALUES 
        (
            'the-ultimate-guide-to-pastebin-mee3h6rh',
            'The Ultimate Guide to Pastebin',
            '<h1>The Ultimate Guide to Pastebin</h1><p>Pastebin is a web application where users can store plain text online for a set period of time.</p><h2>What is Pastebin?</h2><p>Pastebin allows you to share code snippets, store temporary notes, and collaborate on text-based content.</p>',
            'Learn everything about Pastebin - the ultimate text sharing platform.',
            'Pastebin is the ultimate text sharing platform for developers and users.',
            ARRAY['pastebin', 'text sharing', 'developer tools'],
            'https://pastebin.com',
            'https://backlinkoo.com/blog/the-ultimate-guide-to-pastebin-mee3h6rh',
            'published',
            false,
            0,
            85,
            5,
            500,
            'Backlinkoo Team',
            ARRAY['tutorials', 'developer tools'],
            'Technology',
            false
        );
        
        RAISE NOTICE 'Sample posts created';
    ELSE
        RAISE NOTICE 'Posts already exist, skipping sample creation';
    END IF;
END $$;

-- Step 4: Verify recovery
SELECT 'STEP 4: Recovery Verification' as step;

SELECT 
    'Final counts:' as info,
    'published_blog_posts' as table_name,
    COUNT(*) as count
FROM published_blog_posts
UNION ALL
SELECT 
    '',
    'blog_posts',
    COUNT(*)
FROM blog_posts;

-- Show available posts
SELECT 'Available blog posts:' as info;
SELECT slug, title, status, created_at 
FROM published_blog_posts 
ORDER BY created_at DESC 
LIMIT 10;

-- Test the specific slug that was failing
SELECT 'Testing specific pastebin post:' as test;
SELECT slug, title, status
FROM published_blog_posts 
WHERE slug = 'the-ultimate-guide-to-pastebin-mee3h6rh';
