/**
 * Fix Faceook Typo Script
 * 
 * Specifically fixes the "Faceook" to "Facebook" typo in the blog post
 * with slug "h1-unleashing-the-power-of-faceook-the-ultimate-guide-to-dominating-social-media-medqxdg8"
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dfhanacsmsvvkpunurnp.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MTcyOTksImV4cCI6MjA0ODM5MzI5OX0.AkK4ym_wPr2ACWu-bnCAL2VOmP3qKzMtJIvz9tCkgXU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fix the Faceook typo in the specific blog post
 */
async function fixFaceookTypo() {
  console.log('🔍 Starting Faceook typo fix...');
  
  try {
    // First, find the post with the typo
    const targetSlug = 'h1-unleashing-the-power-of-faceook-the-ultimate-guide-to-dominating-social-media-medqxdg8';
    
    console.log(`Looking for blog post with slug: ${targetSlug}`);
    
    const { data: posts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', targetSlug);
    
    if (fetchError) {
      console.error('❌ Error fetching blog post:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    if (!posts || posts.length === 0) {
      console.log('⚠️ No post found with that exact slug. Searching for posts containing "faceook"...');
      
      // Search for any posts with "faceook" in title or content
      const { data: faceookPosts, error: searchError } = await supabase
        .from('blog_posts')
        .select('*')
        .or('title.ilike.%faceook%,content.ilike.%faceook%');
      
      if (searchError) {
        console.error('❌ Error searching for Faceook posts:', searchError);
        return { success: false, error: searchError.message };
      }
      
      console.log(`📋 Found ${faceookPosts?.length || 0} posts containing "faceook"`);
      
      if (!faceookPosts || faceookPosts.length === 0) {
        return { success: false, error: 'No posts found containing "faceook"' };
      }
      
      // Use the first found post
      posts.push(faceookPosts[0]);
    }
    
    const post = posts[0];
    console.log(`📄 Found post: "${post.title}" (ID: ${post.id})`);
    
    // Check what needs to be corrected
    const originalTitle = post.title || '';
    const originalContent = post.content || '';
    const originalMetaDescription = post.meta_description || '';
    const originalKeywords = post.keywords || [];
    
    let updatedTitle = originalTitle;
    let updatedContent = originalContent;
    let updatedMetaDescription = originalMetaDescription;
    let updatedKeywords = [...originalKeywords];
    let updatedSlug = post.slug;
    
    const corrections = [];
    
    // Fix title
    if (originalTitle.includes('Faceook')) {
      updatedTitle = originalTitle.replace(/Faceook/g, 'Facebook');
      corrections.push('title');
      console.log(`📝 Title correction: "${originalTitle}" → "${updatedTitle}"`);
    }
    
    // Fix content
    if (originalContent.includes('Faceook')) {
      updatedContent = originalContent.replace(/Faceook/g, 'Facebook');
      corrections.push('content');
      console.log('📄 Content corrected (replaced Faceook with Facebook)');
    }
    
    // Fix meta description
    if (originalMetaDescription.includes('Faceook')) {
      updatedMetaDescription = originalMetaDescription.replace(/Faceook/g, 'Facebook');
      corrections.push('meta_description');
      console.log('📋 Meta description corrected');
    }
    
    // Fix keywords
    updatedKeywords = originalKeywords.map(keyword => 
      keyword.replace(/Faceook/g, 'Facebook')
    );
    if (JSON.stringify(updatedKeywords) !== JSON.stringify(originalKeywords)) {
      corrections.push('keywords');
      console.log('🏷️ Keywords corrected');
    }
    
    // Generate new slug if title changed
    if (updatedTitle !== originalTitle) {
      updatedSlug = generateSlug(updatedTitle);
      corrections.push('slug');
      console.log(`🔗 New slug: "${updatedSlug}"`);
    }
    
    if (corrections.length === 0) {
      console.log('✅ No corrections needed - post is already correct');
      return { success: true, message: 'No corrections needed' };
    }
    
    // Prepare update data
    const updateData = {
      title: updatedTitle,
      content: updatedContent,
      meta_description: updatedMetaDescription,
      keywords: updatedKeywords,
      slug: updatedSlug,
      updated_at: new Date().toISOString()
    };
    
    console.log(`🔄 Updating post with corrections in: ${corrections.join(', ')}`);
    
    // Update the post
    const { data: updatedPost, error: updateError } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', post.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating blog post:', updateError);
      return { success: false, error: updateError.message };
    }
    
    console.log('✅ Successfully updated blog post!');
    
    return {
      success: true,
      message: `Successfully corrected ${corrections.length} field(s)`,
      corrections,
      originalTitle,
      updatedTitle,
      originalSlug: post.slug,
      updatedSlug,
      postId: post.id
    };
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Generate a URL-friendly slug from a title
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
}

/**
 * Find all posts with "Faceook" typo
 */
async function findAllFaceookPosts() {
  console.log('🔍 Searching for all posts with "Faceook" typo...');
  
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, created_at')
      .or('title.ilike.%faceook%,content.ilike.%faceook%,meta_description.ilike.%faceook%');
    
    if (error) {
      console.error('❌ Error searching for posts:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`📋 Found ${posts?.length || 0} posts with "Faceook" typo:`);
    
    if (posts && posts.length > 0) {
      posts.forEach((post, index) => {
        console.log(`${index + 1}. "${post.title}" (${post.slug})`);
      });
    }
    
    return {
      success: true,
      posts: posts || [],
      count: posts?.length || 0
    };
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Faceook Typo Fix Tool');
  console.log('================================');
  
  // First, show all posts with the typo
  const searchResult = await findAllFaceookPosts();
  
  if (!searchResult.success) {
    console.error('Failed to search for posts:', searchResult.error);
    return;
  }
  
  if (searchResult.count === 0) {
    console.log('✅ No posts found with "Faceook" typo. Everything looks good!');
    return;
  }
  
  console.log('\n🔧 Proceeding with typo fix...\n');
  
  // Fix the typo
  const fixResult = await fixFaceookTypo();
  
  if (fixResult.success) {
    console.log('\n✅ TYPO FIX COMPLETE!');
    console.log('======================');
    console.log(`Message: ${fixResult.message}`);
    
    if (fixResult.corrections) {
      console.log(`Corrections applied: ${fixResult.corrections.join(', ')}`);
      console.log(`Original title: "${fixResult.originalTitle}"`);
      console.log(`Updated title: "${fixResult.updatedTitle}"`);
      console.log(`Original slug: "${fixResult.originalSlug}"`);
      console.log(`Updated slug: "${fixResult.updatedSlug}"`);
      console.log(`Post ID: ${fixResult.postId}`);
    }
  } else {
    console.error('\n❌ TYPO FIX FAILED!');
    console.error('===================');
    console.error(`Error: ${fixResult.error}`);
  }
}

// Run the script if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export for use in other modules
export { fixFaceookTypo, findAllFaceookPosts, generateSlug };
