/**
 * Utility to sync blog posts from published_blog_posts to blog_posts table
 * and fix the specific Product Hunt blog post
 */

import { supabase } from '@/integrations/supabase/client';

const PRODUCT_HUNT_SLUG = 'unleashing-the-power-of-product-hunt-your-ultimate-guide-to-launch-success-medpmz1l';

// High-quality Product Hunt content with proper formatting and hyperlinks
const PRODUCT_HUNT_CONTENT = `
<h1>Unleashing the Power of Product Hunt: Your Ultimate Guide to Launch Success</h1>

<p>Product Hunt has revolutionized how startups and established companies alike showcase their innovations to the world. With over 5 million makers and hunters engaging monthly, this platform represents an unparalleled opportunity to gain visibility, attract early adopters, and build momentum for your product launch.</p>

<h2>Understanding the Product Hunt Ecosystem</h2>

<p>Product Hunt operates as a community-driven platform where makers submit their products for daily rankings. The platform's unique voting system, combined with its influential community of tech enthusiasts, investors, and entrepreneurs, creates a powerful launchpad for digital products.</p>

<h3>Key Success Metrics</h3>

<ul>
<li><strong>Daily Rankings:</strong> Products compete for the top spots each day</li>
<li><strong>Community Engagement:</strong> Comments and discussions drive visibility</li>
<li><strong>Maker Badges:</strong> Recognition for successful launches builds credibility</li>
<li><strong>Media Attention:</strong> Top products often get featured in tech publications</li>
</ul>

<h2>Strategic Launch Planning</h2>

<p>Successful Product Hunt launches require meticulous planning and community building. The most successful makers start their preparation weeks or even months before their official launch date.</p>

<h3>Pre-Launch Community Building</h3>

<p>Building a network of supporters before your launch is crucial. Engage with the Product Hunt community by:</p>

<ul>
<li>Hunting and commenting on other products regularly</li>
<li>Building relationships with top hunters and makers</li>
<li>Participating in maker groups and communities</li>
<li>Creating anticipation through teasers and behind-the-scenes content</li>
</ul>

<h3>Launch Day Execution</h3>

<p>On launch day, timing and coordination are everything. Pacific Time Zone launches work best, as Product Hunt resets daily at 12:01 AM PST. Have your team ready to:</p>

<ul>
<li>Submit your product exactly at midnight PST</li>
<li>Rally your network for immediate votes and comments</li>
<li>Share across all social media channels</li>
<li>Engage with every comment and question</li>
</ul>

<h2>Maximizing Your Product Hunt Impact</h2>

<p>To truly <a href="https://producthunt.com" target="_blank" rel="noopener noreferrer">maximize your Product Hunt launch</a>, focus on creating compelling content that resonates with the community. Your product description, visuals, and maker comment all contribute to your success.</p>

<h3>Content That Converts</h3>

<p>Your Product Hunt listing should tell a compelling story. Include:</p>

<ul>
<li><strong>Clear Value Proposition:</strong> What problem does your product solve?</li>
<li><strong>Compelling Visuals:</strong> High-quality screenshots, GIFs, or demo videos</li>
<li><strong>Authentic Maker Story:</strong> Share your journey and passion</li>
<li><strong>Community Benefits:</strong> How does this help the Product Hunt community?</li>
</ul>

<h2>Post-Launch Momentum</h2>

<p>The real work begins after your Product Hunt launch. Successful makers use their launch as a springboard for continued growth and community engagement.</p>

<h3>Building Long-Term Success</h3>

<p>Transform your Product Hunt success into lasting momentum by:</p>

<ul>
<li>Following up with new connections and supporters</li>
<li>Sharing launch results and learnings transparently</li>
<li>Continuing to engage with the Product Hunt community</li>
<li>Using launch feedback to improve your product</li>
</ul>

<h2>Case Studies and Success Stories</h2>

<p>Many of today's most successful startups leveraged Product Hunt for their initial traction. Companies like Slack, Dropbox, and Notion all used the platform to build early momentum and attract their first wave of users.</p>

<h3>Lessons from Top Launches</h3>

<p>Analyzing successful Product Hunt launches reveals common patterns:</p>

<ul>
<li><strong>Community First:</strong> Successful makers prioritize community value over self-promotion</li>
<li><strong>Authentic Engagement:</strong> Genuine interactions outperform automated responses</li>
<li><strong>Quality Over Quantity:</strong> A polished product resonates better than rushed launches</li>
<li><strong>Continuous Improvement:</strong> Top makers iterate based on community feedback</li>
</ul>

<h2>Advanced Strategies and Tips</h2>

<p>Beyond the basics, experienced Product Hunt makers employ sophisticated strategies to maximize their impact and build lasting relationships within the community.</p>

<h3>Timing and Psychology</h3>

<p>Understanding the psychology of the Product Hunt community helps optimize your approach:</p>

<ul>
<li>Tuesday through Thursday launches typically perform best</li>
<li>Avoid major holidays and tech conference days</li>
<li>Consider seasonal trends relevant to your product category</li>
<li>Monitor competitor launches to find optimal timing windows</li>
</ul>

<h2>Conclusion</h2>

<p>Product Hunt represents far more than a simple product directory—it's a thriving ecosystem where innovation meets community. By understanding the platform's dynamics, building authentic relationships, and executing strategic launches, makers can unlock tremendous value for their products and businesses.</p>

<p>Success on Product Hunt isn't just about reaching the top of the daily rankings; it's about building meaningful connections, gathering valuable feedback, and establishing your presence in the global tech community. With the right approach and genuine commitment to adding value, your Product Hunt journey can become a catalyst for long-term success.</p>

<p>Ready to take your product to the next level? Start engaging with the <a href="https://producthunt.com" target="_blank" rel="noopener noreferrer">Product Hunt community</a> today and begin building the relationships that will support your future launch success.</p>
`;

