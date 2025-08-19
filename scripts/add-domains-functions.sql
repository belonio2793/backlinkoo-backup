-- Function to safely increment published pages counter
CREATE OR REPLACE FUNCTION increment_published_pages(domain_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE domains 
  SET 
    pages_published = pages_published + 1,
    updated_at = now()
  WHERE id = domain_id AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get domain blog stats
CREATE OR REPLACE FUNCTION get_domain_blog_stats(user_id_param uuid)
RETURNS TABLE(
  total_domains bigint,
  active_domains bigint,
  blog_enabled_domains bigint,
  total_pages_published bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_domains,
    COUNT(*) FILTER (WHERE status = 'active') as active_domains,
    COUNT(*) FILTER (WHERE blog_enabled = true) as blog_enabled_domains,
    COALESCE(SUM(pages_published), 0) as total_pages_published
  FROM domains 
  WHERE domains.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_published_pages(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_domain_blog_stats(uuid) TO authenticated;
