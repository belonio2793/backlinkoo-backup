-- Admin function to delete blog posts bypassing RLS
-- This should be run in your Supabase SQL editor

CREATE OR REPLACE FUNCTION delete_blog_post_admin(post_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete the blog post by slug
  DELETE FROM blog_posts WHERE slug = post_slug;
  
  -- Return true if a row was deleted
  RETURN FOUND;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_blog_post_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_blog_post_admin(TEXT) TO anon;
