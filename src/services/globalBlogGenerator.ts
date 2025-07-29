import { supabase } from '@/integrations/supabase/client';
import { contentFilterService } from './contentFilterService';
import { contentModerationService } from './contentModerationService';
import { formatBlogTitle, formatBlogContent } from '@/utils/textFormatting';
import { aiContentEngine } from './aiContentEngine';
import { enhancedAIContentEngine } from './enhancedAIContentEngine';


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
  private readonly API_BASE = '/.netlify/functions';
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
    const rateLimitData = localStorage.getItem(this.RATE_LIMIT_STORAGE_KEY);
    if (!rateLimitData) return { allowed: true };

    const { lastRequest, requestCount, windowStart } = JSON.parse(rateLimitData);
    const now = new Date().getTime();
    const windowDuration = 60 * 60 * 1000; // 1 hour
    const maxRequests = 5; // 5 requests per hour for free users

    // Reset window if expired
    if (now - windowStart > windowDuration) {
      localStorage.removeItem(this.RATE_LIMIT_STORAGE_KEY);
      return { allowed: true };
    }

    if (requestCount >= maxRequests) {
      const retryAfter = Math.ceil((windowStart + windowDuration - now) / 1000);
      return { allowed: false, retryAfter };
    }

    return { allowed: true };
  }

  private updateRateLimit() {
    const now = new Date().getTime();
    const rateLimitData = localStorage.getItem(this.RATE_LIMIT_STORAGE_KEY);
    
    if (rateLimitData) {
      const data = JSON.parse(rateLimitData);
      data.requestCount += 1;
      data.lastRequest = now;
      localStorage.setItem(this.RATE_LIMIT_STORAGE_KEY, JSON.stringify(data));
    } else {
      const newData = {
        windowStart: now,
        lastRequest: now,
        requestCount: 1
      };
      localStorage.setItem(this.RATE_LIMIT_STORAGE_KEY, JSON.stringify(newData));
    }
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

      // Try enhanced global Netlify function first
      try {
        const response = await fetch(`${this.API_BASE}/global-blog-generator`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-IP': locationData?.ip || 'unknown'
          },
          body: JSON.stringify(enhancedRequest)
        });

        if (response.ok) {
          const data = await response.json();
          this.updateRateLimit();
          
          // Store globally for blog environment
          await this.storeGlobalBlogPost(data.blogPost);
          
          return {
            success: true,
            data: {
              blogPost: data.blogPost,
              contextualLinks: data.contextualLinks || {
                primary: { url: request.targetUrl, anchor: request.anchorText || request.primaryKeyword, context: 'Main target link' }
              },
              globalMetrics: data.globalMetrics || {
                totalRequestsToday: null, // Remove mock metrics
                averageGenerationTime: null,
                successRate: null,
                userCountry: locationData?.country || 'Unknown'
              }
            }
          };
        }
      } catch (netlifyError) {
        console.warn('Netlify function unavailable, using fallback:', netlifyError);
      }

      // Use enhanced AI content engine as primary fallback
      console.log('🚀 Using enhanced AI content engine for generation...');
      const aiResult = await this.generateAIEnhancedBlogPost(enhancedRequest);
      this.updateRateLimit();
      
      return aiResult;

    } catch (error) {
      console.error('Global blog generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred during blog generation.'
      };
    }
  }

  private async generateAIEnhancedBlogPost(request: any): Promise<GlobalBlogResponse> {
    try {
      // Use the enhanced AI content engine for original content generation
      const aiResult = await enhancedAIContentEngine.generateContent({
        keyword: request.primaryKeyword,
        targetUrl: request.targetUrl,
        anchorText: request.anchorText,
        userLocation: request.userLocation,
        contentLength: request.additionalContext?.contentLength || 'medium',
        contentTone: request.additionalContext?.contentTone || 'professional',
        seoFocus: request.additionalContext?.seoFocus === 'high',
        industry: request.additionalContext?.industry
      });

      if (aiResult.finalContent && aiResult.finalContent.length > 200) {
        console.log('✅ AI content generation successful:', {
          provider: aiResult.selectedProvider,
          wordCount: aiResult.metadata.wordCount,
          seoScore: aiResult.metadata.seoScore,
          cost: `$${aiResult.totalCost.toFixed(4)}`
        });

        const content = aiResult.finalContent;
        const title = aiResult.metadata.title;
        const keywords = aiResult.metadata.keywords;
        const metaDescription = aiResult.metadata.metaDescription;
        const seoScore = aiResult.metadata.seoScore;
        const readingTime = aiResult.metadata.readingTime;
        const wordCount = aiResult.metadata.wordCount;

        // Enhanced moderation of AI-generated content
        const generatedContentModeration = await contentModerationService.moderateContent(
          `${title} ${content}`,
          request.targetUrl,
          request.primaryKeyword,
          request.anchorText,
          undefined,
          'ai_generated_content'
        );

        if (!generatedContentModeration.allowed) {
          throw new Error(`AI-generated content was flagged for moderation: The content contains terms that require review before publication.`);
        }

        const formattedTitle = formatBlogTitle(title);
        const formattedContent = formatBlogContent(content);

        const blogPost = {
          id: crypto.randomUUID(),
          title: formattedTitle,
          content: formattedContent,
          excerpt: metaDescription,
          slug: `${request.primaryKeyword.toLowerCase().replace(/\s+/g, '-')}-guide-${Date.now()}`,
          keywords: keywords,
          tags: keywords,
          meta_description: metaDescription,
          target_url: request.targetUrl,
          anchor_text: request.anchorText || request.primaryKeyword,
          seo_score: seoScore,
          reading_time: readingTime,
          word_count: wordCount,
          view_count: 0,
          author_name: 'Backlink ∞',
          category: 'SEO Guide',
          ai_provider: aiResult.selectedProvider,
          ai_generation_cost: aiResult.totalCost,
          ai_processing_time: aiResult.processingTime,
          published_url: `https://backlinkoo.com/blog/${request.primaryKeyword.toLowerCase().replace(/\s+/g, '-')}-guide-${Date.now()}`,
          published_at: new Date().toISOString(),
          is_trial_post: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          contextual_links: []
        };

        await this.storeGlobalBlogPost(blogPost);

        return {
          success: true,
          data: {
            blogPost,
            contextualLinks: {
              primary: {
                url: request.targetUrl,
                anchor: request.anchorText || request.primaryKeyword,
                context: 'AI-optimized backlink naturally integrated into content'
              },
              secondary: [
                { url: request.targetUrl, anchor: 'learn more', context: 'Additional reference with AI enhancement' },
                { url: request.targetUrl, anchor: 'get started', context: 'Call-to-action optimized by AI' }
              ]
            },
            globalMetrics: {
              totalRequestsToday: null,
              averageGenerationTime: aiResult.processingTime,
              successRate: null,
              userCountry: request.userLocation || 'Unknown',
              aiProvider: aiResult.selectedProvider,
              contentQuality: seoScore
            }
          }
        };
      } else {
        throw new Error('AI content generation produced insufficient content');
      }
    } catch (aiError) {
      console.error('AI content engine failed:', aiError);
      throw new Error(`Content generation failed: ${aiError.message}`);
    }
  }





  private generateRelatedKeywords(primaryKeyword: string): string[] {
    const commonSuffixes = ['guide', 'tips', 'strategies', 'best practices', 'tools', 'solutions'];
    const commonPrefixes = ['best', 'top', 'advanced', 'professional', 'effective'];
    
    return [
      `${primaryKeyword} guide`,
      `best ${primaryKeyword}`,
      `${primaryKeyword} tips`,
      `${primaryKeyword} strategies`,
      `professional ${primaryKeyword}`
    ].slice(0, 4);
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

      // Try to store in Supabase for global access
      try {
        const { error } = await supabase.from('published_blog_posts').insert([blogPost]);
        if (error) {
          console.warn('Could not store in database:', error);
        } else {
          console.log('��� Blog post stored globally in database');
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
    try {
      const response = await fetch(`${this.API_BASE}/global-blog-generator`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Could not fetch global stats:', error);
    }

    // Return actual usage stats or minimal fallback
    const storedPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
    const today = new Date().toDateString();
    const postsToday = storedPosts.filter((post: any) =>
      new Date(post.created_at).toDateString() === today
    ).length;

    return {
      totalPosts: storedPosts.length,
      postsToday: postsToday,
      activeUsers: null, // Remove inflated user count
      averageQuality: null // Remove artificial quality score
    };
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
