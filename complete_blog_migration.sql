-- COMPLETE MIGRATION FROM blog_posts TO published_blog_posts
-- This will safely migrate all existing blog posts

-- Step 1: Check current state
SELECT 'MIGRATION STATUS CHECK' as step;
SELECT 
    'blog_posts' as table_name, 
    COUNT(*) as record_count,
    COUNT(CASE WHEN slug IS NOT NULL THEN 1 END) as posts_with_slug
FROM blog_posts
UNION ALL
SELECT 
    'published_blog_posts', 
    COUNT(*),
    COUNT(CASE WHEN slug IS NOT NULL THEN 1 END)
FROM published_blog_posts;

-- Step 2: Show sample of what will be migrated
SELECT 'SAMPLE DATA TO MIGRATE' as step;
SELECT 
    id, 
    slug, 
    title, 
    status,
    CASE WHEN meta_description IS NOT NULL THEN 'HAS_META' ELSE 'NO_META' END as meta_desc,
    CASE WHEN keywords IS NOT NULL THEN 'HAS_KEYWORDS' ELSE 'NO_KEYWORDS' END as keywords_status,
    created_at
FROM blog_posts 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 3: Perform the migration with proper column mapping
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
    -- User ID
    user_id,
    
    -- Slug - ensure it exists
    CASE 
        WHEN slug IS NOT NULL AND slug != '' THEN slug
        ELSE 'post-' || id::text
    END as slug,
    
    -- Basic content fields
    title,
    content,
    
    -- Meta description - check if column exists, otherwise generate from content
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'blog_posts' AND column_name = 'meta_description'
        ) THEN 
            CASE 
                WHEN meta_description IS NOT NULL AND meta_description != '' THEN meta_description
                ELSE SUBSTRING(content, 1, 160) || '...'
            END
        ELSE SUBSTRING(content, 1, 160) || '...'
    END as meta_description,
    
    -- Excerpt - check if column exists, otherwise generate from content
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'blog_posts' AND column_name = 'excerpt'
        ) THEN 
            CASE 
                WHEN excerpt IS NOT NULL AND excerpt != '' THEN excerpt
                ELSE SUBSTRING(content, 1, 200) || '...'
            END
        ELSE SUBSTRING(content, 1, 200) || '...'
    END as excerpt,
    
    -- Keywords - convert from TEXT to TEXT[] if it exists
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'blog_posts' AND column_name = 'keywords'
        ) THEN 
            CASE 
                WHEN keywords IS NOT NULL AND keywords != '' THEN 
                    string_to_array(trim(keywords), ',')
                ELSE ARRAY[]::text[]
            END
        ELSE ARRAY['seo', 'backlink', 'marketing']::text[]
    END as keywords,
    
    -- Target URL
    COALESCE(target_url, 'https://example.com') as target_url,
    
    -- Published URL
    CASE 
        WHEN published_url IS NOT NULL AND published_url != '' THEN published_url
        ELSE 'https://backlinkoo.com/blog/' || 
             CASE 
                 WHEN slug IS NOT NULL AND slug != '' THEN slug
                 ELSE 'post-' || id::text
             END
    END as published_url,
    
    -- Status
    COALESCE(status, 'published') as status,
    
    -- Trial post status
    COALESCE(is_trial_post, false) as is_trial_post,
    
    -- Expiration
    expires_at,
    
    -- Metrics
    COALESCE(view_count, 0) as view_count,
    COALESCE(seo_score, 75) as seo_score,
    
    -- Reading time - calculate if not present
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'blog_posts' AND column_name = 'reading_time'
        ) AND reading_time IS NOT NULL AND reading_time > 0 THEN reading_time
        WHEN word_count IS NOT NULL AND word_count > 0 THEN CEIL(word_count::numeric / 200.0)::integer
        ELSE CEIL(length(content)::numeric / 1000.0)::integer
    END as reading_time,
    
    -- Word count
    CASE 
        WHEN word_count IS NOT NULL AND word_count > 0 THEN word_count
        ELSE length(content) / 5
    END as word_count,
    
    -- Author
    COALESCE('Backlinkoo Team') as author_name,
    
    -- Tags - convert from array or create new
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'blog_posts' AND column_name = 'tags'
        ) AND tags IS NOT NULL THEN tags
        ELSE ARRAY['seo', 'marketing', 'backlinks']::text[]
    END as tags,
    
    -- Category
    COALESCE(category, 'General') as category,
    
    -- Timestamps
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, NOW()) as updated_at,
    COALESCE(published_at, created_at, NOW()) as published_at,
    
    -- Anchor text
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'blog_posts' AND column_name = 'anchor_text'
        ) THEN anchor_text
        ELSE NULL
    END as anchor_text,
    
    -- Claiming status
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'blog_posts' AND column_name = 'claimed'
        ) THEN COALESCE(claimed, false)
        ELSE false
    END as is_claimed,
    
    -- Claimed by
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'blog_posts' AND column_name = 'claimed'
        ) AND claimed = true THEN user_id
        ELSE NULL
    END as claimed_by,
    
    -- Claimed at
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'blog_posts' AND column_name = 'claimed'
        ) AND claimed = true THEN COALESCE(updated_at, NOW())
        ELSE NULL
    END as claimed_at

FROM blog_posts
WHERE 
    title IS NOT NULL 
    AND content IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 
        FROM published_blog_posts pbp 
        WHERE pbp.slug = CASE 
            WHEN blog_posts.slug IS NOT NULL AND blog_posts.slug != '' THEN blog_posts.slug
            ELSE 'post-' || blog_posts.id::text
        END
    )
ON CONFLICT (slug) DO NOTHING;

-- Step 4: Verify migration results
SELECT 'MIGRATION RESULTS' as step;

SELECT 
    'After migration:' as status,
    table_name,
    record_count
FROM (
    SELECT 'blog_posts' as table_name, COUNT(*) as record_count FROM blog_posts
    UNION ALL
    SELECT 'published_blog_posts', COUNT(*) FROM published_blog_posts
) t
ORDER BY table_name;

-- Step 5: Show migrated posts
SELECT 'MIGRATED POSTS SAMPLE' as step;
SELECT 
    slug, 
    title, 
    status,
    is_claimed,
    array_length(keywords, 1) as keyword_count,
    array_length(tags, 1) as tag_count,
    created_at
FROM published_blog_posts 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 6: Check for any posts that failed to migrate
SELECT 'MIGRATION ISSUES CHECK' as step;
SELECT 
    COUNT(*) as posts_without_slug_in_blog_posts
FROM blog_posts 
WHERE slug IS NULL OR slug = '';

-- Step 7: Show summary
SELECT 
    'FINAL SUMMARY' as step,
    (SELECT COUNT(*) FROM blog_posts) as original_posts,
    (SELECT COUNT(*) FROM published_blog_posts) as migrated_posts,
    (SELECT COUNT(*) FROM blog_posts) - (SELECT COUNT(*) FROM published_blog_posts) as difference;