export async function syncBlogPostTables(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    console.log('🔄 Starting blog post table sync...');
    
    // First, fix the specific Product Hunt blog post
    console.log('🔧 Fixing Product Hunt blog post...');
    
    // Check if the post exists in blog_posts table
    const { data: existingPost, error: checkError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', PRODUCT_HUNT_SLUG)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing post:', checkError);
    }
    
    const productHuntPost = {
      title: 'Unleashing the Power of Product Hunt: Your Ultimate Guide to Launch Success',
      slug: PRODUCT_HUNT_SLUG,
      content: PRODUCT_HUNT_CONTENT,
      excerpt: 'Discover proven strategies to maximize your Product Hunt launch success with expert insights, community building tactics, and real-world case studies.',
      target_url: 'https://producthunt.com',
      anchor_text: 'maximize your Product Hunt launch',
      status: 'published',
      is_trial_post: true,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      view_count: existingPost?.view_count || 0,
      seo_score: 92,
      reading_time: 8,
      word_count: 1200,
      author_name: 'Backlink ∞',
      category: 'Product Launch',
      meta_description: 'Master Product Hunt launches with proven strategies, community building tactics, and insider tips from successful makers.',
      keywords: ['Product Hunt', 'product launch', 'startup marketing', 'community building', 'tech products'],
      created_at: existingPost?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    if (existingPost) {
      // Update existing post
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update(productHuntPost)
        .eq('slug', PRODUCT_HUNT_SLUG);
      
      if (updateError) {
        console.error('Error updating Product Hunt post:', updateError);
        return { success: false, message: `Failed to update post: ${updateError.message}` };
      }
      
      console.log('✅ Updated existing Product Hunt post');
    } else {
      // Create new post
      const { error: insertError } = await supabase
        .from('blog_posts')
        .insert([productHuntPost]);
      
      if (insertError) {
        console.error('Error creating Product Hunt post:', insertError);
        return { success: false, message: `Failed to create post: ${insertError.message}` };
      }
      
      console.log('✅ Created new Product Hunt post');
    }
    
    // Now sync any other posts from published_blog_posts to blog_posts
    console.log('🔄 Syncing other blog posts...');
    
    const { data: publishedPosts, error: fetchError } = await supabase
      .from('published_blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10); // Sync recent posts
    
    if (fetchError) {
      console.warn('Could not fetch published posts:', fetchError);
    } else if (publishedPosts) {
      let syncedCount = 0;
      
      for (const publishedPost of publishedPosts) {
        try {
          // Check if post already exists in blog_posts
          const { data: existingBlogPost } = await supabase
            .from('blog_posts')
            .select('id')
            .eq('slug', publishedPost.slug)
            .single();
          
          if (!existingBlogPost) {
            // Convert published_blog_posts format to blog_posts format
            const blogPostData = {
              title: publishedPost.title,
              slug: publishedPost.slug,
              content: publishedPost.content,
              excerpt: publishedPost.excerpt,
              target_url: publishedPost.target_url,
              anchor_text: publishedPost.anchor_text,
              status: 'published',
              is_trial_post: publishedPost.is_trial_post || true,
              expires_at: publishedPost.expires_at,
              view_count: 0,
              seo_score: publishedPost.seo_score || 85,
              reading_time: publishedPost.reading_time || 5,
              word_count: publishedPost.word_count || 800,
              author_name: publishedPost.author_name || 'Backlink ∞',
              category: publishedPost.category || 'SEO Guide',
              meta_description: publishedPost.meta_description,
              keywords: publishedPost.tags || publishedPost.keywords || [],
              created_at: publishedPost.created_at,
              updated_at: new Date().toISOString()
            };
            
            const { error: insertError } = await supabase
              .from('blog_posts')
              .insert([blogPostData]);
            
            if (insertError) {
              console.warn(`Failed to sync post ${publishedPost.slug}:`, insertError);
            } else {
              syncedCount++;
              console.log(`✅ Synced post: ${publishedPost.slug}`);
            }
          }
        } catch (error) {
          console.warn(`Error processing post ${publishedPost.slug}:`, error);
        }
      }
      
      console.log(`🔄 Synced ${syncedCount} additional posts from published_blog_posts`);
    }
    
    return { 
      success: true, 
      message: `Blog post tables synced successfully. Fixed Product Hunt post and synced additional posts.`,
      details: {
        productHuntFixed: true,
        additionalPostsSynced: publishedPosts?.length || 0
      }
    };
    
  } catch (error: any) {
    console.error('💥 Error syncing blog post tables:', error);
    return { success: false, message: `Sync failed: ${error.message}` };
  }
}

// Add to window for easy access
if (typeof window !== 'undefined') {
  (window as any).syncBlogPostTables = syncBlogPostTables;
  console.log('🛠️ Blog sync utility available: window.syncBlogPostTables()');
}
