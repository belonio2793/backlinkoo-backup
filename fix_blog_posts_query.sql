-- Run this in your Supabase SQL Editor to fix the missing blog posts

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
    expires_at
) VALUES 

-- The DJ Tiesto post that's missing
(
    'the-ultimate-guide-to-dj-tiesto-mee5frci',
    'The Ultimate Guide to DJ Tiesto',
    '<h1>The Ultimate Guide to DJ Tiesto</h1>

<p>DJ Tiësto, born Tijs Michiel Verwest, is one of the most influential figures in electronic dance music. With a career spanning over two decades, he has shaped the global dance music scene and inspired countless artists.</p>

<h2>Early Career and Rise to Fame</h2>

<p>Tiësto began his career in the late 1990s, quickly establishing himself as a pioneer in trance music. His breakthrough came with his residency at Gatecrasher and his legendary performances at major festivals worldwide.</p>

<h2>Musical Evolution</h2>

<p>Over the years, Tiësto has evolved his sound, transitioning from trance to progressive house, electro house, and big room house. This evolution has kept him relevant and at the forefront of electronic music.</p>

<h2>Major Achievements</h2>

<ul>
<li>First DJ to play solo at the Olympics (Athens 2004)</li>
<li>Multiple Grammy nominations</li>
<li>Consistent ranking in DJ Mag Top 100 DJs</li>
<li>Over 36 million monthly Spotify listeners</li>
</ul>

<h2>Impact on EDM Culture</h2>

<p>Tiësto''s influence extends beyond music production. He has helped bring electronic dance music into mainstream culture and continues to mentor new artists in the industry.</p>

<p>Whether you''re a longtime fan or new to electronic music, understanding Tiësto''s contributions to the genre provides insight into the evolution of modern dance music.</p>',
    'Discover the legendary career of DJ Tiësto, from his trance roots to becoming a global EDM icon.',
    'Understanding DJ Tiësto has become more important than ever in the electronic music world.',
    ARRAY['ultimate', 'guide', 'tiësto', 'edm', 'electronic music', 'trance'],
    'https://tiësto.com',
    'https://backlinkoo.com/blog/the-ultimate-guide-to-dj-tiesto-mee5frci',
    'published',
    false,
    0,
    88,
    7,
    680,
    'Backlinkoo Team',
    ARRAY['music', 'edm', 'dj'],
    'General',
    false,
    '2025-08-16 23:59:59'::timestamptz
),

-- The Pastebin post that's also missing
(
    'the-ultimate-guide-to-pastebin-mee3h6rh',
    'The Ultimate Guide to Pastebin',
    '<h1>The Ultimate Guide to Pastebin</h1>

<p>Pastebin is a web application where users can store plain text online for a set period of time. It''s incredibly useful for sharing code snippets, configuration files, logs, and other text-based content.</p>

<h2>What is Pastebin?</h2>

<p>Pastebin allows you to:</p>
<ul>
<li>Share code snippets quickly and easily</li>
<li>Store temporary notes and documentation</li>
<li>Share logs and configuration files</li>
<li>Collaborate on text-based content</li>
<li>Set expiration dates for automatic cleanup</li>
</ul>

<h2>How to Use Pastebin Effectively</h2>

<p>Using Pastebin is straightforward:</p>
<ol>
<li>Visit pastebin.com</li>
<li>Paste your content in the text area</li>
<li>Choose appropriate syntax highlighting</li>
<li>Set expiration time and privacy settings</li>
<li>Click "Create New Paste"</li>
</ol>

<h2>Best Practices for Developers</h2>

<p>Here are some tips for using Pastebin effectively:</p>
<ul>
<li>Use descriptive titles for your pastes</li>
<li>Choose appropriate syntax highlighting</li>
<li>Set reasonable expiration times</li>
<li>Never share sensitive information like passwords</li>
<li>Use private pastes for confidential code</li>
</ul>

<h2>Alternatives and Similar Services</h2>

<p>While Pastebin is popular, there are several alternatives worth considering, including GitHub Gists, JSFiddle, and CodePen for different use cases.</p>

<p>Whether you''re a developer sharing code or just someone who needs to share text quickly, Pastebin remains an invaluable tool for modern web users.</p>',
    'Learn everything about Pastebin - the ultimate text sharing platform for developers and users.',
    'Understanding Pastebin has become more important than ever for developers and content creators.',
    ARRAY['ultimate', 'guide', 'pastebin', 'code sharing', 'developer tools'],
    'https://Pastebin.com',
    'https://backlinkoo.com/blog/the-ultimate-guide-to-pastebin-mee3h6rh',
    'published',
    false,
    0,
    85,
    6,
    590,
    'Backlinkoo Team',
    ARRAY['developer tools', 'productivity', 'coding'],
    'General',
    false,
    '2025-08-16 23:59:59'::timestamptz
);

-- Verify the posts were created
SELECT slug, title, status FROM published_blog_posts WHERE slug IN (
    'the-ultimate-guide-to-dj-tiesto-mee5frci',
    'the-ultimate-guide-to-pastebin-mee3h6rh'
);
