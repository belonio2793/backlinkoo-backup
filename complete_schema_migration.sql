-- COMPLETE SCHEMA MIGRATION: blog_posts → published_blog_posts
-- This will copy all data and handle schema differences

-- Step 1: Check current state of both tables
SELECT 'MIGRATION ANALYSIS' as step;

-- Count records in each table
SELECT 
    'blog_posts' as table_name, 
    COUNT(*) as total_records,
    COUNT(CASE WHEN slug IS NOT NULL THEN 1 END) as with_slug,
    COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
    COUNT(CASE WHEN title IS NOT NULL THEN 1 END) as with_title,
    COUNT(CASE WHEN content IS NOT NULL THEN 1 END) as with_content
FROM blog_posts
UNION ALL
SELECT 
    'published_blog_posts',
    COUNT(*),
    COUNT(CASE WHEN slug IS NOT NULL THEN 1 END),
    COUNT(CASE WHEN status = 'published' THEN 1 END),
    COUNT(CASE WHEN title IS NOT NULL THEN 1 END),
    COUNT(CASE WHEN content IS NOT NULL THEN 1 END)
FROM published_blog_posts;

-- Show sample data from blog_posts
SELECT 'SAMPLE blog_posts DATA' as info;
SELECT 
    id, 
    slug, 
    title, 
    status,
    CASE WHEN created_at IS NOT NULL THEN 'HAS_DATE' ELSE 'NO_DATE' END as has_created_at,
    CASE WHEN user_id IS NOT NULL THEN 'HAS_USER' ELSE 'NO_USER' END as has_user,
    length(content) as content_length
FROM blog_posts 
ORDER BY created_at DESC NULLS LAST
LIMIT 5;

-- Check for the specific missing post
SELECT 'CHECKING FOR MISSING POST' as check_type;
SELECT 
    'blog_posts' as table_name,
    COUNT(*) as found_count
FROM blog_posts 
WHERE slug = 'the-ultimate-guide-to-skibidi-your-definitive-resource-me2neu4l'
UNION ALL
SELECT 
    'published_blog_posts',
    COUNT(*)
FROM published_blog_posts 
WHERE slug = 'the-ultimate-guide-to-skibidi-your-definitive-resource-me2neu4l';

-- Step 2: Comprehensive data migration with proper column handling
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
    -- User and identity fields
    user_id,
    
    -- Slug - ensure it's not null and unique
    CASE 
        WHEN slug IS NOT NULL AND slug != '' THEN slug
        WHEN title IS NOT NULL THEN 
            lower(
                regexp_replace(
                    regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
                    '\s+', '-', 'g'
                )
            ) || '-' || substring(id::text, 1, 8)
        ELSE 'post-' || id::text
    END as slug,
    
    -- Core content fields
    title,
    content,
    
    -- Meta description - generate if missing
    CASE 
        WHEN meta_description IS NOT NULL AND meta_description != '' THEN meta_description
        WHEN content IS NOT NULL THEN 
            CASE 
                WHEN length(content) > 160 THEN substring(regexp_replace(content, '<[^>]*>', '', 'g'), 1, 157) || '...'
                ELSE regexp_replace(content, '<[^>]*>', '', 'g')
            END
        ELSE 'Blog post about ' || COALESCE(title, 'various topics')
    END as meta_description,
    
    -- Excerpt - generate if missing
    CASE 
        WHEN excerpt IS NOT NULL AND excerpt != '' THEN excerpt
        WHEN content IS NOT NULL THEN 
            CASE 
                WHEN length(content) > 200 THEN substring(regexp_replace(content, '<[^>]*>', '', 'g'), 1, 197) || '...'
                ELSE regexp_replace(content, '<[^>]*>', '', 'g')
            END
        ELSE 'Read more about ' || COALESCE(title, 'this topic')
    END as excerpt,
    
    -- Keywords - handle TEXT to TEXT[] conversion
    CASE 
        WHEN keywords IS NOT NULL AND keywords != '' THEN 
            -- Convert comma-separated string to array
            ARRAY(
                SELECT TRIM(unnest(string_to_array(keywords, ',')))
                WHERE TRIM(unnest(string_to_array(keywords, ','))) != ''
            )
        WHEN title IS NOT NULL THEN
            -- Generate keywords from title
            ARRAY(
                SELECT DISTINCT lower(word)
                FROM unnest(string_to_array(regexp_replace(title, '[^a-zA-Z0-9\s]', ' ', 'g'), ' ')) AS word
                WHERE length(word) > 3
                LIMIT 5
            ) || ARRAY['seo', 'guide']
        ELSE ARRAY['blog', 'post', 'seo']::text[]
    END as keywords,
    
    -- URLs
    COALESCE(target_url, 'https://example.com') as target_url,
    
    CASE 
        WHEN published_url IS NOT NULL AND published_url != '' THEN published_url
        ELSE 'https://backlinkoo.com/blog/' || 
             CASE 
                 WHEN slug IS NOT NULL AND slug != '' THEN slug
                 WHEN title IS NOT NULL THEN 
                     lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || substring(id::text, 1, 8)
                 ELSE 'post-' || id::text
             END
    END as published_url,
    
    -- Status and flags
    COALESCE(status, 'published') as status,
    COALESCE(is_trial_post, false) as is_trial_post,
    
    -- Handle expires_at - fix null string issue
    CASE 
        WHEN expires_at IS NOT NULL THEN expires_at
        WHEN is_trial_post = true THEN (NOW() + INTERVAL '24 hours')
        ELSE NULL
    END as expires_at,
    
    -- Metrics with defaults
    COALESCE(view_count, 0) as view_count,
    COALESCE(seo_score, 75) as seo_score,
    
    -- Reading time calculation
    CASE 
        WHEN reading_time IS NOT NULL AND reading_time > 0 THEN reading_time
        WHEN word_count IS NOT NULL AND word_count > 0 THEN GREATEST(1, CEIL(word_count::numeric / 200.0)::integer)
        WHEN content IS NOT NULL THEN GREATEST(1, CEIL(length(regexp_replace(content, '<[^>]*>', '', 'g'))::numeric / 1000.0)::integer)
        ELSE 3
    END as reading_time,
    
    -- Word count calculation
    CASE 
        WHEN word_count IS NOT NULL AND word_count > 0 THEN word_count
        WHEN content IS NOT NULL THEN 
            GREATEST(1, array_length(string_to_array(regexp_replace(content, '<[^>]*>', ' ', 'g'), ' '), 1))
        ELSE 300
    END as word_count,
    
    -- Author information
    COALESCE(author_name, 'Backlinkoo Team') as author_name,
    
    -- Tags - ensure array format
    CASE 
        WHEN tags IS NOT NULL AND array_length(tags, 1) > 0 THEN tags
        WHEN category IS NOT NULL THEN ARRAY[lower(category)]
        ELSE ARRAY['blog', 'seo', 'marketing']::text[]
    END as tags,
    
    -- Category
    COALESCE(category, 'General') as category,
    
    -- Timestamps - handle nulls properly
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, created_at, NOW()) as updated_at,
    COALESCE(published_at, created_at, NOW()) as published_at,
    
    -- SEO fields
    anchor_text,
    
    -- Claiming fields
    COALESCE(claimed, false) as is_claimed,
    CASE WHEN claimed = true THEN user_id ELSE NULL END as claimed_by,
    CASE WHEN claimed = true THEN COALESCE(updated_at, NOW()) ELSE NULL END as claimed_at

