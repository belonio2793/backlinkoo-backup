/**
 * Enhanced Blog Creation Workflow
 * Complete end-to-end blog creation with database persistence, user ownership, and permalink management
 */

import { supabase } from '@/integrations/supabase/client';
import { blogService, type BlogPostGenerationData } from './blogService';
import { slugGenerationService } from './slugGenerationService';
import { openAIOnlyContentGenerator } from './openAIOnlyContentGenerator';
import { useAuth } from '@/hooks/useAuth';
import { applyBeautifulContentStructure } from '@/utils/forceBeautifulContentStructure';

export interface BlogCreationRequest {
  targetUrl: string;
  keywords: string[];
  primaryKeyword?: string;
  contentType?: 'blog' | 'article' | 'review' | 'guide';
  tone?: 'professional' | 'casual' | 'technical' | 'friendly';
  wordCount?: number;
  customSlug?: string;
  title?: string;
  metaDescription?: string;
  category?: string;
  anchorText?: string;
  includeBacklink?: boolean;
  autoPublish?: boolean;
}

export interface BlogCreationResult {
  success: boolean;
  blogPost?: any;
  error?: string;
  requiresAuth?: boolean;
  permalink?: string;
  previewUrl?: string;
  editUrl?: string;
}

export interface BlogCreationOptions {
  saveToDatabase?: boolean;
  generateSlug?: boolean;
  requireAuth?: boolean;
  isTrialPost?: boolean;
  userId?: string;
}

export class EnhancedBlogWorkflow {
  
  /**
   * Main entry point - create blog post from form submission
   */
  static async createBlogPost(
    request: BlogCreationRequest,
    options: BlogCreationOptions = {}
  ): Promise<BlogCreationResult> {
    
    const {
      saveToDatabase = true,
      generateSlug = true,
      requireAuth = false,
      isTrialPost = false,
      userId
    } = options;

    try {
      console.log('🚀 Starting enhanced blog creation workflow...');
      
      // Step 1: Validate request
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Step 2: Check authentication if required
      if (requireAuth && !userId) {
        return {
          success: false,
          requiresAuth: true,
          error: 'Authentication required for permanent blog posts'
        };
      }

      // Step 3: Generate AI content
      console.log('🤖 Generating AI content...');
      const aiContent = await this.generateAIContent(request);
      if (!aiContent.success) {
        return {
          success: false,
          error: aiContent.error || 'Failed to generate AI content'
        };
      }

      // Step 4: Process and enhance content
      console.log('✨ Processing and enhancing content...');
      const enhancedContent = await this.enhanceContent(aiContent.content!, request);
      
      // Step 5: Generate unique slug
      let finalSlug = '';
      if (generateSlug) {
        console.log('🔗 Generating unique permalink...');
        finalSlug = await this.generateUniqueSlug(enhancedContent.title, request);
      }

      // Step 6: Create blog post data structure
      const blogPostData: BlogPostGenerationData = {
        title: enhancedContent.title,
        content: enhancedContent.content,
        keywords: request.keywords,
        targetUrl: request.targetUrl,
        anchorText: request.anchorText || request.primaryKeyword || request.keywords[0],
        wordCount: enhancedContent.wordCount,
        readingTime: enhancedContent.readingTime,
        seoScore: enhancedContent.seoScore,
        metaDescription: enhancedContent.metaDescription,
        contextualLinks: enhancedContent.contextualLinks || [],
        customSlug: finalSlug || request.customSlug
      };

      // Step 7: Save to database if requested
      let savedPost: any = null;
      if (saveToDatabase) {
        console.log('💾 Saving to database...');
        savedPost = await this.saveBlogPost(blogPostData, userId, isTrialPost);
        if (!savedPost) {
          return {
            success: false,
            error: 'Failed to save blog post to database'
          };
        }
      }

      // Step 8: Generate URLs
      const permalink = savedPost ? `/blog/${savedPost.slug}` : `/blog/${finalSlug}`;
      const previewUrl = `${window.location.origin}${permalink}`;
      const editUrl = savedPost ? `/blog/${savedPost.id}/edit` : null;

      console.log('✅ Blog creation workflow completed successfully!');

      return {
        success: true,
        blogPost: savedPost || {
          ...blogPostData,
          id: `temp_${Date.now()}`,
          slug: finalSlug,
          created_at: new Date().toISOString(),
          status: 'draft'
        },
        permalink,
        previewUrl,
        editUrl
      };

    } catch (error) {
      console.error('❌ Blog creation workflow failed:', error);
      return {
        success: false,
        error: `Blog creation failed: ${error.message}`
      };
    }
  }

