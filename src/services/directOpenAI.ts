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

      // Multiple ways to get API key - more robust approach
      let clientApiKey: string | null = null;

      // Method 1: Environment variables (most reliable)
      clientApiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;

      // Method 2: Environment variables service (fallback)
      if (!clientApiKey) {
        try {
          const { environmentVariablesService } = await import('@/services/environmentVariablesService');
          clientApiKey = await environmentVariablesService.getOpenAIKey();
        } catch (envError) {
          console.warn('Environment variables service failed:', envError);
        }
      }

      // Method 3: Hardcoded fallback for testing (remove in production)
      if (!clientApiKey) {
        // For development/testing - this should be set via environment variables
        console.warn('⚠️ No API key found in environment variables, trying fallback...');

        // Check if we have a demo mode or testing key
        const demoKey = localStorage.getItem('demo_openai_key');
        if (demoKey) {
          clientApiKey = demoKey;
          console.log('🔧 Using demo/test API key from localStorage');
        }
      }

      if (!clientApiKey) {
        console.error('❌ No OpenAI API key found in any location');
        return {
          success: false,
          error: 'OpenAI API key not configured. Please set up your API key in the admin dashboard or environment variables.'
        };
      }

      console.log('✅ API key found:', clientApiKey.substring(0, 15) + '...');

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

      // Call OpenAI via Netlify function with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      console.log('📡 Making request to Netlify function...');
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
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let result;
      if (!response.ok) {
        let errorMessage = `OpenAI API call failed: ${response.status}`;
        let errorData = null;

        try {
          // Try to get error details from response
          errorData = await response.json();
          errorMessage += ` - ${errorData.error || errorData.message || 'Unknown error'}`;
        } catch (jsonError) {
          // If JSON parsing fails, use status only
          console.warn('Failed to parse error response JSON:', jsonError);
        }

        console.error('❌ Netlify function error:', errorMessage, errorData);

        // Try fallback generation for certain errors
        if (response.status === 401 || response.status === 403) {
          return {
            success: false,
            error: 'Invalid OpenAI API key. Please check your API key configuration.'
          };
        } else if (response.status === 429) {
          return {
            success: false,
            error: 'OpenAI rate limit exceeded. Please try again in a moment.'
          };
        } else if (response.status >= 500) {
          // Try direct fallback for server errors
          console.log('🔄 Trying fallback generation due to server error...');
          return await this.generateFallbackContent(request);
        }

        throw new Error(errorMessage);
      } else {
        result = await response.json();
      }

      if (!result.success || !result.content) {
        console.error('❌ Invalid response from OpenAI function:', result);

        // Try fallback if OpenAI response is invalid
        console.log('🔄 Trying fallback generation due to invalid response...');
        return await this.generateFallbackContent(request);
      }

      const content = result.content;

      // Process the generated content
      const title = this.extractTitle(content, request.keyword);
      const slug = this.generateSlug(title);
      const excerpt = this.extractExcerpt(content);
      
      // Insert the backlink naturally
      const contentWithLink = this.insertBacklink(content, request.anchorText, request.targetUrl);

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
   * Save blog post to storage
   */
  private static async saveBlogPost(blogData: any): Promise<string> {
    try {
      // Try to save to database first
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data, error } = await supabase
          .from('blog_posts')
          .insert(blogData)
          .select()
          .single();

        if (!error) {
          console.log('✅ Blog post saved to database');
          return `/blog/${blogData.slug}`;
        }
      }
    } catch (error) {
      console.warn('Database save failed, using localStorage fallback:', error);
    }

    // Fallback to localStorage
    console.log('📁 Using localStorage fallback');
    
    // Save individual blog post
    localStorage.setItem(`blog_post_${blogData.slug}`, JSON.stringify(blogData));
    
    // Update blog posts index
    const existingPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
    const newPostMeta = {
      slug: blogData.slug,
      title: blogData.title,
      created_at: blogData.created_at
    };
    
    existingPosts.unshift(newPostMeta);
    localStorage.setItem('all_blog_posts', JSON.stringify(existingPosts));

    return `/blog/${blogData.slug}`;
  }


}
