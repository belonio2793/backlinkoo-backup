const { createClient } = require('@supabase/supabase-js');

/**
 * Domain Blog Server - Serves blog content for specific domains
 * When leadpages.org is accessed, serve blog content instead of the admin app
 */

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Blog-enabled domains that should serve content
const BLOG_DOMAINS = [
  'leadpages.org',
  'backlinks.org',
  'seo-tools.org'
];

function generateBlogHTML(domain, posts = [], theme = {}) {
  const siteName = domain.replace('.org', '').replace('.com', '');
  const siteTitle = siteName.charAt(0).toUpperCase() + siteName.slice(1);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${siteTitle} - Expert Insights & Resources</title>
    <meta name="description" content="Expert insights, tips, and resources about ${siteName} and digital marketing.">
    
    <!-- SEO Meta Tags -->
    <meta property="og:title" content="${siteTitle} - Expert Insights">
    <meta property="og:description" content="Expert insights and resources about ${siteName}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://${domain}">
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <style>
        .beautiful-prose {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .hero-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .card-hover {
            transition: all 0.3s ease;
        }
        
        .card-hover:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="hero-gradient text-white">
        <div class="container mx-auto px-6 py-16">
            <div class="text-center">
                <h1 class="beautiful-prose text-5xl font-black mb-4">${siteTitle}</h1>
                <p class="beautiful-prose text-xl opacity-90 max-w-2xl mx-auto">
                    Expert insights, strategies, and resources to help you succeed in digital marketing and ${siteName}.
                </p>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-12">
        ${posts.length > 0 ? generatePostsHTML(posts) : generateDefaultContent(siteTitle)}
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-12 mt-16">
        <div class="container mx-auto px-6 text-center">
            <p class="beautiful-prose text-gray-300">
                © ${new Date().getFullYear()} ${siteTitle}. All rights reserved.
            </p>
            <p class="beautiful-prose text-gray-400 mt-2 text-sm">
                Providing expert insights and resources for digital marketing success.
            </p>
        </div>
    </footer>
</body>
</html>`;
}

function generatePostsHTML(posts) {
  const featuredPost = posts.find(p => p.featured) || posts[0];
  const recentPosts = posts.filter(p => p !== featuredPost).slice(0, 6);

  return `
    <!-- Featured Post -->
    ${featuredPost ? `
    <section class="mb-16">
        <h2 class="beautiful-prose text-3xl font-bold text-gray-900 mb-8 text-center">Featured Article</h2>
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden card-hover">
            <div class="p-8">
                <h3 class="beautiful-prose text-2xl font-bold text-gray-900 mb-4">
                    <a href="/blog/${featuredPost.slug}" class="hover:text-blue-600 transition-colors">
                        ${featuredPost.title}
                    </a>
                </h3>
                <p class="beautiful-prose text-gray-600 mb-6 leading-relaxed">
                    ${featuredPost.excerpt}
                </p>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4 text-sm text-gray-500">
                        <span>Published ${new Date(featuredPost.published_at || featuredPost.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>5 min read</span>
                    </div>
                    <a href="/blog/${featuredPost.slug}" 
                       class="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Read More
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    </section>
    ` : ''}

    <!-- Recent Posts -->
    ${recentPosts.length > 0 ? `
    <section>
        <h2 class="beautiful-prose text-3xl font-bold text-gray-900 mb-8 text-center">Latest Articles</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${recentPosts.map(post => `
                <article class="bg-white rounded-xl shadow-lg overflow-hidden card-hover">
                    <div class="p-6">
                        <h3 class="beautiful-prose text-xl font-semibold text-gray-900 mb-3">
                            <a href="/blog/${post.slug}" class="hover:text-blue-600 transition-colors">
                                ${post.title}
                            </a>
                        </h3>
                        <p class="beautiful-prose text-gray-600 mb-4 leading-relaxed">
                            ${post.excerpt}
                        </p>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-500">
                                ${new Date(post.published_at || post.created_at).toLocaleDateString()}
                            </span>
                            <a href="/blog/${post.slug}" 
                               class="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                                Read More →
                            </a>
                        </div>
                    </div>
                </article>
            `).join('')}
        </div>
    </section>
    ` : ''}
  `;
}

function generateDefaultContent(siteTitle) {
  return `
    <section class="text-center py-16">
        <div class="max-w-3xl mx-auto">
            <h2 class="beautiful-prose text-4xl font-bold text-gray-900 mb-6">
                Welcome to ${siteTitle}
            </h2>
            <p class="beautiful-prose text-xl text-gray-600 mb-8 leading-relaxed">
                We're preparing exciting content for you! Our expert team is working on valuable insights, 
                strategies, and resources that will help you succeed in digital marketing.
            </p>
            <div class="bg-white rounded-2xl shadow-lg p-8 mb-8">
                <h3 class="beautiful-prose text-2xl font-semibold text-gray-900 mb-4">
                    What You Can Expect
                </h3>
                <div class="grid md:grid-cols-3 gap-6 text-left">
                    <div class="text-center">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                            </svg>
                        </div>
                        <h4 class="font-semibold text-gray-900 mb-2">Expert Insights</h4>
                        <p class="text-gray-600 text-sm">In-depth articles from industry professionals</p>
                    </div>
                    <div class="text-center">
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                        </div>
                        <h4 class="font-semibold text-gray-900 mb-2">Actionable Tips</h4>
                        <p class="text-gray-600 text-sm">Practical strategies you can implement today</p>
                    </div>
                    <div class="text-center">
                        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"></path>
                            </svg>
                        </div>
                        <h4 class="font-semibold text-gray-900 mb-2">Latest Trends</h4>
                        <p class="text-gray-600 text-sm">Stay ahead with cutting-edge industry updates</p>
                    </div>
                </div>
            </div>
            <p class="text-gray-500">
                Check back soon for our latest content, or 
                <a href="mailto:hello@${siteTitle.toLowerCase()}.org" class="text-blue-600 hover:text-blue-700">contact us</a> 
                with any questions.
            </p>
        </div>
    </section>
  `;
}

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'text/html',
    'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
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
    // Get the domain from headers or query params
    const requestDomain = event.headers.host || 
                         event.queryStringParameters?.domain || 
                         'leadpages.org';

    console.log('🌐 Processing request for domain:', requestDomain);

    // Check if this is a blog domain
    if (!BLOG_DOMAINS.includes(requestDomain)) {
      return {
        statusCode: 404,
        headers,
        body: '<h1>Domain not configured for blog content</h1>'
      };
    }

    // Try to fetch blog posts for this domain
    let posts = [];
    let domain = null;

    try {
      // Get domain info
      const { data: domainData } = await supabase
        .from('domains')
        .select('*')
        .eq('domain', requestDomain)
        .eq('blog_enabled', true)
        .single();

      domain = domainData;

      if (domain) {
        // Get blog posts for this domain
        const { data: postsData } = await supabase
          .from('domain_blog_posts')
          .select('*')
          .eq('domain_id', domain.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(10);

        posts = postsData || [];
      }
    } catch (error) {
      console.log('Note: Could not fetch from database, using static content');
    }

    // Generate the HTML
    const html = generateBlogHTML(requestDomain, posts);

    return {
      statusCode: 200,
      headers,
      body: html
    };

  } catch (error) {
    console.error('❌ Error serving blog content:', error);

    return {
      statusCode: 500,
      headers,
      body: `
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>Temporary Error</h1>
            <p>We're experiencing a temporary issue. Please try again in a few moments.</p>
          </body>
        </html>
      `
    };
  }
};
