#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { SecureConfig } from './src/lib/secure-config.js';

// Configuration using secure credentials
const SUPABASE_URL = SecureConfig.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = SecureConfig.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupDatabase() {
    console.log('🔧 Setting up published_blog_posts table...');

    try {
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
            `DROP POLICY IF EXISTS "Anyone can view published blog posts" ON published_blog_posts;`,
            `CREATE POLICY "Anyone can view published blog posts" ON published_blog_posts
                FOR SELECT USING (status = 'published');`,
            `DROP POLICY IF EXISTS "Users can view own blog posts" ON published_blog_posts;`,
            `CREATE POLICY "Users can view own blog posts" ON published_blog_posts
                FOR SELECT USING (auth.uid() = user_id);`,
            `DROP POLICY IF EXISTS "Users can insert their own posts" ON published_blog_posts;`,
            `CREATE POLICY "Users can insert their own posts" ON published_blog_posts
                FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);`,
            `DROP POLICY IF EXISTS "Users can update their own posts" ON published_blog_posts;`,
            `CREATE POLICY "Users can update their own posts" ON published_blog_posts
                FOR UPDATE USING (auth.uid() = user_id);`,
            `DROP POLICY IF EXISTS "Users can delete their own posts" ON published_blog_posts;`,
            `CREATE POLICY "Users can delete their own posts" ON published_blog_posts
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

        // Create the specific missing blog post
        const slug = 'unleashing-the-power-of-grok-the-ultimate-guide-to-understanding-and-embracing-t-mee0zps6';
        
        console.log('📝 Creating missing blog post...');

        const blogPost = {
            slug: slug,
            title: 'Unleashing the Power of Grok: The Ultimate Guide to Understanding and Embracing Technology',
            content: `
                <div class="beautiful-prose">
                    <h1 class="beautiful-prose text-4xl md:text-5xl font-black mb-8 leading-tight text-black">Unleashing the Power of Grok: The Ultimate Guide to Understanding and Embracing Technology</h1>
                    
                    <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">In today's rapidly evolving technological landscape, the ability to truly understand and embrace new technologies has become more crucial than ever. Grok, a concept popularized by science fiction author Robert A. Heinlein, represents a deep, intuitive understanding that goes beyond surface-level knowledge.</p>
                    
                    <h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12">What Does It Mean to Grok Technology?</h2>
                    
                    <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">To grok something means to understand it so thoroughly that it becomes part of you. When applied to technology, this means developing an intuitive relationship with digital tools and systems that allows you to leverage their full potential.</p>
                    
                    <h3 class="beautiful-prose text-2xl font-semibold text-black mb-4 mt-8">The Foundation of Deep Understanding</h3>
                    
                    <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">True technological fluency begins with curiosity and a willingness to experiment. Rather than simply learning to use tools, we must strive to understand the principles underlying their operation.</p>
                    
                    <h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12">Building Your Technology Grok Skills</h2>
                    
                    <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Developing a deep understanding of technology requires consistent practice and exploration. Start by choosing one technology that interests you and diving deep into its ecosystem.</p>
                    
                    <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">For those looking to enhance their <a href="https://example.com" target="_blank" rel="noopener noreferrer" class="beautiful-prose text-blue-600 hover:text-purple-600 font-semibold transition-colors duration-300 underline decoration-2 underline-offset-2 hover:decoration-purple-600">digital marketing strategies</a>, understanding the underlying technologies becomes even more important.</p>
                    
                    <h3 class="beautiful-prose text-2xl font-semibold text-black mb-4 mt-8">Practical Steps to Grok Any Technology</h3>
                    
                    <ul class="beautiful-prose space-y-4 my-8">
                        <li class="beautiful-prose relative pl-8 text-lg leading-relaxed text-gray-700">Start with the fundamentals and build up gradually</li>
                        <li class="beautiful-prose relative pl-8 text-lg leading-relaxed text-gray-700">Practice hands-on experimentation regularly</li>
                        <li class="beautiful-prose relative pl-8 text-lg leading-relaxed text-gray-700">Connect with communities of practitioners</li>
                        <li class="beautiful-prose relative pl-8 text-lg leading-relaxed text-gray-700">Teach others what you've learned</li>
                    </ul>
                    
                    <h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12">The Future of Technology Understanding</h2>
                    
                    <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">As artificial intelligence and machine learning continue to reshape our world, the ability to grok these technologies becomes increasingly valuable. The key is to maintain a balance between technical knowledge and intuitive understanding.</p>
                    
                    <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">By developing this deeper relationship with technology, we can move beyond being passive consumers to become active creators and innovators in the digital age.</p>
                </div>
            `,
            meta_description: 'Master the art of truly understanding technology with our comprehensive guide to grokking digital tools and systems.',
            excerpt: 'Learn how to develop deep, intuitive understanding of technology that goes beyond surface-level knowledge.',
            keywords: ['grok', 'technology understanding', 'digital fluency', 'tech skills'],
            target_url: 'https://example.com',
            published_url: `https://backlinkoo.com/blog/${slug}`,
            status: 'published',
            is_trial_post: false,
            view_count: 0,
            seo_score: 85,
            reading_time: 5,
            word_count: 800,
            author_name: 'Backlinkoo Team',
            tags: ['Technology', 'Learning', 'Digital Skills'],
            category: 'Technology',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            published_at: new Date().toISOString(),
            anchor_text: 'digital marketing strategies'
        };

        // Insert the blog post
        const { data, error } = await supabase
            .from('published_blog_posts')
            .insert([blogPost])
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating blog post:', error);
            throw error;
        }

        console.log('✅ Blog post created successfully');
        console.log('🌐 Blog post URL: https://backlinkoo.com/blog/' + slug);

        return true;

    } catch (error) {
        console.error('❌ Setup failed:', error);
        return false;
    }
}

// Run the setup
setupDatabase()
    .then(success => {
        if (success) {
            console.log('\n🎉 Database setup completed successfully!');
            process.exit(0);
        } else {
            console.log('\n❌ Database setup failed');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n💥 Unexpected error:', error);
        process.exit(1);
    });
