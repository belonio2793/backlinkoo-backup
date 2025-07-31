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

      // Try calling OpenAI via Netlify function, with fallback
      let content = '';

      try {
        const response = await fetch('/.netlify/functions/generate-content-openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            maxTokens: 2500,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API call failed: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !result.content) {
          throw new Error(result.error || 'Failed to generate content');
        }

        content = result.content;

      } catch (fetchError) {
        console.warn('Netlify function call failed, using fallback content generation:', fetchError.message);

        // Generate fallback content
        content = this.generateFallbackContent(request);
      }

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

  /**
   * Generate fallback content when AI services are unavailable
   */
  private static generateFallbackContent(request: BlogRequest): string {
    const { keyword, anchorText, targetUrl } = request;

    return `The Complete Guide to ${keyword}

Welcome to our comprehensive guide on ${keyword}. This article will provide you with valuable insights and practical information to help you understand this important topic.

Introduction

Understanding ${keyword} is crucial in today's digital landscape. Whether you're a beginner or looking to expand your knowledge, this guide will walk you through the essential concepts and best practices.

What You Need to Know About ${keyword}

${keyword} plays a vital role in many aspects of business and technology. Let's explore the key components that make this topic so important.

Key Benefits:
- Improved efficiency and productivity
- Better decision-making capabilities
- Enhanced user experience
- Cost-effective solutions
- Scalable implementation

Best Practices

When working with ${keyword}, it's important to follow industry best practices. Here are some essential guidelines to consider:

1. Research and Planning: Always start with thorough research to understand your specific needs and goals.

2. Implementation Strategy: Develop a clear implementation strategy that aligns with your objectives.

3. Continuous Monitoring: Regularly monitor performance and make adjustments as needed.

4. Stay Updated: Keep up with the latest trends and developments in the field.

Getting Started

To begin your journey with ${keyword}, consider these initial steps:

Step 1: Assessment - Evaluate your current situation and identify areas for improvement.

Step 2: Goal Setting - Define clear, measurable goals that align with your objectives.

Step 3: Resource Planning - Determine what resources you'll need and create a realistic timeline.

Advanced Techniques

For those looking to take their understanding of ${keyword} to the next level, consider exploring advanced techniques and strategies. Professional guidance can be invaluable in this process.

For expert assistance and additional resources, consider consulting with ${anchorText}. They offer specialized knowledge and proven solutions that can help you achieve your goals more effectively.

Common Challenges and Solutions

Every implementation of ${keyword} comes with its own set of challenges. Here are some common issues and their solutions:

Challenge 1: Resource Constraints
Solution: Prioritize high-impact activities and consider phased implementation.

Challenge 2: Technical Complexity
Solution: Invest in proper training and consider working with experienced professionals.

Challenge 3: Change Management
Solution: Develop a comprehensive change management strategy that includes stakeholder buy-in.

Measuring Success

To ensure your ${keyword} implementation is successful, establish key performance indicators (KPIs) and regularly measure progress. Important metrics to consider include performance improvements, cost savings, user satisfaction, return on investment, and long-term sustainability.

Future Trends

The field of ${keyword} continues to evolve rapidly. Stay ahead of the curve by keeping an eye on emerging trends and technologies that could impact your implementation.

Conclusion

Mastering ${keyword} requires dedication, continuous learning, and the right approach. By following the guidelines and best practices outlined in this guide, you'll be well-equipped to achieve success in your endeavors.

Remember that professional guidance can make a significant difference in your results. Don't hesitate to seek expert advice when needed to ensure you're making the most of your investment in ${keyword}.

Whether you're just getting started or looking to optimize your existing approach, the principles discussed in this guide will serve as a solid foundation for your success.`;
  }
}
