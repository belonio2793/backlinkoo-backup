/**
 * Emergency Schema Fix - Create ALL missing tables for campaign system
 * Fixes the specific errors seen in campaign resume attempts
 */

const { createClient } = require('@supabase/supabase-js');

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
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚨 EMERGENCY SCHEMA FIX: Creating ALL missing tables...');

    const results = [];

    // 1. Create campaigns table (if not exists)
    try {
      const { error: campaignsError } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.campaigns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            keywords TEXT[] NOT NULL DEFAULT '{}',
            anchor_texts TEXT[] NOT NULL DEFAULT '{}',
            target_url TEXT NOT NULL,
            status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'error')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE,
            published_urls TEXT[] DEFAULT '{}'
          );
        `
      });

      if (campaignsError) {
        console.log('Campaigns table creation failed:', campaignsError);
      } else {
        results.push('✅ campaigns table created/verified');
      }
    } catch (error) {
      console.log('Error with campaigns table:', error.message);
      results.push(`❌ campaigns table error: ${error.message}`);
    }

    // 2. Create automation_campaigns table (alternative naming)
    try {
      const { error: autoCampaignsError } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.automation_campaigns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            keywords TEXT[] NOT NULL DEFAULT '{}',
            anchor_texts TEXT[] NOT NULL DEFAULT '{}',
            target_url TEXT NOT NULL,
            status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'error')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE,
            published_urls TEXT[] DEFAULT '{}'
          );
        `
      });

      if (autoCampaignsError) {
        console.log('Automation campaigns table creation failed:', autoCampaignsError);
      } else {
        results.push('✅ automation_campaigns table created/verified');
      }
    } catch (error) {
      console.log('Error with automation_campaigns table:', error.message);
      results.push(`❌ automation_campaigns table error: ${error.message}`);
    }

    // 3. Create published_blog_posts table (MISSING TABLE from errors)
    try {
      const { error: blogPostsError } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.published_blog_posts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            campaign_id UUID NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            published_url TEXT NOT NULL,
            platform TEXT DEFAULT 'Telegraph.ph',
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
            published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (blogPostsError) {
        console.log('Published blog posts table creation failed:', blogPostsError);
      } else {
        results.push('✅ published_blog_posts table created/verified');
      }
    } catch (error) {
      console.log('Error with published_blog_posts table:', error.message);
      results.push(`❌ published_blog_posts table error: ${error.message}`);
    }

    // 4. Create published_links table
    try {
      const { error: linksError } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.published_links (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            campaign_id UUID NOT NULL,
            url TEXT NOT NULL,
            platform TEXT DEFAULT 'Telegraph.ph',
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (linksError) {
        console.log('Published links table creation failed:', linksError);
      } else {
        results.push('✅ published_links table created/verified');
      }
    } catch (error) {
      console.log('Error with published_links table:', error.message);
      results.push(`❌ published_links table error: ${error.message}`);
    }

    // 5. Create automation_published_links table (alternative naming)
    try {
      const { error: autoLinksError } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.automation_published_links (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            campaign_id UUID NOT NULL,
            published_url TEXT NOT NULL,
            platform TEXT DEFAULT 'Telegraph.ph',
            title TEXT,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
            published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (autoLinksError) {
        console.log('Automation published links table creation failed:', autoLinksError);
      } else {
        results.push('✅ automation_published_links table created/verified');
      }
    } catch (error) {
      console.log('Error with automation_published_links table:', error.message);
      results.push(`❌ automation_published_links table error: ${error.message}`);
    }

    // 6. Create activity_logs table (MISSING TABLE from errors)
    try {
      const { error: logsError } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.activity_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            campaign_id UUID NOT NULL,
            activity_type TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (logsError) {
        console.log('Activity logs table creation failed:', logsError);
      } else {
        results.push('✅ activity_logs table created/verified');
      }
    } catch (error) {
      console.log('Error with activity_logs table:', error.message);
      results.push(`❌ activity_logs table error: ${error.message}`);
    }

    // 7. Set up RLS policies for all tables
    try {
      const { error: rlsError } = await supabase.rpc('exec', {
        sql: `
          -- Enable RLS on all tables
          ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.automation_campaigns ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.published_blog_posts ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.published_links ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.automation_published_links ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

          -- Create policies for campaigns table
          DROP POLICY IF EXISTS "Users can access their own campaigns" ON public.campaigns;
          CREATE POLICY "Users can access their own campaigns" ON public.campaigns
            FOR ALL USING (auth.uid() = user_id);

          -- Create policies for automation_campaigns table
          DROP POLICY IF EXISTS "Users can access their own automation campaigns" ON public.automation_campaigns;
          CREATE POLICY "Users can access their own automation campaigns" ON public.automation_campaigns
            FOR ALL USING (auth.uid() = user_id);

          -- Create policies for published_blog_posts table
          DROP POLICY IF EXISTS "Users can access their campaign blog posts" ON public.published_blog_posts;
          CREATE POLICY "Users can access their campaign blog posts" ON public.published_blog_posts
            FOR ALL USING (
              campaign_id IN (
                SELECT id FROM public.campaigns WHERE user_id = auth.uid()
                UNION
                SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
              )
            );

          -- Create policies for published_links table
          DROP POLICY IF EXISTS "Users can access their campaign links" ON public.published_links;
          CREATE POLICY "Users can access their campaign links" ON public.published_links
            FOR ALL USING (
              campaign_id IN (
                SELECT id FROM public.campaigns WHERE user_id = auth.uid()
                UNION
                SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
              )
            );

          -- Create policies for automation_published_links table
          DROP POLICY IF EXISTS "Users can access their automation links" ON public.automation_published_links;
          CREATE POLICY "Users can access their automation links" ON public.automation_published_links
            FOR ALL USING (
              campaign_id IN (
                SELECT id FROM public.campaigns WHERE user_id = auth.uid()
                UNION
                SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
              )
            );

          -- Create policies for activity_logs table
          DROP POLICY IF EXISTS "Users can access their campaign logs" ON public.activity_logs;
          CREATE POLICY "Users can access their campaign logs" ON public.activity_logs
            FOR ALL USING (
              campaign_id IN (
                SELECT id FROM public.campaigns WHERE user_id = auth.uid()
                UNION
                SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
              )
            );
        `
      });

      if (rlsError) {
        console.log('RLS policies setup failed:', rlsError);
        results.push(`❌ RLS policies error: ${rlsError.message}`);
      } else {
        results.push('✅ RLS policies created/updated');
      }
    } catch (error) {
      console.log('Error setting up RLS policies:', error.message);
      results.push(`❌ RLS policies error: ${error.message}`);
    }

    // 8. Verify tables exist by checking them
    try {
      const tables = [
        'campaigns',
        'automation_campaigns', 
        'published_blog_posts',
        'published_links',
        'automation_published_links',
        'activity_logs'
      ];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          results.push(`❌ Table ${table} verification failed: ${error.message}`);
        } else {
          results.push(`✅ Table ${table} verified working`);
        }
      }
    } catch (error) {
      results.push(`❌ Table verification error: ${error.message}`);
    }

    console.log('🎉 Emergency schema fix completed');
    console.log('Results:', results);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Emergency schema fix completed',
        results: results,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('❌ Emergency schema fix failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Emergency schema fix failed',
        timestamp: new Date().toISOString()
      }),
    };
  }
};