FROM blog_posts
WHERE 
    title IS NOT NULL 
    AND content IS NOT NULL
    AND title != ''
    AND content != ''
    -- Only migrate posts not already in published_blog_posts
    AND NOT EXISTS (
        SELECT 1 
        FROM published_blog_posts pbp 
        WHERE pbp.slug = CASE 
            WHEN blog_posts.slug IS NOT NULL AND blog_posts.slug != '' THEN blog_posts.slug
            WHEN blog_posts.title IS NOT NULL THEN 
                lower(regexp_replace(regexp_replace(blog_posts.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || substring(blog_posts.id::text, 1, 8)
            ELSE 'post-' || blog_posts.id::text
        END
    )
ON CONFLICT (slug) DO UPDATE SET
    -- Update existing posts with latest data
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    meta_description = EXCLUDED.meta_description,
    excerpt = EXCLUDED.excerpt,
    keywords = EXCLUDED.keywords,
    target_url = EXCLUDED.target_url,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Step 3: Verify migration results
SELECT 'MIGRATION RESULTS' as step;

-- Show final counts
SELECT 
    'After migration' as status,
    table_name,
    record_count,
    published_count
FROM (
    SELECT 
        'blog_posts' as table_name, 
        COUNT(*) as record_count,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_count
    FROM blog_posts
    UNION ALL
    SELECT 
        'published_blog_posts',
        COUNT(*),
        COUNT(CASE WHEN status = 'published' THEN 1 END)
    FROM published_blog_posts
) t
ORDER BY table_name;

-- Check if the specific missing post is now available
SELECT 'MISSING POST CHECK' as check_type;
SELECT 
    slug, 
    title, 
    status,
    created_at,
    'NOW AVAILABLE' as availability
FROM published_blog_posts 
WHERE slug = 'the-ultimate-guide-to-skibidi-your-definitive-resource-me2neu4l'
UNION ALL
SELECT 
    'No post found' as slug,
    'Missing post still not found' as title,
    'N/A' as status,
    NOW() as created_at,
    'STILL MISSING' as availability
WHERE NOT EXISTS (
    SELECT 1 FROM published_blog_posts 
    WHERE slug = 'the-ultimate-guide-to-skibidi-your-definitive-resource-me2neu4l'
);

-- Show sample of migrated posts
SELECT 'MIGRATED POSTS SAMPLE' as info;
SELECT 
    slug,
    title,
    status,
    is_claimed,
    array_length(keywords, 1) as keyword_count,
    array_length(tags, 1) as tag_count,
    reading_time,
    word_count,
    created_at
FROM published_blog_posts 
ORDER BY created_at DESC 
LIMIT 10;

-- Final summary
SELECT 
    'MIGRATION SUMMARY' as summary,
    (SELECT COUNT(*) FROM blog_posts) as source_posts,
    (SELECT COUNT(*) FROM published_blog_posts) as target_posts,
    (SELECT COUNT(*) FROM published_blog_posts WHERE status = 'published') as published_posts,
    (SELECT COUNT(*) FROM published_blog_posts WHERE is_trial_post = true) as trial_posts,
    (SELECT COUNT(*) FROM published_blog_posts WHERE is_claimed = true) as claimed_posts;
