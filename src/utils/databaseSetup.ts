import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type BlogPost = Tables<'blog_posts'>;

export const DatabaseSetup = {
  /**
   * Test if database connection is working
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Supabase database connection...');
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select('count', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
      }
      
      console.log('✅ Database connection successful!');
      return true;
    } catch (err) {
      console.error('❌ Database connection error:', err);
      return false;
    }
  },

  /**
   * Get count of existing blog posts
   */
  async getPostCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error getting post count:', error);
        return 0;
      }
      
      return count || 0;
    } catch (err) {
      console.error('Error getting post count:', err);
      return 0;
    }
  },

  /**
   * Create sample blog posts if database is empty
   */
  async createSamplePosts(): Promise<boolean> {
    try {
      const count = await this.getPostCount();
      
      if (count > 0) {
        console.log(`📊 Database already has ${count} posts, skipping sample creation`);
        return true;
      }
      
      console.log('📝 Creating sample blog posts...');
      
      const samplePosts = [
        {
          title: 'The Complete Guide to SEO Optimization in 2024',
          slug: 'complete-seo-optimization-guide-2024',
          content: `# The Complete Guide to SEO Optimization in 2024

Search Engine Optimization (SEO) continues to evolve, and staying ahead of the curve is crucial for digital success. In this comprehensive guide, we'll explore the latest SEO strategies that actually work in 2024.

## Key SEO Strategies for 2024

### 1. Content Quality and Relevance
Creating high-quality, relevant content remains the cornerstone of effective SEO. Search engines prioritize content that provides genuine value to users.

### 2. Technical SEO Excellence
Technical optimization ensures your website can be properly crawled and indexed by search engines.

### 3. User Experience Optimization
Page speed, mobile responsiveness, and overall user experience are critical ranking factors.

## Advanced Techniques

- **Semantic SEO**: Understanding search intent and context
- **Entity-based SEO**: Optimizing for entities rather than just keywords
- **AI-assisted content creation**: Leveraging AI tools responsibly

## Conclusion

SEO success in 2024 requires a holistic approach combining technical excellence, quality content, and exceptional user experience.`,
          excerpt: 'Master the latest SEO strategies and techniques that drive real results in 2024.',
          target_url: 'https://example.com/seo-guide',
          status: 'published',
          category: 'SEO',
          tags: ['seo', 'optimization', 'digital marketing', 'search engines'],
          meta_description: 'Complete guide to SEO optimization in 2024. Learn proven strategies and techniques that drive real results.',
          author_name: 'SEO Expert',
          reading_time: 8,
          word_count: 1200,
          seo_score: 95,
          is_trial_post: false,
          view_count: 1250
        },
        {
          title: 'Advanced Link Building Strategies That Actually Work',
          slug: 'advanced-link-building-strategies',
          content: `# Advanced Link Building Strategies That Actually Work

Link building remains one of the most important ranking factors in SEO. However, the strategies that worked years ago are no longer effective. Here's what works now.

## Modern Link Building Approaches

### 1. Digital PR and HARO
Help A Reporter Out (HARO) and digital PR campaigns can generate high-quality backlinks from authoritative sources.

### 2. Resource Page Link Building
Finding resource pages in your niche and getting your content included.

### 3. Broken Link Building
Identifying broken links on relevant websites and suggesting your content as a replacement.

## Quality Over Quantity

Focus on earning links from:
- High domain authority sites
- Relevant industry publications
- Local business directories
- Educational institutions

## Tools for Link Building

- Ahrefs for competitor analysis
- Semrush for link opportunities
- Moz for domain authority checking

Remember, sustainable link building is about creating genuinely valuable content that people want to link to.`,
          excerpt: 'Discover advanced link building strategies that generate high-quality backlinks and improve your search rankings.',
          target_url: 'https://example.com/link-building',
          status: 'published',
          category: 'Link Building',
          tags: ['link building', 'backlinks', 'seo', 'digital marketing'],
          meta_description: 'Learn advanced link building strategies that actually work. Generate high-quality backlinks and improve rankings.',
          author_name: 'Link Building Specialist',
          reading_time: 6,
          word_count: 800,
          seo_score: 88,
          is_trial_post: false,
          view_count: 890
        },
        {
          title: 'Content Marketing Automation: Tools and Strategies',
          slug: 'content-marketing-automation-tools',
          content: `# Content Marketing Automation: Tools and Strategies

Content marketing automation can transform your marketing efforts, saving time while improving results. Here's how to implement it effectively.

## Why Automate Content Marketing?

- **Consistency**: Maintain regular publishing schedules
- **Efficiency**: Reduce manual work and repetitive tasks
- **Scalability**: Manage larger content volumes
- **Analytics**: Better tracking and optimization

## Essential Automation Tools

### 1. Content Creation
- AI writing assistants
- Template systems
- Content calendars

### 2. Distribution
- Social media schedulers
- Email marketing platforms
- RSS feed automation

### 3. Analytics and Optimization
- Performance tracking
- A/B testing platforms
- SEO monitoring tools

## Best Practices

1. Start with clear goals and metrics
2. Maintain human oversight and creativity
3. Test and optimize continuously
4. Don't over-automate - keep the human touch

Automation should enhance your content marketing, not replace the strategic thinking and creativity that makes content truly valuable.`,
          excerpt: 'Streamline your content marketing with automation tools and strategies that save time while improving results.',
          target_url: 'https://example.com/content-automation',
          status: 'published',
          category: 'Content Marketing',
          tags: ['content marketing', 'automation', 'productivity', 'tools'],
          meta_description: 'Discover content marketing automation tools and strategies that streamline your workflow and improve results.',
          author_name: 'Content Marketing Expert',
          reading_time: 5,
          word_count: 650,
          seo_score: 82,
          is_trial_post: false,
          view_count: 567
        }
      ];

      const { data, error } = await supabase
        .from('blog_posts')
        .insert(samplePosts)
        .select();

      if (error) {
        console.error('❌ Failed to create sample posts:', error);
        return false;
      }

      console.log(`✅ Successfully created ${data?.length || 0} sample blog posts`);
      return true;

    } catch (err) {
      console.error('❌ Error creating sample posts:', err);
      return false;
    }
  },

  /**
   * Initialize database with sample data if needed
   */
  async initializeDatabase(): Promise<boolean> {
    try {
      // Test connection first
      const isConnected = await this.testConnection();
      if (!isConnected) {
        console.log('❌ Database connection failed, cannot initialize');
        return false;
      }

      // Create sample posts if database is empty
      await this.createSamplePosts();
      
      return true;
    } catch (err) {
      console.error('❌ Database initialization failed:', err);
      return false;
    }
  }
};
