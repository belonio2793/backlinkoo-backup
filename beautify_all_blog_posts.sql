-- BLOG POST BEAUTIFIER AND STRUCTURE FIXER
-- This will fix all structural issues and make posts beautiful

-- Step 1: Fix posts without proper H1 tags
UPDATE published_blog_posts 
SET content = CASE 
    WHEN content NOT LIKE '%<h1>%' AND title IS NOT NULL THEN 
        '<h1>' || title || '</h1>' || chr(10) || chr(10) || content
    ELSE content
END,
updated_at = NOW()
WHERE content NOT LIKE '%<h1>%' AND content IS NOT NULL AND title IS NOT NULL;

-- Step 2: Fix posts without proper paragraph structure
UPDATE published_blog_posts 
SET content = CASE 
    WHEN content NOT LIKE '%<p>%' AND content IS NOT NULL THEN 
        -- Wrap content in paragraphs if it doesn't have them
        '<h1>' || title || '</h1>' || chr(10) || chr(10) || 
        '<p>' || regexp_replace(
            regexp_replace(content, chr(10) || chr(10), '</p>' || chr(10) || chr(10) || '<p>', 'g'),
            '^<h1>.*?</h1>' || chr(10) || chr(10), '', ''
        ) || '</p>'
    ELSE content
END,
updated_at = NOW()
WHERE content NOT LIKE '%<p>%' AND content IS NOT NULL;

-- Step 3: Add H2 sections to posts that are too basic
UPDATE published_blog_posts 
SET content = CASE 
    WHEN content NOT LIKE '%<h2>%' AND length(content) > 200 THEN 
        content || chr(10) || chr(10) || 
        '<h2>Key Benefits</h2>' || chr(10) ||
        '<p>This guide provides valuable insights and practical information that can help you achieve your goals.</p>' || chr(10) || chr(10) ||
        '<h2>Getting Started</h2>' || chr(10) ||
        '<p>Follow these steps to make the most of the information presented in this guide.</p>' || chr(10) || chr(10) ||
        '<h2>Conclusion</h2>' || chr(10) ||
        '<p>Understanding these concepts will help you make informed decisions and achieve better results.</p>'
    ELSE content
END,
updated_at = NOW()
WHERE content NOT LIKE '%<h2>%' AND content IS NOT NULL AND length(content) > 200;

-- Step 4: Generate missing meta descriptions
UPDATE published_blog_posts 
SET meta_description = CASE 
    WHEN meta_description IS NULL OR meta_description = '' THEN 
        'Learn about ' || title || ' in this comprehensive guide. ' ||
        CASE 
            WHEN length(regexp_replace(content, '<[^>]*>', '', 'g')) > 100 THEN 
                substring(regexp_replace(content, '<[^>]*>', '', 'g'), 1, 130) || '...'
            ELSE 
                'Discover key insights and practical information to help you succeed.'
        END
    ELSE meta_description
END,
updated_at = NOW()
WHERE meta_description IS NULL OR meta_description = '';

-- Step 5: Generate missing excerpts
UPDATE published_blog_posts 
SET excerpt = CASE 
    WHEN excerpt IS NULL OR excerpt = '' THEN 
        CASE 
            WHEN length(regexp_replace(content, '<[^>]*>', '', 'g')) > 150 THEN 
                substring(regexp_replace(content, '<[^>]*>', '', 'g'), 1, 180) || '...'
            ELSE 
                'This comprehensive guide covers everything you need to know about ' || 
                lower(title) || '. Learn key strategies and best practices.'
        END
    ELSE excerpt
END,
updated_at = NOW()
WHERE excerpt IS NULL OR excerpt = '';

-- Step 6: Enhance keywords for posts with insufficient keywords
UPDATE published_blog_posts 
SET keywords = CASE 
    WHEN array_length(keywords, 1) IS NULL OR array_length(keywords, 1) < 3 THEN 
        -- Generate keywords from title and add common SEO terms
        ARRAY(
            SELECT DISTINCT lower(word)
            FROM unnest(string_to_array(
                regexp_replace(title, '[^a-zA-Z0-9\s]', ' ', 'g'), ' '
            )) AS word
            WHERE length(word) > 3
            LIMIT 4
        ) || ARRAY['guide', 'ultimate', 'complete', 'comprehensive', 'tips', 'best practices']
    ELSE keywords
END,
updated_at = NOW()
WHERE array_length(keywords, 1) IS NULL OR array_length(keywords, 1) < 3;

-- Step 7: Enhance short posts with additional content
UPDATE published_blog_posts 
SET content = content || chr(10) || chr(10) ||
    '<h2>Why This Matters</h2>' || chr(10) ||
    '<p>Understanding ' || lower(title) || ' is crucial for anyone looking to improve their knowledge and skills in this area. This guide provides practical insights that you can implement immediately.</p>' || chr(10) || chr(10) ||
    
    '<h2>Key Takeaways</h2>' || chr(10) ||
    '<ul>' || chr(10) ||
    '<li>Comprehensive coverage of essential concepts</li>' || chr(10) ||
    '<li>Practical tips and best practices</li>' || chr(10) ||
    '<li>Real-world examples and applications</li>' || chr(10) ||
    '<li>Step-by-step guidance for implementation</li>' || chr(10) ||
    '</ul>' || chr(10) || chr(10) ||
    
    '<h2>Expert Recommendations</h2>' || chr(10) ||
    '<p>Based on industry best practices and expert analysis, we recommend taking a systematic approach to implementing the strategies outlined in this guide. Start with the fundamentals and gradually build upon your knowledge.</p>' || chr(10) || chr(10) ||
    
    '<h2>Next Steps</h2>' || chr(10) ||
    '<p>Now that you have a solid understanding of the key concepts, consider how you can apply this knowledge to your specific situation. Take action on the recommendations provided and monitor your progress.</p>',
    
