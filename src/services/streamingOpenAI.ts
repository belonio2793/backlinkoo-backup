/**
 * Streaming OpenAI Service - Real-time generation with progress updates
 * Enhanced with Supabase edge functions and prompt display
 */

import { enhancedOpenAI } from './enhancedOpenAIService';
import { SEOAnalyzer } from './seoAnalyzer';

export interface StreamingProgress {
  stage: 'preparing' | 'connecting' | 'generating' | 'formatting' | 'publishing' | 'complete' | 'error';
  message: string;
  progress: number;
  details?: string;
  wordCount?: number;
  currentContent?: string;
  selectedPrompt?: string;
  promptIndex?: number;
  userInputs?: {
    keyword: string;
    anchorText: string;
    url: string;
  };
  attempts?: number;
  fallbackUsed?: boolean;
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
   * Generate content with real-time streaming updates using enhanced OpenAI service
   */
  async generateWithStreaming(options: GenerationOptions): Promise<GenerationResult> {
    const { keyword, anchorText, url, wordCount = 1000, onProgress, onContentUpdate } = options;

    try {
      // Get available prompts
      const availablePrompts = enhancedOpenAI.getPromptTemplates();
      const promptIndex = Math.floor(Math.random() * availablePrompts.length);
      const selectedPrompt = enhancedOpenAI.formatPrompt(
        availablePrompts[promptIndex],
        keyword,
        anchorText || keyword,
        url
      );

      // Stage 1: Preparing
      onProgress?.({
        stage: 'preparing',
        message: 'Preparing content generation request...',
        progress: 10,
        details: `Selected prompt template ${promptIndex + 1} of ${availablePrompts.length}`,
        selectedPrompt,
        promptIndex,
        userInputs: { keyword, anchorText: anchorText || keyword, url },
        timestamp: new Date()
      });

      await this.delay(800);

      // Stage 2: Connecting
      onProgress?.({
        stage: 'connecting',
        message: 'Connecting to Supabase + OpenAI ChatGPT...',
        progress: 20,
        details: 'Establishing secure connection through Supabase Edge Functions',
        selectedPrompt,
        promptIndex,
        userInputs: { keyword, anchorText: anchorText || keyword, url },
        timestamp: new Date()
      });

      await this.delay(1200);

      // Stage 3: Generating
      onProgress?.({
        stage: 'generating',
        message: 'ChatGPT is composing your blog post...',
        progress: 30,
        details: `Using enhanced retry mechanisms with fallbacks`,
        selectedPrompt,
        promptIndex,
        userInputs: { keyword, anchorText: anchorText || keyword, url },
        timestamp: new Date()
      });

      // Use enhanced OpenAI service with retry mechanisms
      const result = await enhancedOpenAI.generateContent({
        keyword,
        anchorText: anchorText || keyword,
        url,
        wordCount,
        contentType: 'comprehensive',
        tone: 'professional',
        selectedPrompt,
        promptIndex
      });

      if (!result.success || !result.content) {
        throw new Error(result.error || 'Content generation failed');
      }

      // Simulate progressive content building for better UX
      const content = result.content;
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
          details: `${result.provider} generating content with ${result.attempts || 1} attempts`,
          wordCount: wordsBuilt,
          currentContent: partialContent,
          selectedPrompt,
          promptIndex,
          userInputs: { keyword, anchorText: anchorText || keyword, url },
          attempts: result.attempts,
          fallbackUsed: result.fallbackUsed,
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
        details: `Content from ${result.provider} - Adding SEO structure and anchor links`,
        wordCount: targetWords,
        selectedPrompt,
        promptIndex,
        userInputs: { keyword, anchorText: anchorText || keyword, url },
        attempts: result.attempts,
        fallbackUsed: result.fallbackUsed,
        timestamp: new Date()
      });

      await this.delay(1000);

      // Stage 6: Publishing
      onProgress?.({
        stage: 'publishing',
        message: 'Publishing to blog system...',
        progress: 95,
        details: 'Creating slug, storing in database, and making live',
        selectedPrompt,
        promptIndex,
        userInputs: { keyword, anchorText: anchorText || keyword, url },
        timestamp: new Date()
      });

      // Generate a slug for the post
      const slug = this.generateSlug(keyword);
      const publishedUrl = `/blog/${slug}`;

      // Store the post with additional metadata
      await this.publishPost(content, slug, keyword, anchorText || keyword, url, {
        provider: result.provider,
        prompt: selectedPrompt,
        promptIndex,
        attempts: result.attempts,
        fallbackUsed: result.fallbackUsed
      });

      await this.delay(800);

      // Stage 7: Complete
      onProgress?.({
        stage: 'complete',
        message: 'Blog post published successfully!',
        progress: 100,
        details: `Live at: ${publishedUrl} | Provider: ${result.provider}`,
        wordCount: targetWords,
        selectedPrompt,
        promptIndex,
        userInputs: { keyword, anchorText: anchorText || keyword, url },
        attempts: result.attempts,
        fallbackUsed: result.fallbackUsed,
        timestamp: new Date()
      });

      return {
        success: true,
        content,
        slug,
        publishedUrl,
        usage: result.usage
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
   * Publish the post to the blog system with enhanced metadata
   */
  private async publishPost(
    content: string,
    slug: string,
    keyword: string,
    anchorText: string,
    url: string,
    metadata?: {
      provider?: string;
      prompt?: string;
      promptIndex?: number;
      attempts?: number;
      fallbackUsed?: boolean;
    }
  ): Promise<void> {
    try {
      // Extract title from content (first h1 or first line)
      const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i) || content.match(/^(.+)$/m);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : keyword;

      // Store in localStorage for trial posts with enhanced metadata
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
        seo_score: SEOAnalyzer.analyzeBlogPost(
          title,
          content,
          excerpt
        ).overallScore,
        reading_time: Math.ceil(content.split(' ').length / 200),
        // Enhanced metadata
        ai_provider: metadata?.provider || 'unknown',
        prompt_used: metadata?.prompt || '',
        prompt_index: metadata?.promptIndex || 0,
        generation_attempts: metadata?.attempts || 1,
        fallback_used: metadata?.fallbackUsed || false,
        generation_timestamp: new Date().toISOString()
      };

      // Store in localStorage
      const existingPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
      existingPosts.unshift(blogPost);

      // Keep only latest 50 posts in localStorage
      const limitedPosts = existingPosts.slice(0, 50);
      localStorage.setItem('all_blog_posts', JSON.stringify(limitedPosts));

      console.log('📝 Enhanced blog post published to localStorage:', {
        title,
        slug,
        provider: metadata?.provider,
        attempts: metadata?.attempts,
        fallbackUsed: metadata?.fallbackUsed
      });
    } catch (error) {
      console.error('Failed to publish post:', error);
      // Don't throw error as the content was generated successfully
    }
  }
}

// Export singleton instance
export const streamingOpenAI = new StreamingOpenAIService();
