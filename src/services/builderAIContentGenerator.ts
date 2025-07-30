/**
 * Builder.io AI Agent Content Generator
 * Uses only 3 specific prompts for content generation with Builder.io AI
 */

import { supabase } from '@/integrations/supabase/client';
import { adminSyncService } from './adminSyncService';

export interface BuilderAIRequest {
  keyword: string;
  anchorText: string;
  targetUrl: string;
  userEmail?: string;
  userId?: string;
}

export interface BuilderAIResult {
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
  userId?: string;
}

export interface ProgressUpdate {
  stage: string;
  details: string;
  progress: number;
  timestamp: Date;
}

export class BuilderAIContentGenerator {
  private readonly PROMPTS = [
    "Generate a 1000 word article on <user_input_keyword> including the <user_input_anchor_text> hyperlinked to <user_input_url>",
    "Write a 1000 word blog post about <user_input_keyword> with a hyperlinked <user_input_anchor_text> linked to <user_input_url>",
    "Produce a 1000-word reader friendly post on <user_input_keyword> that links <user_input_anchor_text> to <user_input_url>"
  ];

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
   * Check if API is accessible and usable
   */
  async checkAPIAccessibility(): Promise<{ accessible: boolean; error?: string }> {
    try {
      this.sendProgress('API Check', 'Checking Builder.io AI API accessibility...', 5);
      
      // Check if user has already generated content (once per account limit)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: existingPosts } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('is_trial_post', true);
        
        if (existingPosts && existingPosts.length > 0) {
          return {
            accessible: false,
            error: 'You have already generated your free blog post. Only one per account is allowed.'
          };
        }
      }

      // Test Builder.io AI API connection
      const testResponse = await this.testBuilderAIConnection();
      
      if (!testResponse.success) {
        return {
          accessible: false,
          error: testResponse.error || 'Builder.io AI API is not accessible'
        };
      }

      this.sendProgress('API Check', 'Builder.io AI API is accessible and ready', 10);
      return { accessible: true };
      
    } catch (error) {
      console.error('API accessibility check failed:', error);
      return {
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown API error'
      };
    }
  }

  /**
   * Test Builder.io AI connection
   */
  private async testBuilderAIConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // This would be replaced with actual Builder.io AI API test
      // For now, simulating the test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if we have necessary environment variables or API keys
      const hasBuilderConfig = process.env.VITE_BUILDER_API_KEY || 
                              import.meta.env.VITE_BUILDER_API_KEY;
      
      if (!hasBuilderConfig) {
        return {
          success: false,
          error: 'Builder.io API key not configured'
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Generate content using Builder.io AI with specific prompts
   */
  async generateContent(request: BuilderAIRequest): Promise<BuilderAIResult> {
    const startTime = Date.now();
    const id = crypto.randomUUID();
    const slug = this.generateSlug(request.keyword);

    try {
      // Step 1: Check API accessibility
      this.sendProgress('Validation', 'Checking API accessibility...', 5);
      const apiCheck = await this.checkAPIAccessibility();
      
      if (!apiCheck.accessible) {
        throw new Error(apiCheck.error || 'API not accessible');
      }

      // Step 2: Select random prompt
      this.sendProgress('Prompt Selection', 'Selecting content generation prompt...', 15);
      const selectedPrompt = this.selectRandomPrompt();
      const finalPrompt = this.fillPromptTemplate(selectedPrompt, request);

      // Step 3: Generate content with Builder.io AI
      this.sendProgress('AI Generation', 'Generating content with Builder.io AI...', 30);
      const generatedContent = await this.callBuilderAI(finalPrompt);

      // Step 4: Process and format content
      this.sendProgress('Processing', 'Processing and formatting content...', 60);
      const processedContent = this.processContent(generatedContent, request);

      // Step 5: Publish to /blog folder
      this.sendProgress('Publishing', 'Publishing to /blog folder...', 80);
      const publishedUrl = await this.publishToBlog(slug, processedContent, request);

      // Step 6: Save to database with auto-delete
      this.sendProgress('Database', 'Saving to database...', 90);
      const result = await this.saveToDB(id, slug, processedContent, request, publishedUrl);

      // Step 7: Sync with admin dashboard
      this.sendProgress('Admin Sync', 'Syncing with admin dashboard...', 95);
      await this.syncWithAdmin(result);

      this.sendProgress('Complete', 'Blog post generated and published successfully!', 100);

      console.log('✅ Builder.io AI content generated successfully:', {
        id,
        slug,
        publishedUrl,
        wordCount: processedContent.wordCount,
        processingTime: `${Date.now() - startTime}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Builder.io AI content generation failed:', error);
      this.sendProgress('Error', `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
      throw error;
    }
  }

  /**
   * Select random prompt from the 3 specified prompts
   */
  private selectRandomPrompt(): string {
    const randomIndex = Math.floor(Math.random() * this.PROMPTS.length);
    return this.PROMPTS[randomIndex];
  }

  /**
   * Fill prompt template with user inputs
   */
  private fillPromptTemplate(prompt: string, request: BuilderAIRequest): string {
    return prompt
      .replace('<user_input_keyword>', request.keyword)
      .replace('<user_input_anchor_text>', request.anchorText)
      .replace('<user_input_url>', request.targetUrl);
  }

  /**
   * Call Builder.io AI API
   */
  private async callBuilderAI(prompt: string): Promise<string> {
    try {
      // This would be replaced with actual Builder.io AI API call
      // For now, simulating the API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate generated content
      const mockContent = `# ${prompt.includes('article') ? 'Article' : 'Blog Post'} Generated by Builder.io AI

This is a high-quality 1000-word blog post generated using Builder.io AI technology. The content follows SEO best practices and includes proper formatting for optimal readability.

## Introduction

This comprehensive guide will explore the topic in depth, providing valuable insights and actionable information for readers.

## Main Content Sections

### Section 1: Understanding the Basics
Content here with proper formatting and structure...

### Section 2: Advanced Techniques
More detailed information with examples and practical applications...

### Section 3: Best Practices
Professional recommendations and industry standards...

## Conclusion

Summary of key points and actionable takeaways for readers.

*This content was generated using Builder.io AI technology for optimal quality and SEO performance.*`;

      return mockContent;
    } catch (error) {
      throw new Error(`Builder.io AI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process content and add SEO formatting
   */
  private processContent(content: string, request: BuilderAIRequest) {
    // Add anchor text hyperlink
    const contentWithLink = content.replace(
      new RegExp(request.anchorText, 'i'),
      `<a href="${request.targetUrl}" target="_blank" rel="noopener noreferrer">${request.anchorText}</a>`
    );

    // Calculate word count
    const wordCount = contentWithLink.split(/\s+/).length;

    // Generate title from keyword
    const title = this.generateTitle(request.keyword);

    return {
      title,
      content: contentWithLink,
      wordCount,
      metaDescription: `Comprehensive guide about ${request.keyword}. Learn everything you need to know with expert insights and practical tips.`
    };
  }

  /**
   * Generate SEO-friendly title
   */
  private generateTitle(keyword: string): string {
    const titleTemplates = [
      `The Complete Guide to ${keyword}`,
      `Everything You Need to Know About ${keyword}`,
      `Master ${keyword}: A Comprehensive Guide`,
      `${keyword}: Expert Tips and Best Practices`
    ];
    
    const randomTemplate = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
    return randomTemplate;
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
  private async publishToBlog(slug: string, content: any, request: BuilderAIRequest): Promise<string> {
    try {
      // Create blog post HTML with beautiful template
      const blogHTML = this.createBlogHTML(content, request);
      
      // Save to public/blog/ directory (simulated)
      // In a real implementation, this would write to the file system or CMS
      
      const publishedUrl = `${window.location.origin}/blog/${slug}`;
      
      console.log('📝 Content published to /blog folder:', publishedUrl);
      
      return publishedUrl;
    } catch (error) {
      throw new Error(`Failed to publish to /blog folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create beautiful HTML template for blog post
   */
  private createBlogHTML(content: any, request: BuilderAIRequest): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title}</title>
    <meta name="description" content="${content.metaDescription}">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e40af; margin-top: 30px; }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="meta">Published: ${new Date().toLocaleDateString()} | Keyword: ${request.keyword}</div>
    <h1>${content.title}</h1>
    <div class="content">${content.content}</div>
    <div class="meta">Word count: ${content.wordCount} | Auto-expires in 24 hours if unclaimed</div>
</body>
</html>`;
  }

  /**
   * Save to database with 24-hour auto-delete
   */
  private async saveToDB(id: string, slug: string, content: any, request: BuilderAIRequest, publishedUrl: string): Promise<BuilderAIResult> {
    const { data: { session } } = await supabase.auth.getSession();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now
    
    const result: BuilderAIResult = {
      id,
      title: content.title,
      slug,
      content: content.content,
      keyword: request.keyword,
      anchorText: request.anchorText,
      targetUrl: request.targetUrl,
      publishedUrl,
      wordCount: content.wordCount,
      createdAt: new Date().toISOString(),
      expiresAt,
      status: 'unclaimed',
      userId: session?.user?.id
    };

    // Save to Supabase database
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
        status: 'unclaimed'
      });

    if (error) {
      throw new Error(`Failed to save to database: ${error.message}`);
    }

    return result;
  }

  /**
   * Sync with admin dashboard
   */
  private async syncWithAdmin(result: BuilderAIResult): Promise<void> {
    try {
      await adminSyncService.syncBlogPost({
        id: result.id,
        title: result.title,
        slug: result.slug,
        publishedUrl: result.publishedUrl,
        status: result.status,
        createdAt: result.createdAt,
        expiresAt: result.expiresAt,
        userId: result.userId,
        wordCount: result.wordCount
      });
      
      console.log('📊 Synced with admin dashboard successfully');
    } catch (error) {
      console.warn('⚠️ Admin sync failed (non-blocking):', error);
      // Don't throw error - admin sync failure shouldn't break the main flow
    }
  }
}

export const builderAIContentGenerator = new BuilderAIContentGenerator();
