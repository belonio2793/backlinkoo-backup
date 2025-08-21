import { supabase } from '@/integrations/supabase/client';

export interface CreateBlogPostData {
  title: string;
  content: string;
  target_url: string;
  anchor_text?: string;
  keyword?: string;
  category?: string;
  tags?: string[];
  is_trial_post?: boolean;
  expires_at?: string;
}

/**
 * Create a blog post directly in Supabase
 * This utility helps you add posts to your database
 */
export async function createBlogPost(data: CreateBlogPostData) {
  try {
    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50) + '-' + Date.now();

    const blogPostData = {
      title: data.title,
      slug,
      content: data.content,
      target_url: data.target_url,
      anchor_text: data.anchor_text || data.title,
      keyword: data.keyword || extractKeywordFromTitle(data.title),
      category: data.category || 'General',
      tags: data.tags || [],
      status: 'published' as const,
      is_trial_post: data.is_trial_post || false,
      expires_at: data.expires_at,
      author_name: 'Admin',
      seo_score: 85,
      reading_time: Math.ceil(data.content.split(' ').length / 200),
      word_count: data.content.split(' ').length,
      view_count: 0,
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Try to insert into published_blog_posts first
    let { data: result, error } = await supabase
      .from('published_blog_posts')
      .insert(blogPostData)
      .select()
      .single();

    // If published_blog_posts table doesn't exist, try blog_posts
    if (error && error.message?.includes('relation') && error.message?.includes('does not exist')) {
      console.log('📝 published_blog_posts table not found, using blog_posts table...');
      
      const blogPostsResult = await supabase
        .from('blog_posts')
        .insert(blogPostData)
        .select()
        .single();

      result = blogPostsResult.data;
      error = blogPostsResult.error;
    }

    if (error) {
      console.error('❌ Failed to create blog post:', error);
      throw error;
    }

    console.log('✅ Blog post created successfully:', result);
    return result;

  } catch (error) {
    console.error('❌ Error creating blog post:', error);
    throw error;
  }
}

function extractKeywordFromTitle(title: string): string {
  const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const words = title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));

  return words[0] || 'blog';
}

/**
 * Example usage:
 * 
 * await createBlogPost({
 *   title: "How to Build Great SEO Content",
 *   content: "<h1>How to Build Great SEO Content</h1><p>Your content here...</p>",
 *   target_url: "https://example.com",
 *   anchor_text: "SEO services",
 *   keyword: "SEO content",
 *   category: "Digital Marketing",
 *   tags: ["SEO", "content", "marketing"]
 * });
 */