  /**
   * Validate blog creation request
   */
  private static validateRequest(request: BlogCreationRequest): { isValid: boolean; error?: string } {
    if (!request.targetUrl) {
      return { isValid: false, error: 'Target URL is required' };
    }

    if (!request.keywords || request.keywords.length === 0) {
      return { isValid: false, error: 'At least one keyword is required' };
    }

    // Validate URL format
    try {
      new URL(request.targetUrl);
    } catch {
      return { isValid: false, error: 'Invalid target URL format' };
    }

    // Validate word count
    if (request.wordCount && (request.wordCount < 100 || request.wordCount > 5000)) {
      return { isValid: false, error: 'Word count must be between 100 and 5000' };
    }

    return { isValid: true };
  }

  /**
   * Generate AI content using OpenAI
   */
  private static async generateAIContent(request: BlogCreationRequest): Promise<{
    success: boolean;
    content?: any;
    error?: string;
  }> {
    try {
      const prompt = this.buildContentPrompt(request);
      
      const aiRequest = {
        targetUrl: request.targetUrl,
        primaryKeyword: request.primaryKeyword || request.keywords[0],
        anchorText: request.anchorText,
        wordCount: request.wordCount || 800,
        tone: request.tone || 'professional',
        contentType: request.contentType || 'blog'
      };

      const result = await openAIOnlyContentGenerator.generateContent(aiRequest);
      
      return {
        success: true,
        content: result
      };

    } catch (error) {
      console.error('AI content generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build AI prompt based on request parameters
   */
  private static buildContentPrompt(request: BlogCreationRequest): string {
    const {
      keywords,
      targetUrl,
      contentType = 'blog',
      tone = 'professional',
      wordCount = 800,
      includeBacklink = true
    } = request;

    const keywordList = keywords.join(', ');
    const domain = new URL(targetUrl).hostname;

    return `
Create a comprehensive ${contentType} post about "${keywords[0]}" with the following specifications:

**Content Requirements:**
- Word count: approximately ${wordCount} words
- Tone: ${tone}
- Primary keywords: ${keywordList}
- Target website: ${domain}

**Structure Guidelines:**
- Start with an engaging introduction that hooks the reader
- Use clear H2 and H3 headings to organize content
- Include practical examples and actionable insights
- Write in a natural, conversational style that flows well
- End with a compelling conclusion

**SEO Optimization:**
- Naturally incorporate the primary keyword "${keywords[0]}" throughout
- Use related keywords and synonyms for better semantic SEO
- Ensure proper heading hierarchy (H1 > H2 > H3)
- Write meta-friendly content that search engines will love

${includeBacklink ? `
**Backlink Integration:**
- Naturally incorporate a link to ${targetUrl} 
- Use contextual anchor text that fits the content flow
- Make the backlink feel organic and valuable to readers
- Ensure the link provides genuine value to the audience
` : ''}

**Content Quality:**
- Provide genuine value and insights to readers
- Use engaging language that keeps readers interested
- Include specific examples and practical tips
- Ensure content is original and plagiarism-free
- Write with expertise and authority on the topic

Generate high-quality, engaging content that ranks well and provides real value to readers.
`;
  }

  /**
   * Enhance generated content with additional processing
   */
  private static async enhanceContent(aiContent: any, request: BlogCreationRequest): Promise<{
    title: string;
    content: string;
    wordCount: number;
    readingTime: number;
    seoScore: number;
    metaDescription: string;
    contextualLinks?: any[];
  }> {
    
    // Calculate metrics
    const wordCount = this.calculateWordCount(aiContent.content);
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    const seoScore = this.calculateSEOScore(aiContent, request);

    // Generate meta description if not provided
    let metaDescription = request.metaDescription || aiContent.metaDescription;
    if (!metaDescription) {
      metaDescription = this.generateMetaDescription(aiContent.content, request.keywords[0]);
    }

    // Enhance title if needed
    let title = request.title || aiContent.title;
    if (!title || title.length < 10) {
      title = this.generateTitle(request.keywords[0], request.contentType);
    }

    // Process contextual links
    const contextualLinks = this.extractContextualLinks(aiContent.content, request.targetUrl);

    // Apply beautiful content structure automatically
    console.log('🎨 Applying beautiful content structure in enhanced workflow...');
    const beautifulContent = applyBeautifulContentStructure(aiContent.content, title);

    return {
      title: title.substring(0, 60), // SEO-friendly title length
      content: beautifulContent, // Use beautifully formatted content
      wordCount,
      readingTime,
      seoScore,
      metaDescription: metaDescription.substring(0, 160), // SEO-friendly meta length
      contextualLinks
    };
  }

  /**
   * Generate unique slug for the blog post
   */
  private static async generateUniqueSlug(title: string, request: BlogCreationRequest): Promise<string> {
    try {
      const slugOptions = {
        title,
        keywords: request.keywords,
        customSlug: request.customSlug
      };

      return await slugGenerationService.generateUniqueSlug(slugOptions);
    } catch (error) {
      console.warn('Slug generation failed, using fallback:', error);
      // Fallback slug generation
      const baseSlug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 50);
      
      return `${baseSlug}-${Date.now().toString(36)}`;
    }
  }

  /**
   * Save blog post to database
   */
  private static async saveBlogPost(
    blogPostData: BlogPostGenerationData,
    userId?: string,
    isTrialPost: boolean = false
  ): Promise<any> {
    try {
      return await blogService.createBlogPost(blogPostData, userId, isTrialPost);
    } catch (error) {
      console.error('Failed to save blog post:', error);
      throw new Error(`Database save failed: ${error.message}`);
    }
  }

  /**
   * Calculate word count from content
   */
  private static calculateWordCount(content: string): number {
    const textContent = content.replace(/<[^>]*>/g, ' ');
    return textContent.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Calculate SEO score based on content quality
   */
  private static calculateSEOScore(aiContent: any, request: BlogCreationRequest): number {
    let score = 70; // Base score

    // Word count scoring
    const wordCount = this.calculateWordCount(aiContent.content);
    if (wordCount >= 800) score += 10;
    if (wordCount >= 1200) score += 5;

    // Keyword presence
    const lowerContent = aiContent.content.toLowerCase();
    const keywordMatches = request.keywords.filter(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    ).length;
    score += Math.min(keywordMatches * 5, 15);

    // Title optimization
    if (aiContent.title && aiContent.title.length >= 30 && aiContent.title.length <= 60) {
      score += 5;
    }

    // Meta description
    if (aiContent.metaDescription && aiContent.metaDescription.length >= 120) {
      score += 5;
    }

    // Heading structure
    if (aiContent.content.includes('<h2>') || aiContent.content.includes('##')) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  /**
   * Generate meta description from content
   */
  private static generateMetaDescription(content: string, primaryKeyword: string): string {
    const textContent = content.replace(/<[^>]*>/g, ' ');
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    let metaDesc = '';
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(primaryKeyword.toLowerCase())) {
        metaDesc = sentence.trim();
        break;
      }
    }

    if (!metaDesc && sentences.length > 0) {
      metaDesc = sentences[0].trim();
    }

    return metaDesc.substring(0, 155) + (metaDesc.length > 155 ? '...' : '');
  }

  /**
   * Generate title if not provided
   */
  private static generateTitle(primaryKeyword: string, contentType: string = 'blog'): string {
    const titleTemplates = {
      blog: [
        `The Complete Guide to ${primaryKeyword}`,
        `Everything You Need to Know About ${primaryKeyword}`,
        `${primaryKeyword}: A Comprehensive Overview`,
        `Mastering ${primaryKeyword}: Tips and Strategies`
      ],
      article: [
        `Understanding ${primaryKeyword}: Key Insights`,
        `${primaryKeyword} Explained: What You Should Know`,
        `The Definitive Guide to ${primaryKeyword}`
      ],
      review: [
        `${primaryKeyword} Review: Pros, Cons, and Verdict`,
        `In-Depth ${primaryKeyword} Analysis`,
        `${primaryKeyword}: Comprehensive Review and Rating`
      ],
      guide: [
        `Step-by-Step ${primaryKeyword} Guide`,
        `How to Master ${primaryKeyword}`,
        `${primaryKeyword} Tutorial: From Beginner to Expert`
      ]
    };

    const templates = titleTemplates[contentType] || titleTemplates.blog;
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Extract contextual links from content
   */
  private static extractContextualLinks(content: string, targetUrl: string): any[] {
    const links = [];
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      links.push({
        url: match[1],
        anchorText: match[2],
        isTarget: match[1] === targetUrl
      });
    }

    return links;
  }

  /**
   * Get user's blog posts with management capabilities
   */
  static async getUserBlogPosts(userId: string): Promise<any[]> {
    try {
      return await blogService.getUserBlogPosts(userId);
    } catch (error) {
      console.error('Failed to get user blog posts:', error);
      return [];
    }
  }

  /**
   * Update blog post
   */
  static async updateBlogPost(postId: string, updates: any): Promise<any> {
    try {
      return await blogService.updateBlogPost(postId, updates);
    } catch (error) {
      console.error('Failed to update blog post:', error);
      throw error;
    }
  }

  /**
   * Delete blog post
   */
  static async deleteBlogPost(postId: string): Promise<void> {
    try {
      await blogService.deleteBlogPost(postId);
    } catch (error) {
      console.error('Failed to delete blog post:', error);
      throw error;
    }
  }

  /**
   * Publish blog post (change status to published)
   */
  static async publishBlogPost(postId: string): Promise<any> {
    try {
      return await blogService.updateBlogPost(postId, {
        status: 'published',
        published_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to publish blog post:', error);
      throw error;
    }
  }

  /**
   * Get blog post by ID with ownership verification
   */
  static async getBlogPost(postId: string, userId?: string): Promise<any> {
    try {
      const post = await blogService.getBlogPostById(postId);
      
      // Verify ownership for non-public operations
      if (userId && post?.user_id && post.user_id !== userId) {
        throw new Error('Access denied: You do not own this blog post');
      }

      return post;
    } catch (error) {
      console.error('Failed to get blog post:', error);
      throw error;
    }
  }

  /**
   * Check blog post availability and ownership
   */
  static async checkBlogPostAccess(postId: string, userId?: string): Promise<{
    exists: boolean;
    canEdit: boolean;
    canDelete: boolean;
    isOwner: boolean;
    post?: any;
  }> {
    try {
      const post = await blogService.getBlogPostById(postId);
      
      if (!post) {
        return {
          exists: false,
          canEdit: false,
          canDelete: false,
          isOwner: false
        };
      }

      const isOwner = userId && post.user_id === userId;
      const isPublic = post.status === 'published';

      return {
        exists: true,
        canEdit: isOwner,
        canDelete: isOwner,
        isOwner: !!isOwner,
        post: isPublic || isOwner ? post : null
      };

    } catch (error) {
      console.error('Failed to check blog post access:', error);
      return {
        exists: false,
        canEdit: false,
        canDelete: false,
        isOwner: false
      };
    }
  }
}
