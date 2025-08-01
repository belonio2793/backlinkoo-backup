-- COMPLETE SECURITY PROTOCOL REMOVAL
-- This script removes ALL security restrictions from the blog_posts table
-- WARNING: This makes the table completely open to all operations

-- 1. Drop ALL existing policies
DROP POLICY IF EXISTS "Public can read published posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can manage their own posts" ON blog_posts;
DROP POLICY IF EXISTS "Anyone can delete unclaimed posts" ON blog_posts;
DROP POLICY IF EXISTS "Only owners can delete claimed posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can delete own claimed posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can manage all posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow anonymous post creation" ON blog_posts;
DROP POLICY IF EXISTS "Allow authenticated post creation" ON blog_posts;
DROP POLICY IF EXISTS "Allow blog post creation" ON blog_posts;
DROP POLICY IF EXISTS "Users can update posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow all operations" ON blog_posts;

-- 2. DISABLE Row Level Security completely
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;

-- 3. Grant full access to all roles
GRANT ALL PRIVILEGES ON blog_posts TO PUBLIC;
GRANT ALL PRIVILEGES ON blog_posts TO anon;
GRANT ALL PRIVILEGES ON blog_posts TO authenticated;

-- 4. Grant sequence permissions for auto-incrementing IDs
GRANT ALL ON SEQUENCE blog_posts_id_seq TO PUBLIC;
GRANT ALL ON SEQUENCE blog_posts_id_seq TO anon;
GRANT ALL ON SEQUENCE blog_posts_id_seq TO authenticated;

-- 5. Test unrestricted access by creating a test post
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
  'No Security Test Post',
  'no-security-test-' || extract(epoch from now()),
  '<p>This post was created without any security restrictions.</p>',
  'https://example.com',
  'published',
  true,
  false,
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 6. Verify the test worked
SELECT 
  'Security Removal Test' as test_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM blog_posts WHERE title = 'No Security Test Post') 
    THEN 'SUCCESS - Blog posts can now be created without restrictions' 
    ELSE 'FAILED - Still blocked by some security measure' 
  END as result;

-- 7. Show current table permissions
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'blog_posts'
ORDER BY grantee, privilege_type;

-- 8. Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'blog_posts';

-- 9. Clean up test post
DELETE FROM blog_posts WHERE title = 'No Security Test Post';

-- Success message
SELECT 'ALL SECURITY PROTOCOLS HAVE BEEN REMOVED FROM blog_posts TABLE!' as status,
       'The table is now completely open for all operations.' as warning;
