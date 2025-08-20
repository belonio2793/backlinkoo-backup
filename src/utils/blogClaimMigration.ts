import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from './errorUtils';

export class BlogClaimMigration {
  /**
   * Update blog_posts table to include claimed field and improve lifecycle management
   */
  static async updateBlogPostsSchema(): Promise<{ success: boolean; error?: string }> {
    try {
      const migrationSQL = `
        -- Add claimed column if it doesn't exist
        ALTER TABLE blog_posts 
        ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT false;

        -- Update existing posts to set claimed based on user_id
        UPDATE blog_posts 
        SET claimed = (user_id IS NOT NULL)
        WHERE claimed IS NULL OR claimed != (user_id IS NOT NULL);

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_blog_posts_claimed ON blog_posts(claimed);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_expires_at ON blog_posts(expires_at);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_claimed_user ON blog_posts(claimed, user_id);

        -- Create function to automatically set claimed when user_id is set
        CREATE OR REPLACE FUNCTION sync_blog_post_claimed_status()
        RETURNS TRIGGER AS $$
        BEGIN
          -- If user_id is being set (claiming a post)
          IF NEW.user_id IS NOT NULL AND OLD.user_id IS NULL THEN
            NEW.claimed = true;
            NEW.expires_at = NULL; -- Remove expiration for claimed posts
            NEW.is_trial_post = false; -- No longer a trial post
          END IF;
          
          -- If user_id is being cleared (unclaiming a post)
          IF NEW.user_id IS NULL AND OLD.user_id IS NOT NULL THEN
            NEW.claimed = false;
            NEW.expires_at = NOW() + INTERVAL '24 hours'; -- Set new expiration
            NEW.is_trial_post = true; -- Back to trial status
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger for automatic claimed status sync
        DROP TRIGGER IF EXISTS trigger_sync_claimed_status ON blog_posts;
        CREATE TRIGGER trigger_sync_claimed_status
          BEFORE UPDATE ON blog_posts
          FOR EACH ROW
          EXECUTE FUNCTION sync_blog_post_claimed_status();

        -- Function to cleanup expired unclaimed posts
        CREATE OR REPLACE FUNCTION cleanup_expired_posts()
        RETURNS INTEGER AS $$
        DECLARE
          deleted_count INTEGER;
        BEGIN
          DELETE FROM blog_posts 
          WHERE claimed = false 
            AND expires_at IS NOT NULL 
            AND expires_at <= NOW();
          
          GET DIAGNOSTICS deleted_count = ROW_COUNT;
          RETURN deleted_count;
        END;
        $$ LANGUAGE plpgsql;

        -- Update RLS policies for new claimed logic
        DROP POLICY IF EXISTS "Public can read published posts" ON blog_posts;
        CREATE POLICY "Public can read published posts" ON blog_posts
          FOR SELECT USING (status = 'published');

        DROP POLICY IF EXISTS "Users can manage their own posts" ON blog_posts;
        CREATE POLICY "Users can manage their own posts" ON blog_posts
          FOR ALL USING (auth.uid() = user_id);

        -- Policy to allow deletion of unclaimed posts by anyone
        DROP POLICY IF EXISTS "Anyone can delete unclaimed posts" ON blog_posts;
        CREATE POLICY "Anyone can delete unclaimed posts" ON blog_posts
          FOR DELETE USING (claimed = false);

        -- Policy to prevent deletion of claimed posts by non-owners
        DROP POLICY IF EXISTS "Only owners can delete claimed posts" ON blog_posts;
        CREATE POLICY "Only owners can delete claimed posts" ON blog_posts
          FOR DELETE USING (claimed = true AND auth.uid() = user_id);

        -- Admin policy for full access
        DROP POLICY IF EXISTS "Admins can manage all posts" ON blog_posts;
        CREATE POLICY "Admins can manage all posts" ON blog_posts
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM profiles 
              WHERE profiles.user_id = auth.uid() 
              AND profiles.role = 'admin'
            )
          );
      `;

      const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

      if (error) {
        return { success: false, error: getErrorMessage(error) };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: getErrorMessage(error) };
    }
  }

  /**
   * Set up automatic cleanup of expired posts
   */
  static async setupAutomaticCleanup(): Promise<{ success: boolean; error?: string }> {
    try {
      // Note: This would ideally be a cron job in production
      // For now, we'll create a function that can be called periodically
      const cleanupSQL = `
        -- Create a function to be called by cron or scheduled tasks
        CREATE OR REPLACE FUNCTION scheduled_cleanup_expired_posts()
        RETURNS TEXT AS $$
        DECLARE
          deleted_count INTEGER;
        BEGIN
          deleted_count := cleanup_expired_posts();
          RETURN 'Deleted ' || deleted_count || ' expired posts at ' || NOW();
        END;
        $$ LANGUAGE plpgsql;
      `;

      const { error } = await supabase.rpc('exec_sql', { sql: cleanupSQL });

      if (error) {
        return { success: false, error: getErrorMessage(error) };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: getErrorMessage(error) };
    }
  }

  /**
   * Run all blog claim migrations
   */
  static async runAllMigrations(): Promise<{
    success: boolean;
    results: Array<{ step: string; success: boolean; error?: string }>;
  }> {
    const results = [];

    // Update schema
    const schemaResult = await this.updateBlogPostsSchema();
    results.push({ step: 'Update blog_posts schema with claimed field', ...schemaResult });

    // Setup cleanup
    const cleanupResult = await this.setupAutomaticCleanup();
    results.push({ step: 'Setup automatic cleanup functions', ...cleanupResult });

    const allSuccessful = results.every(r => r.success);

    return {
      success: allSuccessful,
      results
    };
  }
}