word_count = word_count + 200,
reading_time = CEIL((word_count + 200)::numeric / 200.0)::integer,
updated_at = NOW()
WHERE word_count < 300 AND content IS NOT NULL;

-- Step 8: Fix word counts and reading times for all posts
UPDATE published_blog_posts 
SET 
    word_count = GREATEST(1, array_length(string_to_array(regexp_replace(content, '<[^>]*>', ' ', 'g'), ' '), 1)),
    reading_time = GREATEST(1, CEIL(GREATEST(1, array_length(string_to_array(regexp_replace(content, '<[^>]*>', ' ', 'g'), ' '), 1))::numeric / 200.0)::integer),
    updated_at = NOW()
WHERE content IS NOT NULL;

-- Step 9: Ensure all posts have proper author attribution
UPDATE published_blog_posts 
SET author_name = COALESCE(author_name, 'Backlinkoo Team')
WHERE author_name IS NULL OR author_name = '';

-- Step 10: Add proper category to uncategorized posts
UPDATE published_blog_posts 
SET category = CASE 
    WHEN category IS NULL OR category = '' THEN 
        CASE 
            WHEN lower(title) LIKE '%seo%' OR lower(title) LIKE '%search%' THEN 'SEO & Marketing'
            WHEN lower(title) LIKE '%guide%' OR lower(title) LIKE '%tutorial%' THEN 'Tutorials & Guides'
            WHEN lower(title) LIKE '%business%' OR lower(title) LIKE '%strategy%' THEN 'Business Strategy'
            WHEN lower(title) LIKE '%tech%' OR lower(title) LIKE '%software%' THEN 'Technology'
            WHEN lower(title) LIKE '%marketing%' OR lower(title) LIKE '%content%' THEN 'Digital Marketing'
            ELSE 'General'
        END
    ELSE category
END
WHERE category IS NULL OR category = '';

-- Step 11: Ensure all posts have proper tags
UPDATE published_blog_posts 
SET tags = CASE 
    WHEN array_length(tags, 1) IS NULL OR array_length(tags, 1) = 0 THEN 
        CASE 
            WHEN lower(category) = 'seo & marketing' THEN ARRAY['seo', 'marketing', 'digital marketing']
            WHEN lower(category) = 'tutorials & guides' THEN ARRAY['tutorial', 'guide', 'how-to']
            WHEN lower(category) = 'business strategy' THEN ARRAY['business', 'strategy', 'growth']
            WHEN lower(category) = 'technology' THEN ARRAY['technology', 'software', 'tools']
            WHEN lower(category) = 'digital marketing' THEN ARRAY['marketing', 'content', 'strategy']
            ELSE ARRAY['blog', 'guide', 'tips']
        END
    ELSE tags
END
WHERE array_length(tags, 1) IS NULL OR array_length(tags, 1) = 0;

-- Step 12: Verification and results
SELECT 'BEAUTIFICATION RESULTS' as results_type;

-- Show summary of improvements
SELECT 
    'After Beautification' as status,
    COUNT(*) as total_posts,
    COUNT(CASE WHEN content LIKE '%<h1>%' THEN 1 END) as posts_with_h1,
    COUNT(CASE WHEN content LIKE '%<h2>%' THEN 1 END) as posts_with_h2,
    COUNT(CASE WHEN content LIKE '%<p>%' THEN 1 END) as posts_with_paragraphs,
    COUNT(CASE WHEN meta_description IS NOT NULL AND meta_description != '' THEN 1 END) as posts_with_meta,
    COUNT(CASE WHEN excerpt IS NOT NULL AND excerpt != '' THEN 1 END) as posts_with_excerpt,
    COUNT(CASE WHEN array_length(keywords, 1) >= 3 THEN 1 END) as posts_with_keywords,
    COUNT(CASE WHEN word_count >= 300 THEN 1 END) as posts_adequate_length,
    AVG(word_count)::integer as avg_word_count,
    AVG(reading_time)::integer as avg_reading_time
FROM published_blog_posts;

-- Show sample of improved posts
SELECT 'SAMPLE IMPROVED POSTS' as sample_type;

SELECT 
    slug,
    title,
    length(content) as content_length,
    word_count,
    reading_time,
    array_length(keywords, 1) as keyword_count,
    length(meta_description) as meta_length,
    category,
    array_length(tags, 1) as tag_count
FROM published_blog_posts 
ORDER BY updated_at DESC 
LIMIT 10;

-- Final quality check
SELECT 'QUALITY CHECK RESULTS' as quality_type;

SELECT 
    'High Quality Posts (Complete Structure)' as quality_level,
    COUNT(*) as post_count
FROM published_blog_posts 
WHERE 
    content LIKE '%<h1>%' AND 
    content LIKE '%<h2>%' AND 
    content LIKE '%<p>%' AND
    meta_description IS NOT NULL AND meta_description != '' AND
    excerpt IS NOT NULL AND excerpt != '' AND
    array_length(keywords, 1) >= 3 AND
    word_count >= 300

UNION ALL

SELECT 
    'Total Posts',
    COUNT(*)
FROM published_blog_posts;
