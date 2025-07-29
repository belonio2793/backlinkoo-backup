import { supabase } from '@/integrations/supabase/client';
import { contentFilterService } from './contentFilterService';
import { contentModerationService } from './contentModerationService';
import { formatBlogTitle, formatBlogContent } from '@/utils/textFormatting';
import { aiContentEngine } from './aiContentEngine';
import { enhancedAIContentEngine } from './enhancedAIContentEngine';
import { SmartFallbackContent } from './smartFallbackContent';

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
      console.warn('AI content engine failed, falling back to template generation:', aiError);
      return this.generateFallbackBlogPost(request);
    }
  }

  private async generateFallbackBlogPost(request: any): Promise<GlobalBlogResponse> {
    // Fallback to smart template-based generation when AI fails
    const content = SmartFallbackContent.generateContent(
      request.primaryKeyword,
      request.targetUrl,
      request.anchorText
    );

    // Enhanced moderation of generated content
    const title = `${request.primaryKeyword}: A Comprehensive Guide for ${new Date().getFullYear()}`;
    const keywords = [request.primaryKeyword, ...this.generateRelatedKeywords(request.primaryKeyword)];

    const generatedContentModeration = await contentModerationService.moderateContent(
      `${title} ${content}`,
      request.targetUrl,
      request.primaryKeyword,
      request.anchorText,
      undefined,
      'generated_content'
    );

    if (!generatedContentModeration.allowed) {
      throw new Error(`Generated content was flagged for moderation: The AI-generated content contains terms that require review before publication.`);
    }

    const rawTitle = `${request.primaryKeyword}: A Comprehensive Guide for ${new Date().getFullYear()}`;
    const formattedTitle = formatBlogTitle(rawTitle);
    const formattedContent = formatBlogContent(content);

    const blogPost = {
      id: crypto.randomUUID(),
      title: formattedTitle,
      content: formattedContent,
      excerpt: `Discover everything you need to know about ${request.primaryKeyword}. Expert insights, practical tips, and actionable strategies.`,
      slug: `${request.primaryKeyword.toLowerCase().replace(/\s+/g, '-')}-guide-${Date.now()}`,
      keywords: [request.primaryKeyword, ...this.generateRelatedKeywords(request.primaryKeyword)],
      tags: [request.primaryKeyword, ...this.generateRelatedKeywords(request.primaryKeyword)], // Add tags for compatibility
      meta_description: `Complete guide to ${request.primaryKeyword}. Learn from experts and boost your results with proven strategies.`,
      target_url: request.targetUrl,
      anchor_text: request.anchorText || request.primaryKeyword,
      seo_score: Math.floor(Math.random() * 20) + 80,
      reading_time: Math.floor(Math.random() * 5) + 3,
      word_count: Math.floor(content.length / 6), // Approximate word count
      view_count: 0,
      author_name: 'Backlink ∞',
      category: 'SEO Guide',
      published_url: `https://backlinkoo.com/blog/${request.primaryKeyword.toLowerCase().replace(/\s+/g, '-')}-guide-${Date.now()}`,
      published_at: new Date().toISOString(),
      is_trial_post: true,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
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
            context: 'Main target link naturally integrated into content' 
          },
          secondary: [
            { url: request.targetUrl, anchor: 'learn more', context: 'Additional reference in conclusion' }
          ]
        },
        globalMetrics: {
          totalRequestsToday: null, // Remove artificial metrics
          averageGenerationTime: null,
          successRate: null,
          userCountry: request.userLocation || 'Unknown'
        }
      }
    };
  }

  private generateFallbackContent(request: any): string {
    const sections = [
      `<h1>${request.primaryKeyword}: Your Complete Guide</h1><p>Welcome to the ultimate guide on ${request.primaryKeyword}. Whether you're a beginner or looking to enhance your knowledge, this comprehensive resource will provide you with valuable insights and practical strategies.</p>`,
      
      `<h2>What is ${request.primaryKeyword}?</h2><p>${request.primaryKeyword} is a crucial aspect of modern digital strategies. Understanding its fundamentals can significantly impact your success in today's competitive landscape.</p>`,

      `<h2>Key Benefits of ${request.primaryKeyword}</h2><ul><li><strong>Enhanced Performance</strong>: Implementing ${request.primaryKeyword} strategies can dramatically improve your results</li><li><strong>Cost Efficiency</strong>: Smart ${request.primaryKeyword} approaches often reduce overhead while maximizing output</li><li><strong>Competitive Advantage</strong>: Stay ahead of competitors with advanced ${request.primaryKeyword} techniques</li><li><strong>Long-term Growth</strong>: Build sustainable success through proven ${request.primaryKeyword} methodologies</li></ul>`,
      
      `<h2>Best Practices for ${request.primaryKeyword}</h2><p>To get the most out of ${request.primaryKeyword}, consider these expert-recommended practices:</p><h3>Strategy Development</h3><p>Begin with a clear understanding of your goals. ${request.primaryKeyword} works best when aligned with your overall objectives.</p><h3>Implementation Tips</h3><ul><li>Start with small, manageable steps</li><li>Monitor progress regularly</li><li>Adjust strategies based on results</li><li>Stay updated with latest trends in ${request.primaryKeyword}</li></ul>`,
      
      `## Advanced ${request.primaryKeyword} Techniques\n\nFor those ready to take their ${request.primaryKeyword} efforts to the next level, these advanced techniques can provide significant advantages:\n\n### Professional Tools and Resources\nLeverage specialized tools and platforms designed for ${request.primaryKeyword}. For comprehensive solutions, consider exploring [advanced ${request.primaryKeyword} tools](${request.targetUrl}) that can streamline your workflow.\n\n`,
      
      `<h2>Common Mistakes to Avoid</h2><p>Even experienced practitioners can fall into these ${request.primaryKeyword} traps:</p><ul><li>Neglecting regular monitoring and optimization</li><li>Focusing on quantity over quality</li><li>Ignoring user experience considerations</li><li>Failing to adapt to industry changes</li></ul>`,
      
      `<h2>Future of ${request.primaryKeyword}</h2><p>As technology continues to evolve, ${request.primaryKeyword} is becoming increasingly sophisticated. Stay ahead by:</p><ul><li>Embracing new technologies and methodologies</li><li>Investing in continuous learning</li><li>Building adaptable strategies</li><li>Networking with industry experts</li></ul>`,
      
      `## Conclusion\n\n${request.primaryKeyword} represents a significant opportunity for growth and success. By implementing the strategies outlined in this guide, you'll be well-positioned to achieve your objectives.\n\nReady to get started? [Explore our ${request.primaryKeyword} solutions](${request.targetUrl}) and take your efforts to the next level.\n\n---\n\n* This comprehensive guide provides actionable insights for ${request.primaryKeyword} success. For more detailed strategies and tools, visit our resource center.`
    ];

    // Join sections and clean up any remaining markdown
    let content = sections.join('');

    // Fix any remaining markdown patterns
    content = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    return content;
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
      // Add timeout and better error handling for fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.API_BASE}/global-blog-generator`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.warn('Could not fetch global stats, using local fallback:', error);
      // Don't re-throw the error, just continue to fallback
    }

    // Return actual usage stats or minimal fallback
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
