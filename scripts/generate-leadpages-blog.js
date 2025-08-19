#!/usr/bin/env node

/**
 * Generate Blog Content for leadpages.org
 * Creates SEO-optimized blog posts specifically for the leadpages.org domain
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const DOMAIN_ID = 'leadpages-org';
const DOMAIN_NAME = 'leadpages.org';
const BLOG_SUBDIRECTORY = 'blog';

// Sample blog posts for leadpages.org
const SAMPLE_BLOG_POSTS = [
  {
    title: "10 Essential Lead Generation Strategies for 2024",
    slug: "essential-lead-generation-strategies-2024",
    content: `
      <h1>10 Essential Lead Generation Strategies for 2024</h1>
      
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Lead generation has evolved dramatically in recent years. With changing consumer behaviors and new digital platforms emerging, businesses need to adapt their strategies to stay competitive in 2024.</p>
      
      <h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12">1. Optimize Your Landing Pages</h2>
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Creating high-converting landing pages is crucial for any lead generation strategy. Focus on clear value propositions, compelling headlines, and streamlined forms that capture essential information without overwhelming visitors.</p>
      
      <h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12">2. Leverage Social Media Advertising</h2>
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Social media platforms offer sophisticated targeting options that allow you to reach your ideal customers. Platforms like Facebook, LinkedIn, and Instagram provide powerful tools for lead generation campaigns.</p>
      
      <h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12">3. Content Marketing Excellence</h2>
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Quality content attracts and engages potential customers. Create valuable blog posts, ebooks, whitepapers, and videos that address your audience's pain points and establish your expertise.</p>
      
      <h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12">4. Email Marketing Automation</h2>
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Automated email sequences help nurture leads through the sales funnel. Set up welcome series, educational content, and targeted campaigns based on user behavior and interests.</p>
      
      <h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12">5. Search Engine Optimization (SEO)</h2>
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Organic search traffic is one of the highest-quality sources of leads. Optimize your website and content for relevant keywords to attract visitors who are actively searching for solutions.</p>
      
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Implementing these strategies consistently will help you build a robust lead generation system that delivers sustainable results for your business.</p>
    `,
    excerpt: "Discover the most effective lead generation strategies for 2024, including landing page optimization, social media advertising, and content marketing techniques.",
    keywords: ["lead generation", "marketing strategies", "digital marketing", "conversion optimization"],
    status: "published",
    featured: true
  },
  {
    title: "How to Create High-Converting Landing Pages in 2024",
    slug: "create-high-converting-landing-pages-2024",
    content: `
      <h1>How to Create High-Converting Landing Pages in 2024</h1>
      
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Landing pages are the cornerstone of successful digital marketing campaigns. A well-designed landing page can be the difference between a visitor bouncing away and becoming a valuable lead or customer.</p>
      
      <h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12">Essential Elements of High-Converting Landing Pages</h2>
      
      <h3 class="beautiful-prose text-2xl font-semibold text-black mb-4 mt-8">Compelling Headlines</h3>
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Your headline is the first thing visitors see. Make it clear, benefit-focused, and aligned with the traffic source that brought them to your page.</p>
      
      <h3 class="beautiful-prose text-2xl font-semibold text-black mb-4 mt-8">Clear Value Proposition</h3>
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Clearly communicate what you're offering and why it's valuable. Focus on benefits rather than features, and make it immediately obvious what visitors will gain.</p>
      
      <h3 class="beautiful-prose text-2xl font-semibold text-black mb-4 mt-8">Optimized Forms</h3>
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Keep forms short and ask for only essential information. The more fields you add, the lower your conversion rate typically becomes.</p>
      
      <h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12">Design Best Practices</h2>
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Use clean, professional designs with plenty of white space. Ensure your page loads quickly and looks great on mobile devices, as mobile traffic continues to dominate.</p>
      
      <h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12">Testing and Optimization</h2>
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Continuously test different elements of your landing pages. A/B test headlines, images, call-to-action buttons, and form fields to improve performance over time.</p>
      
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Remember, the key to successful landing pages is understanding your audience and providing them with exactly what they're looking for in a clear, compelling way.</p>
    `,
    excerpt: "Learn the essential elements and best practices for creating landing pages that convert visitors into leads and customers.",
    keywords: ["landing pages", "conversion optimization", "web design", "digital marketing"],
    status: "published",
    featured: false
  },
  {
    title: "Digital Marketing Trends That Will Dominate 2024",
    slug: "digital-marketing-trends-2024",
    content: `
      <h1>Digital Marketing Trends That Will Dominate 2024</h1>
      
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">The digital marketing landscape continues to evolve at a rapid pace. Staying ahead of trends is crucial for businesses looking to maintain their competitive edge and reach their target audiences effectively.</p>
      
      <h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12">AI-Powered Marketing Automation</h2>
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Artificial intelligence is revolutionizing how businesses approach marketing automation. From predictive analytics to personalized content creation, AI tools are becoming essential for modern marketers.</p>
      
      <h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12">Video Content Dominance</h2>
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Video content continues to outperform other formats across all platforms. Short-form videos, live streaming, and interactive video experiences are driving engagement and conversions.</p>
      
      <h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12">Privacy-First Marketing</h2>
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">With increasing privacy regulations and the phase-out of third-party cookies, marketers must adopt privacy-first strategies that rely on first-party data and consent-based marketing.</p>
      
      <h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12">Voice Search Optimization</h2>
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">As voice assistants become more prevalent, optimizing content for voice search queries is becoming increasingly important for SEO and content marketing strategies.</p>
      
      <h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12">Social Commerce Growth</h2>
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Social media platforms are expanding their e-commerce capabilities, making it easier for businesses to sell directly through social channels and reach customers where they spend their time.</p>
      
      <p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6">Adapting to these trends early will give your business a significant advantage in the competitive digital marketplace of 2024.</p>
    `,
    excerpt: "Explore the key digital marketing trends that will shape business strategies and customer engagement in 2024.",
    keywords: ["digital marketing", "marketing trends", "AI marketing", "social commerce"],
    status: "published",
    featured: false
  }
];

async function ensureDomainExists() {
  console.log('🏠 Ensuring domain exists in database...');
  
  // Check if domain exists
  const { data: existingDomain, error: checkError } = await supabase
    .from('domains')
    .select('*')
    .eq('domain', DOMAIN_NAME)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('❌ Error checking domain:', checkError);
    throw checkError;
  }

  if (existingDomain) {
    console.log('✅ Domain already exists:', existingDomain.domain);
    return existingDomain;
  }

  // Create domain if it doesn't exist
  const { data: newDomain, error: createError } = await supabase
    .from('domains')
    .insert({
      domain: DOMAIN_NAME,
      status: 'active',
      dns_configured: true,
      blog_enabled: true,
      blog_subdirectory: BLOG_SUBDIRECTORY,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Error creating domain:', createError);
    throw createError;
  }

  console.log('✅ Created new domain:', newDomain.domain);
  return newDomain;
}

async function createBlogPosts(domain) {
  console.log('📝 Creating blog posts for', domain.domain);

  for (const post of SAMPLE_BLOG_POSTS) {
    try {
      // Check if post already exists
      const { data: existingPost } = await supabase
        .from('domain_blog_posts')
        .select('*')
        .eq('domain_id', domain.id)
        .eq('slug', post.slug)
        .single();

      if (existingPost) {
        console.log(`⏭️  Post already exists: ${post.title}`);
        continue;
      }

      // Create the blog post
      const { data: newPost, error: postError } = await supabase
        .from('domain_blog_posts')
        .insert({
          domain_id: domain.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          keywords: post.keywords,
          status: post.status,
          featured: post.featured,
          author_id: 'system',
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (postError) {
        console.error(`❌ Error creating post "${post.title}":`, postError);
        continue;
      }

      console.log(`✅ Created post: ${newPost.title}`);

    } catch (error) {
      console.error(`❌ Error processing post "${post.title}":`, error);
    }
  }
}

async function setupBlogTheme(domain) {
  console.log('🎨 Setting up blog theme for', domain.domain);

  try {
    // Check if theme already exists
    const { data: existingTheme } = await supabase
      .from('domain_blog_themes')
      .select('*')
      .eq('domain_id', domain.id)
      .single();

    if (existingTheme) {
      console.log('⏭️  Theme already configured');
      return existingTheme;
    }

    // Create default theme
    const { data: newTheme, error: themeError } = await supabase
      .from('domain_blog_themes')
      .insert({
        domain_id: domain.id,
        theme_id: 'minimal',
        theme_name: 'Minimal Clean',
        custom_styles: {
          primaryColor: '#1e40af',
          accentColor: '#3b82f6',
          backgroundColor: '#ffffff'
        },
        custom_settings: {},
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (themeError) {
      console.error('❌ Error creating theme:', themeError);
      throw themeError;
    }

    console.log(`✅ Created theme: ${newTheme.theme_name}`);
    return newTheme;

  } catch (error) {
    console.error('❌ Error setting up theme:', error);
  }
}

async function generateBlogContentForLeadpages() {
  try {
    console.log('🚀 Starting blog content generation for leadpages.org...');

    // Step 1: Ensure domain exists
    const domain = await ensureDomainExists();

    // Step 2: Create blog posts
    await createBlogPosts(domain);

    // Step 3: Setup blog theme
    await setupBlogTheme(domain);

    // Step 4: Verify content
    const { data: posts, error: countError } = await supabase
      .from('domain_blog_posts')
      .select('*')
      .eq('domain_id', domain.id);

    if (countError) {
      console.error('❌ Error counting posts:', countError);
    } else {
      console.log(`✅ Total posts created: ${posts.length}`);
    }

    console.log('🎉 Blog content generation completed successfully!');
    console.log(`📱 Blog URL: https://${DOMAIN_NAME}/${BLOG_SUBDIRECTORY}`);

  } catch (error) {
    console.error('❌ Blog content generation failed:', error);
    process.exit(1);
  }
}

// Run the script
generateBlogContentForLeadpages();
