/**
 * One-Time Beautiful Content Structure Migration
 * 
 * This runs automatically once to apply beautiful content structure
 * to existing blog posts in the database. It only runs if needed.
 */

import { supabase } from '@/integrations/supabase/client';
import { applyBeautifulContentStructure } from './forceBeautifulContentStructure';

const MIGRATION_KEY = 'beautiful_content_migration_completed';
const MIGRATION_VERSION = '1.0.0';

export async function runOneTimeBeautifulContentMigration(): Promise<void> {
  try {
    // Check if migration has already been completed
    const migrationCompleted = localStorage.getItem(MIGRATION_KEY);
    if (migrationCompleted === MIGRATION_VERSION) {
      console.log('🎨 Beautiful content migration already completed, skipping...');
      return;
    }

    console.log('🎨 Starting one-time beautiful content structure migration...');

    // Get all blog posts that need migration (those without beautiful-prose classes)
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .not('content', 'like', '%beautiful-prose%')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch blog posts for migration:', error);
      return;
    }

    if (!posts || posts.length === 0) {
      console.log('✅ No blog posts need beautiful content migration');
      localStorage.setItem(MIGRATION_KEY, MIGRATION_VERSION);
      return;
    }

    console.log(`📚 Found ${posts.length} blog posts that need beautiful content structure`);

    let migrated = 0;
    let failed = 0;

    // Process in batches to avoid overwhelming the database
    const batchSize = 3;
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(posts.length/batchSize)}`);
      
      const batchPromises = batch.map(async (post) => {
        try {
          const originalContent = post.content || '';
          
          // Apply beautiful content structure
          const beautifulContent = applyBeautifulContentStructure(originalContent, post.title);
          
          // Only update if content actually changed
          if (beautifulContent !== originalContent) {
            const { error: updateError } = await supabase
              .from('blog_posts')
              .update({
                content: beautifulContent,
                updated_at: new Date().toISOString()
              })
              .eq('id', post.id);

            if (updateError) {
              console.error(`❌ Failed to update post ${post.id}:`, updateError.message);
              return { success: false };
            }

            console.log(`✅ Migrated: "${post.title?.substring(0, 50)}..."`);
            return { success: true };
          } else {
            console.log(`⏭️ Skipped: "${post.title?.substring(0, 50)}..." (no changes needed)`);
            return { success: true };
          }
        } catch (error: any) {
          console.error(`💥 Error processing post ${post.id}:`, error.message);
          return { success: false };
        }
      });

      const results = await Promise.all(batchPromises);
      
      results.forEach(result => {
        if (result.success) {
          migrated++;
        } else {
          failed++;
        }
      });

      // Small delay between batches
      if (i + batchSize < posts.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`🎉 Beautiful content migration complete!`);
    console.log(`   ✅ Successfully migrated: ${migrated} posts`);
    console.log(`   ❌ Failed: ${failed} posts`);

    // Mark migration as completed
    localStorage.setItem(MIGRATION_KEY, MIGRATION_VERSION);

  } catch (error: any) {
    console.error('💥 Beautiful content migration failed:', error.message);
  }
}

// Auto-run migration when imported (with delay to not block app startup)
if (typeof window !== 'undefined') {
  // Run after a delay to not block initial app load
  setTimeout(() => {
    runOneTimeBeautifulContentMigration().catch(console.error);
  }, 3000);
}
