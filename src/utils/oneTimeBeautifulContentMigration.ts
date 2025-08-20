/**
 * One-Time Beautiful Content Structure Migration
 * 
 * This runs automatically once to apply beautiful content structure
 * to existing blog posts in the database. It only runs if needed.
 */

import { supabase } from '@/integrations/supabase/client';
import { applyBeautifulContentStructure } from './forceBeautifulContentStructure';
import { getErrorMessage, formatErrorForLogging } from './errorUtils';

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
    let posts;
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .not('content', 'like', '%beautiful-prose%')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch blog posts for migration:', getErrorMessage(error));
        console.error('❌ Full error details:', formatErrorForLogging(error, 'Blog Migration'));
        return;
      }
      posts = data;
    } catch (fetchError: any) {
      console.error('❌ Network error fetching blog posts for migration:', getErrorMessage(fetchError));
      console.error('❌ Full network error details:', formatErrorForLogging(fetchError, 'Blog Migration Network'));
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
            try {
              const { error: updateError } = await supabase
                .from('blog_posts')
                .update({
                  content: beautifulContent,
                  updated_at: new Date().toISOString()
                })
                .eq('id', post.id);

              if (updateError) {
                const errorMsg = getErrorMessage(updateError);
                console.error(`❌ Failed to update post ${post.id} (${post.title?.substring(0, 30)}):`, errorMsg);
                return { success: false, error: errorMsg };
              }

              console.log(`✅ Migrated: "${post.title?.substring(0, 50)}..."`);
              return { success: true };
            } catch (updateError: any) {
              const errorMsg = getErrorMessage(updateError);
              console.error(`❌ Network error updating post ${post.id}:`, errorMsg);
              return { success: false, error: errorMsg };
            }
          } else {
            console.log(`⏭️ Skipped: "${post.title?.substring(0, 50)}..." (no changes needed)`);
            return { success: true };
          }
        } catch (error: any) {
          const errorMsg = getErrorMessage(error);
          console.error(`💥 Error processing post ${post.id}:`, errorMsg);
          return { success: false, error: errorMsg };
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
    console.error('💥 Beautiful content migration failed:', getErrorMessage(error));
    console.error('💥 Full migration error details:', formatErrorForLogging(error, 'Beautiful Content Migration'));
  }
}

// Manual retry function
export function retryBeautifulContentMigration(): void {
  localStorage.removeItem(MIGRATION_KEY);
  console.log('🔄 Migration reset - running again...');
  runOneTimeBeautifulContentMigration();
}

// Auto-run migration when imported (with delay to not block app startup) - DISABLED TO PREVENT AUTO-EXECUTION ERRORS
if (typeof window !== 'undefined') {
  // Make retry function available globally for debugging
  (window as any).retryBeautifulContentMigration = retryBeautifulContentMigration;

  // Run after a delay to not block initial app load - DISABLED
  // setTimeout(() => {
  //   runOneTimeBeautifulContentMigration().catch(console.error);
  // }, 3000);

  console.log('📚 Beautiful content migration utility loaded (auto-execution disabled)');
}
