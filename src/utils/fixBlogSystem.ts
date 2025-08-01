/**
 * Blog System Fix Utility
 * This utility fixes the missing user_saved_posts table and other blog system issues
 */

import { supabase } from '@/integrations/supabase/client';

export interface BlogSystemFix {
  component: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  details?: any;
}

export class BlogSystemFixUtility {
  private fixes: BlogSystemFix[] = [];

  private log(component: string, status: 'success' | 'error' | 'skipped', message: string, details?: any) {
    const fix: BlogSystemFix = { component, status, message, details };
    this.fixes.push(fix);
    console.log(`${status === 'success' ? '✅' : status === 'error' ? '❌' : '⏭️'} [${component}] ${message}`);
  }

  async fixBlogSystem(): Promise<BlogSystemFix[]> {
    console.log('🔧 Starting blog system fixes...');
    this.fixes = [];

    await this.createUserSavedPostsTable();
    await this.enableRLS();
    await this.createPolicies();
    await this.verifyBlogPostsTable();
    await this.ensureSampleData();

    console.log('🔧 Blog system fixes complete!');
    return this.fixes;
  }

  private async createUserSavedPostsTable() {
    try {
      // Check if table exists first
      const { data: existingTables, error: checkError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'user_saved_posts');

      if (checkError) {
        // Fallback: try to query the table directly
        const { error: queryError } = await supabase
          .from('user_saved_posts')
          .select('id')
          .limit(1);

        if (!queryError) {
          this.log('user_saved_posts Table', 'skipped', 'Table already exists');
          return;
        }
      } else if (existingTables && existingTables.length > 0) {
        this.log('user_saved_posts Table', 'skipped', 'Table already exists');
        return;
      }

      // Create the table using SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS user_saved_posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
          saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, post_id)
        );
      `;

      const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

      if (error) {
        this.log('user_saved_posts Table', 'error', 'Failed to create table', { error: error.message });
      } else {
        this.log('user_saved_posts Table', 'success', 'Table created successfully');
      }
    } catch (error: any) {
      this.log('user_saved_posts Table', 'error', 'Creation failed', { error: error.message });
    }
  }

  private async enableRLS() {
    try {
      const enableRLSSQL = `
        ALTER TABLE user_saved_posts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
      `;

      const { error } = await supabase.rpc('exec_sql', { sql: enableRLSSQL });

      if (error) {
        this.log('RLS Setup', 'error', 'Failed to enable RLS', { error: error.message });
      } else {
        this.log('RLS Setup', 'success', 'Row Level Security enabled');
      }
    } catch (error: any) {
      this.log('RLS Setup', 'error', 'RLS setup failed', { error: error.message });
    }
  }

  private async createPolicies() {
    try {
      const policiesSQL = `
        -- Policies for blog_posts table
        CREATE POLICY IF NOT EXISTS "Blog posts are viewable by everyone" ON blog_posts
          FOR SELECT USING (true);

        CREATE POLICY IF NOT EXISTS "Users can insert their own blog posts" ON blog_posts
          FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

        CREATE POLICY IF NOT EXISTS "Users can update their own blog posts" ON blog_posts
          FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

