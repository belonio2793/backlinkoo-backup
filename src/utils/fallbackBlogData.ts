/**
 * Fallback blog data for when database is unavailable
 */

export interface FallbackBlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
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
  target_url: string;
  view_count: number;
  tags: string[];
}

export const fallbackBlogPosts: FallbackBlogPost[] = [
  {
    id: 'fallback-seo-guide-001',
    slug: 'ultimate-guide-seo-content-strategy-2024',
    title: 'The Ultimate Guide to SEO Content Strategy in 2024',
    content: `<h1>The Ultimate Guide to SEO Content Strategy in 2024</h1>
    
    <p>Search engine optimization has evolved dramatically in recent years, and content strategy sits at the heart of modern SEO success. In this comprehensive guide, we'll explore the most effective strategies for creating content that not only ranks well but also delivers real value to your audience.</p>
    
    <h2>Understanding Modern SEO Content</h2>
    
    <p>Today's SEO isn't just about keywords and backlinks—it's about creating content that genuinely serves user intent. Search engines have become incredibly sophisticated at understanding context, relevance, and user satisfaction signals.</p>
    
    <h3>Key Elements of High-Performing Content</h3>
    
    <ul>
      <li><strong>User Intent Alignment</strong>: Your content must directly address what users are searching for</li>
      <li><strong>E-A-T Optimization</strong>: Expertise, Authoritativeness, and Trustworthiness are crucial ranking factors</li>
      <li><strong>Technical Excellence</strong>: Fast loading, mobile-friendly, and properly structured content</li>
      <li><strong>Natural Link Building</strong>: Creating content that naturally attracts high-quality backlinks</li>
    </ul>
    
    <h2>Building Your Content Strategy Framework</h2>
    
    <p>A successful content strategy requires systematic planning and execution. Start by conducting thorough keyword research, but don't stop there—understand the complete user journey and create content for each stage.</p>
    
    <blockquote>
      "The best SEO content doesn't just rank well—it becomes a valuable resource that users bookmark, share, and return to repeatedly."
    </blockquote>
    
    <p>Remember, successful SEO content strategy is a long-term investment that pays dividends through increased organic traffic, brand authority, and business growth.</p>`,
    status: 'published',
    category: 'Digital Marketing',
    keywords: ['SEO', 'content strategy', 'digital marketing', 'search optimization'],
    seo_score: 92,
    is_trial_post: true,
    reading_time: 5,
    word_count: 450,
    author_name: 'Backlink ∞',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    target_url: 'https://example.com/seo-services',
    view_count: 23,
    tags: ['SEO', 'content', 'strategy', 'digital marketing']
  },
  {
    id: 'fallback-ai-content-002',
    slug: 'ai-revolutionizing-content-creation-businesses',
    title: 'How AI is Revolutionizing Content Creation for Businesses',
    content: `<h1>How AI is Revolutionizing Content Creation for Businesses</h1>
    
    <p>Artificial intelligence is transforming how businesses approach content creation, offering unprecedented opportunities for scale, personalization, and efficiency. This technological shift is not just changing the tools we use—it's fundamentally altering the content landscape.</p>
    
    <h2>The AI Content Revolution</h2>
    
    <p>Modern AI tools can generate high-quality content at scale, but the real power lies in how businesses integrate these tools into their broader content strategy. From blog posts to social media content, AI is enabling companies to maintain consistent output while freeing up creative teams for strategic work.</p>
    
    <h3>Key Benefits of AI-Powered Content</h3>
    
    <ul>
      <li><strong>Scalability</strong>: Generate large volumes of content quickly</li>
      <li><strong>Consistency</strong>: Maintain brand voice across all content</li>
      <li><strong>Personalization</strong>: Create targeted content for specific audiences</li>
      <li><strong>SEO Optimization</strong>: Built-in optimization for search engine performance</li>
    </ul>
    
    <h2>Best Practices for AI Content Implementation</h2>
    
    <p>While AI offers tremendous capabilities, successful implementation requires thoughtful strategy. The most effective approaches combine AI efficiency with human creativity and oversight.</p>
    
    <blockquote>
      "AI doesn't replace human creativity—it amplifies it, allowing content creators to focus on strategy and innovation while automating routine tasks."
    </blockquote>
    
    <p>The future of content creation is collaborative, with AI handling the heavy lifting while humans provide strategic direction and creative oversight.</p>`,
    status: 'published',
    category: 'Technology',
    keywords: ['AI', 'content creation', 'artificial intelligence', 'business automation'],
    seo_score: 88,
    is_trial_post: true,
    reading_time: 4,
    word_count: 380,
    author_name: 'Backlink ∞',
    published_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    target_url: 'https://example.com/ai-content-tools',
    view_count: 17,
    tags: ['AI', 'automation', 'content', 'technology']
  },
  {
    id: 'fallback-backlinks-003',
    slug: 'building-high-quality-backlinks-strategy-guide',
    title: 'Building High-Quality Backlinks: A Complete Strategy Guide',
    content: `<h1>Building High-Quality Backlinks: A Complete Strategy Guide</h1>
    
    <p>Backlinks remain one of the most important ranking factors in SEO, but the approach to building them has evolved significantly. Modern link building focuses on quality over quantity, emphasizing relationships, value creation, and natural link acquisition.</p>
    
    <h2>Understanding Quality Backlinks</h2>
    
    <p>Not all backlinks are created equal. High-quality backlinks come from authoritative, relevant websites and provide genuine value to users. These links signal to search engines that your content is trustworthy and valuable.</p>
    
    <h3>Characteristics of Quality Backlinks</h3>
    
    <ul>
      <li><strong>Relevance</strong>: Links from websites in your industry or niche</li>
      <li><strong>Authority</strong>: Links from high-domain authority websites</li>
      <li><strong>Natural Placement</strong>: Links that fit naturally within content</li>
      <li><strong>Diverse Sources</strong>: Links from various types of legitimate websites</li>
    </ul>
    
    <h2>Effective Link Building Strategies</h2>
    
    <p>The most successful link building campaigns focus on creating valuable content and building genuine relationships within your industry. This approach takes time but delivers sustainable results.</p>
    
    <blockquote>
      "The best backlinks are earned, not built. Focus on creating content so valuable that others naturally want to link to it."
    </blockquote>
    
    <h2>Measuring Link Building Success</h2>
    
    <p>Track not just the number of backlinks, but their quality and impact on your overall SEO performance. Focus on metrics like domain authority, referral traffic, and ranking improvements.</p>`,
    status: 'published',
    category: 'Digital Marketing',
    keywords: ['backlinks', 'link building', 'SEO strategy', 'digital marketing'],
    seo_score: 95,
    is_trial_post: true,
    reading_time: 6,
    word_count: 420,
    author_name: 'Backlink ∞',
    published_at: new Date(Date.now() - 172800000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
    target_url: 'https://example.com/backlink-services',
    view_count: 31,
    tags: ['backlinks', 'SEO', 'strategy', 'link building']
  }
];

/**
 * Get fallback blog posts (for when database is unavailable)
 */
export function getFallbackBlogPosts(): FallbackBlogPost[] {
  return fallbackBlogPosts;
}

/**
 * Store fallback posts in localStorage for persistence
 */
export function storeFallbackPostsInLocalStorage(): void {
  try {
    const existingPosts = localStorage.getItem('fallback_blog_posts');
    if (!existingPosts) {
      localStorage.setItem('fallback_blog_posts', JSON.stringify(fallbackBlogPosts));
      console.log('✅ Stored fallback blog posts in localStorage');
    }
  } catch (error) {
    console.warn('⚠️ Failed to store fallback posts in localStorage:', error);
  }
}

/**
 * Get posts from localStorage fallback
 */
export function getFallbackPostsFromLocalStorage(): FallbackBlogPost[] {
  try {
    const stored = localStorage.getItem('fallback_blog_posts');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('⚠️ Failed to parse fallback posts from localStorage:', error);
  }
  
  // Return default fallback posts
  return fallbackBlogPosts;
}

/**
 * Check if we should use fallback data (when database is unavailable)
 */
export function shouldUseFallbackData(): boolean {
  // Check if environment variables are missing
  const hasSupabaseConfig = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  if (!hasSupabaseConfig) {
    console.log('📦 Using fallback blog data due to missing Supabase configuration');
    return true;
  }
  
  return false;
}
