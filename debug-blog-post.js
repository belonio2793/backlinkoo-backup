/**
 * Debug script to check the specific blog post content
 */

import { supabase } from './src/integrations/supabase/client.js';

const slug = 'unleashing-the-power-of-product-hunt-your-ultimate-guide-to-launch-success-medpmz1l';

async function debugBlogPost() {
  try {
    console.log('🔍 Checking blog post:', slug);
    
    // Check if the post exists in database
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      console.error('❌ Error fetching post:', error);
      
      if (error.code === 'PGRST116') {
        console.log('📝 Post does not exist in database');
      }
      return;
    }
    
    console.log('✅ Post found in database');
    console.log('📊 Post details:');
    console.log('  - Title:', post.title);
    console.log('  - Slug:', post.slug);
    console.log('  - Status:', post.status);
    console.log('  - Content length:', post.content ? post.content.length : 0);
    console.log('  - Is trial post:', post.is_trial_post);
    console.log('  - Target URL:', post.target_url);
    console.log('  - Anchor text:', post.anchor_text);
    console.log('  - SEO score:', post.seo_score);
    console.log('  - Word count:', post.word_count);
    console.log('  - Reading time:', post.reading_time);
    console.log('  - Created at:', post.created_at);
    console.log('  - Updated at:', post.updated_at);
    
    if (!post.content || post.content.trim().length === 0) {
      console.log('⚠️ ISSUE FOUND: Post has no content!');
    } else {
      console.log('📄 Content preview (first 500 chars):');
      console.log(post.content.substring(0, 500) + '...');
      
      // Check for hyperlinks in content
      const hasLinks = post.content.includes('http') || post.content.includes('<a') || post.content.includes('[');
      console.log('🔗 Contains links:', hasLinks);
      
      if (!hasLinks && post.target_url) {
        console.log('⚠️ ISSUE FOUND: No hyperlinks found in content but target_url exists:', post.target_url);
      }
    }
    
    // Check for formatting issues
    if (post.content) {
      const hasHeadings = post.content.includes('#') || post.content.includes('<h');
      const hasParagraphs = post.content.includes('\n\n') || post.content.includes('<p>');
      const hasLists = post.content.includes('-') || post.content.includes('1.') || post.content.includes('<li>');
      
      console.log('📝 Content formatting:');
      console.log('  - Has headings:', hasHeadings);
      console.log('  - Has paragraphs:', hasParagraphs);
      console.log('  - Has lists:', hasLists);
      
      if (!hasHeadings && !hasParagraphs) {
        console.log('⚠️ ISSUE FOUND: Poor content structure - no headings or paragraph breaks');
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the debug
debugBlogPost().then(() => {
  console.log('\n✅ Blog post debug complete');
}).catch(err => {
  console.error('❌ Fatal error:', err);
});
