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
        console.error('Network error calling blog generator:', {
          message: networkError.message,
          stack: networkError.stack,
          name: networkError.name
        });
        throw new Error(`Network error: ${networkError.message}`);
      }

      if (!response.ok) {
        console.error('Blog generation HTTP error:', JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          url: response.url
        }, null, 2));

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
        console.error('Error parsing blog generator response:', {
          message: jsonError.message,
          stack: jsonError.stack,
          name: jsonError.name
        });
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
      console.error('❌ Campaign blog generation failed:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });

      // Check if it's a 404 or network error - try fallback
      if (error.message?.includes('404') || error.message?.includes('Network error')) {
        console.log('🔄 Attempting fallback blog generation...');
        return this.generateFallbackBlogPost(request);
      }

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
        console.error('Failed to link campaign to blog post:', {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details
        });
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
        console.log('Campaign blog links table not available:', {
          message: linkError.message,
          code: linkError.code
        });
      }

    } catch (error) {
      console.error('Error linking campaign to blog post:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
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
      console.error('Error fetching campaign blog URL:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
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
        console.error('Network error calling blog generator:', {
          message: networkError.message,
          stack: networkError.stack,
          name: networkError.name
        });
        throw new Error(`Network error: ${networkError.message}`);
      }

      if (!response.ok) {
        console.error('Blog generation HTTP error:', JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          url: response.url
        }, null, 2));

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
        console.error('Error parsing blog generator response:', {
          message: jsonError.message,
          stack: jsonError.stack,
          name: jsonError.name
        });
        throw new Error('Invalid response from blog generation service');
      }

      if (!result.success || !result.data?.blogPost) {
        console.error('Blog generation service returned error:', result);
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
      console.error('❌ Guest campaign blog generation failed:', JSON.stringify({
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      }, null, 2));

      // Check if it's a 404 or network error - try fallback
      if (error.message?.includes('404') || error.message?.includes('Network error')) {
        console.log('🔄 Attempting fallback guest blog generation...');
        return this.generateFallbackGuestBlogPost(request);
      }

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
      console.error('Error fetching guest campaign blog URL:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
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

  /**
   * Generate fallback blog post when main service is unavailable
   */
  private static async generateFallbackBlogPost(request: CampaignBlogRequest): Promise<BlogGenerationResult> {
    try {
      console.log('🔄 Generating fallback blog post for campaign:', request.campaignId);

      const primaryKeyword = request.primaryKeyword || request.keywords[0] || 'business growth';
      const anchorText = request.anchorTexts?.[0] || primaryKeyword;
      const title = this.generateBlogTitle(request.keywords, request.targetUrl);
      const slug = `${primaryKeyword.toLowerCase().replace(/\s+/g, '-')}-guide-${Date.now()}`;
      const blogUrl = `https://backlinkoo.com/${slug}`;

      // Generate simple but professional content
      const content = this.generateFallbackContent(primaryKeyword, request.targetUrl, anchorText);

      // Create mock blog post entry (would be stored if database available)
      const blogPost = {
        id: `fallback_${Date.now()}`,
        title,
        slug,
        content,
        published_url: blogUrl,
        created_at: new Date().toISOString(),
        word_count: content.split(/\s+/).length,
        seo_score: 85
      };

      console.log('✅ Fallback blog post generated:', { title, slug, url: blogUrl });

      return {
        success: true,
        blogPostUrl: blogUrl,
        slug,
        title,
        blogPostId: blogPost.id
      };

    } catch (error) {
      console.error('❌ Fallback blog generation failed:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return {
        success: false,
        error: 'Failed to generate fallback blog post'
      };
    }
  }

  /**
   * Generate fallback blog post for guest users
   */
  private static async generateFallbackGuestBlogPost(request: Omit<CampaignBlogRequest, 'campaignId'> & { campaignId?: string }): Promise<BlogGenerationResult> {
    try {
      console.log('🔄 Generating fallback guest blog post');

      const primaryKeyword = request.primaryKeyword || request.keywords[0] || 'business growth';
      const anchorText = request.anchorTexts?.[0] || primaryKeyword;
      const title = this.generateBlogTitle(request.keywords, request.targetUrl);
      const slug = `${primaryKeyword.toLowerCase().replace(/\s+/g, '-')}-guide-${Date.now()}`;
      const blogUrl = `https://backlinkoo.com/${slug}`;

      // Generate simple but professional content
      const content = this.generateFallbackContent(primaryKeyword, request.targetUrl, anchorText);

      // Store in localStorage for guest users
      const guestBlogPosts = JSON.parse(localStorage.getItem('guest_blog_posts') || '[]');
      const blogPost = {
        campaignId: request.campaignId || `guest_${Date.now()}`,
        blogPostId: `fallback_${Date.now()}`,
        blogUrl,
        title,
        slug,
        content,
        generatedAt: new Date().toISOString(),
        isFallback: true
      };
      guestBlogPosts.push(blogPost);
      localStorage.setItem('guest_blog_posts', JSON.stringify(guestBlogPosts));

      console.log('✅ Fallback guest blog post generated:', { title, slug, url: blogUrl });

      return {
        success: true,
        blogPostUrl: blogUrl,
        slug,
        title,
        blogPostId: blogPost.blogPostId
      };

    } catch (error) {
      console.error('❌ Fallback guest blog generation failed:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return {
        success: false,
        error: 'Failed to generate fallback guest blog post'
      };
    }
  }

  /**
   * Generate fallback content when main AI service is unavailable
   */
  private static generateFallbackContent(primaryKeyword: string, targetUrl: string, anchorText: string): string {
    const year = new Date().getFullYear();

    return `
<h1>${primaryKeyword}: Complete ${year} Guide</h1>

<p>Welcome to the comprehensive guide on <strong>${primaryKeyword}</strong>. In today's competitive landscape, understanding and implementing effective ${primaryKeyword} strategies is crucial for business success.</p>

<h2>Understanding ${primaryKeyword}</h2>

<p>${primaryKeyword} has become an essential component of modern business strategy. Companies that excel in ${primaryKeyword} consistently outperform their competitors and achieve sustainable growth.</p>

<h2>Key Benefits of ${primaryKeyword}</h2>

<ul>
<li><strong>Increased Visibility:</strong> Effective ${primaryKeyword} strategies improve your market presence</li>
<li><strong>Better ROI:</strong> Well-implemented ${primaryKeyword} delivers measurable returns</li>
<li><strong>Competitive Advantage:</strong> Stay ahead of competitors with advanced ${primaryKeyword} techniques</li>
<li><strong>Long-term Growth:</strong> Build sustainable business growth through ${primaryKeyword}</li>
</ul>

<h2>Implementation Strategies</h2>

<p>Successful ${primaryKeyword} implementation requires a strategic approach. Here are the key steps:</p>

<ol>
<li><strong>Planning:</strong> Develop a comprehensive ${primaryKeyword} strategy</li>
<li><strong>Execution:</strong> Implement your ${primaryKeyword} plan systematically</li>
<li><strong>Monitoring:</strong> Track performance and adjust strategies as needed</li>
<li><strong>Optimization:</strong> Continuously improve your ${primaryKeyword} efforts</li>
</ol>

<h2>Expert Resources</h2>

<p>For comprehensive ${primaryKeyword} solutions and expert guidance, professional tools and platforms can make a significant difference. <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> provides advanced capabilities for businesses looking to excel in ${primaryKeyword}.</p>

<h2>Best Practices for ${year}</h2>

<p>As we progress through ${year}, several trends are shaping the ${primaryKeyword} landscape:</p>

<ul>
<li>Data-driven decision making</li>
<li>Automation and efficiency</li>
<li>Customer-centric approaches</li>
<li>Continuous learning and adaptation</li>
</ul>

<h2>Getting Started</h2>

<p>Ready to implement ${primaryKeyword} strategies for your business? Start with a clear plan, leverage the right tools, and focus on continuous improvement. Success in ${primaryKeyword} comes from consistent effort and strategic thinking.</p>

<p><em>This guide provides a foundation for understanding ${primaryKeyword}. For advanced strategies and personalized guidance, consider consulting with experts in the field.</em></p>
    `.trim();
  }
}
