/**
 * Emergency Blog Service - Stream-Safe Fallback
 * 
 * This service provides a completely isolated approach to fetching blog posts
 * that avoids any potential response stream conflicts.
 */

import { createClient } from '@supabase/supabase-js';
import { SecureConfig } from '../lib/secure-config';

// Create a completely isolated Supabase client for emergency use
const getEmergencyClient = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || SecureConfig.SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || SecureConfig.SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase credentials not available for emergency client');
  }
  
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (url, options = {}) => {
        // Ultra-simple fetch without any enhancements
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
      }
    }
  });
};

export interface EmergencyBlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  user_id?: string;
  target_url?: string;
  published_url?: string;
  view_count?: number;
  seo_score?: number;
  reading_time?: number;
  word_count?: number;
  author_name?: string;
  tags?: string[];
  category?: string;
  is_trial_post?: boolean;
  expires_at?: string;
  anchor_text?: string;
  is_claimed?: boolean;
  claimed_by?: string;
  claimed_at?: string;
  meta_description?: string;
  excerpt?: string;
  keywords?: string[];
}

class EmergencyBlogService {
  private client: any = null;
  
  private getClient() {
    if (!this.client) {
      this.client = getEmergencyClient();
    }
    return this.client;
  }

  /**
   * Emergency fetch using completely isolated client
   */
  async emergencyFetchBySlug(slug: string): Promise<EmergencyBlogPost | null> {
    console.log('🚨 [EmergencyBlogService] Emergency fetch for slug:', slug);
    
    try {
      const client = this.getClient();
      
      // Try published_blog_posts first
      const publishedResult = await client
        .from('published_blog_posts')
        .select(`
          id, slug, title, content, status, created_at, updated_at, published_at,
          user_id, target_url, published_url, view_count, seo_score, reading_time,
          word_count, author_name, tags, category, is_trial_post, expires_at,
          anchor_text, is_claimed, claimed_by, claimed_at, meta_description,
          excerpt, keywords
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (!publishedResult.error && publishedResult.data) {
        console.log('✅ [EmergencyBlogService] Found in published_blog_posts');
        return publishedResult.data as EmergencyBlogPost;
      }

      // If not found, try blog_posts
      if (publishedResult.error?.code === 'PGRST116') {
        console.log('🔄 [EmergencyBlogService] Trying blog_posts...');
        
        const blogResult = await client
          .from('blog_posts')
          .select(`
            id, slug, title, content, status, created_at, updated_at, published_at,
            user_id, target_url, published_url, view_count, seo_score, reading_time,
            word_count, author_name, tags, category, is_trial_post, expires_at,
            anchor_text, claimed, meta_description, excerpt, keywords
          `)
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (!blogResult.error && blogResult.data) {
          console.log('✅ [EmergencyBlogService] Found in blog_posts');
          
          // Map blog_posts schema to published_blog_posts schema
          return {
            ...blogResult.data,
            is_claimed: blogResult.data.claimed || false,
            claimed_by: blogResult.data.claimed ? blogResult.data.user_id : null,
            claimed_at: blogResult.data.claimed ? blogResult.data.updated_at : null,
            keywords: Array.isArray(blogResult.data.keywords) 
              ? blogResult.data.keywords 
              : (blogResult.data.keywords ? [blogResult.data.keywords] : [])
          } as EmergencyBlogPost;
        }

        if (blogResult.error?.code === 'PGRST116') {
          console.log('❌ [EmergencyBlogService] Post not found in either table');
          return null;
        }

        throw new Error(`Blog posts table error: ${blogResult.error?.message}`);
      }

      throw new Error(`Published blog posts table error: ${publishedResult.error?.message}`);

    } catch (error: any) {
      console.error('❌ [EmergencyBlogService] Emergency fetch failed:', error.message);
      throw error;
    }
  }

  /**
   * Create sample blog post data for testing
   */
  createSamplePost(slug: string): EmergencyBlogPost {
    return {
      id: 'emergency-' + Date.now(),
      slug: slug,
      title: this.generateTitleFromSlug(slug),
      content: this.generateSampleContent(slug),
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      target_url: 'https://example.com',
      published_url: `https://backlinkoo.com/blog/${slug}`,
      view_count: 0,
      seo_score: 75,
      reading_time: 5,
      word_count: 500,
      author_name: 'Backlinkoo Team',
      tags: ['emergency', 'fallback'],
      category: 'General',
      is_trial_post: false,
      is_claimed: false,
      meta_description: `Learn about ${this.generateTitleFromSlug(slug)} in this comprehensive guide.`,
      excerpt: `This is an emergency fallback post for ${slug}. The original content will be available soon.`,
      keywords: ['guide', 'emergency', 'fallback']
    };
  }

  private generateTitleFromSlug(slug: string): string {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private generateSampleContent(slug: string): string {
    const title = this.generateTitleFromSlug(slug);
    return `
      <h1>${title}</h1>
      <p>This is an emergency fallback blog post. The original content is temporarily unavailable due to technical issues.</p>
      <h2>What happened?</h2>
      <p>We're experiencing some database connectivity issues that prevented the original blog post from loading properly.</p>
      <h2>What's next?</h2>
      <p>Our team is working to restore the original content. Please check back in a few minutes.</p>
      <p>If you continue to see this message, please contact our support team.</p>
    `;
  }
}

export const emergencyBlogService = new EmergencyBlogService();
