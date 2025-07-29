/**
 * Utility to clean up malformed blog content in localStorage
 */
import { cleanHTMLContent } from './textFormatting';

export function cleanupStoredBlogPosts(): number {
  let cleanedCount = 0;
  
  try {
    // Find all blog post keys in localStorage
    const blogPostKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('blog_post_')
    );
    
    console.log(`🧹 Found ${blogPostKeys.length} blog posts to check for cleanup`);
    
    for (const key of blogPostKeys) {
      try {
        const storedData = localStorage.getItem(key);
        if (!storedData) continue;
        
        const blogPost = JSON.parse(storedData);
        if (!blogPost.content) continue;
        
        // Check if content has malformed HTML comments
        const hasHTMLComments = blogPost.content.includes('<!--') || 
                               blogPost.content.includes('-->') ||
                               blogPost.content.includes('&lt;div class="bullet') ||
                               blogPost.content.includes('"@context"');
        
        if (hasHTMLComments) {
          console.log(`🔧 Cleaning malformed content in: ${blogPost.title || key}`);
          
          // Clean the content
          const cleanedContent = cleanHTMLContent(blogPost.content);
          
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
        console.warn(`Failed to process blog post ${key}:`, error);
      }
    }
    
    // Also clean up the all_blog_posts list if it exists
    try {
      const allPostsData = localStorage.getItem('all_blog_posts');
      if (allPostsData) {
        const allPosts = JSON.parse(allPostsData);
        let listUpdated = false;
        
        const cleanedPosts = allPosts.map((post: any) => {
          if (post.content && (post.content.includes('<!--') || post.content.includes('-->') || 
                              post.content.includes('&lt;div class="bullet') || 
                              post.content.includes('"@context"'))) {
            listUpdated = true;
            return {
              ...post,
              content: cleanHTMLContent(post.content),
              updated_at: new Date().toISOString()
            };
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
    
    console.log(`✅ Cleanup completed! ${cleanedCount} blog posts were fixed.`);
    return cleanedCount;
    
  } catch (error) {
    console.error('Content cleanup failed:', error);
    return 0;
  }
}

/**
 * Check if there are any blog posts with malformed content
 */
export function checkForMalformedContent(): { hasMalformed: boolean; count: number; examples: string[] } {
  const examples: string[] = [];
  let malformedCount = 0;
  
  try {
    const blogPostKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('blog_post_')
    );
    
    for (const key of blogPostKeys) {
      try {
        const storedData = localStorage.getItem(key);
        if (!storedData) continue;
        
        const blogPost = JSON.parse(storedData);
        if (!blogPost.content) continue;
        
        const hasHTMLComments = blogPost.content.includes('<!--') || 
                               blogPost.content.includes('-->') ||
                               blogPost.content.includes('&lt;div class="bullet') ||
                               blogPost.content.includes('"@context"');
        
        if (hasHTMLComments) {
          malformedCount++;
          if (examples.length < 3) {
            examples.push(blogPost.title || `Post ${key}`);
          }
        }
      } catch (error) {
        console.warn(`Failed to check blog post ${key}:`, error);
      }
    }
    
    return {
      hasMalformed: malformedCount > 0,
      count: malformedCount,
      examples
    };
    
  } catch (error) {
    console.error('Failed to check for malformed content:', error);
    return { hasMalformed: false, count: 0, examples: [] };
  }
}
