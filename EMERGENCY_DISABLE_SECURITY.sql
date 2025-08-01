-- EMERGENCY SECURITY DISABLE SCRIPT
-- Copy and paste this entire script into your Supabase SQL Editor and execute it
-- This will immediately remove all security restrictions from blog_posts

-- 1. Drop ALL policies (no matter what they're called)
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'blog_posts'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON blog_posts', pol.policyname);
    END LOOP;
END $$;

-- 2. Completely disable RLS
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;

-- 3. Grant ALL permissions to everyone
GRANT ALL PRIVILEGES ON TABLE blog_posts TO PUBLIC;
GRANT ALL PRIVILEGES ON TABLE blog_posts TO anon;
GRANT ALL PRIVILEGES ON TABLE blog_posts TO authenticated;

-- 4. Grant sequence access
GRANT ALL ON SEQUENCE blog_posts_id_seq TO PUBLIC;
GRANT ALL ON SEQUENCE blog_posts_id_seq TO anon; 
GRANT ALL ON SEQUENCE blog_posts_id_seq TO authenticated;

-- 5. Test that it works
INSERT INTO blog_posts (
    title, 
    slug, 
    content, 
    status,
    created_at
) VALUES (
    'EMERGENCY TEST POST', 
    'emergency-test-' || extract(epoch from now()), 
    '<p>This post confirms security has been disabled</p>',
    'published',
    now()
);

-- 6. Verify it was created
SELECT 
    'SUCCESS: Security disabled, post created!' as result
WHERE EXISTS (
    SELECT 1 FROM blog_posts WHERE title = 'EMERGENCY TEST POST'
);

-- 7. Clean up test
DELETE FROM blog_posts WHERE title = 'EMERGENCY TEST POST';

-- 8. Final confirmation
SELECT 
    'SECURITY PROTOCOLS COMPLETELY DISABLED' as status,
    'Blog posts can now be created without restrictions' as message;
