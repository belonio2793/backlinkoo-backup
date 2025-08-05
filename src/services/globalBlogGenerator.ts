/**
 * DEPRECATED: This service has been replaced by openAIContentGenerator.ts
 *
 * This file is kept for compatibility but should not be used for new development.
 * The system now uses only OpenAI for content generation.
 * Use openAIContentGenerator.ts instead.
 */

import { supabase } from '@/integrations/supabase/client';
import { contentFilterService } from './contentFilterService';
import { contentModerationService } from './contentModerationService';
import { formatBlogTitle, formatBlogContent } from '@/utils/textFormatting';

export interface GlobalBlogRequest {
  targetUrl: string;
  primaryKeyword: string;
  anchorText?: string;
  userLocation?: string;
  userLanguage?: string;
  userTimezone?: string;
  userIP?: string;
  sessionId: string;
  additionalContext?: {
    industry?: string;
    targetAudience?: string;
    contentTone?: 'professional' | 'casual' | 'technical' | 'friendly';
    contentLength?: 'short' | 'medium' | 'long';
    seoFocus?: 'high' | 'medium' | 'balanced';
  };
}

export interface GlobalBlogResponse {
  success: boolean;
  data?: {
    blogPost: {
      id: string;
      title: string;
      content: string;
      excerpt: string;
      slug: string;
      keywords: string[];
      meta_description: string;
      target_url: string;
      anchor_text: string;
      seo_score: number;
      reading_time: number;
      published_url: string;
      is_trial_post: boolean;
      expires_at?: string;
      created_at: string;
      updated_at: string;
    };
    contextualLinks: {
      primary: { url: string; anchor: string; context: string };
      secondary?: { url: string; anchor: string; context: string }[];
    };
    globalMetrics: {
      totalRequestsToday: number;
      averageGenerationTime: number;
      successRate: number;
      userCountry: string;
    };
  };
  error?: string;
  retryAfter?: number;
}

class GlobalBlogGeneratorService {
  private readonly RATE_LIMIT_STORAGE_KEY = 'global_blog_rate_limit';
  private readonly USER_SESSION_KEY = 'global_user_session';

  constructor() {
    this.initializeUserSession();
  }

