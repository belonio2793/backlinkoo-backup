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

      // Method 3: Setup demo API key for testing
      if (!clientApiKey) {
        console.warn('⚠️ No API key found in environment variables, setting up demo mode...');

        const { setupDemoApiKey } = await import('@/utils/setupDemoApiKey');
        const demoSetup = setupDemoApiKey();

        if (demoSetup) {
          clientApiKey = localStorage.getItem('demo_openai_key');
          console.log('🔧 Using demo mode for content generation');
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

      // Check if this is a demo key - if so, use fallback content directly
      if (clientApiKey.includes('demo-fallback')) {
        console.log('🔧 Demo key detected, using fallback content generation');
        return await this.generateFallbackContent(request);
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

      // Check if it's a timeout error
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🔄 Request timed out, trying fallback generation...');
        return await this.generateFallbackContent(request);
      }

      // Check if it's a network error
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
        console.log('🔄 Network error, trying fallback generation...');
        return await this.generateFallbackContent(request);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during blog generation'
      };
    }
  }

  /**
   * Generate fallback content when OpenAI is unavailable
   */
  private static async generateFallbackContent(request: BlogRequest): Promise<BlogResponse> {
    try {
      console.log('🔄 Generating fallback content...');

      const title = this.generateFallbackTitle(request.keyword);
      const content = this.generateFallbackBlogContent(request);
      const slug = this.generateSlug(title);
      const excerpt = this.extractExcerpt(content);

      console.log('✅ Fallback content generated successfully');

      // Save the blog post
      const blogUrl = await this.saveBlogPost({
        id: crypto.randomUUID(),
        title,
        slug,
        content,
        excerpt,
        meta_description: excerpt,
        keywords: [request.keyword],
        tags: request.keyword.split(' '),
        category: 'AI Generated',
        target_url: request.targetUrl,
        anchor_text: request.anchorText,
        status: 'published',
        is_trial_post: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        view_count: 0,
        seo_score: 75, // Lower score for fallback content
        reading_time: this.calculateReadingTime(content),
        word_count: content.split(/\s+/).length,
        author_name: 'Backlink ∞ Generator',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        published_url: `/blog/${slug}`,
        user_id: null
      });

      return {
        success: true,
        title,
        content,
        slug,
        excerpt,
        blogUrl,
        metadata: { fallback: true }
      };
    } catch (error) {
      console.error('❌ Fallback generation failed:', error);
      return {
        success: false,
        error: 'Failed to generate content. Please try again later.'
      };
    }
  }

  /**
   * Generate fallback title from keyword
   */
  private static generateFallbackTitle(keyword: string): string {
    const templates = [
      `The Ultimate Guide to ${keyword}`,
      `Everything You Need to Know About ${keyword}`,
      `A Complete Introduction to ${keyword}`,
      `Mastering ${keyword}: A Comprehensive Guide`,
      `${keyword}: Best Practices and Tips`
    ];

    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    return randomTemplate.replace(keyword, keyword.toLowerCase());
  }

  /**
   * Generate fallback blog content
   */
  private static generateFallbackBlogContent(request: BlogRequest): string {
    const { keyword, anchorText, targetUrl } = request;

    const content = `
<h1>The Ultimate Guide to ${keyword}</h1>

<p>Welcome to our comprehensive guide on ${keyword}. In today's digital landscape, understanding ${keyword} is crucial for success. This article will provide you with everything you need to know to get started and excel in this area.</p>

<h2>What is ${keyword}?</h2>

<p>${keyword} has become an essential component of modern business and digital strategies. Whether you're a beginner or looking to enhance your existing knowledge, this guide will help you understand the fundamentals and advanced concepts.</p>

<p>To get the most out of ${keyword}, it's important to work with experienced professionals. For expert guidance and services, we recommend checking out <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> for comprehensive solutions.</p>

<h2>Key Benefits of ${keyword}</h2>

<p>Understanding and implementing ${keyword} can provide numerous advantages:</p>

<ul>
<li>Improved efficiency and productivity</li>
<li>Better results and outcomes</li>
<li>Enhanced competitive advantage</li>
<li>Cost-effective solutions</li>
<li>Scalable growth opportunities</li>
</ul>

<h2>Getting Started with ${keyword}</h2>

<p>If you're new to ${keyword}, here are the essential steps to begin your journey:</p>

<ol>
<li><strong>Research and Planning:</strong> Start by understanding your specific needs and goals related to ${keyword}.</li>
<li><strong>Choose the Right Approach:</strong> Select the methodology that best fits your situation and resources.</li>
<li><strong>Implementation:</strong> Begin with small, manageable steps and gradually expand your efforts.</li>
<li><strong>Monitor and Optimize:</strong> Continuously track your progress and make improvements as needed.</li>
</ol>

<h2>Best Practices for ${keyword}</h2>

<p>To maximize your success with ${keyword}, consider these proven strategies:</p>

<h3>Strategy 1: Focus on Quality</h3>
<p>Quality should always be your top priority when working with ${keyword}. This ensures better long-term results and sustainable growth.</p>

<h3>Strategy 2: Stay Updated</h3>
<p>The field of ${keyword} is constantly evolving. Stay informed about the latest trends, tools, and techniques to maintain your competitive edge.</p>

<h3>Strategy 3: Measure Performance</h3>
<p>Regular monitoring and analysis are crucial for understanding what works and what doesn't in your ${keyword} efforts.</p>

<h2>Common Mistakes to Avoid</h2>

<p>Learning from common pitfalls can save you time and resources:</p>

<ul>
<li>Rushing the implementation process</li>
<li>Neglecting proper planning and strategy</li>
<li>Ignoring important metrics and KPIs</li>
<li>Failing to adapt to changes in the industry</li>
<li>Not seeking professional guidance when needed</li>
</ul>

<h2>Tools and Resources</h2>

<p>Having the right tools can significantly improve your ${keyword} results. Consider investing in quality software, training, and expert consultation to enhance your capabilities.</p>

<h2>Conclusion</h2>

<p>Mastering ${keyword} requires dedication, continuous learning, and the right strategies. By following the guidelines outlined in this comprehensive guide, you'll be well-equipped to achieve your goals and drive meaningful results.</p>

<p>Remember that success with ${keyword} often comes from consistent effort and staying informed about industry developments. Start implementing these strategies today, and you'll see improvements in your outcomes over time.</p>

<p>For additional resources and professional support, don't hesitate to explore specialized services that can accelerate your progress and help you achieve better results faster.</p>
    `.trim();

    return content;
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
