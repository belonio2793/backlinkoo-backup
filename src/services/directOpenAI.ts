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
   * Generate blog post using direct OpenAI API call
   */
  static async generateBlogPost(request: BlogRequest): Promise<BlogResponse> {
    try {
      console.log('🚀 Starting direct blog generation...');

      // Check if OpenAI API key is configured
      const { environmentVariablesService } = await import('@/services/environmentVariablesService');
      const clientApiKey = await environmentVariablesService.getOpenAIKey();

      if (!clientApiKey) {
        return {
          success: false,
          error: 'AI content generation is currently unavailable. Please try again later or contact support.'
        };
      }

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
          contentType: 'how-to',
          tone: 'professional',
          apiKey: clientApiKey // Pass API key securely to server function
        })
      });

      let result;
      if (!response.ok) {
        let errorMessage = `OpenAI API call failed: ${response.status}`;
        try {
          // Try to get error details from response
          const errorData = await response.json();
          errorMessage += ` - ${errorData.error || 'Unknown error'}`;
        } catch {
          // If JSON parsing fails, use status only
        }
        throw new Error(errorMessage);
      } else {
        result = await response.json();
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

      // Save to blog posts
      const blogData = {
        id: crypto.randomUUID(),
        title,
        slug,
        content: contentWithLink,
        excerpt,
        meta_description: excerpt,
        keywords: [request.keyword],
        tags: request.keyword.split(' '),
        category: 'AI Generated',
        target_url: request.targetUrl,
        anchor_text: request.anchorText,
        status: 'published',
        is_trial_post: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        view_count: 0,
        seo_score: 85,
        reading_time: this.calculateReadingTime(contentWithLink),
        word_count: contentWithLink.split(/\s+/).length,
        author_name: 'Backlink ∞ AI',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        published_url: `/blog/${slug}`,
        user_id: null // Unclaimed initially
      };

      // Save the blog post
      const blogUrl = await this.saveBlogPost(blogData);

      console.log('✅ Blog post generated successfully');

      return {
        success: true,
        title,
        content: contentWithLink,
        slug,
        excerpt,
        blogUrl,
        metadata: blogData
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
      const firstLine = lines[0].trim();
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
   * Generate URL-friendly slug
   */
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 100);
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


}
