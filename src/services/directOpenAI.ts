/**
 * Direct OpenAI Service for Blog Generation
 * Simplified service that directly calls OpenAI without complex templates
 */

interface BlogRequest {
  keyword: string;
  anchorText: string;
  targetUrl: string;
}

interface BlogResponse {
  success: boolean;
  title?: string;
  content?: string;
  slug?: string;
  excerpt?: string;
  blogUrl?: string;
  error?: string;
  metadata?: any;
}

export class DirectOpenAIService {
  /**
   * Generate blog post using direct OpenAI API call or local dev API
   */
  static async generateBlogPost(request: BlogRequest): Promise<BlogResponse> {
    try {
      console.log('🚀 Starting direct blog generation...');

      // Check if we should use local dev API
      const { LocalDevAPI } = await import('@/services/localDevAPI');
      if (LocalDevAPI.shouldUseMockAPI()) {
        console.log('🧪 Using local development API...');
        return await this.generateWithLocalAPI(request);
      }

      // Check if OpenAI API key is configured (but allow Netlify functions to handle it)
      const { environmentVariablesService } = await import('@/services/environmentVariablesService');
      const clientApiKey = await environmentVariablesService.getOpenAIKey();

      // Don't fail if no local API key - Netlify functions might have it configured
      console.log('🔑 Local API key check:', clientApiKey ? 'Found' : 'Not found (will try Netlify function)');

      // Build the prompt dynamically
      const prompt = `Write a comprehensive 1000-word blog post about "${request.keyword}". 

REQUIREMENTS:
- Create engaging, informative content that provides real value to readers
- Include a natural mention of "${request.anchorText}" that would logically link to ${request.targetUrl}
- Structure with clear headings and subheadings
- Write in a professional yet conversational tone
- Include actionable insights and examples where relevant
- Make the content SEO-friendly with natural keyword usage

IMPORTANT: Do not include any HTML tags or markdown formatting. Write in plain text with clear paragraph breaks.

Please write the complete blog post now:`;

      console.log('📝 Generated prompt:', prompt);

      // Call OpenAI via Netlify function
      console.log('🚀 Calling OpenAI Netlify function...');
      const response = await fetch('/.netlify/functions/generate-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: request.keyword,
          url: request.targetUrl,
          anchorText: request.anchorText,
          wordCount: 1000,
          contentType: 'blog-post',
          tone: 'professional',
          apiKey: clientApiKey || null // Pass API key or let Netlify function use its configured key
        })
      });

      // Read response body once and handle both success and error cases
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        throw new Error(`OpenAI API call failed: ${response.status} - Unable to parse response`);
      }

      if (!response.ok) {
        const errorMessage = `OpenAI API call failed: ${response.status} - ${result.error || 'Unknown error'}`;
        throw new Error(errorMessage);
      }

      if (!result.success || !result.content) {
        throw new Error(result.error || 'Failed to generate content');
      }

      const content = result.content;

      // Process the generated content
      const title = this.extractTitle(content, request.keyword);
      const slug = this.generateSlug(title);
      const excerpt = this.extractExcerpt(content);
      
      // Process the content to include the backlink (it should already be included by the AI)
      const contentWithLink = content.includes(request.targetUrl) ? content : this.insertBacklink(content, request.anchorText, request.targetUrl);

      // Save to blog posts using blog service (no manual ID setting)
      const blogData = {
        title,
        content: contentWithLink,
        targetUrl: request.targetUrl,
        anchorText: request.anchorText,
        wordCount: contentWithLink.split(/\s+/).length,
        readingTime: this.calculateReadingTime(contentWithLink),
        seoScore: 85,
        customSlug: slug
      };

      // Save the blog post using blog service
      const savedPost = await this.saveBlogPostData(blogData);
      const blogUrl = savedPost.published_url || `/blog/${savedPost.slug}`;

      console.log('✅ Blog post generated successfully');

      return {
        success: true,
        title,
        content: contentWithLink,
        slug,
        excerpt,
        blogUrl,
        metadata: savedPost
      };

    } catch (error) {
      console.error('❌ Blog generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Extract title from content or generate from keyword
   */
  private static extractTitle(content: string, keyword: string): string {
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length > 0) {
      let firstLine = lines[0].trim();
      // Strip HTML tags from the title
      firstLine = firstLine.replace(/<[^>]*>/g, '');
      // If first line looks like a title (not too long, doesn't end with period)
      if (firstLine.length <= 100 && !firstLine.endsWith('.') && firstLine.length > 10) {
        return firstLine;
      }
    }

    // Generate title from keyword
    const keywordWords = keyword.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
    return `The Complete Guide to ${keywordWords.join(' ')}`;
  }

  /**
   * Generate URL-friendly slug with timestamp for uniqueness
   */
  private static generateSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      // Strip HTML tags first
      .replace(/<[^>]*>/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 80); // Leave room for timestamp

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36);
    return `${baseSlug}-${timestamp}`;
  }

  /**
   * Extract excerpt from content
   */
  private static extractExcerpt(content: string): string {
    const paragraphs = content.split('\n\n').filter(p => p.trim() && p.length > 50);
    
    if (paragraphs.length > 0) {
      const firstParagraph = paragraphs[0].trim();
      return firstParagraph.length > 200 
        ? firstParagraph.substring(0, 200) + '...'
        : firstParagraph;
    }
    
    return content.substring(0, 200) + '...';
  }

  /**
   * Insert backlink naturally into content
   */
  private static insertBacklink(content: string, anchorText: string, targetUrl: string): string {
    const paragraphs = content.split('\n\n');
    
    // Find a good paragraph to insert the link (usually 2nd or 3rd paragraph)
    const targetParagraphIndex = Math.min(2, Math.floor(paragraphs.length / 2));
    
    if (paragraphs[targetParagraphIndex] && paragraphs[targetParagraphIndex].length > 100) {
      const sentences = paragraphs[targetParagraphIndex].split('.');
      
      if (sentences.length > 1) {
        // Insert link after first sentence
        const linkedText = `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>`;
        sentences[0] = sentences[0] + `. For more information on this topic, check out ${linkedText}`;
        paragraphs[targetParagraphIndex] = sentences.join('.');
      }
    }
    
    return paragraphs.join('\n\n');
  }

  /**
   * Calculate reading time
   */
  private static calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Save blog post to storage using the blog service
   */
  private static async saveBlogPost(blogData: any): Promise<string> {
    try {
      // Use the blog service for proper database handling
      const { blogService } = await import('@/services/blogService');

      const blogPostData = {
        title: blogData.title,
        content: blogData.content,
        keywords: blogData.keywords,
        targetUrl: blogData.target_url,
        anchorText: blogData.anchor_text,
        wordCount: blogData.word_count,
        readingTime: blogData.reading_time,
        seoScore: blogData.seo_score,
        metaDescription: blogData.meta_description,
        customSlug: blogData.slug
      };

      const savedPost = await blogService.createBlogPost(
        blogPostData,
        null, // no user_id for trial posts
        true  // is_trial_post = true
      );

      console.log('✅ Blog post saved to database');
      return savedPost.published_url || `/blog/${savedPost.slug}`;
    } catch (error) {
      console.error('Failed to save blog post:', error);
      throw new Error('Failed to save blog post to database');
    }
  }

  /**
   * Generate blog post using local development API
   */
  private static async generateWithLocalAPI(request: BlogRequest): Promise<BlogResponse> {
    try {
      const { LocalDevAPI } = await import('@/services/localDevAPI');

      const result = await LocalDevAPI.generateBlogPost({
        keyword: request.keyword,
        anchorText: request.anchorText,
        targetUrl: request.targetUrl,
        wordCount: 1000,
        contentType: 'blog-post',
        tone: 'professional'
      });

      if (!result.success || !result.content) {
        throw new Error(result.error || 'Failed to generate mock content');
      }

      const content = result.content;

      // Process the generated content
      const title = this.extractTitle(content, request.keyword);
      const slug = this.generateSlug(title);
      const excerpt = this.extractExcerpt(content);

      // Save to blog posts
      const blogData = {
        title,
        content,
        targetUrl: request.targetUrl,
        anchorText: request.anchorText,
        wordCount: content.replace(/<[^>]*>/g, '').split(/\s+/).length,
        readingTime: this.calculateReadingTime(content),
        seoScore: 85,
        customSlug: slug
      };

      // Save the blog post to database
      const savedPost = await this.saveBlogPostData(blogData);
      const blogUrl = savedPost.published_url || `/blog/${savedPost.slug}`;

      console.log('✅ Mock blog post generated and saved to database:', {
        id: savedPost.id,
        slug: savedPost.slug,
        title: savedPost.title
      });

      return {
        success: true,
        title,
        content,
        slug,
        excerpt,
        blogUrl,
        metadata: savedPost
      };

    } catch (error) {
      console.error('❌ Mock blog generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mock generation failed'
      };
    }
  }

  /**
   * Save blog post data using the blog service
   */
  private static async saveBlogPostData(blogData: any) {
    const { blogService } = await import('@/services/blogService');

    // Clean up old posts before creating new ones
    try {
      const { LocalDevAPI } = await import('@/services/localDevAPI');
      await LocalDevAPI.cleanupInvalidPosts();
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }

    return await blogService.createBlogPost(
      blogData,
      null, // no user_id for trial posts
      true  // is_trial_post = true
    );
  }


}
