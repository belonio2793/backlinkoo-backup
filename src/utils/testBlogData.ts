import { supabase } from '@/integrations/supabase/client';

export interface TestBlogPost {
  title: string;
  content: string;
  slug: string;
  target_url: string;
  status: 'published';
  category: string;
  keywords: string[];
  seo_score: number;
  is_trial_post: boolean;
  reading_time: number;
  word_count: number;
  author_name: string;
  published_at: string;
  created_at: string;
}

export const sampleBlogPosts: TestBlogPost[] = [
  {
    title: "The Ultimate Guide to SEO Content Strategy in 2024",
    content: `<h1>The Ultimate Guide to SEO Content Strategy in 2024</h1>
    
    <p>Search engine optimization has evolved dramatically in recent years, and content strategy sits at the heart of modern SEO success. In this comprehensive guide, we'll explore the most effective strategies for creating content that not only ranks well but also delivers real value to your audience.</p>
    
    <h2>Understanding Modern SEO Content</h2>
    
    <p>Today's SEO isn't just about keywords and backlinks—it's about creating content that genuinely serves user intent. Search engines have become incredibly sophisticated at understanding context, relevance, and user satisfaction signals.</p>
    
    <h3>Key Elements of High-Performing Content</h3>
    
    <ul>
      <li><strong>User Intent Alignment</strong>: Your content must directly address what users are searching for</li>
      <li><strong>E-A-T Optimization</strong>: Expertise, Authoritativeness, and Trustworthiness are crucial ranking factors</li>
      <li><strong>Technical Excellence</strong>: Fast loading, mobile-friendly, and properly structured content</li>
      <li><strong>Natural Link Building</strong>: Creating content that naturally attracts <a href="https://example.com" target="_blank">high-quality backlinks</a></li>
    </ul>
    
    <h2>Building Your Content Strategy Framework</h2>
    
    <p>A successful content strategy requires systematic planning and execution. Start by conducting thorough keyword research, but don't stop there—understand the complete user journey and create content for each stage.</p>
    
    <blockquote>
      "The best SEO content doesn't just rank well—it becomes a valuable resource that users bookmark, share, and return to repeatedly."
    </blockquote>
    
    <h3>Implementation Steps</h3>
    
    <ol>
      <li>Audit your existing content performance</li>
      <li>Identify content gaps in your industry</li>
      <li>Create a content calendar aligned with business goals</li>
      <li>Develop topic clusters around pillar content</li>
      <li>Monitor and optimize based on performance data</li>
    </ol>
    
    <p>Remember, successful SEO content strategy is a long-term investment that pays dividends through increased organic traffic, brand authority, and business growth.</p>`,
    slug: "ultimate-guide-seo-content-strategy-2024",
    target_url: "https://example.com/seo-services",
    status: "published",
    category: "Digital Marketing",
    keywords: ["SEO", "content strategy", "digital marketing", "search optimization"],
    seo_score: 92,
    is_trial_post: true,
    reading_time: 5,
    word_count: 450,
    author_name: "Backlink ∞",
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    title: "How AI is Revolutionizing Content Creation for Businesses",
    content: `<h1>How AI is Revolutionizing Content Creation for Businesses</h1>
    
    <p>Artificial intelligence is transforming how businesses approach content creation, offering unprecedented opportunities for scale, personalization, and efficiency. This technological shift is not just changing the tools we use—it's fundamentally altering the content landscape.</p>
    
    <h2>The AI Content Revolution</h2>
    
    <p>Modern AI tools can generate high-quality content at scale, but the real power lies in how businesses integrate these tools into their broader content strategy. From blog posts to social media content, AI is enabling companies to maintain consistent output while freeing up creative teams for strategic work.</p>
    
    <h3>Key Benefits of AI-Powered Content</h3>
    
    <ul>
      <li><strong>Scalability</strong>: Generate large volumes of content quickly</li>
      <li><strong>Consistency</strong>: Maintain brand voice across all content</li>
      <li><strong>Personalization</strong>: Create targeted content for specific audiences</li>
      <li><strong>SEO Optimization</strong>: Built-in optimization for <a href="https://example.com/ai-seo" target="_blank">search engine performance</a></li>
    </ul>
    
    <h2>Best Practices for AI Content Implementation</h2>
    
    <p>While AI offers tremendous capabilities, successful implementation requires thoughtful strategy. The most effective approaches combine AI efficiency with human creativity and oversight.</p>
    
    <blockquote>
      "AI doesn't replace human creativity—it amplifies it, allowing content creators to focus on strategy and innovation while automating routine tasks."
    </blockquote>
    
    <h3>Getting Started with AI Content Tools</h3>
    
    <ol>
      <li>Define your content goals and brand guidelines</li>
      <li>Choose AI tools that align with your workflow</li>
      <li>Establish quality control processes</li>
      <li>Train your team on AI-assisted workflows</li>
      <li>Measure and optimize performance regularly</li>
    </ol>
    
    <p>The future of content creation is collaborative, with AI handling the heavy lifting while humans provide strategic direction and creative oversight.</p>`,
    slug: "ai-revolutionizing-content-creation-businesses",
    target_url: "https://example.com/ai-content-tools",
    status: "published",
    category: "Technology",
    keywords: ["AI", "content creation", "artificial intelligence", "business automation"],
    seo_score: 88,
    is_trial_post: true,
    reading_time: 4,
    word_count: 380,
    author_name: "Backlink ∞",
    published_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    title: "Building High-Quality Backlinks: A Complete Strategy Guide",
    content: `<h1>Building High-Quality Backlinks: A Complete Strategy Guide</h1>
    
    <p>Backlinks remain one of the most important ranking factors in SEO, but the approach to building them has evolved significantly. Modern link building focuses on quality over quantity, emphasizing relationships, value creation, and natural link acquisition.</p>
    
    <h2>Understanding Quality Backlinks</h2>
    
    <p>Not all backlinks are created equal. High-quality backlinks come from authoritative, relevant websites and provide genuine value to users. These links signal to search engines that your content is trustworthy and valuable.</p>
    
    <h3>Characteristics of Quality Backlinks</h3>
    
    <ul>
      <li><strong>Relevance</strong>: Links from websites in your industry or niche</li>
      <li><strong>Authority</strong>: Links from high-domain authority websites</li>
      <li><strong>Natural Placement</strong>: Links that fit naturally within content</li>
      <li><strong>Diverse Sources</strong>: Links from various types of <a href="https://example.com/link-building" target="_blank">legitimate websites</a></li>
    </ul>
    
    <h2>Effective Link Building Strategies</h2>
    
    <p>The most successful link building campaigns focus on creating valuable content and building genuine relationships within your industry. This approach takes time but delivers sustainable results.</p>
    
    <blockquote>
      "The best backlinks are earned, not built. Focus on creating content so valuable that others naturally want to link to it."
    </blockquote>
    
    <h3>Proven Link Building Techniques</h3>
    
    <ol>
      <li>Create linkable assets (research studies, tools, guides)</li>
      <li>Build relationships with industry influencers</li>
      <li>Guest posting on relevant, high-quality websites</li>
      <li>Digital PR and media outreach</li>
      <li>Resource page link building</li>
      <li>Broken link building opportunities</li>
    </ol>
    
    <h2>Measuring Link Building Success</h2>
    
    <p>Track not just the number of backlinks, but their quality and impact on your overall SEO performance. Focus on metrics like domain authority, referral traffic, and ranking improvements.</p>`,
    slug: "building-high-quality-backlinks-strategy-guide",
    target_url: "https://example.com/backlink-services",
    status: "published",
    category: "Digital Marketing",
    keywords: ["backlinks", "link building", "SEO strategy", "digital marketing"],
    seo_score: 95,
    is_trial_post: true,
    reading_time: 6,
    word_count: 420,
    author_name: "Backlink ∞",
    published_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    created_at: new Date(Date.now() - 172800000).toISOString(),
  }
];

