-- Create sample blog posts to restore functionality
-- This will create the missing "pastebin" blog post and others

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
    is_claimed,
    claimed_by,
    claimed_at
) VALUES 

-- The specific pastebin post that was mentioned in the error
(
    'the-ultimate-guide-to-pastebin-mee3h6rh',
    'The Ultimate Guide to Pastebin',
    '<h1>The Ultimate Guide to Pastebin</h1>

<p>Pastebin is a web application where users can store plain text online for a set period of time. It''s incredibly useful for sharing code snippets, configuration files, logs, and other text-based content.</p>

<h2>What is Pastebin?</h2>

<p>Pastebin allows you to:</p>
<ul>
<li>Share code snippets quickly</li>
<li>Store temporary notes</li>
<li>Share logs and configuration files</li>
<li>Collaborate on text-based content</li>
</ul>

<h2>How to Use Pastebin</h2>

<p>Using Pastebin is straightforward:</p>
<ol>
<li>Visit pastebin.com</li>
<li>Paste your content in the text area</li>
<li>Choose expiration time</li>
<li>Set privacy settings</li>
<li>Click "Create New Paste"</li>
</ol>

<h2>Best Practices</h2>

<p>Here are some tips for using Pastebin effectively:</p>
<ul>
<li>Use appropriate syntax highlighting</li>
<li>Set reasonable expiration times</li>
<li>Don''t share sensitive information</li>
<li>Use descriptive titles</li>
</ul>

<p>Whether you''re a developer sharing code or just someone who needs to share text quickly, Pastebin is an invaluable tool for modern web users.</p>',
    'Learn everything about Pastebin - the ultimate text sharing platform for developers and users.',
    'Pastebin is the ultimate text sharing platform. Learn how to use it effectively for code sharing, collaboration, and more.',
    ARRAY['pastebin', 'text sharing', 'code snippets', 'developer tools', 'collaboration'],
    'https://pastebin.com',
    'https://backlinkoo.com/blog/the-ultimate-guide-to-pastebin-mee3h6rh',
    'published',
    false,
    0,
    85,
    5,
    500,
    'Backlinkoo Team',
    ARRAY['tutorials', 'developer tools', 'productivity'],
    'Technology',
    false,
    NULL,
    NULL
),

-- Additional sample posts
(
    'seo-guide-for-beginners',
    'SEO Guide for Beginners',
    '<h1>SEO Guide for Beginners</h1>

<p>Search Engine Optimization (SEO) is crucial for online visibility. This comprehensive guide will help you understand and implement basic SEO strategies.</p>

<h2>What is SEO?</h2>

<p>SEO is the practice of optimizing your website to rank higher in search engine results pages (SERPs).</p>

<h2>Key SEO Factors</h2>

<ul>
<li>Quality content creation</li>
<li>Keyword research and optimization</li>
<li>Technical SEO improvements</li>
<li>Link building strategies</li>
<li>User experience optimization</li>
</ul>

<h2>Getting Started</h2>

<p>Start with these fundamental steps:</p>
<ol>
<li>Research your target keywords</li>
<li>Optimize your page titles and meta descriptions</li>
<li>Create high-quality, relevant content</li>
<li>Improve your website''s loading speed</li>
<li>Build quality backlinks</li>
</ol>

<p>Remember, SEO is a long-term strategy that requires patience and consistency.</p>',
    'Learn the fundamentals of SEO with this comprehensive beginner''s guide.',
    'Master the basics of Search Engine Optimization with our step-by-step guide for beginners.',
    ARRAY['seo', 'search engine optimization', 'digital marketing', 'beginners guide'],
    'https://example.com/seo',
    'https://backlinkoo.com/blog/seo-guide-for-beginners',
    'published',
    false,
    15,
    90,
    8,
    650,
    'Backlinkoo Team',
    ARRAY['seo', 'digital marketing', 'tutorials'],
    'Digital Marketing',
    false,
    NULL,
    NULL
),

(
    'backlink-building-strategies-2024',
    'Backlink Building Strategies for 2024',
    '<h1>Backlink Building Strategies for 2024</h1>

<p>Backlinks remain one of the most important ranking factors for search engines. Here''s how to build quality backlinks in 2024.</p>

<h2>What Are Backlinks?</h2>

<p>Backlinks are links from other websites that point to your site. They''re like votes of confidence in your content.</p>

<h2>Effective Strategies</h2>

<ul>
<li>Guest posting on relevant sites</li>
<li>Creating linkable assets</li>
<li>Broken link building</li>
<li>Resource page link building</li>
<li>HARO (Help a Reporter Out)</li>
</ul>

<h2>Quality Over Quantity</h2>

<p>Focus on getting backlinks from:</p>
<ul>
<li>High domain authority sites</li>
<li>Relevant industry websites</li>
<li>Sites with real traffic</li>
<li>Trusted sources</li>
</ul>

<p>Building quality backlinks takes time, but the results are worth the effort.</p>',
    'Discover effective backlink building strategies for 2024 to improve your search rankings.',
    'Learn the most effective backlink building strategies for 2024 and boost your website''s authority.',
    ARRAY['backlinks', 'link building', 'seo strategy', '2024 tactics'],
    'https://example.com/link-building',
    'https://backlinkoo.com/blog/backlink-building-strategies-2024',
    'published',
    false,
    8,
    88,
    6,
    450,
    'Backlinkoo Team',
    ARRAY['backlinks', 'seo', 'link building'],
    'Digital Marketing',
    false,
    NULL,
    NULL
);

-- Check what was created
SELECT 'Created blog posts:' as status;
SELECT slug, title, status, view_count FROM published_blog_posts ORDER BY created_at DESC;
