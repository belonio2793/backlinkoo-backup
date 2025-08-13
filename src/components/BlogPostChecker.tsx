import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function BlogPostChecker() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [targetPostExists, setTargetPostExists] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetSlug = 'the-ultimate-guide-to-forum-profile-backlinks-unlocking-the-power-of-quality-lin-me9b9gfz';

  const checkBlogPosts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Checking blog posts in database...');
      
      // Get all blog posts
      const { data: allPosts, error: allError } = await supabase
        .from('blog_posts')
        .select('slug, title, created_at, status, claimed, user_id')
        .order('created_at', { ascending: false })
        .limit(20);

      if (allError) {
        setError(`Error fetching blog posts: ${allError.message}`);
        console.error('❌ Error fetching blog posts:', allError.message);
        return;
      }

      setPosts(allPosts || []);
      console.log(`📊 Found ${allPosts?.length || 0} blog posts`);

      // Check specifically for the target slug
      console.log(`🎯 Checking for specific slug: ${targetSlug}`);
      
      const { data: targetPost, error: targetError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', targetSlug)
        .single();

      if (targetError) {
        console.log('❌ Target blog post NOT found in database:', targetError.message);
        setTargetPostExists(false);
      } else {
        console.log('✅ Target blog post found:', targetPost.title);
        setTargetPostExists(true);
      }

    } catch (error: any) {
      setError(`Unexpected error: ${error.message}`);
      console.error('💥 Unexpected error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const createTestBlogPost = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔨 Creating test blog post...');
      
      const testPost = {
        title: 'The Ultimate Guide to Forum Profile Backlinks: Unlocking the Power of Quality Link Building',
        slug: targetSlug,
        content: `
**Title: The Ultimate Guide to Forum Profile Backlinks: Unlocking the Power of Quality Link Building**

**Introduction:** Did you know that forum profile backlinks are like hidden gems in the vast landscape of SEO strategies? These powerful yet often underutilized backlinks can significantly boost your website's authority and visibility. Imagine having the key to unlock a treasure trove of high-quality link building opportunities. In this comprehensive guide, we will delve into the world of forum profile backlinks, uncovering their potential to revolutionize your SEO game.

**Why Forum Profile Backlinks Matter:** Forum profile backlinks are not just any ordinary links; they are strategic assets that can drive targeted traffic to your site and improve your search engine rankings. According to recent studies, websites with a diverse backlink profile that includes forum links tend to rank higher on Google. In fact, a survey of SEO experts revealed that forum profile backlinks are among the most underrated yet effective link building strategies.

**The Anatomy of a Successful Forum Profile Backlink Strategy:** To harness the full power of forum profile backlinks, you need a well-thought-out strategy. Here are key steps to create a successful forum profile backlink campaign:

1. **Research and Identify Relevant Forums**: Start by identifying forums in your niche with active participation and high domain authority. Look for forums where your target audience engages regularly.

2. **Optimize Your Forum Profile**: When creating your forum profile, ensure your username and information link back to your website. Craft a compelling bio and avatar to establish credibility within the forum community.

3. **Engage Thoughtfully and Add Value**: Avoid spammy tactics and focus on adding value to forum discussions. Contribute meaningful insights and build relationships with other forum members.

4. **Strategically Place Your Backlinks**: When adding backlinks in forum posts or your profile, ensure they are relevant to the discussion and provide additional value to readers. Avoid over-optimization and focus on natural link placement.

**Core Study Questions & Boosted Traffic by 300% with Forum Profile Backlinks**

Many businesses have leveraged forum profile backlinks to achieve remarkable growth. For instance, a digital marketing agency saw a 300% increase in organic traffic within six months by strategically participating in industry-specific forums and building quality profile backlinks.

**Conclusion:** Forum profile backlinks remain one of the most accessible and effective link building strategies when executed properly. By following the guidelines outlined in this guide, you can unlock the potential of forum profile backlinks to boost your website's SEO performance and drive meaningful traffic to your business.
        `,
        target_url: 'https://example.com',
        anchor_text: 'quality link building',
        status: 'published',
        is_trial_post: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        view_count: 0,
        seo_score: 85,
        reading_time: 8,
        word_count: 450,
        author_name: 'Backlink ∞',
        tags: ['seo', 'backlinks', 'forum', 'link building'],
        category: 'Digital Marketing',
        meta_description: 'Discover the power of forum profile backlinks and learn how to create a strategic link building campaign that drives targeted traffic and improves your search engine rankings.',
        keywords: ['forum profile backlinks', 'link building', 'SEO strategy', 'digital marketing', 'search engine optimization']
      };

      const { data: newPost, error: createError } = await supabase
        .from('blog_posts')
        .insert(testPost)
        .select()
        .single();

      if (createError) {
        setError(`Error creating blog post: ${createError.message}`);
        console.error('❌ Error creating blog post:', createError.message);
        return;
      }

      console.log('✅ Test blog post created successfully:', newPost.title);
      
      // Refresh the list
      await checkBlogPosts();
      
    } catch (error: any) {
      setError(`Unexpected error creating post: ${error.message}`);
      console.error('💥 Unexpected error creating post:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBlogPosts();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Blog Post Database Checker
            <Button onClick={checkBlogPosts} disabled={loading}>
              {loading ? 'Checking...' : 'Refresh'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          
          {/* Target Blog Post Status */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold mb-2">Target Blog Post Status:</h3>
            <p className="text-sm text-gray-600 mb-2">
              Slug: <code className="bg-gray-100 px-1 rounded">{targetSlug}</code>
            </p>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                targetPostExists === true ? 'bg-green-100 text-green-700' :
                targetPostExists === false ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {targetPostExists === true ? '✅ EXISTS' : 
                 targetPostExists === false ? '❌ NOT FOUND' : 
                 '⏳ CHECKING...'}
              </span>
              
              {targetPostExists === false && (
                <Button 
                  onClick={createTestBlogPost} 
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  Create Missing Post
                </Button>
              )}
            </div>
          </div>

          {/* Blog Posts List */}
          <div>
            <h3 className="font-semibold mb-4">Database Blog Posts ({posts.length}):</h3>
            {posts.length === 0 ? (
              <p className="text-gray-500 italic">No blog posts found in database</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {posts.map((post, index) => (
                  <div key={post.slug} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{post.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Slug: {post.slug}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {post.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            post.claimed ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {post.claimed ? 'Claimed' : 'Unclaimed'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
