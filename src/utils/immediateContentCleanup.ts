/**
 * Immediate content cleanup for malformed blog posts
 * This will clean existing content and can be run manually
 */
import { cleanHTMLContent } from './textFormatting';

export function runImmediateContentCleanup(): void {
  console.log('🧹 Running immediate content cleanup...');
  
  try {
    // Find all blog post keys
    const blogPostKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('blog_post_')
    );
    
    console.log(`Found ${blogPostKeys.length} blog posts to clean`);
    
    let cleanedCount = 0;
    
    for (const key of blogPostKeys) {
      try {
        const storedData = localStorage.getItem(key);
        if (!storedData) continue;
        
        const blogPost = JSON.parse(storedData);
        if (!blogPost.content) continue;
        
        // Always clean the content to ensure consistency
        const originalContent = blogPost.content;
        const cleanedContent = cleanHTMLContent(originalContent);
        
        if (originalContent !== cleanedContent) {
          console.log(`🔧 Cleaning: ${blogPost.title || key}`);
          
          // Update the blog post
          const updatedBlogPost = {
            ...blogPost,
            content: cleanedContent,
            updated_at: new Date().toISOString()
          };
          
          // Save back to localStorage
          localStorage.setItem(key, JSON.stringify(updatedBlogPost));
          cleanedCount++;
        }
      } catch (error) {
        console.warn(`Failed to process ${key}:`, error);
      }
    }
    
    // Also clean up the all_blog_posts list
    try {
      const allPostsData = localStorage.getItem('all_blog_posts');
      if (allPostsData) {
        const allPosts = JSON.parse(allPostsData);
        let listUpdated = false;
        
        const cleanedPosts = allPosts.map((post: any) => {
          if (post.content) {
            const originalContent = post.content;
            const cleanedContent = cleanHTMLContent(originalContent);
            
            if (originalContent !== cleanedContent) {
              listUpdated = true;
              return {
                ...post,
                content: cleanedContent,
                updated_at: new Date().toISOString()
              };
            }
          }
          return post;
        });
        
        if (listUpdated) {
          localStorage.setItem('all_blog_posts', JSON.stringify(cleanedPosts));
          console.log('🔧 Cleaned all_blog_posts list');
        }
      }
    } catch (error) {
      console.warn('Failed to clean all_blog_posts list:', error);
    }
    
    console.log(`✅ Immediate cleanup completed! ${cleanedCount} blog posts were improved.`);
    
    // Update cleanup version to prevent duplicate runs
    localStorage.setItem('content_cleanup_version', '1.1.0');
    
  } catch (error) {
    console.error('Immediate cleanup failed:', error);
  }
}

// Expose to window for manual execution
if (typeof window !== 'undefined') {
  (window as any).runContentCleanup = runImmediateContentCleanup;
}
