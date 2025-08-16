const { createClient } = require('@supabase/supabase-js');

/**
 * Emergency Blog Fix - Creates the missing blog post and sets up database
 */
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('🚨 Emergency blog fix starting...');

    // First, ensure the published_blog_posts table exists
    const setupTableResponse = await fetch('/.netlify/functions/setup-published-blog-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setup' })
    });

    if (!setupTableResponse.ok) {
      console.log('⚠️ Table setup call failed, but continuing...');
    }

    // Get the slug from query parameters
    const slug = event.queryStringParameters?.slug || 'unleashing-the-power-of-grok-the-ultimate-guide-to-understanding-and-embracing-t-mee0zps6';

    console.log('🔍 Checking for blog post with slug:', slug);

    // Check if the blog post already exists
    const { data: existingPost, error: checkError } = await supabase
      .from('published_blog_posts')
      .select('id, title, status')
      .eq('slug', slug)
      .single();

    if (existingPost) {
      console.log('✅ Blog post already exists:', existingPost.title);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Blog post already exists',
          post: existingPost,
          url: `https://backlinkoo.com/blog/${slug}`
        })
      };
    }

    console.log('📝 Creating missing blog post...');

    // Create the blog post with proper formatting
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Blog post created successfully',
        post: data,
        url: `https://backlinkoo.com/blog/${slug}`
      })
    };

  } catch (error) {
    console.error('❌ Emergency fix failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        details: 'Emergency blog fix failed'
      })
    };
  }
};
