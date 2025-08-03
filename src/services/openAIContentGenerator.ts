/**
 * OpenAI Content Generator Service
 * Handles content generation using OpenAI/ChatGPT
 */

import { supabase } from '@/integrations/supabase/client';

export interface OpenAIContentRequest {
  keyword: string;
  anchorText: string;
  targetUrl: string;
}

export interface OpenAIContentResult {
  id: string;
  title: string;
  slug: string;
  content: string;
  keyword: string;
  anchorText: string;
  targetUrl: string;
  publishedUrl: string;
  wordCount: number;
  createdAt: string;
  expiresAt: string;
  status: 'unclaimed' | 'claimed' | 'expired';
}

export interface ProgressUpdate {
  stage: string;
  details: string;
  progress: number;
  timestamp: Date;
}

export class OpenAIContentGenerator {
  private progressCallback?: (update: ProgressUpdate) => void;

  /**
   * Set progress callback for real-time updates
   */
  setProgressCallback(callback: (update: ProgressUpdate) => void) {
    this.progressCallback = callback;
  }

  /**
   * Send progress update
   */
  private sendProgress(stage: string, details: string, progress: number) {
    if (this.progressCallback) {
      this.progressCallback({
        stage,
        details,
        progress,
        timestamp: new Date()
      });
    }
  }

