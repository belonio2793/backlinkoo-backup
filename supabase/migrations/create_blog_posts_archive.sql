-- Blog Posts Archive Table
-- Provides permanent storage for blog posts similar to credit transaction history
-- Ensures claimed posts are never lost and can be recovered

-- Create the archive table
CREATE TABLE IF NOT EXISTS blog_posts_archive (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_post_id UUID NOT NULL,
  archive_reason TEXT NOT NULL CHECK (archive_reason IN ('claim', 'backup', 'migration', 'safety')),
  archived_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  restored_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata for tracking
  archived_by_user_id UUID REFERENCES auth.users(id),
  archive_version TEXT DEFAULT '1.0',
  
  -- Indexes for performance
  CONSTRAINT blog_posts_archive_blog_post_id_reason_key UNIQUE(blog_post_id, archive_reason, created_at)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_archive_blog_post_id ON blog_posts_archive(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_archive_reason ON blog_posts_archive(archive_reason);
CREATE INDEX IF NOT EXISTS idx_blog_posts_archive_created_at ON blog_posts_archive(created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE blog_posts_archive ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own archived posts
CREATE POLICY "Users can view their own archived posts" ON blog_posts_archive
  FOR SELECT USING (
    archived_by_user_id = auth.uid() OR
    (archived_data->>'user_id')::uuid = auth.uid()
  );

-- Policy: Service role can manage all archives (for system operations)
CREATE POLICY "Service role can manage all archives" ON blog_posts_archive
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy: Authenticated users can create archives for their own posts
CREATE POLICY "Users can create archives for their own posts" ON blog_posts_archive
  FOR INSERT WITH CHECK (
    archived_by_user_id = auth.uid() OR
    (archived_data->>'user_id')::uuid = auth.uid()
  );

-- Function to automatically archive a blog post when it's claimed
CREATE OR REPLACE FUNCTION auto_archive_on_claim()
RETURNS TRIGGER AS $$
BEGIN
  -- Only archive when a post transitions from unclaimed to claimed
  IF OLD.user_id IS NULL AND NEW.user_id IS NOT NULL AND NEW.is_trial_post = false THEN
    INSERT INTO blog_posts_archive (
      blog_post_id,
      archive_reason,
      archived_data,
      archived_by_user_id
    ) VALUES (
      NEW.id,
      'claim',
      jsonb_build_object(
        'id', NEW.id,
        'title', NEW.title,
        'slug', NEW.slug,
        'content', NEW.content,
        'target_url', NEW.target_url,
        'user_id', NEW.user_id,
        'claimed_at', NEW.updated_at,
        'original_trial_status', OLD.is_trial_post,
        'archive_metadata', jsonb_build_object(
          'auto_archived', true,
          'trigger', 'claim_transition',
          'archived_at', NOW()
        )
      ),
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-archive on claim
DROP TRIGGER IF EXISTS trigger_auto_archive_on_claim ON blog_posts;
CREATE TRIGGER trigger_auto_archive_on_claim
  AFTER UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_archive_on_claim();

-- Function to restore a blog post from archive
CREATE OR REPLACE FUNCTION restore_blog_post_from_archive(
  archive_record_id UUID
)
RETURNS UUID AS $$
DECLARE
  archive_record RECORD;
  restored_post_id UUID;
BEGIN
  -- Get the archive record
  SELECT * INTO archive_record 
  FROM blog_posts_archive 
  WHERE id = archive_record_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Archive record not found';
  END IF;
  
  -- Insert the archived data back into blog_posts table
  INSERT INTO blog_posts (
    id, title, slug, content, excerpt, meta_description,
    keywords, tags, category, target_url, anchor_text,
    published_url, status, is_trial_post, expires_at,
    view_count, seo_score, reading_time, word_count,
    featured_image, author_name, author_avatar,
    contextual_links, user_id, created_at, updated_at,
    published_at
  )
  SELECT 
    (archive_record.archived_data->>'id')::uuid,
    archive_record.archived_data->>'title',
    archive_record.archived_data->>'slug',
    archive_record.archived_data->>'content',
    archive_record.archived_data->>'excerpt',
    archive_record.archived_data->>'meta_description',
    CASE 
      WHEN archive_record.archived_data->'keywords' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(archive_record.archived_data->'keywords'))
      ELSE ARRAY[]::text[]
    END,
    CASE 
      WHEN archive_record.archived_data->'tags' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(archive_record.archived_data->'tags'))
      ELSE ARRAY[]::text[]
    END,
    COALESCE(archive_record.archived_data->>'category', 'General'),
    archive_record.archived_data->>'target_url',
    archive_record.archived_data->>'anchor_text',
    archive_record.archived_data->>'published_url',
    COALESCE(archive_record.archived_data->>'status', 'published'),
    COALESCE((archive_record.archived_data->>'is_trial_post')::boolean, false),
    CASE 
      WHEN archive_record.archived_data->>'expires_at' = 'null' THEN NULL
      ELSE (archive_record.archived_data->>'expires_at')::timestamp with time zone
    END,
    COALESCE((archive_record.archived_data->>'view_count')::integer, 0),
    COALESCE((archive_record.archived_data->>'seo_score')::integer, 85),
    COALESCE((archive_record.archived_data->>'reading_time')::integer, 5),
    COALESCE((archive_record.archived_data->>'word_count')::integer, 1000),
    archive_record.archived_data->>'featured_image',
    COALESCE(archive_record.archived_data->>'author_name', 'AI Generator'),
    archive_record.archived_data->>'author_avatar',
    COALESCE(archive_record.archived_data->'contextual_links', '{}'::jsonb),
    (archive_record.archived_data->>'user_id')::uuid,
    COALESCE((archive_record.archived_data->>'created_at')::timestamp with time zone, NOW()),
    NOW(),
    COALESCE((archive_record.archived_data->>'published_at')::timestamp with time zone, NOW())
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    user_id = EXCLUDED.user_id,
    is_trial_post = EXCLUDED.is_trial_post,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW(),
    contextual_links = jsonb_build_object(
      'restored_from_archive', true,
      'restoration_timestamp', NOW(),
      'archive_record_id', archive_record_id
    ) || COALESCE(EXCLUDED.contextual_links, '{}'::jsonb)
  RETURNING id INTO restored_post_id;
  
  -- Mark the archive record as restored
  UPDATE blog_posts_archive 
  SET restored_at = NOW()
  WHERE id = archive_record_id;
  
  RETURN restored_post_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get storage statistics
CREATE OR REPLACE FUNCTION get_blog_storage_stats()
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  WITH blog_stats AS (
    SELECT 
      COUNT(*) as total_posts,
      COUNT(*) FILTER (WHERE is_trial_post = true) as trial_posts,
      COUNT(*) FILTER (WHERE user_id IS NOT NULL) as claimed_posts,
      COUNT(*) FILTER (WHERE expires_at IS NULL) as permanent_posts,
      COUNT(*) FILTER (WHERE status = 'expired') as expired_posts
    FROM blog_posts
  ),
  archive_stats AS (
    SELECT 
      COUNT(*) as total_archives,
      COUNT(*) FILTER (WHERE archive_reason = 'claim') as claim_archives,
      COUNT(*) FILTER (WHERE archive_reason = 'backup') as backup_archives,
      COUNT(*) FILTER (WHERE restored_at IS NOT NULL) as restored_archives
    FROM blog_posts_archive
  )
  SELECT json_build_object(
    'blog_posts', row_to_json(blog_stats.*),
    'archives', row_to_json(archive_stats.*),
    'integrity_score', CASE 
      WHEN blog_stats.total_posts > 0 
      THEN ROUND((archive_stats.total_archives::decimal / blog_stats.total_posts) * 100)
      ELSE 100 
    END,
    'generated_at', NOW()
  ) INTO stats
  FROM blog_stats, archive_stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE blog_posts_archive IS 'Permanent archive for blog posts, ensuring claimed posts are never lost';
COMMENT ON COLUMN blog_posts_archive.archive_reason IS 'Reason for archiving: claim, backup, migration, or safety';
COMMENT ON COLUMN blog_posts_archive.archived_data IS 'Complete blog post data stored as JSONB for maximum flexibility';
COMMENT ON FUNCTION auto_archive_on_claim() IS 'Automatically creates archive record when a blog post is claimed';
COMMENT ON FUNCTION restore_blog_post_from_archive(UUID) IS 'Restores a blog post from its archive record';
COMMENT ON FUNCTION get_blog_storage_stats() IS 'Returns comprehensive statistics about blog post storage and archival';

-- Grant necessary permissions
GRANT SELECT, INSERT ON blog_posts_archive TO authenticated;
GRANT ALL ON blog_posts_archive TO service_role;
