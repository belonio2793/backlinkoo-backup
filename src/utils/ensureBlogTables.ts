/**
 * Utility to ensure blog tables exist before performing operations
 */

import { supabase } from '@/integrations/supabase/client';

export async function ensureBlogTablesExist(): Promise<boolean> {
  try {
    console.log('🔍 Checking if blog tables exist...');

    // Test if published_blog_posts table exists
    const { error: tableError } = await supabase
      .from('published_blog_posts')
      .select('id')
      .limit(1);

    if (tableError) {
      if (tableError.message?.includes('relation') || tableError.message?.includes('does not exist')) {
        console.warn('⚠️ Blog tables do not exist, attempting to create them...');
        
        // Try to create the table if it doesn't exist
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS published_blog_posts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            slug VARCHAR(255) NOT NULL UNIQUE,
            title TEXT NOT NULL,
            excerpt TEXT,
            content TEXT NOT NULL,
            published_url TEXT NOT NULL,
            target_url TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            published_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE,
            status VARCHAR(50) DEFAULT 'published',
            seo_score INTEGER DEFAULT 0,
            reading_time INTEGER DEFAULT 0,
            word_count INTEGER DEFAULT 0,
            view_count INTEGER DEFAULT 0,
            is_trial_post BOOLEAN DEFAULT true,
            user_id UUID REFERENCES auth.users(id),
            author_name TEXT DEFAULT 'Anonymous',
            tags TEXT[] DEFAULT '{}',
            category TEXT DEFAULT 'General'
          );

          CREATE INDEX IF NOT EXISTS idx_published_blog_posts_slug ON published_blog_posts(slug);
          CREATE INDEX IF NOT EXISTS idx_published_blog_posts_status ON published_blog_posts(status);
          CREATE INDEX IF NOT EXISTS idx_published_blog_posts_published_at ON published_blog_posts(published_at DESC);
          CREATE INDEX IF NOT EXISTS idx_published_blog_posts_trial ON published_blog_posts(is_trial_post, expires_at);

          ALTER TABLE published_blog_posts ENABLE ROW LEVEL SECURITY;

          DROP POLICY IF EXISTS "Anyone can view published blog posts" ON published_blog_posts;
          CREATE POLICY "Anyone can view published blog posts" ON published_blog_posts
            FOR SELECT USING (status = 'published');

          DROP POLICY IF EXISTS "Users can view own blog posts" ON published_blog_posts;
          CREATE POLICY "Users can view own blog posts" ON published_blog_posts
            FOR SELECT USING (auth.uid() = user_id);

          DROP POLICY IF EXISTS "Users can insert own blog posts" ON published_blog_posts;
          CREATE POLICY "Users can insert own blog posts" ON published_blog_posts
            FOR INSERT WITH CHECK (auth.uid() = user_id);

          DROP POLICY IF EXISTS "Users can update own blog posts" ON published_blog_posts;
          CREATE POLICY "Users can update own blog posts" ON published_blog_posts
            FOR UPDATE USING (auth.uid() = user_id);

          DROP POLICY IF EXISTS "Users can delete own blog posts" ON published_blog_posts;
          CREATE POLICY "Users can delete own blog posts" ON published_blog_posts
            FOR DELETE USING (auth.uid() = user_id);
        `;

        try {
          const { error: createError } = await supabase.rpc('exec', { sql: createTableSQL });
          
          if (createError) {
            console.warn('❌ Could not create blog tables:', createError.message);
            return false;
          }

          console.log('✅ Blog tables created successfully');
          return true;
        } catch (createError) {
          console.warn('❌ Error creating blog tables:', createError);
          return false;
        }
      } else {
        console.warn('❌ Database error:', tableError.message);
        return false;
      }
    }

    console.log('✅ Blog tables exist and are accessible');
    return true;
  } catch (error) {
    console.warn('❌ Error checking blog tables:', error);
    return false;
  }
}

export async function initializeBlogSystemSafely(): Promise<{
  success: boolean;
  message: string;
  fallbackToLocalStorage: boolean;
}> {
  try {
    const tablesExist = await ensureBlogTablesExist();
    
    if (tablesExist) {
      return {
        success: true,
        message: 'Blog system initialized successfully',
        fallbackToLocalStorage: false
      };
    } else {
      return {
        success: true,
        message: 'Blog system initialized with localStorage fallback',
        fallbackToLocalStorage: true
      };
    }
  } catch (error) {
    console.warn('Blog system initialization failed, using localStorage fallback:', error);
    return {
      success: true,
      message: 'Blog system initialized with localStorage fallback due to database issues',
      fallbackToLocalStorage: true
    };
  }
}
