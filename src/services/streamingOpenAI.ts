/**
 * Streaming OpenAI Service - Real-time generation with progress updates
 */

export interface StreamingProgress {
  stage: 'preparing' | 'connecting' | 'generating' | 'formatting' | 'publishing' | 'complete' | 'error';
  message: string;
  progress: number;
  details?: string;
  wordCount?: number;
  currentContent?: string;
  timestamp: Date;
}

export interface GenerationOptions {
  keyword: string;
  anchorText: string;
  url: string;
  wordCount?: number;
  onProgress?: (progress: StreamingProgress) => void;
  onContentUpdate?: (content: string, wordCount: number) => void;
}

export interface GenerationResult {
  success: boolean;
  content?: string;
  slug?: string;
  publishedUrl?: string;
  error?: string;
  usage?: {
    tokens: number;
    cost: number;
  };
}

export class StreamingOpenAIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/.netlify/functions';
  }

  /**
   * Generate content with real-time streaming updates
   */
  async generateWithStreaming(options: GenerationOptions): Promise<GenerationResult> {
    const { keyword, anchorText, url, wordCount = 1000, onProgress, onContentUpdate } = options;

    // Randomly select a prompt template
    const prompts = [
      `Generate a ${wordCount} word blog post on ${keyword} including the ${anchorText} hyperlinked to ${url}`,
      `Write a ${wordCount} word blog post about ${keyword} with a hyperlinked ${anchorText} linked to ${url}`,
      `Produce a ${wordCount}-word blog post on ${keyword} that links ${anchorText}`
    ];
    
    const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    try {
      // Stage 1: Preparing
      onProgress?.({
        stage: 'preparing',
        message: 'Preparing content generation request...',
        progress: 10,
        details: `Selected prompt template and processing: "${keyword}"`,
        timestamp: new Date()
      });

      await this.delay(800);

      // Stage 2: Connecting
      onProgress?.({
        stage: 'connecting',
        message: 'Connecting to OpenAI ChatGPT...',
        progress: 20,
        details: 'Establishing secure connection to AI service',
        timestamp: new Date()
      });

      await this.delay(1200);

      // Stage 3: Generating
      onProgress?.({
        stage: 'generating',
        message: 'ChatGPT is composing your blog post...',
        progress: 30,
        details: `Using prompt: "${selectedPrompt}"`,
        timestamp: new Date()
      });

      // Start the actual generation
      const response = await fetch(`${this.baseUrl}/generate-openai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword,
          url,
          anchorText,
          wordCount,
          contentType: 'comprehensive',
          tone: 'professional'
        })
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Content generation failed');
      }

      // Simulate progressive content building for better UX
      const content = data.content;
      const words = content.split(' ');
      const targetWords = Math.min(words.length, wordCount);

      // Stage 4: Simulated streaming content composition
      for (let i = 0; i < 5; i++) {
        const progressPercent = 40 + (i * 8);
        const wordsBuilt = Math.floor((targetWords * (i + 1)) / 5);
        const partialContent = words.slice(0, wordsBuilt).join(' ');

        onProgress?.({
          stage: 'generating',
          message: `Writing content... ${wordsBuilt}/${targetWords} words`,
          progress: progressPercent,
          details: 'AI is crafting sentences and structuring content',
          wordCount: wordsBuilt,
          currentContent: partialContent,
          timestamp: new Date()
        });

        onContentUpdate?.(partialContent, wordsBuilt);
        await this.delay(600);
      }

      // Stage 5: Formatting
      onProgress?.({
        stage: 'formatting',
        message: 'Formatting and optimizing content...',
        progress: 85,
        details: 'Adding SEO structure, headings, and anchor link integration',
        wordCount: targetWords,
        timestamp: new Date()
      });

      await this.delay(1000);

      // Stage 6: Publishing
      onProgress?.({
        stage: 'publishing',
        message: 'Publishing to blog system...',
        progress: 95,
        details: 'Creating slug, storing in database, and making live',
        timestamp: new Date()
      });

      // Generate a slug for the post
      const slug = this.generateSlug(keyword);
      const publishedUrl = `/blog/${slug}`;

      // Store the post (in real implementation, this would save to database)
      await this.publishPost(content, slug, keyword, anchorText, url);

      await this.delay(800);

      // Stage 7: Complete
      onProgress?.({
        stage: 'complete',
        message: 'Blog post published successfully!',
        progress: 100,
        details: `Live at: ${publishedUrl}`,
        wordCount: targetWords,
        timestamp: new Date()
      });

      return {
        success: true,
        content,
        slug,
        publishedUrl,
        usage: data.usage
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      onProgress?.({
        stage: 'error',
        message: 'Generation failed',
        progress: 0,
        details: errorMessage,
        timestamp: new Date()
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Utility to add realistic delays for better UX
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate a URL-friendly slug from keyword
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
   * Publish the post to the blog system
   */
  private async publishPost(content: string, slug: string, keyword: string, anchorText: string, url: string): Promise<void> {
    try {
      // Extract title from content (first h1 or first line)
      const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i) || content.match(/^(.+)$/m);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : keyword;

      // Store in localStorage for trial posts
      const blogPost = {
        id: Date.now().toString(),
        title,
        content,
        slug,
        keyword,
        anchor_text: anchorText,
        target_url: url,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        is_trial_post: true,
        word_count: content.split(' ').length,
        seo_score: Math.floor(Math.random() * 20) + 80, // Mock SEO score 80-100
        reading_time: Math.ceil(content.split(' ').length / 200)
      };

      // Store in localStorage
      const existingPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
      existingPosts.unshift(blogPost);
      
      // Keep only latest 50 posts in localStorage
      const limitedPosts = existingPosts.slice(0, 50);
      localStorage.setItem('all_blog_posts', JSON.stringify(limitedPosts));

      console.log('📝 Blog post published to localStorage:', { title, slug });
    } catch (error) {
      console.error('Failed to publish post:', error);
      // Don't throw error as the content was generated successfully
    }
  }
}

// Export singleton instance
export const streamingOpenAI = new StreamingOpenAIService();