export async function createSampleBlogPosts(): Promise<{ success: boolean; message: string; created: number }> {
  try {
    console.log('🌱 Creating sample blog posts...');
    
    // First check if posts already exist
    const { data: existingPosts } = await supabase
      .from('published_blog_posts')
      .select('slug')
      .in('slug', sampleBlogPosts.map(p => p.slug));
    
    const existingSlugs = new Set(existingPosts?.map(p => p.slug) || []);
    const postsToCreate = sampleBlogPosts.filter(p => !existingSlugs.has(p.slug));
    
    if (postsToCreate.length === 0) {
      return {
        success: true,
        message: 'Sample blog posts already exist',
        created: 0
      };
    }
    
    // Create new posts
    const { data, error } = await supabase
      .from('published_blog_posts')
      .insert(postsToCreate)
      .select();
    
    if (error) {
      console.error('❌ Failed to create sample posts:', error);
      
      // If published_blog_posts table doesn't exist, try blog_posts table
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.log('🔄 Trying blog_posts table as fallback...');
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('blog_posts')
          .insert(postsToCreate)
          .select();
        
        if (fallbackError) {
          return {
            success: false,
            message: `Failed to create sample posts: ${fallbackError.message}`,
            created: 0
          };
        }
        
        return {
          success: true,
          message: `Created ${fallbackData?.length || 0} sample blog posts in blog_posts table`,
          created: fallbackData?.length || 0
        };
      }
      
      return {
        success: false,
        message: `Failed to create sample posts: ${error.message}`,
        created: 0
      };
    }
    
    console.log(`✅ Created ${data?.length || 0} sample blog posts`);
    return {
      success: true,
      message: `Created ${data?.length || 0} sample blog posts`,
      created: data?.length || 0
    };
    
  } catch (error: any) {
    console.error('❌ Error creating sample posts:', error);
    return {
      success: false,
      message: `Error creating sample posts: ${error.message || 'Unknown error'}`,
      created: 0
    };
  }
}

export async function testDatabaseConnection(): Promise<{ success: boolean; message: string; tables: string[] }> {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test connection with simple query
    const tables: string[] = [];
    let message = '';
    
    // Test published_blog_posts table
    try {
      const { data, error } = await supabase
        .from('published_blog_posts')
        .select('id')
        .limit(1);
      
      if (!error) {
        tables.push('published_blog_posts');
        console.log('✅ published_blog_posts table accessible');
      }
    } catch (e) {
      console.log('⚠️ published_blog_posts table not accessible');
    }
    
    // Test blog_posts table
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id')
        .limit(1);
      
      if (!error) {
        tables.push('blog_posts');
        console.log('✅ blog_posts table accessible');
      }
    } catch (e) {
      console.log('⚠️ blog_posts table not accessible');
    }
    
    if (tables.length === 0) {
      return {
        success: false,
        message: 'No blog tables accessible. Database connection may be down.',
        tables: []
      };
    }
    
    return {
      success: true,
      message: `Database connection successful. Available tables: ${tables.join(', ')}`,
      tables
    };
    
  } catch (error: any) {
    console.error('❌ Database connection failed:', error);
    return {
      success: false,
      message: `Database connection failed: ${error.message || 'Unknown error'}`,
      tables: []
    };
  }
}