  private initializeUserSession() {
    if (!localStorage.getItem(this.USER_SESSION_KEY)) {
      const sessionData = {
        sessionId: crypto.randomUUID(),
        startTime: new Date().toISOString(),
        requestCount: 0,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenResolution: `${screen.width}x${screen.height}`
      };
      localStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(sessionData));
    }
  }

  private getUserSession() {
    const sessionData = localStorage.getItem(this.USER_SESSION_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  private async getUserLocationData() {
    try {
      // Use a free IP geolocation service
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        return {
          country: data.country_name,
          city: data.city,
          region: data.region,
          ip: data.ip,
          timezone: data.timezone
        };
      }
    } catch (error) {
      console.warn('Could not fetch location data:', error);
    }
    return null;
  }

  private checkRateLimit(): { allowed: boolean; retryAfter?: number } {
    // Rate limiting disabled - unlimited usage
    return { allowed: true };
  }

  private updateRateLimit() {
    // Rate limiting disabled - unlimited usage
    console.log('✅ Rate limiting disabled - unlimited OpenAI API usage allowed');
  }

  async generateGlobalBlogPost(request: GlobalBlogRequest): Promise<GlobalBlogResponse> {
    try {
      // Enhanced content moderation check
      const moderationResult = await contentModerationService.moderateContent(
        `${request.targetUrl} ${request.primaryKeyword} ${request.anchorText || ''}`,
        request.targetUrl,
        request.primaryKeyword,
        request.anchorText,
        undefined, // No user ID for global requests
        'blog_request'
      );

      if (!moderationResult.allowed) {
        if (moderationResult.requiresReview) {
          return {
            success: false,
            error: `Content flagged for review: Your request has been submitted for administrative review due to potentially inappropriate content. You will be notified once the review is complete.`,
          };
        } else {
          return {
            success: false,
            error: `Content blocked: Your request contains terms that violate our content policy. Please review our guidelines and try again with appropriate content.`,
          };
        }
      }

      // Check rate limiting
      const rateCheck = this.checkRateLimit();
      if (!rateCheck.allowed) {
        return {
          success: false,
          error: `Rate limit exceeded. Please try again in ${Math.ceil(rateCheck.retryAfter! / 60)} minutes.`,
          retryAfter: rateCheck.retryAfter
        };
      }

      // Get user location data
      const locationData = await this.getUserLocationData();
      const session = this.getUserSession();

      // Prepare enhanced request with global context
      const enhancedRequest = {
        ...request,
        userLocation: locationData?.country,
        userIP: locationData?.ip,
        userTimezone: locationData?.timezone || session?.timezone,
        userLanguage: navigator.language,
        sessionData: session,
        timestamp: new Date().toISOString()
      };

      console.log('🌍 Global blog generation request:', enhancedRequest);

      // No external function calls - return error immediately
      console.log('❌ Content generation temporarily unavailable');
      this.updateRateLimit();

      return {
        success: false,
        error: "We're currently experiencing a large volume of requests. Please register or sign in to try one of our alternatives."
      };

    } catch (error) {
      console.error('Global blog generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred during blog generation.'
      };
    }
  }



  private async generateFallbackBlogPost(request: any): Promise<GlobalBlogResponse> {
    // Instead of generating fallback content, return an error asking users to register
    return {
      success: false,
      error: "We're currently experiencing a large volume of requests. Please register or sign in to try one of our alternatives."
    };
  }



  private async storeGlobalBlogPost(blogPost: any) {
    try {
      // Store in localStorage for immediate access
      const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
      const blogMeta = {
        id: blogPost.id,
        slug: blogPost.slug,
        title: blogPost.title,
        created_at: blogPost.created_at,
        is_trial_post: blogPost.is_trial_post,
        expires_at: blogPost.expires_at
      };

      allBlogPosts.unshift(blogMeta);
      localStorage.setItem('all_blog_posts', JSON.stringify(allBlogPosts));
      localStorage.setItem(`blog_post_${blogPost.slug}`, JSON.stringify(blogPost));

      // Clean content before storing in database to prevent malformed patterns
      const cleanedBlogPost = {
        ...blogPost,
        content: blogPost.content
          .replace(/##\s*&lt;\s*h[1-6]\s*&gt;\s*Pro\s*Tip/gi, '## Pro Tip')
          .replace(/##\s*&lt;\s*h[1-6]\s*&gt;/gi, '##')
          .replace(/##\s*&lt;[^>]*&gt;[^\n]*/g, '')
          .replace(/&lt;\s*h[1-6]\s*&gt;/gi, '')
          .replace(/&lt;\s*\/\s*h[1-6]\s*&gt;/gi, '')
          .replace(/&lt;\s*p\s*&gt;/gi, '')
          .replace(/&lt;\s*\/\s*p\s*&gt;/gi, '')
      };

      // Try to store in Supabase for global access
      try {
        const { error } = await supabase.from('published_blog_posts').insert([cleanedBlogPost]);
        if (error) {
          console.warn('Could not store in database:', error);
        } else {
          console.log('✅ Blog post stored globally in database');
        }
      } catch (dbError) {
        console.warn('Database storage failed, using localStorage only:', dbError);
      }

      console.log('📝 Blog post stored locally and globally');
    } catch (error) {
      console.error('Failed to store blog post:', error);
    }
  }

  async getGlobalBlogStats() {
    // Return actual usage stats from localStorage only
    try {
      const storedPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
      const today = new Date().toDateString();
      const postsToday = storedPosts.filter((post: any) => {
        try {
          return new Date(post.created_at).toDateString() === today;
        } catch {
          return false;
        }
      }).length;

      return {
        totalPosts: storedPosts.length,
        postsToday: postsToday,
        activeUsers: null, // Remove inflated user count
        averageQuality: null // Remove artificial quality score
      };
    } catch (storageError) {
      console.warn('Could not access localStorage, using minimal fallback:', storageError);
      // Return minimal safe fallback
      return {
        totalPosts: 0,
        postsToday: 0,
        activeUsers: null,
        averageQuality: null
      };
    }
  }

  getUserSessionData() {
    return this.getUserSession();
  }

  getRemainingRequests(): number {
    const rateLimitData = localStorage.getItem(this.RATE_LIMIT_STORAGE_KEY);
    if (!rateLimitData) return 5;

    const { requestCount, windowStart } = JSON.parse(rateLimitData);
    const now = new Date().getTime();
    const windowDuration = 60 * 60 * 1000; // 1 hour

    // Reset if window expired
    if (now - windowStart > windowDuration) {
      return 5;
    }

    return Math.max(0, 5 - requestCount);
  }
}

export const globalBlogGenerator = new GlobalBlogGeneratorService();
