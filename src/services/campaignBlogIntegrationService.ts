/**
 * Campaign Blog Integration Service
 * Automatically generates and publishes blog posts when campaigns are submitted
 */

import { supabase } from '@/integrations/supabase/client';

interface CampaignBlogRequest {
  campaignId: string;
  targetUrl: string;
  keywords: string[];
  anchorTexts?: string[];
  primaryKeyword?: string;
  campaignName?: string;
}

interface BlogGenerationResult {
  success: boolean;
  blogPostUrl?: string;
  slug?: string;
  title?: string;
  blogPostId?: string;
  error?: string;
}

export class CampaignBlogIntegrationService {
  /**
   * Generate and publish a blog post for a campaign
   */
  static async generateCampaignBlogPost(request: CampaignBlogRequest): Promise<BlogGenerationResult> {
    try {
      console.log('🚀 Generating campaign blog post:', request.campaignId);

      // Select the primary keyword (first keyword if not specified)
      const primaryKeyword = request.primaryKeyword || request.keywords[0] || 'business growth';
      
      // Select anchor text (first anchor text or primary keyword)
      const anchorText = request.anchorTexts?.[0] || primaryKeyword;

      // Generate comprehensive blog content using the global blog generator
      const blogRequest = {
        targetUrl: request.targetUrl,
        primaryKeyword,
        anchorText,
        userLocation: null, // Let the system detect
        sessionId: `campaign_${request.campaignId}`,
        additionalContext: {
          contentTone: 'professional',
          campaignId: request.campaignId,
          isAutomatedGeneration: true
        }
      };

      console.log('📝 Calling blog generator with:', {
        keyword: primaryKeyword,
        targetUrl: request.targetUrl,
        anchorText
      });

      // Call the global blog generator function with error handling
      let response;
      try {
        response = await fetch('/.netlify/functions/global-blog-generator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(blogRequest)
        });
      } catch (networkError) {
        console.error('Network error calling blog generator:', networkError);
        throw new Error(`Network error: ${networkError.message}`);
      }

      if (!response.ok) {
        console.error('Blog generation HTTP error:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });

        // If it's a 404, the function might not be deployed
        if (response.status === 404) {
          throw new Error('Blog generation service not available (404). Please check Netlify function deployment.');
        }

        throw new Error(`Blog generation failed: ${response.status} ${response.statusText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Error parsing blog generator response:', jsonError);
        throw new Error('Invalid response from blog generation service');
      }

      if (!result.success || !result.data?.blogPost) {
        console.error('Blog generation service returned error:', result);
        throw new Error(result.error || 'Failed to generate blog post');
      }

      const blogPost = result.data.blogPost;
      const blogUrl = `https://backlinkoo.com/${blogPost.slug}`;

      // Store the association between campaign and blog post
      await this.linkCampaignToBlogPost(request.campaignId, blogPost.id, blogUrl);

      console.log('✅ Campaign blog post generated successfully:', {
        campaignId: request.campaignId,
        blogUrl,
        title: blogPost.title
      });

      return {
        success: true,
        blogPostUrl: blogUrl,
        slug: blogPost.slug,
        title: blogPost.title,
        blogPostId: blogPost.id
      };

    } catch (error) {
      console.error('❌ Campaign blog generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Link a campaign to its generated blog post
   */
  private static async linkCampaignToBlogPost(
    campaignId: string, 
    blogPostId: string, 
    blogUrl: string
  ): Promise<void> {
    try {
      // Update the campaign with blog post information
      const { error: updateError } = await supabase
        .from('backlink_campaigns')
        .update({
          blog_post_id: blogPostId,
          blog_post_url: blogUrl,
          blog_generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (updateError) {
        console.error('Failed to link campaign to blog post:', updateError);
      }

      // Also create an entry in campaign blog links table if it exists
      try {
        await supabase
          .from('campaign_blog_links')
          .insert({
            campaign_id: campaignId,
            blog_post_id: blogPostId,
            blog_url: blogUrl,
            created_at: new Date().toISOString()
          });
      } catch (linkError) {
        // This table might not exist, so we'll ignore the error
        console.log('Campaign blog links table not available:', linkError);
      }

    } catch (error) {
      console.error('Error linking campaign to blog post:', error);
      // Don't throw - this is not critical for the main flow
    }
  }

  /**
   * Get blog post URL for a campaign
   */
  static async getCampaignBlogUrl(campaignId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('backlink_campaigns')
        .select('blog_post_url')
        .eq('id', campaignId)
        .single();

      if (error || !data) {
        return null;
      }

      return data.blog_post_url;
    } catch (error) {
      console.error('Error fetching campaign blog URL:', error);
      return null;
    }
  }

  /**
   * Generate blog post for guest users (stored in localStorage)
   */
  static async generateGuestCampaignBlogPost(request: Omit<CampaignBlogRequest, 'campaignId'> & { campaignId?: string }): Promise<BlogGenerationResult> {
    try {
      console.log('🚀 Generating guest campaign blog post');

      const primaryKeyword = request.primaryKeyword || request.keywords[0] || 'business growth';
      const anchorText = request.anchorTexts?.[0] || primaryKeyword;

      // Generate blog content
      const blogRequest = {
        targetUrl: request.targetUrl,
        primaryKeyword,
        anchorText,
        userLocation: null,
        sessionId: `guest_${Date.now()}`,
        additionalContext: {
          contentTone: 'professional',
          isGuestGeneration: true
        }
      };

      const response = await fetch('/.netlify/functions/global-blog-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blogRequest)
      });

      if (!response.ok) {
        throw new Error(`Blog generation failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data?.blogPost) {
        throw new Error(result.error || 'Failed to generate blog post');
      }

      const blogPost = result.data.blogPost;
      const blogUrl = `https://backlinkoo.com/${blogPost.slug}`;

      // Store in localStorage for guest users
      const guestBlogPosts = JSON.parse(localStorage.getItem('guest_blog_posts') || '[]');
      guestBlogPosts.push({
        campaignId: request.campaignId || `guest_${Date.now()}`,
        blogPostId: blogPost.id,
        blogUrl,
        title: blogPost.title,
        slug: blogPost.slug,
        generatedAt: new Date().toISOString()
      });
      localStorage.setItem('guest_blog_posts', JSON.stringify(guestBlogPosts));

      console.log('✅ Guest campaign blog post generated successfully:', {
        blogUrl,
        title: blogPost.title
      });

      return {
        success: true,
        blogPostUrl: blogUrl,
        slug: blogPost.slug,
        title: blogPost.title,
        blogPostId: blogPost.id
      };

    } catch (error) {
      console.error('❌ Guest campaign blog generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get blog post URL for guest campaign
   */
  static getGuestCampaignBlogUrl(campaignId: string): string | null {
    try {
      const guestBlogPosts = JSON.parse(localStorage.getItem('guest_blog_posts') || '[]');
      const blogPost = guestBlogPosts.find((post: any) => post.campaignId === campaignId);
      return blogPost?.blogUrl || null;
    } catch (error) {
      console.error('Error fetching guest campaign blog URL:', error);
      return null;
    }
  }

  /**
   * Generate a compelling blog title based on keywords
   */
  private static generateBlogTitle(keywords: string[], targetUrl: string): string {
    const primaryKeyword = keywords[0] || 'business growth';
    const domain = targetUrl.replace(/^https?:\/\//, '').split('/')[0];
    
    const titleTemplates = [
      `The Ultimate Guide to ${primaryKeyword}: Strategies That Work`,
      `${primaryKeyword}: Complete 2024 Guide for Success`,
      `How to Master ${primaryKeyword}: Expert Insights and Tips`,
      `${primaryKeyword} Explained: Everything You Need to Know`,
      `Advanced ${primaryKeyword} Strategies for Modern Businesses`
    ];

    return titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
  }
}
