/**
 * Blog Table Debugger
 * Helps diagnose and fix issues between blog_posts and published_blog_posts tables
 */

import { supabase } from '@/integrations/supabase/client';

export class BlogTableDebugger {
  /**
   * Check the status of both blog tables
   */
  static async checkBothTables() {
    console.log('🔍 Checking blog table status...');
    
    const results = {
      blog_posts: { exists: false, count: 0, recent: [] as any[], error: null },
      published_blog_posts: { exists: false, count: 0, recent: [] as any[], error: null }
    };

    // Check blog_posts table
    try {
      const { data: blogPosts, error: blogError, count } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5);

      results.blog_posts = {
        exists: true,
        count: count || 0,
        recent: blogPosts || [],
        error: blogError
      };

      console.log(`✅ blog_posts: ${count} posts found`);
      if (blogPosts && blogPosts.length > 0) {
        console.log('📝 Recent blog_posts:', blogPosts.map(p => ({ slug: p.slug, title: p.title?.substring(0, 50) })));
      }
    } catch (error: any) {
      results.blog_posts.error = error.message;
      console.error('❌ blog_posts error:', error.message);
    }

    // Check published_blog_posts table
    try {
      const { data: publishedPosts, error: publishedError, count: publishedCount } = await supabase
        .from('published_blog_posts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5);

      results.published_blog_posts = {
        exists: true,
        count: publishedCount || 0,
        recent: publishedPosts || [],
        error: publishedError
      };

      console.log(`✅ published_blog_posts: ${publishedCount} posts found`);
      if (publishedPosts && publishedPosts.length > 0) {
        console.log('📝 Recent published_blog_posts:', publishedPosts.map(p => ({ slug: p.slug, title: p.title?.substring(0, 50) })));
      }
    } catch (error: any) {
      results.published_blog_posts.error = error.message;
      console.error('❌ published_blog_posts error:', error.message);
    }

    return results;
  }

  /**
   * Fix timestamp null value issues
   */
  static async fixTimestampIssues() {
    console.log('🔧 Fixing timestamp issues...');
    
    try {
      // Fix blog_posts timestamp issues
      const { error: fixBlogError } = await supabase.rpc('exec_sql', {
        query: `
          UPDATE blog_posts 
          SET 
            published_at = CASE 
              WHEN published_at = 'null'::text::timestamp THEN NULL 
              WHEN published_at::text = 'null' THEN NULL
              ELSE published_at 
            END,
            expires_at = CASE 
              WHEN expires_at = 'null'::text::timestamp THEN NULL 
              WHEN expires_at::text = 'null' THEN NULL
              ELSE expires_at 
            END,
            claimed_at = CASE 
              WHEN claimed_at = 'null'::text::timestamp THEN NULL 
              WHEN claimed_at::text = 'null' THEN NULL
              ELSE claimed_at 
            END
          WHERE 
            published_at::text = 'null' OR 
            expires_at::text = 'null' OR 
            claimed_at::text = 'null';
        `
      });

      if (fixBlogError) {
        console.warn('⚠️ blog_posts timestamp fix error:', fixBlogError.message);
      } else {
        console.log('✅ blog_posts timestamp issues fixed');
      }

      // Fix published_blog_posts timestamp issues
      const { error: fixPublishedError } = await supabase.rpc('exec_sql', {
        query: `
          UPDATE published_blog_posts 
          SET 
            published_at = CASE 
              WHEN published_at = 'null'::text::timestamp THEN NULL 
              WHEN published_at::text = 'null' THEN NULL
              ELSE published_at 
            END,
            expires_at = CASE 
              WHEN expires_at = 'null'::text::timestamp THEN NULL 
              WHEN expires_at::text = 'null' THEN NULL
              ELSE expires_at 
            END,
            claimed_at = CASE 
              WHEN claimed_at = 'null'::text::timestamp THEN NULL 
              WHEN claimed_at::text = 'null' THEN NULL
              ELSE claimed_at 
            END
          WHERE 
            published_at::text = 'null' OR 
            expires_at::text = 'null' OR 
            claimed_at::text = 'null';
        `
      });

      if (fixPublishedError) {
        console.warn('⚠️ published_blog_posts timestamp fix error:', fixPublishedError.message);
      } else {
        console.log('✅ published_blog_posts timestamp issues fixed');
      }

    } catch (error: any) {
      console.error('❌ Failed to fix timestamp issues:', error.message);
    }
  }

