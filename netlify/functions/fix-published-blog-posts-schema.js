const { createClient } = require('@supabase/supabase-js');

/**
 * Fix Published Blog Posts Schema - Emergency Fix
 * Creates the missing published_blog_posts table and sets up proper permissions
 */
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Initialize Supabase with service role key for admin operations
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔧 Starting published_blog_posts table creation...');

    // Create the published_blog_posts table with all required columns
    const createTableSQL = `
      -- Create published_blog_posts table
      CREATE TABLE IF NOT EXISTS public.published_blog_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        excerpt TEXT,
        target_url TEXT NOT NULL,
        anchor_text TEXT NOT NULL,
        keyword TEXT NOT NULL,
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
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_published_blog_posts_user_id ON public.published_blog_posts(user_id);
      CREATE INDEX IF NOT EXISTS idx_published_blog_posts_slug ON public.published_blog_posts(slug);
      CREATE INDEX IF NOT EXISTS idx_published_blog_posts_status ON public.published_blog_posts(status);
      CREATE INDEX IF NOT EXISTS idx_published_blog_posts_published_at ON public.published_blog_posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_published_blog_posts_target_url ON public.published_blog_posts(target_url);
      CREATE INDEX IF NOT EXISTS idx_published_blog_posts_trial ON public.published_blog_posts(is_trial_post, expires_at);
      CREATE INDEX IF NOT EXISTS idx_published_blog_posts_claimed ON public.published_blog_posts(is_claimed, claimed_at);

      -- Enable Row Level Security
      ALTER TABLE public.published_blog_posts ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies to avoid conflicts
      DROP POLICY IF EXISTS "Anyone can view published blog posts" ON public.published_blog_posts;
      DROP POLICY IF EXISTS "Users can view own blog posts" ON public.published_blog_posts;
      DROP POLICY IF EXISTS "Users can insert own blog posts" ON public.published_blog_posts;
      DROP POLICY IF EXISTS "Users can update own blog posts" ON public.published_blog_posts;
      DROP POLICY IF EXISTS "Users can delete own blog posts" ON public.published_blog_posts;

      -- Create RLS policies
      CREATE POLICY "Anyone can view published blog posts" ON public.published_blog_posts
        FOR SELECT USING (status = 'published');

      CREATE POLICY "Users can view own blog posts" ON public.published_blog_posts
        FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert own blog posts" ON public.published_blog_posts
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update own blog posts" ON public.published_blog_posts
        FOR UPDATE USING (auth.uid() = user_id);

      CREATE POLICY "Users can delete own blog posts" ON public.published_blog_posts
        FOR DELETE USING (auth.uid() = user_id);

      -- Create function for auto-updating timestamps
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create trigger for automatic timestamp updates
      DROP TRIGGER IF EXISTS update_published_blog_posts_updated_at ON public.published_blog_posts;
      CREATE TRIGGER update_published_blog_posts_updated_at 
        BEFORE UPDATE ON public.published_blog_posts 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    // Execute the SQL commands
    const { error: createError } = await supabase.rpc('execute_sql', {
      sql: createTableSQL
    });

    if (createError) {
      // Fallback to manual table creation if RPC fails
      console.log('RPC failed, trying manual creation...');
      
      const { error: manualError } = await supabase.from('published_blog_posts').select('id').limit(1);
      
      if (manualError && manualError.message?.includes('relation') && manualError.message?.includes('does not exist')) {
        // Table doesn't exist, create it manually using SQL editor approach
        const simpleCreateSQL = `
          CREATE TABLE IF NOT EXISTS published_blog_posts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            excerpt TEXT,
            target_url TEXT NOT NULL,
            anchor_text TEXT NOT NULL,
            keyword TEXT NOT NULL,
            platform TEXT DEFAULT 'telegraph',
            published_url TEXT NOT NULL,
            status TEXT DEFAULT 'published',
            view_count INTEGER DEFAULT 0,
            is_claimed BOOLEAN DEFAULT false,
            is_trial_post BOOLEAN DEFAULT true,
            expires_at TIMESTAMPTZ,
            claimed_at TIMESTAMPTZ,
            claimed_by UUID,
            validation_status TEXT DEFAULT 'pending',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;

        // Try using the sql query method
        const { error: sqlError } = await supabase.sql`${simpleCreateSQL}`;
        
        if (sqlError) {
          throw new Error(`Failed to create table: ${sqlError.message}`);
        }
      }
    }

    // Verify table exists by testing a simple query
    const { error: testError } = await supabase
      .from('published_blog_posts')
      .select('id')
      .limit(1);

    if (testError && testError.message?.includes('relation') && testError.message?.includes('does not exist')) {
      throw new Error('Table creation failed - published_blog_posts still does not exist');
    }

    console.log('✅ published_blog_posts table verified/created successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'published_blog_posts table created/verified successfully',
        tableExists: true,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Schema fix error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to fix database schema',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
