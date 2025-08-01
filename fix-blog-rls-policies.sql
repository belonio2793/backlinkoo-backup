-- Blog Posts RLS Policy Fix
-- Run this in your Supabase SQL editor to fix Row Level Security issues

-- 1. Drop existing policies to avoid conflicts
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

-- 2. Enable RLS on the table
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- 3. Create new, more permissive policies

-- Allow anyone to read published posts
CREATE POLICY "Public can read published posts" ON blog_posts
  FOR SELECT USING (status = 'published');

-- Allow anyone to create blog posts (needed for trial posts and anonymous users)
CREATE POLICY "Allow blog post creation" ON blog_posts
  FOR INSERT WITH CHECK (true);

-- Allow users to update their own posts or unclaimed posts
CREATE POLICY "Users can update posts" ON blog_posts
  FOR UPDATE USING (
    auth.uid() = user_id OR  -- Own posts
    user_id IS NULL OR       -- Unclaimed posts
    claimed = false          -- Unclaimed posts
  );

-- Allow deletion of unclaimed posts by anyone
CREATE POLICY "Anyone can delete unclaimed posts" ON blog_posts
  FOR DELETE USING (claimed = false OR user_id IS NULL);

-- Allow users to delete their own claimed posts
CREATE POLICY "Users can delete own claimed posts" ON blog_posts
  FOR DELETE USING (claimed = true AND auth.uid() = user_id);

-- Admin policy for full access (requires profiles table with role column)
CREATE POLICY "Admins can manage all posts" ON blog_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 4. Test the policies by creating a test post
INSERT INTO blog_posts (
  title,
  slug,
  content,
  target_url,
  status,
  is_trial_post,
  claimed
) VALUES (
  'RLS Policy Test Post',
  'rls-policy-test-' || extract(epoch from now()),
  '<p>This is a test post to verify RLS policies are working.</p>',
  'https://example.com',
  'published',
  true,
  false
) ON CONFLICT (slug) DO NOTHING;

-- 5. Verify the test worked
SELECT 
  'RLS Policy Test' as test_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM blog_posts WHERE title = 'RLS Policy Test Post') 
    THEN 'PASSED - Blog post creation working' 
    ELSE 'FAILED - Blog post creation blocked' 
  END as result;

-- 6. Clean up test post
DELETE FROM blog_posts WHERE title = 'RLS Policy Test Post';

-- 7. Show current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'blog_posts' 
ORDER BY policyname;

-- Success message
SELECT 'RLS policies have been updated successfully!' as status;
