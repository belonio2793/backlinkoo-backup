import { supabase } from '@/integrations/supabase/client';

export class ManualMigration {
  static async createUserSavedPostsTable(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if table already exists
      const { data: existingTable, error: checkError } = await supabase
        .from('user_saved_posts')
        .select('id')
        .limit(1);

      if (!checkError) {
        return { success: true }; // Table already exists
      }

      // Create the table using raw SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS user_saved_posts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
          saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Ensure a user can't save the same post multiple times
          UNIQUE(user_id, post_id)
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_user_saved_posts_user_id ON user_saved_posts(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_saved_posts_post_id ON user_saved_posts(post_id);
        CREATE INDEX IF NOT EXISTS idx_user_saved_posts_saved_at ON user_saved_posts(saved_at);

        -- Enable Row Level Security
        ALTER TABLE user_saved_posts ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        DROP POLICY IF EXISTS "Users can view their own saved posts" ON user_saved_posts;
        CREATE POLICY "Users can view their own saved posts" ON user_saved_posts
          FOR SELECT USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can save posts to their dashboard" ON user_saved_posts;
        CREATE POLICY "Users can save posts to their dashboard" ON user_saved_posts
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can remove their own saved posts" ON user_saved_posts;
        CREATE POLICY "Users can remove their own saved posts" ON user_saved_posts
          FOR DELETE USING (auth.uid() = user_id);
      `;

      const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async createBlogPostsTable(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if table already exists
      const { data: existingTable, error: checkError } = await supabase
        .from('blog_posts')
        .select('id')
        .limit(1);

      if (!checkError) {
        return { success: true }; // Table already exists
      }

      // Create the table using raw SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS blog_posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          content TEXT NOT NULL,
          excerpt TEXT,
          meta_description TEXT,
          keywords TEXT[] DEFAULT '{}',
          tags TEXT[] DEFAULT '{}',
          category TEXT DEFAULT 'General',
          target_url TEXT NOT NULL,
          anchor_text TEXT,
          published_url TEXT,
          status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
          is_trial_post BOOLEAN DEFAULT false,
          expires_at TIMESTAMP WITH TIME ZONE,
          view_count INTEGER DEFAULT 0,
          seo_score INTEGER DEFAULT 75,
          reading_time INTEGER DEFAULT 5,
          word_count INTEGER DEFAULT 1000,
          featured_image TEXT,
          author_name TEXT DEFAULT 'AI Writer',
          author_avatar TEXT,
          contextual_links JSONB DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_trial ON blog_posts(is_trial_post);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_expires ON blog_posts(expires_at);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_user ON blog_posts(user_id);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_created ON blog_posts(created_at);

        -- Enable Row Level Security
        ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        DROP POLICY IF EXISTS "Public can read published posts" ON blog_posts;
        CREATE POLICY "Public can read published posts" ON blog_posts
          FOR SELECT USING (status = 'published');

        DROP POLICY IF EXISTS "Users can manage their own posts" ON blog_posts;
        CREATE POLICY "Users can manage their own posts" ON blog_posts
          FOR ALL USING (auth.uid() = user_id);
      `;

      const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async insertSampleData(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if we already have data
      const { data: existingPosts, error: countError } = await supabase
        .from('blog_posts')
        .select('id')
        .limit(1);

      if (existingPosts && existingPosts.length > 0) {
        return { success: true }; // Data already exists
      }

      // Insert sample blog posts
      const samplePosts = [
        {
          title: 'Getting Started with SEO Optimization',
          slug: 'getting-started-seo-optimization',
          content: '<h1>Getting Started with SEO Optimization</h1><p>Learn the fundamentals of SEO optimization and how to improve your website rankings. This comprehensive guide covers keyword research, on-page optimization, and link building strategies.</p><p>SEO is crucial for driving organic traffic to your website. By following best practices, you can improve your search engine rankings and attract more visitors.</p>',
          excerpt: 'Complete guide to SEO fundamentals and best practices',
          meta_description: 'Learn SEO optimization fundamentals to improve your website rankings and drive organic traffic',
          keywords: ['seo', 'optimization', 'rankings', 'organic traffic'],
          tags: ['seo', 'optimization', 'beginners', 'guide'],
          category: 'SEO',
          target_url: 'https://example.com/seo-guide',
          anchor_text: 'SEO optimization guide',
          reading_time: 5,
          word_count: 1200,
          seo_score: 85,
          is_trial_post: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          author_name: 'SEO Expert'
        },
        {
          title: 'Advanced Link Building Strategies for 2024',
          slug: 'advanced-link-building-strategies-2024',
          content: '<h1>Advanced Link Building Strategies for 2024</h1><p>Discover cutting-edge link building techniques that work in today\'s competitive landscape. This guide covers high-authority backlink acquisition, relationship building, and content-driven link earning strategies.</p><p>Link building remains one of the most important ranking factors. Learn how to build high-quality backlinks that drive real results.</p>',
          excerpt: 'Cutting-edge link building techniques for modern SEO',
          meta_description: 'Master advanced link building strategies to boost your website authority and search rankings',
          keywords: ['link building', 'backlinks', 'seo strategy', 'authority'],
          tags: ['link-building', 'backlinks', 'advanced', 'strategy'],
          category: 'Link Building',
          target_url: 'https://example.com/link-building',
          anchor_text: 'link building strategies',
          reading_time: 8,
          word_count: 1800,
          seo_score: 92,
          is_trial_post: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          author_name: 'Link Building Pro'
        },
        {
          title: 'Content Marketing Best Practices',
          slug: 'content-marketing-best-practices',
          content: '<h1>Content Marketing Best Practices</h1><p>Create compelling content that drives engagement and conversions. This guide covers content strategy, audience research, and performance optimization.</p><p>Effective content marketing builds trust, establishes authority, and drives business growth. Learn the strategies that top marketers use.</p>',
          excerpt: 'Essential strategies for effective content marketing',
          meta_description: 'Learn content marketing best practices to engage your audience and drive business growth',
          keywords: ['content marketing', 'content strategy', 'engagement', 'conversions'],
          tags: ['content-marketing', 'strategy', 'engagement', 'best-practices'],
          category: 'Content Marketing',
          target_url: 'https://example.com/content-marketing',
          anchor_text: 'content marketing guide',
          reading_time: 6,
          word_count: 1400,
          seo_score: 88,
          is_trial_post: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          author_name: 'Content Strategist'
        }
      ];

      for (const post of samplePosts) {
        const { error } = await supabase
          .from('blog_posts')
          .insert(post);

        if (error) {
          console.warn('Failed to insert sample post:', error);
        }
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async runAllMigrations(): Promise<{
    success: boolean;
    results: Array<{ step: string; success: boolean; error?: string }>;
  }> {
    const results = [];

    // Create blog_posts table
    const blogPostsResult = await this.createBlogPostsTable();
    results.push({ step: 'Create blog_posts table', ...blogPostsResult });

    // Create user_saved_posts table
    const userSavedResult = await this.createUserSavedPostsTable();
    results.push({ step: 'Create user_saved_posts table', ...userSavedResult });

    // Insert sample data
    const sampleDataResult = await this.insertSampleData();
    results.push({ step: 'Insert sample data', ...sampleDataResult });

    const allSuccessful = results.every(r => r.success);

    return {
      success: allSuccessful,
      results
    };
  }
}
