-- BLOG POST CONTENT ANALYZER AND BEAUTIFIER
-- This will scan all blog posts and identify structural issues

-- Step 1: Analyze current blog post content structure
SELECT 'BLOG POST CONTENT ANALYSIS' as analysis_type;

SELECT 
    slug,
    title,
    -- Content structure analysis
    CASE 
        WHEN content IS NULL OR content = '' THEN 'EMPTY_CONTENT'
        WHEN content NOT LIKE '%<h1>%' AND content NOT LIKE '%<h2>%' THEN 'NO_HEADINGS'
        WHEN content LIKE '%<h1>%' THEN 'HAS_H1'
        ELSE 'BASIC_CONTENT'
    END as content_structure,
    
    -- Length analysis
    length(content) as content_length,
    
    -- HTML structure check
    CASE 
        WHEN content LIKE '%<h1>%' THEN 'HAS_H1'
        ELSE 'NO_H1'
    END as has_h1,
    
    CASE 
        WHEN content LIKE '%<h2>%' THEN 'HAS_H2'
        ELSE 'NO_H2'
    END as has_h2,
    
    CASE 
        WHEN content LIKE '%<p>%' THEN 'HAS_PARAGRAPHS'
        ELSE 'NO_PARAGRAPHS'
    END as has_paragraphs,
    
    CASE 
        WHEN content LIKE '%<ul>%' OR content LIKE '%<ol>%' THEN 'HAS_LISTS'
        ELSE 'NO_LISTS'
    END as has_lists,
    
    -- Meta data check
    CASE 
        WHEN meta_description IS NULL OR meta_description = '' THEN 'NO_META'
        WHEN length(meta_description) < 120 THEN 'SHORT_META'
        WHEN length(meta_description) > 160 THEN 'LONG_META'
        ELSE 'GOOD_META'
    END as meta_quality,
    
    CASE 
        WHEN excerpt IS NULL OR excerpt = '' THEN 'NO_EXCERPT'
        WHEN length(excerpt) < 100 THEN 'SHORT_EXCERPT'
        ELSE 'GOOD_EXCERPT'
    END as excerpt_quality,
    
    -- Keywords analysis
    array_length(keywords, 1) as keyword_count,
    
    -- Word count analysis
    CASE 
        WHEN word_count < 300 THEN 'TOO_SHORT'
        WHEN word_count > 2000 THEN 'TOO_LONG'
        ELSE 'GOOD_LENGTH'
    END as content_length_quality,
    
    status,
    created_at

FROM published_blog_posts 
ORDER BY created_at DESC;

-- Step 2: Identify posts with structural issues
SELECT 'POSTS NEEDING FIXES' as fix_category;

SELECT 
    slug,
    title,
    'CONTENT_ISSUES' as issue_type,
    ARRAY[
        CASE WHEN content IS NULL OR content = '' THEN 'empty_content' END,
        CASE WHEN content NOT LIKE '%<h1>%' THEN 'missing_h1' END,
        CASE WHEN content NOT LIKE '%<h2>%' THEN 'missing_h2' END,
        CASE WHEN content NOT LIKE '%<p>%' THEN 'missing_paragraphs' END,
        CASE WHEN meta_description IS NULL OR meta_description = '' THEN 'missing_meta' END,
        CASE WHEN excerpt IS NULL OR excerpt = '' THEN 'missing_excerpt' END,
        CASE WHEN array_length(keywords, 1) IS NULL OR array_length(keywords, 1) < 3 THEN 'insufficient_keywords' END,
        CASE WHEN word_count < 300 THEN 'too_short' END
    ] as issues

FROM published_blog_posts 
WHERE 
    content IS NULL OR content = '' OR
    content NOT LIKE '%<h1>%' OR
    content NOT LIKE '%<h2>%' OR
    content NOT LIKE '%<p>%' OR
    meta_description IS NULL OR meta_description = '' OR
    excerpt IS NULL OR excerpt = '' OR
    array_length(keywords, 1) IS NULL OR array_length(keywords, 1) < 3 OR
    word_count < 300
ORDER BY created_at DESC;

-- Step 3: Sample content to see what needs beautification
SELECT 'SAMPLE CONTENT FOR REVIEW' as sample_type;

SELECT 
    slug,
    title,
    substring(content, 1, 200) || '...' as content_preview,
    meta_description,
    excerpt,
    keywords,
    word_count
FROM published_blog_posts 
WHERE content IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Step 4: Count posts by quality
SELECT 'QUALITY SUMMARY' as summary_type;

SELECT 
    'Total Posts' as metric,
    COUNT(*) as count
FROM published_blog_posts
UNION ALL
SELECT 
    'Posts with Good Structure',
    COUNT(*)
FROM published_blog_posts 
WHERE content LIKE '%<h1>%' AND content LIKE '%<h2>%' AND content LIKE '%<p>%'
UNION ALL
SELECT 
    'Posts Missing H1',
    COUNT(*)
FROM published_blog_posts 
WHERE content NOT LIKE '%<h1>%' OR content IS NULL
UNION ALL
SELECT 
    'Posts Missing Meta Description',
    COUNT(*)
FROM published_blog_posts 
WHERE meta_description IS NULL OR meta_description = ''
UNION ALL
SELECT 
    'Posts with Insufficient Keywords',
    COUNT(*)
FROM published_blog_posts 
WHERE array_length(keywords, 1) IS NULL OR array_length(keywords, 1) < 3;
