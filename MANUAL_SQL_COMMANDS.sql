-- COPY AND PASTE THESE COMMANDS INTO YOUR SUPABASE SQL EDITOR
-- EXECUTE THEM ONE BY ONE TO COMPLETELY DISABLE RLS

-- 1. DISABLE ROW LEVEL SECURITY
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;

-- 2. GRANT ALL PERMISSIONS TO PUBLIC
GRANT ALL PRIVILEGES ON TABLE blog_posts TO PUBLIC;

-- 3. GRANT PERMISSIONS TO ANONYMOUS USERS  
GRANT ALL PRIVILEGES ON TABLE blog_posts TO anon;

-- 4. GRANT PERMISSIONS TO AUTHENTICATED USERS
GRANT ALL PRIVILEGES ON TABLE blog_posts TO authenticated;

-- 5. GRANT SEQUENCE PERMISSIONS FOR AUTO-INCREMENT
GRANT ALL ON SEQUENCE blog_posts_id_seq TO PUBLIC;
GRANT ALL ON SEQUENCE blog_posts_id_seq TO anon;
GRANT ALL ON SEQUENCE blog_posts_id_seq TO authenticated;

-- 6. TEST THAT IT WORKS
INSERT INTO blog_posts (
    title, 
    slug, 
    content, 
    target_url,
    status,
    is_trial_post,
    claimed,
    created_at
) VALUES (
    'Manual SQL Test Post', 
    'manual-sql-test-' || extract(epoch from now()), 
    '<p>This post confirms that RLS has been manually disabled</p>',
    'https://example.com',
    'published',
    true,
    false,
    now()
);

-- 7. VERIFY SUCCESS
SELECT 'SUCCESS: RLS DISABLED AND POST CREATED!' as result
WHERE EXISTS (SELECT 1 FROM blog_posts WHERE title = 'Manual SQL Test Post');

-- 8. CLEAN UP TEST POST
DELETE FROM blog_posts WHERE title = 'Manual SQL Test Post';

-- 9. FINAL CONFIRMATION
SELECT 'RLS COMPLETELY DISABLED - BLOG CREATION SHOULD NOW WORK' as status;
