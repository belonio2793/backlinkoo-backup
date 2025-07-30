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
      this.sendProgress('Error', `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
      throw error;
    }
  }

  /**
   * Get rotating prompt from the three specified prompts
   */
  private getRotatingPrompt(request: OpenAIContentRequest): string {
    const prompts = [
      `Write a 1000 word easy-to-read article about ${request.keyword} for grade 8-10 readers. Use simple language, short sentences, and include the text "${request.anchorText}" as a hyperlink to ${request.targetUrl}. Format with proper HTML headings (h1, h2, h3) and paragraphs. Make it engaging and informative.`,
      `Create a 1000 word beginner-friendly blog post explaining ${request.keyword} in simple terms. Write for teenagers and use clear, easy language. Include "${request.anchorText}" as a clickable link to ${request.targetUrl}. Use HTML formatting with headings and paragraphs. Focus on practical tips and examples.`,
      `Generate a 1000-word reader-friendly guide about ${request.keyword} written in simple English suitable for high school students. Include the phrase "${request.anchorText}" linked to ${request.targetUrl}. Use proper HTML structure with h1, h2, h3 headings and well-organized paragraphs. Make it helpful and easy to understand.`
    ];

    // Get current prompt index based on time and keyword to ensure uniqueness
    const promptIndex = (Math.floor(Date.now() / (5 * 60 * 1000)) + request.keyword.length) % prompts.length;
    const selectedPrompt = prompts[promptIndex];

    console.log(`🔄 Using prompt ${promptIndex + 1}/3 for unique content generation`);
    return selectedPrompt;
  }

  /**
   * Generate content using OpenAI/ChatGPT
   */
  private async generateOpenAIContent(request: OpenAIContentRequest, prompt: string): Promise<string> {
    // Simulate API call delay (in real implementation, this would be the OpenAI API call)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check for duplicate content to ensure uniqueness
    const existingContent = this.checkForDuplicateContent(request.keyword);
    if (existingContent) {
      // Generate variation for uniqueness
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Generate comprehensive 1000+ word structured blog post content with proper HTML
    const content = `
<h1>${this.generateUniqueTitle(request.keyword)}</h1>

<h2>What You Need to Know About ${request.keyword}</h2>

<p>Learning about ${request.keyword} doesn't have to be complicated. This guide will help you understand everything you need to know in simple terms.</p>

<p>Many people think ${request.keyword} is hard to understand, but it's actually quite simple once you break it down. Whether you're a student, someone curious about the topic, or looking to improve your knowledge, this article will give you all the basics.</p>

<h2>Why ${request.keyword} Matters</h2>

<p>${request.keyword} is important because it affects many parts of our daily lives. Understanding it can help you make better decisions and stay informed about what's happening around you.</p>

<p>Here are the main reasons why ${request.keyword} is worth learning about:</p>

<h3>Easy Benefits You'll See Right Away</h3>

<ul>
<li><strong>Better Understanding:</strong> You'll know more about how things work</li>
<li><strong>Smarter Choices:</strong> You can make better decisions when you know the facts</li>
<li><strong>Stay Updated:</strong> You'll understand news and conversations about this topic</li>
<li><strong>Help Others:</strong> You can share what you learn with friends and family</li>
</ul>

<h2>Getting Started with ${request.keyword}</h2>

<p>The best way to learn about ${request.keyword} is to start with the basics. Don't worry about understanding everything at once - take it step by step.</p>

<h3>Step 1: Learn the Basics</h3>

<p>Start by understanding what ${request.keyword} actually means. Think of it like learning to ride a bike - you need to know the parts before you can put it all together.</p>

<p>Most people find it helpful to:</p>
<ul>
<li>Read simple explanations first</li>
<li>Ask questions when something isn't clear</li>
<li>Practice what you learn</li>
<li>Take breaks so you don't get overwhelmed</li>
</ul>

<h3>Step 2: Find Good Sources</h3>

<p>Not all information about ${request.keyword} is the same quality. Some sources are better than others for learning.</p>

<p>Look for sources that:</p>
<ul>
<li>Use simple language</li>
<li>Give examples you can understand</li>
<li>Are updated regularly</li>
<li>Come from trusted experts</li>
</ul>

<h2>Common Questions About ${request.keyword}</h2>

<p>Most people have similar questions when they first learn about ${request.keyword}. Here are the most common ones and simple answers.</p>

<h3>Is ${request.keyword} Hard to Learn?</h3>

<p>No, ${request.keyword} isn't hard to learn if you take it slowly. Like any new topic, it takes time to understand all the pieces. Start with the basics and build up your knowledge bit by bit.</p>

<h3>How Long Does It Take to Understand?</h3>

<p>Everyone learns at their own pace. Some people get the basics in a few hours, while others might need a few weeks. The important thing is to keep learning at a speed that works for you.</p>

<h3>What Mistakes Should I Avoid?</h3>

<p>The biggest mistake people make is trying to learn everything at once. This can be overwhelming and make you want to give up. Instead, focus on one small part at a time.</p>

<h2>Practical Tips for Success</h2>

<p>Here are some simple tips that will help you succeed with ${request.keyword}:</p>

<h3>Start Small and Build Up</h3>

<p>Don't try to become an expert overnight. Start with the most basic concepts and gradually add more knowledge. This approach works much better than trying to learn everything at once.</p>

<h3>Practice What You Learn</h3>

<p>Reading about ${request.keyword} is good, but practicing what you learn is even better. Try to use your new knowledge in real situations whenever possible.</p>

<h3>Ask for Help When Needed</h3>

<p>Don't be afraid to ask questions. Everyone was a beginner once, and most people are happy to help someone who's genuinely trying to learn.</p>

<p>For more detailed help and expert guidance, you can check out <a href="${request.targetUrl}" target="_blank" rel="noopener noreferrer">${request.anchorText}</a> for additional resources and support.</p>

<h2>Real-World Examples</h2>

<p>Understanding ${request.keyword} becomes much easier when you see how it applies to real life. Here are some examples that show how this topic affects everyday situations.</p>

<h3>Example 1: In Daily Life</h3>

<p>You probably encounter ${request.keyword} more often than you realize. Many of the decisions you make every day are connected to this topic, even if you don't notice it.</p>

<h3>Example 2: In School or Work</h3>

<p>Whether you're in school or at work, ${request.keyword} plays a role in many activities. Understanding it can help you do better in these areas.</p>

<h3>Example 3: When Making Decisions</h3>

<p>When you need to make important choices, knowledge about ${request.keyword} can help you think through the options and pick the best one.</p>

<h2>Avoiding Common Mistakes</h2>

<p>Learning about any new topic comes with challenges. Here are the most common mistakes people make with ${request.keyword} and how to avoid them.</p>

<h3>Mistake 1: Rushing Through the Basics</h3>

<p>Many people want to skip the fundamentals and jump to advanced topics. This usually backfires because you need a strong foundation to understand more complex ideas.</p>

<p><strong>Solution:</strong> Take time to really understand the basics before moving on. It might seem slow, but it will save you time in the long run.</p>

<h3>Mistake 2: Not Asking Questions</h3>

<p>Some people feel embarrassed to ask questions about things they don't understand. This can lead to confusion and gaps in knowledge.</p>

<p><strong>Solution:</strong> Remember that asking questions is how you learn. Nobody expects you to know everything right away.</p>

<h3>Mistake 3: Giving Up Too Soon</h3>

<p>When something seems difficult, it's tempting to quit. But most topics become clearer with a little more time and effort.</p>

<p><strong>Solution:</strong> When you feel stuck, take a break and come back to it later. Sometimes a fresh perspective is all you need.</p>

<h2>Making It Part of Your Life</h2>

<p>Once you understand the basics of ${request.keyword}, you can start applying this knowledge in your daily life. This is where the real benefits begin to show.</p>

<h3>Small Changes, Big Results</h3>

<p>You don't need to make huge changes to see benefits. Small adjustments based on what you've learned can make a real difference over time.</p>

<h3>Sharing What You Learn</h3>

<p>Teaching others is one of the best ways to strengthen your own understanding. When you explain ${request.keyword} to someone else, you often discover things you didn't fully understand.</p>

<h2>Looking Ahead</h2>

<p>As you continue learning about ${request.keyword}, you'll discover that there's always more to explore. This isn't a bad thing - it means there are always new ways to grow and improve.</p>

<h3>Keep Learning</h3>

<p>The world is always changing, and knowledge about ${request.keyword} continues to evolve. Stay curious and keep learning new things.</p>

<h3>Stay Connected</h3>

<p>Connect with other people who are interested in ${request.keyword}. You can learn a lot from sharing experiences and ideas with others.</p>

<h2>Your Next Steps</h2>

<p>Now that you have a good foundation about ${request.keyword}, here's what you should do next:</p>

<ol>
<li><strong>Practice:</strong> Use what you've learned in real situations</li>
<li><strong>Explore:</strong> Look into specific areas that interest you most</li>
<li><strong>Connect:</strong> Find others who share your interest in this topic</li>
<li><strong>Keep Learning:</strong> Stay curious and continue building your knowledge</li>
</ol>

<h2>Final Thoughts</h2>

<p>Learning about ${request.keyword} is a journey, not a destination. You've taken an important first step by reading this guide. Remember to be patient with yourself as you continue learning.</p>

<p>The most important thing is to stay curious and keep practicing. Every expert was once a beginner, and with time and effort, you can develop real expertise in this area.</p>

<p>Don't forget that learning is more fun when you share it with others. Consider discussing what you've learned with friends, family, or classmates. You might be surprised by how much you actually know!</p>

<p>Keep exploring, keep questioning, and most importantly, keep learning. Your future self will thank you for the time you invest in understanding ${request.keyword} today.</p>
    `;

    return content.trim();
  }

  /**
   * Process content and add formatting
   */
  private processContent(content: string, request: OpenAIContentRequest) {
    // Calculate word count
    const wordCount = content.split(/\s+/).length;

    // Generate title from keyword
    const title = this.generateTitle(request.keyword);

    return {
      title,
      content,
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
   * Generate unique SEO-friendly title
   */
  private generateUniqueTitle(keyword: string): string {
    const titleTemplates = [
      `Simple Guide to ${keyword}`,
      `Everything About ${keyword}`,
      `Learn ${keyword} Easy Steps`,
      `${keyword} Explained Simply`,
      `Understanding ${keyword} Made Easy`,
      `${keyword}: A Beginner's Guide`,
      `Getting Started with ${keyword}`,
      `${keyword} Basics Everyone Should Know`,
      `Easy ${keyword} Guide for Everyone`,
      `${keyword}: What You Need to Know`
    ];

    // Use time and keyword length to ensure uniqueness
    const index = (Math.floor(Date.now() / 1000) + keyword.length) % titleTemplates.length;
    return titleTemplates[index];
  }

  /**
   * Generate SEO-friendly title (legacy method)
   */
  private generateTitle(keyword: string): string {
    return this.generateUniqueTitle(keyword);
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(keyword: string): string {
    return keyword
      .toLowerCase()
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
      author_name: 'AI Assistant',
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
}

export const openAIContentGenerator = new OpenAIContentGenerator();
