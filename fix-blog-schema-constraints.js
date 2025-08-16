const { createClient } = require('@supabase/supabase-js');

/**
 * Fix published_blog_posts schema NOT NULL constraints
 * Makes anchor_text and keyword nullable to prevent constraint violations
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBlogSchemaConstraints() {
  console.log('🔧 Fixing published_blog_posts schema constraints...');
  
  try {
    // First check if table exists
    const { error: checkError } = await supabase
      .from('published_blog_posts')
      .select('id')
      .limit(1);
    
    if (checkError) {
      if (checkError.message?.includes('relation') && checkError.message?.includes('does not exist')) {
        console.log('❌ published_blog_posts table does not exist, creating it...');
        
        // Create table with correct schema
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS published_blog_posts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            excerpt TEXT,
            target_url TEXT NOT NULL,
            anchor_text TEXT, -- Allow NULL
            keyword TEXT, -- Allow NULL
            platform TEXT DEFAULT 'telegraph',
            published_url TEXT NOT NULL,
            status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
            view_count INTEGER DEFAULT 0,
            is_claimed BOOLEAN DEFAULT false,
            is_trial_post BOOLEAN DEFAULT true,
            expires_at TIMESTAMPTZ,
            claimed_at TIMESTAMPTZ,
            claimed_by UUID REFERENCES auth.users(id),
            validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'failed')),
            seo_score INTEGER DEFAULT 0,
            reading_time INTEGER DEFAULT 0,
            word_count INTEGER DEFAULT 0,
            author_name TEXT DEFAULT 'Anonymous',
            tags TEXT[] DEFAULT '{}',
            category TEXT DEFAULT 'General',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_published_blog_posts_user_id ON published_blog_posts(user_id);
          CREATE INDEX IF NOT EXISTS idx_published_blog_posts_slug ON published_blog_posts(slug);
          CREATE INDEX IF NOT EXISTS idx_published_blog_posts_status ON published_blog_posts(status);
          CREATE INDEX IF NOT EXISTS idx_published_blog_posts_published_at ON published_blog_posts(created_at DESC);
          CREATE INDEX IF NOT EXISTS idx_published_blog_posts_target_url ON published_blog_posts(target_url);
          CREATE INDEX IF NOT EXISTS idx_published_blog_posts_trial ON published_blog_posts(is_trial_post, expires_at);
          CREATE INDEX IF NOT EXISTS idx_published_blog_posts_claimed ON published_blog_posts(is_claimed, claimed_at);

          -- Enable Row Level Security
          ALTER TABLE published_blog_posts ENABLE ROW LEVEL SECURITY;

          -- Create RLS policies
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
        
        // Use SQL query to create table
        const { error: createError } = await supabase.sql`${createTableSQL}`;
        
        if (createError) {
          console.error('❌ Failed to create table:', createError.message);
          return false;
        }
        
        console.log('✅ Created published_blog_posts table with correct schema');
        return true;
      } else {
        console.error('❌ Error checking table:', checkError.message);
        return false;
      }
    }
    
    // Table exists, check if we need to modify constraints
    console.log('✅ published_blog_posts table exists');
    
    // Try to modify columns to allow NULL if they're currently NOT NULL
    try {
      const alterSQL = `
        ALTER TABLE published_blog_posts 
        ALTER COLUMN anchor_text DROP NOT NULL,
        ALTER COLUMN keyword DROP NOT NULL;
      `;
      
      const { error: alterError } = await supabase.sql`${alterSQL}`;
      
      if (alterError) {
        console.warn('⚠️ Could not modify constraints (they may already be correct):', alterError.message);
      } else {
        console.log('✅ Modified anchor_text and keyword columns to allow NULL');
      }
    } catch (alterError) {
      console.warn('⚠️ Could not modify constraints (they may already be correct):', alterError.message);
    }
    
    // Test insertion to verify fix worked
    console.log('🧪 Testing blog post insertion...');
    
    const testPost = {
      title: 'Test Blog Post',
      content: '<p>This is a test blog post content.</p>',
      slug: `test-blog-${Date.now()}`,
      target_url: 'https://example.com',
      published_url: `https://example.com/blog/test-blog-${Date.now()}`,
      anchor_text: null, // Test NULL value
      keyword: null, // Test NULL value
      status: 'published',
      is_trial_post: true,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    const { data: testData, error: testError } = await supabase
      .from('published_blog_posts')
      .insert(testPost)
      .select();
    
    if (testError) {
      console.error('❌ Test insertion failed:', testError.message);
      return false;
    }
    
    console.log('✅ Test insertion successful, constraint issue is fixed');
    
    // Clean up test post
    if (testData && testData[0]) {
      await supabase
        .from('published_blog_posts')
        .delete()
        .eq('id', testData[0].id);
      console.log('🧹 Cleaned up test post');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
    return false;
  }
}

// Run the fix
fixBlogSchemaConstraints()
  .then(success => {
    if (success) {
      console.log('🎉 Blog schema constraints fixed successfully');
      process.exit(0);
    } else {
      console.log('❌ Failed to fix blog schema constraints');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