  /**
   * Sync posts from blog_posts to published_blog_posts
   */
  static async syncTablesToPublished() {
    console.log('🔄 Syncing blog_posts to published_blog_posts...');
    
    try {
      // Get all published posts from blog_posts that aren't in published_blog_posts
      const { data: blogPosts, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published');

      if (fetchError) {
        console.error('❌ Failed to fetch blog_posts:', fetchError.message);
        return;
      }

      if (!blogPosts || blogPosts.length === 0) {
        console.log('ℹ️ No published posts found in blog_posts');
        return;
      }

      console.log(`📦 Found ${blogPosts.length} published posts in blog_posts`);

      // Check which ones already exist in published_blog_posts
      const { data: existingPublished } = await supabase
        .from('published_blog_posts')
        .select('slug')
        .in('slug', blogPosts.map(p => p.slug));

      const existingSlugs = new Set(existingPublished?.map(p => p.slug) || []);
      const postsToSync = blogPosts.filter(p => !existingSlugs.has(p.slug));

      if (postsToSync.length === 0) {
        console.log('✅ All posts are already synced');
        return;
      }

      console.log(`🔄 Syncing ${postsToSync.length} new posts...`);

      // Insert posts in batches
      const batchSize = 10;
      let syncedCount = 0;

      for (let i = 0; i < postsToSync.length; i += batchSize) {
        const batch = postsToSync.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from('published_blog_posts')
          .insert(batch);

        if (insertError) {
          console.warn(`⚠️ Failed to sync batch ${i / batchSize + 1}:`, insertError.message);
        } else {
          syncedCount += batch.length;
          console.log(`✅ Synced batch ${i / batchSize + 1}: ${batch.length} posts`);
        }
      }

      console.log(`🎉 Sync complete: ${syncedCount}/${postsToSync.length} posts synced`);
      
    } catch (error: any) {
      console.error('❌ Failed to sync tables:', error.message);
    }
  }

  /**
   * Force the blog listing to use blog_posts table
   */
  static async forceBlogPostsUsage() {
    console.log('🔧 Configuring blog listing to use blog_posts table...');
    
    // Store preference in localStorage
    localStorage.setItem('blog_table_preference', 'blog_posts');
    
    console.log('✅ Blog listing will now prefer blog_posts table');
  }

  /**
   * Complete diagnostic and fix routine
   */
  static async runFullDiagnostic() {
    console.log('🚀 Running full blog table diagnostic...');
    
    // Step 1: Check both tables
    const tableStatus = await this.checkBothTables();
    
    // Step 2: Fix timestamp issues
    await this.fixTimestampIssues();
    
    // Step 3: Sync tables if needed
    if (tableStatus.blog_posts.count > tableStatus.published_blog_posts.count) {
      await this.syncTablesToPublished();
    }
    
    // Step 4: Check again to verify fixes
    console.log('🔍 Verifying fixes...');
    const updatedStatus = await this.checkBothTables();
    
    console.log('📊 Final Status:');
    console.log(`blog_posts: ${updatedStatus.blog_posts.count} posts`);
    console.log(`published_blog_posts: ${updatedStatus.published_blog_posts.count} posts`);
    
    return updatedStatus;
  }
}

// Export for easy use in console
export const debugBlogTables = BlogTableDebugger.runFullDiagnostic;
export const checkBlogTables = BlogTableDebugger.checkBothTables;
export const fixTimestamps = BlogTableDebugger.fixTimestampIssues;
export const syncTables = BlogTableDebugger.syncTablesToPublished;