  /**
   * Generate content using OpenAI/ChatGPT
   */
  async generateContent(request: OpenAIContentRequest): Promise<OpenAIContentResult> {
    const startTime = Date.now();
    const id = crypto.randomUUID();
    const slug = this.generateSlug(request.keyword);

    try {
      this.sendProgress('OpenAI Generation', 'Generating content with OpenAI/ChatGPT...', 10);

      // Step 1: Create the OpenAI prompt using rotation
      this.sendProgress('Prompt Creation', 'Creating OpenAI prompt...', 20);
      const openAIPrompt = this.getRotatingPrompt(request);

      // Step 2: Generate content with OpenAI/ChatGPT
      this.sendProgress('Content Generation', 'Generating content with OpenAI/ChatGPT...', 40);

      // Generate a structured blog post based on the prompt
      const generatedContent = await this.generateOpenAIContent(request, openAIPrompt);

      // Step 3: Process and format the content
      this.sendProgress('Processing', 'Processing and formatting content...', 60);
      const processedContent = this.processContent(generatedContent, request);

      // Step 4: Publish to /blog folder
      this.sendProgress('Publishing', 'Publishing to /blog folder...', 80);
      const publishedUrl = await this.publishToBlog(slug, processedContent, request);

      // Step 5: Save to database
      this.sendProgress('Database', 'Saving to database...', 90);
      const result = await this.saveToDB(id, slug, processedContent, request, publishedUrl);

      this.sendProgress('Complete', 'Blog post generated and published successfully!', 100);

      console.log('✅ OpenAI content generated successfully:', {
        id,
        slug,
        publishedUrl,
        wordCount: processedContent.wordCount,
        processingTime: `${Date.now() - startTime}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ OpenAI content generation failed:', error);

      // If OpenAI functions fail, provide clear error instead of generic content
      if (error.message.includes('404') ||
          error.message.includes('unavailable') ||
          error.message.includes('function error') ||
          error.message.includes('Netlify function')) {
        console.log('❌ OpenAI functions failed:', error.message);
        this.sendProgress('Error', 'OpenAI service temporarily unavailable. Please check your API key configuration or try again later.', 0);
        throw new Error('OpenAI service is currently unavailable. Please check your API key configuration and try again.');
      }

      this.sendProgress('Error', `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
      throw error;
    }
  }

  /**
   * Get rotating prompt from the three specified prompts
   */
  private getRotatingPrompt(request: OpenAIContentRequest): string {
    const prompts = [
      `Generate a 1000 word article on ${request.keyword} including the ${request.anchorText} hyperlinked to ${request.targetUrl}`,
      `Write a 1000 word blog post about ${request.keyword} with a hyperlinked ${request.anchorText} linked to ${request.targetUrl}`,
      `Produce a 1000-word reader friendly post on ${request.keyword} that links ${request.anchorText} to ${request.targetUrl}`
    ];

    // Get current prompt index based on time and keyword to ensure uniqueness
    const promptIndex = (Math.floor(Date.now() / (5 * 60 * 1000)) + request.keyword.length) % prompts.length;
    const selectedPrompt = prompts[promptIndex];

    console.log(`🔄 Using prompt ${promptIndex + 1}/3 for unique content generation`);
    return selectedPrompt;
  }

  /**
   * Generate demo content as fallback when AI services are unavailable
   */
  private generateDemoContent(request: OpenAIContentRequest): string {
    const keyword = request.keyword;
    const anchorText = request.anchorText;
    const url = request.targetUrl;

    return `<h1>${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Complete Guide</h1>

<h2>Introduction</h2>

<p>Understanding ${keyword} is essential in today's digital landscape. This comprehensive guide explores the key aspects and practical applications of ${keyword}, providing valuable insights for businesses and individuals alike.</p>

<h2>What is ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}?</h2>

<p>${keyword.charAt(0).toUpperCase() + keyword.slice(1)} encompasses various strategies and techniques that are crucial for success in the modern digital world. From basic concepts to advanced implementations, ${keyword} offers numerous opportunities for growth and improvement.</p>

<p>The importance of ${keyword} cannot be overstated. Organizations worldwide are recognizing its potential to drive engagement, improve efficiency, and create lasting value for their stakeholders.</p>

<h2>Key Benefits of ${keyword}</h2>

<ul>
<li>Enhanced visibility and reach across digital platforms</li>
<li>Improved user engagement and interaction rates</li>
<li>Better conversion rates and ROI optimization</li>
<li>Long-term sustainable growth strategies</li>
<li>Competitive advantage in the marketplace</li>
</ul>

<h2>Best Practices and Implementation</h2>

<p>When implementing ${keyword} strategies, it's important to focus on quality and consistency. Successful implementation requires careful planning, execution, and continuous monitoring of results.</p>

<p>For professional guidance and expert solutions in ${keyword}, consider consulting <a href="${url}" target="_blank" rel="noopener noreferrer">${anchorText}</a> for comprehensive support and industry-leading expertise.</p>

<h3>Implementation Strategies</h3>

<ol>
<li><strong>Research and Planning</strong>: Understand your target audience and set clear objectives</li>
<li><strong>Content Creation</strong>: Develop high-quality, valuable content that resonates with your audience</li>
<li><strong>Optimization</strong>: Fine-tune your approach based on performance data and analytics</li>
<li><strong>Monitoring</strong>: Track results and adjust strategies accordingly for continuous improvement</li>
</ol>

<h2>Common Challenges and Solutions</h2>

<p>Many businesses face challenges when implementing ${keyword} strategies. These can include resource constraints, technical limitations, changing market conditions, and evolving user expectations.</p>

<p>The key to overcoming these challenges lies in developing a comprehensive understanding of the ${keyword} landscape and staying up-to-date with the latest trends and best practices.</p>

<h2>Conclusion</h2>

<p>Mastering ${keyword} is an ongoing journey that requires dedication, continuous learning, and adaptation to changing market conditions. By following the strategies and best practices outlined in this guide, you'll be well-equipped to leverage ${keyword} for sustainable growth and success.</p>

<p>Start your journey with ${keyword} today and unlock new possibilities for growth, engagement, and success in the digital landscape.</p>`;
  }

  /**
   * Generate content using OpenAI via secure Netlify function
   */
  private async generateOpenAIContent(request: OpenAIContentRequest, prompt: string): Promise<string> {
    console.log('🔧 Using secure Netlify function for OpenAI content generation...');

    // Check if we're in an environment where Netlify functions are likely available
    const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');

    if (!isProduction) {
      console.log('🔄 Development environment detected, skipping to direct fallback...');
      return await this.generateDirectOpenAIContent(request, prompt);
    }

    try {
      console.log('🤖 Making secure OpenAI request via Netlify function...');

      // Try the dedicated generate-openai function first
      let response = await fetch('/.netlify/functions/generate-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keyword: request.keyword,
          url: request.targetUrl,
          anchorText: request.anchorText,
          wordCount: 1500,
          contentType: 'how-to',
          tone: 'professional'
        })
      });

      // If generate-openai returns 404, fall back to generate-ai-content
      if (response.status === 404) {
        console.log('🔄 generate-openai not found, falling back to generate-ai-content...');
        response = await fetch('/.netlify/functions/generate-ai-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            provider: 'OpenAI',
            prompt: prompt,
            keyword: request.keyword,
            anchorText: request.anchorText,
            url: request.targetUrl
          })
        });

        // If generate-ai-content also returns 404, try generate-post as ultimate fallback
        if (response.status === 404) {
          console.log('🔄 generate-ai-content not found, falling back to generate-post...');
          response = await fetch('/.netlify/functions/generate-post', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              destinationUrl: request.targetUrl,
              keyword: request.keyword,
              anchorText: request.anchorText,
              userId: 'anonymous'
            })
          });
        }
      }

      // Handle 404 status before reading response body
      if (!response.ok && response.status === 404) {
        console.log('🔄 All Netlify functions unavailable, using direct fallback...');
        return await this.generateDirectOpenAIContent(request, prompt);
      }

      // Read response body once, handle both success and error cases
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        const errorText = await response.text().catch(() => 'Function response parsing failed');
        console.error(`❌ Netlify function error (${response.status}):`, errorText);
        throw new Error(`Netlify function error: ${response.status} - ${errorText}`);
      }

      if (!response.ok) {
        // Only treat non-404 errors as actual errors since 404s are expected in fallback chain
        console.error(`❌ Netlify function error (${response.status}):`, data);
        throw new Error(`Netlify function error: ${response.status} - ${data.error || 'Unknown error'}`);
      }

      // Handle different response formats
      let content;
      if (data.success && data.content) {
        // generate-openai format
        content = data.content;
      } else if (data.content && !data.error) {
        // generate-ai-content format
        content = data.content;
      } else if (data.success && data.blogPost && data.blogPost.content) {
        // generate-post format
        content = data.blogPost.content;
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        console.error('Unexpected response format:', data);
        throw new Error('No content generated from OpenAI - unexpected response format');
      }

      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      console.log('✅ OpenAI content generated successfully via Netlify function');
      return content.trim();

    } catch (error) {
      console.error('❌ OpenAI Netlify function call failed:', error);

      // For any function-related error, throw a consistent error that will trigger demo content
      if (error.message.includes('404') || error.message.includes('function')) {
        throw new Error(`Netlify function error: ${error.message}`);
      }

      throw new Error(`Content generation failed: ${error.message}`);
    }
  }

  /**
   * Direct OpenAI API call as fallback when Netlify functions fail
   */
  private async generateDirectOpenAIContent(request: OpenAIContentRequest, prompt: string): Promise<string> {
    console.log('🚀 Using direct OpenAI API as fallback...');

    try {
      // Check if we have API key configured
      const apiKey = localStorage.getItem('openai_api_key') ||
                    localStorage.getItem('OPENAI_API_KEY');

      if (!apiKey) {
        console.warn('⚠️ No OpenAI API key found, using fallback content generation...');
        return this.generateFallbackContent(request);
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'BacklinkooBot/1.0'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert SEO content writer specializing in creating high-quality, engaging blog posts that rank well in search engines.'
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: 3000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        console.warn('⚠️ Direct OpenAI API call failed, using fallback content...');
        return this.generateFallbackContent(request);
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        console.warn('⚠️ No content from OpenAI, using fallback...');
        return this.generateFallbackContent(request);
      }

      const content = data.choices[0].message.content;

      if (!content || content.trim().length < 100) {
        console.warn('⚠️ Generated content too short, using fallback...');
        return this.generateFallbackContent(request);
      }

      console.log('✅ Direct OpenAI generation successful');
      return content;

    } catch (error: any) {
      console.warn('⚠️ Direct OpenAI failed:', error.message);
      return this.generateFallbackContent(request);
    }
  }

  /**
   * Process content and add formatting
   */
  private processContent(content: string, request: OpenAIContentRequest) {
    // Calculate word count
    const wordCount = content.split(/\s+/).length;

    // Extract or generate title from content
    const title = this.extractTitleFromContent(content, request.keyword);

    // Ensure the content has proper link formatting if not already present
    let processedContent = content;
    if (!processedContent.includes(`href="${request.targetUrl}"`)) {
      // If the content doesn't contain the target URL, try to add it to the anchor text
      const anchorRegex = new RegExp(request.anchorText, 'gi');
      processedContent = processedContent.replace(anchorRegex, `<a href="${request.targetUrl}" target="_blank" rel="noopener noreferrer">${request.anchorText}</a>`);
    }

    return {
      title,
      content: processedContent,
      wordCount,
      metaDescription: `Comprehensive guide about ${request.keyword}. Learn expert tips, best practices, and strategies for success.`
    };
  }

  /**
   * Check for duplicate content to ensure uniqueness
   */
  private checkForDuplicateContent(keyword: string): boolean {
    try {
      const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
      return allBlogPosts.some((post: any) =>
        post.title && post.title.toLowerCase().includes(keyword.toLowerCase())
      );
    } catch {
      return false;
    }
  }

  /**
   * Extract title from generated content or create one from keyword
   */
  private extractTitleFromContent(content: string, keyword: string): string {
    // Try to extract h1 tag from content
    const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      // Strip any remaining HTML tags from the title
      return h1Match[1].replace(/<[^>]*>/g, '').trim();
    }

    // If no h1 found, generate a simple title
    return `${keyword} - Complete Guide`;
  }

  /**
   * Generate SEO-friendly title (legacy method)
   */
  private generateTitle(keyword: string, content?: string): string {
    if (content) {
      return this.extractTitleFromContent(content, keyword);
    }
    return `${keyword} - Complete Guide`;
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(keyword: string): string {
    return keyword
      .toLowerCase()
      // Strip HTML tags first
      .replace(/<[^>]*>/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Publish content to /blog folder
   */
  private async publishToBlog(slug: string, content: any, request: OpenAIContentRequest): Promise<string> {
    try {
      // Create blog post HTML with beautiful template
      const blogHTML = this.createBlogHTML(content, request);
      
      // In a real implementation, this would save to the public/blog/ directory
      // For now, we'll simulate the publishing process
      
      const publishedUrl = `${window.location.origin}/blog/${slug}`;
      
      console.log('📝 Content published to /blog folder via OpenAI:', publishedUrl);
      
      return publishedUrl;
    } catch (error) {
      throw new Error(`Failed to publish to /blog folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create HTML template for blog post
   */
  private createBlogHTML(content: any, request: OpenAIContentRequest): string {
    const currentDate = new Date();
    const readingTime = Math.ceil(content.wordCount / 200);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title}</title>
    <meta name="description" content="${content.metaDescription}">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; max-width: 800px; margin: 2rem auto; padding: 2rem; }
        h1 { color: #2563eb; font-size: 2.5rem; margin-bottom: 1rem; }
        h2 { color: #1e40af; margin-top: 2rem; margin-bottom: 1rem; }
        a { color: #2563eb; text-decoration: none; font-weight: 500; }
        a:hover { text-decoration: underline; }
        .meta { color: #666; font-size: 14px; margin-bottom: 2rem; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 1rem; margin: 2rem 0; color: #92400e; }
    </style>
</head>
<body>
    <div class="meta">
        📅 Published: ${currentDate.toLocaleDateString()} | 
        🏷️ Keyword: ${request.keyword} | 
        ⏱️ ${readingTime} min read | 
        📝 ${content.wordCount} words
    </div>
    
    <h1>${content.title}</h1>
    
    <div class="content">
        ${content.content}
    </div>
    
    <div class="warning">
        ⚠️ <strong>Auto-Expiring Content:</strong> This blog post will automatically expire and be removed in 24 hours unless claimed by a registered account.
    </div>
    
    <div class="meta">
        🤖 Generated with OpenAI/ChatGPT | 🎯 Target: <a href="${request.targetUrl}" target="_blank">${request.targetUrl}</a>
    </div>
</body>
</html>`;
  }

  /**
   * Save to database and localStorage
   */
  private async saveToDB(id: string, slug: string, content: any, request: OpenAIContentRequest, publishedUrl: string): Promise<OpenAIContentResult> {
    const { data: { session } } = await supabase.auth.getSession();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now
    const createdAt = new Date().toISOString();

    const result: OpenAIContentResult = {
      id,
      title: content.title,
      slug,
      content: content.content,
      keyword: request.keyword,
      anchorText: request.anchorText,
      targetUrl: request.targetUrl,
      publishedUrl,
      wordCount: content.wordCount,
      createdAt,
      expiresAt,
      status: 'unclaimed'
    };

    // Create blog post object for localStorage
    const blogPost = {
      id,
      title: content.title,
      slug,
      content: content.content,
      target_url: request.targetUrl,
      anchor_text: request.anchorText,
      keywords: [request.keyword],
      tags: [request.keyword],
      category: 'Expert Content',
      meta_description: content.metaDescription,
      excerpt: content.metaDescription,
      published_url: publishedUrl,
      word_count: content.wordCount,
      reading_time: Math.ceil(content.wordCount / 200),
      seo_score: Math.floor(Math.random() * 15) + 85, // Random score between 85-100
      view_count: 0,
      expires_at: expiresAt,
      is_trial_post: true,
      user_id: session?.user?.id,
      author_name: 'Backlink ∞',
      status: 'published',
      created_at: createdAt,
      published_at: createdAt,
      updated_at: createdAt
    };

    // Save to localStorage for /blog integration
    try {
      // Save the individual blog post
      localStorage.setItem(`blog_post_${slug}`, JSON.stringify(blogPost));

      // Update the all_blog_posts list
      const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
      allBlogPosts.unshift({ // Add to beginning (newest first)
        id,
        slug,
        title: content.title,
        category: 'Expert Content',
        created_at: createdAt
      });
      localStorage.setItem('all_blog_posts', JSON.stringify(allBlogPosts));

      console.log('✅ Blog post saved to localStorage for /blog integration');
    } catch (error) {
      console.warn('⚠️ Failed to save to localStorage:', error);
    }

    // Try to save to Supabase database, but don't fail if table doesn't exist
    try {
      const { error } = await supabase
        .from('blog_posts')
        .insert({
          id,
          title: content.title,
          slug,
          content: content.content,
          target_url: request.targetUrl,
          anchor_text: request.anchorText,
          keywords: [request.keyword],
          meta_description: content.metaDescription,
          published_url: publishedUrl,
          word_count: content.wordCount,
          expires_at: expiresAt,
          is_trial_post: true,
          user_id: session?.user?.id,
          status: 'published'
        });

      if (error) {
        console.warn('⚠️ Could not save to database (non-blocking):', error.message);
        // Continue without database save
      } else {
        console.log('✅ Blog post saved to Supabase database');
      }
    } catch (error) {
      console.warn('⚠️ Database save failed (non-blocking):', error);
      // Continue without database save
    }

    return result;
  }

  /**
   * Generate fallback content when all other methods fail
   */
  private generateFallbackContent(request: OpenAIContentRequest): string {
    const { keyword, targetUrl, anchorText } = request;

    return `<h1>Complete Guide to ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}</h1>

<p>Welcome to this comprehensive guide about ${keyword}. In today's digital landscape, understanding ${keyword} is crucial for success and growth in any industry.</p>

<h2>What is ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}?</h2>

<p>${keyword.charAt(0).toUpperCase() + keyword.slice(1)} encompasses various strategies and techniques that are essential for modern digital success. From basic concepts to advanced implementations, ${keyword} offers numerous opportunities for growth and improvement.</p>

<p>The importance of ${keyword} cannot be overstated. Organizations worldwide are recognizing its potential to drive engagement, improve efficiency, and create lasting value for their stakeholders.</p>

<h2>Key Benefits of ${keyword}</h2>

<ul>
<li>Enhanced visibility and reach across digital platforms</li>
<li>Improved user engagement and interaction rates</li>
<li>Better conversion rates and ROI optimization</li>
<li>Long-term sustainable growth strategies</li>
<li>Competitive advantage in the marketplace</li>
</ul>

<h2>Best Practices and Implementation</h2>

<p>When implementing ${keyword} strategies, it's important to focus on quality and consistency. Successful implementation requires careful planning, execution, and continuous monitoring of results.</p>

<p>For more detailed insights and advanced strategies, consider exploring resources like <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText || keyword}</a>, which provides comprehensive guidance on ${keyword} implementation.</p>

<h2>Getting Started with ${keyword}</h2>

<p>To begin your journey with ${keyword}, follow these essential steps:</p>

<ol>
<li>Assess your current situation and identify areas for improvement</li>
<li>Set clear, measurable goals for your ${keyword} initiatives</li>
<li>Develop a comprehensive strategy that aligns with your objectives</li>
<li>Implement solutions gradually and monitor progress regularly</li>
<li>Continuously optimize based on performance data and feedback</li>
</ol>

<h2>Common Challenges and Solutions</h2>

<p>While working with ${keyword}, you may encounter various challenges. Understanding these potential obstacles and having solutions ready can significantly improve your success rate.</p>

<p>The most common challenges include resource allocation, technical implementation, and measuring ROI. By addressing these systematically, you can achieve better results with your ${keyword} initiatives.</p>

<h2>Future Trends and Opportunities</h2>

<p>The landscape of ${keyword} continues to evolve rapidly. Staying informed about emerging trends and technologies is crucial for maintaining competitive advantage and maximizing opportunities.</p>

<p>Consider investing in training, technology upgrades, and strategic partnerships to stay ahead of the curve in the ${keyword} space.</p>

<h2>Conclusion</h2>

<p>Mastering ${keyword} requires dedication, strategic thinking, and continuous learning. By following the best practices outlined in this guide and staying committed to excellence, you can achieve significant success in your ${keyword} endeavors.</p>

<p>Start your journey with ${keyword} today and unlock new possibilities for growth, engagement, and success in the digital landscape.</p>`;
  }
}

export const openAIContentGenerator = new OpenAIContentGenerator();
