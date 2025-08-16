const { createClient } = require('@supabase/supabase-js');

/**
 * Emergency setup for published_blog_posts table
 * This function creates the missing table that's causing blog posts to fail loading
 */
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Initialize Supabase with service role key for admin operations
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('🔧 Setting up published_blog_posts table...');

    // Create the published_blog_posts table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS published_blog_posts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        meta_description TEXT,
        excerpt TEXT,
        keywords TEXT[] DEFAULT '{}',
        target_url TEXT NOT NULL,
        published_url TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
        is_trial_post BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMPTZ,
        view_count INTEGER DEFAULT 0,
        seo_score INTEGER DEFAULT 0,
        contextual_links JSONB DEFAULT '[]',
        reading_time INTEGER DEFAULT 0,
        word_count INTEGER DEFAULT 0,
        featured_image TEXT,
        author_name TEXT DEFAULT 'Backlinkoo Team',
        author_avatar TEXT,
        tags TEXT[] DEFAULT '{}',
        category TEXT DEFAULT 'General',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        published_at TIMESTAMPTZ DEFAULT NOW(),
        anchor_text TEXT,
        is_claimed BOOLEAN DEFAULT FALSE,
        claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        claimed_at TIMESTAMPTZ
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', {
      query: createTableSQL
    });

    if (createError && !createError.message.includes('already exists')) {
      console.error('Error creating table:', createError);
      throw createError;
    }

    console.log('✅ published_blog_posts table created');

    // Create indexes for performance
    const indexesSQL = [
      'CREATE INDEX IF NOT EXISTS idx_published_blog_posts_user_id ON published_blog_posts(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_published_blog_posts_slug ON published_blog_posts(slug);',
      'CREATE INDEX IF NOT EXISTS idx_published_blog_posts_status ON published_blog_posts(status);',
      'CREATE INDEX IF NOT EXISTS idx_published_blog_posts_published_at ON published_blog_posts(published_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_published_blog_posts_target_url ON published_blog_posts(target_url);',
      'CREATE INDEX IF NOT EXISTS idx_published_blog_posts_trial ON published_blog_posts(is_trial_post, expires_at);'
    ];

    for (const indexSQL of indexesSQL) {
      const { error: indexError } = await supabase.rpc('exec_sql', {
        query: indexSQL
      });
      if (indexError && !indexError.message.includes('already exists')) {
        console.warn('Index creation warning:', indexError.message);
      }
    }

    console.log('✅ Indexes created');

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE published_blog_posts ENABLE ROW LEVEL SECURITY;'
    });

    if (rlsError && !rlsError.message.includes('already')) {
      console.warn('RLS enable warning:', rlsError.message);
    }

    // Create RLS policies
    const policiesSQL = [
      `CREATE POLICY IF NOT EXISTS "Anyone can view published blog posts" ON published_blog_posts
        FOR SELECT USING (status = 'published');`,
      `CREATE POLICY IF NOT EXISTS "Users can view own blog posts" ON published_blog_posts
        FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY IF NOT EXISTS "Users can insert their own posts" ON published_blog_posts
        FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY IF NOT EXISTS "Users can update their own posts" ON published_blog_posts
        FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY IF NOT EXISTS "Users can delete their own posts" ON published_blog_posts
        FOR DELETE USING (auth.uid() = user_id);`
    ];

    for (const policySQL of policiesSQL) {
      const { error: policyError } = await supabase.rpc('exec_sql', {
        query: policySQL
      });
      if (policyError && !policyError.message.includes('already exists')) {
        console.warn('Policy creation warning:', policyError.message);
      }
    }

    console.log('✅ RLS policies created');

    // Create view count increment function
    const functionSQL = `
      CREATE OR REPLACE FUNCTION increment_published_blog_post_views(post_slug TEXT)
      RETURNS void AS $$
      BEGIN
        UPDATE published_blog_posts 
        SET view_count = view_count + 1 
        WHERE slug = post_slug AND status = 'published';
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: functionError } = await supabase.rpc('exec_sql', {
      query: functionSQL
    });

    if (functionError) {
      console.warn('Function creation warning:', functionError.message);
    } else {
      console.log('✅ View increment function created');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'published_blog_posts table setup completed',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Setup failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to setup database',
        timestamp: new Date().toISOString()
      })
    };
  }
};