        -- Policies for user_saved_posts table
        CREATE POLICY IF NOT EXISTS "Users can view their own saved posts" ON user_saved_posts
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can save posts to their dashboard" ON user_saved_posts
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can remove their own saved posts" ON user_saved_posts
          FOR DELETE USING (auth.uid() = user_id);
      `;

      const { error } = await supabase.rpc('exec_sql', { sql: policiesSQL });

      if (error) {
        this.log('Security Policies', 'error', 'Failed to create policies', { error: error.message });
      } else {
        this.log('Security Policies', 'success', 'Security policies created');
      }
    } catch (error: any) {
      this.log('Security Policies', 'error', 'Policy creation failed', { error: error.message });
    }
  }

  private async verifyBlogPostsTable() {
    try {
      const { data, error, count } = await supabase
        .from('blog_posts')
        .select('id', { count: 'exact', head: true });

      if (error) {
        this.log('blog_posts Verification', 'error', 'Table access failed', { error: error.message });
      } else {
        this.log('blog_posts Verification', 'success', 'Table accessible', { postCount: count || 0 });
      }
    } catch (error: any) {
      this.log('blog_posts Verification', 'error', 'Verification failed', { error: error.message });
    }
  }

  private async ensureSampleData() {
    try {
      const { count, error } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true });

      if (error) {
        this.log('Sample Data', 'error', 'Could not check for existing data', { error: error.message });
        return;
      }

      if (count && count > 0) {
        this.log('Sample Data', 'skipped', `${count} posts already exist`);
        return;
      }

      // Create sample blog posts
      const samplePosts = [
        {
          title: 'Complete Guide to SEO in 2024',
          slug: 'complete-seo-guide-2024',
          content: `<h2>Introduction to SEO</h2>
<p>Search Engine Optimization (SEO) continues to evolve rapidly. In 2024, the focus is on providing exceptional user experience while maintaining technical excellence.</p>

<h3>Key SEO Trends</h3>
<ul>
<li>Core Web Vitals optimization</li>
<li>AI-powered content creation</li>
<li>Voice search optimization</li>
<li>Mobile-first indexing</li>
</ul>

<h3>Technical SEO Fundamentals</h3>
<p>Technical SEO forms the foundation of any successful SEO strategy. Key areas include:</p>
<ul>
<li>Site speed optimization</li>
<li>Structured data implementation</li>
<li>XML sitemap optimization</li>
<li>Internal linking strategy</li>
</ul>

<p>For more advanced SEO techniques, visit <a href="https://backlinkoo.com">our platform</a> for comprehensive backlink solutions.</p>`,
          excerpt: 'Master the latest SEO strategies and techniques for 2024',
          target_url: 'https://backlinkoo.com/seo-guide',
          category: 'SEO',
          tags: ['seo', 'optimization', 'marketing'],
          meta_description: 'Complete guide to SEO optimization in 2024. Learn proven strategies and techniques.',
          author_name: 'SEO Expert',
          reading_time: 5,
          word_count: 850,
          seo_score: 92,
          status: 'published',
          is_trial_post: false
        },
        {
          title: 'Advanced Link Building Strategies',
          slug: 'advanced-link-building-strategies',
          content: `<h2>Modern Link Building Approach</h2>
<p>Link building in 2024 requires a sophisticated approach that focuses on quality over quantity and genuine relationship building.</p>

<h3>Effective Link Building Techniques</h3>
<ul>
<li>Resource page link building</li>
<li>Broken link building</li>
<li>Guest posting on authority sites</li>
<li>Digital PR and HARO</li>
</ul>

<h3>Quality vs Quantity</h3>
<p>A single high-authority link from a relevant domain can be worth more than dozens of low-quality links. Focus on:</p>
<ul>
<li>Domain authority and relevance</li>
<li>Content quality and context</li>
<li>Natural anchor text diversity</li>
<li>Editorial standards</li>
</ul>

<p>Learn more about professional <a href="https://backlinkoo.com">backlink services</a> and how they can boost your rankings.</p>`,
          excerpt: 'Learn advanced link building strategies that drive real results',
          target_url: 'https://backlinkoo.com/link-building',
          category: 'Link Building',
          tags: ['backlinks', 'seo', 'marketing'],
          meta_description: 'Advanced link building strategies for 2024. Proven techniques for quality backlinks.',
          author_name: 'Link Building Expert',
          reading_time: 7,
          word_count: 1200,
          seo_score: 88,
          status: 'published',
          is_trial_post: true,
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours from now
        }
      ];

      const { data, error } = await supabase
        .from('blog_posts')
        .insert(samplePosts)
        .select();

      if (error) {
        this.log('Sample Data', 'error', 'Failed to create sample posts', { error: error.message });
      } else {
        this.log('Sample Data', 'success', `Created ${data?.length || 0} sample posts`);
      }
    } catch (error: any) {
      this.log('Sample Data', 'error', 'Sample data creation failed', { error: error.message });
    }
  }

  getFixes(): BlogSystemFix[] {
    return this.fixes;
  }

  getSummary() {
    const summary = {
      success: this.fixes.filter(f => f.status === 'success').length,
      error: this.fixes.filter(f => f.status === 'error').length,
      skipped: this.fixes.filter(f => f.status === 'skipped').length,
      total: this.fixes.length
    };
    return summary;
  }
}

export const blogSystemFix = new BlogSystemFixUtility();
