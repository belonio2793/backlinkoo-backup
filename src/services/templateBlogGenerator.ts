/**
 * Template-Based Blog Generation Service
 * Handles user queries with template placeholders and auto-generates content
 */

import { supabase } from '@/integrations/supabase/client';
import { OpenAIService } from './api/openai';
import { blogService } from './blogService';

export interface TemplateQuery {
  rawQuery: string;
  keyword: string;
  anchorText: string;
  url: string;
  wordCount?: number;
  additionalInstructions?: string;
}

export interface BlogGenerationMetadata {
  keyword: string;
  anchorText: string;
  targetUrl: string;
  template: string;
  wordCount: number;
  generationMethod: 'template' | 'manual';
  userQuery?: string;
}

export interface TemplateBlogResult {
  success: boolean;
  post?: {
    id: string;
    title: string;
    content: string;
    slug: string;
    publishedUrl: string;
    metadata: BlogGenerationMetadata;
  };
  error?: string;
  templateUsed?: string;
}

export class TemplateBlogGenerator {
  private openAIService: OpenAIService;
  
  // Predefined template patterns that match your requirements
  private readonly TEMPLATE_PATTERNS = [
    {
      pattern: /generate\s+a\s+(\d+)\s+word\s+blog\s+post\s+on\s+(.+?)\s+including\s+the\s+(.+?)\s+hyperlinked\s+to\s+(.+)/i,
      template: "Generate a {{wordCount}} word blog post on {{keyword}} including the {{anchorText}} hyperlinked to {{url}}"
    },
    {
      pattern: /write\s+a\s+(\d+)\s+word\s+blog\s+post\s+about\s+(.+?)\s+with\s+a\s+hyperlinked\s+(.+?)\s+linked\s+to\s+(.+)/i,
      template: "Write a {{wordCount}} word blog post about {{keyword}} with a hyperlinked {{anchorText}} linked to {{url}}"
    },
    {
      pattern: /produce\s+a\s+(\d+)[\-\s]*word\s+blog\s+post\s+on\s+(.+?)\s+that\s+links\s+(.+?)\s+to\s+(.+)/i,
      template: "Produce a {{wordCount}}-word blog post on {{keyword}} that links {{anchorText}} to {{url}}"
    },
    {
      pattern: /create\s+(.+?)\s+content\s+about\s+(.+?)\s+linking\s+(.+?)\s+to\s+(.+)/i,
      template: "Create {{wordCount}} word content about {{keyword}} linking {{anchorText}} to {{url}}"
    },
    {
      pattern: /blog\s+post\s+(.+?)\s+keyword[:\s]+(.+?)\s+anchor[:\s]+(.+?)\s+url[:\s]+(.+)/i,
      template: "Generate blog post about {{keyword}} with {{anchorText}} linking to {{url}}"
    }
  ];

  constructor() {
    this.openAIService = new OpenAIService();
  }

  /**
   * Parse a user query and extract template parameters
   */
  parseTemplateQuery(query: string): TemplateQuery | null {
    const cleanQuery = query.trim().toLowerCase();
    
    // Try each template pattern
    for (const templateDef of this.TEMPLATE_PATTERNS) {
      const match = cleanQuery.match(templateDef.pattern);
      if (match) {
        let wordCount, keyword, anchorText, url;
        
        // Extract based on pattern groups
        if (match.length >= 5) {
          [, wordCount, keyword, anchorText, url] = match;
        } else if (match.length >= 4) {
          [, keyword, anchorText, url] = match;
          wordCount = '1000'; // Default
        }

        // Clean up extracted values
        keyword = keyword?.trim().replace(/['"]/g, '') || '';
        anchorText = anchorText?.trim().replace(/['"]/g, '') || '';
        url = url?.trim().replace(/['"]/g, '') || '';
        
        // Validate URL format
        if (!this.isValidUrl(url)) {
          return null;
        }

        return {
          rawQuery: query,
          keyword,
          anchorText,
          url,
          wordCount: parseInt(wordCount) || 1000
        };
      }
    }

    // Try alternative parsing for flexible input formats
    return this.parseFlexibleQuery(query);
  }

  /**
   * Parse queries with flexible formats (keyword: value, anchor: text, url: link)
   */
  private parseFlexibleQuery(query: string): TemplateQuery | null {
    const keywordMatch = query.match(/keyword[:\s]+([^,\n]+)/i);
    const anchorMatch = query.match(/anchor[:\s]+([^,\n]+)/i);
    const urlMatch = query.match(/url[:\s]+([^,\s\n]+)/i);
    const wordMatch = query.match(/(\d+)\s*words?/i);

    if (keywordMatch && anchorMatch && urlMatch) {
      const keyword = keywordMatch[1].trim().replace(/['"]/g, '');
      const anchorText = anchorMatch[1].trim().replace(/['"]/g, '');
      const url = urlMatch[1].trim().replace(/['"]/g, '');
      
      if (this.isValidUrl(url)) {
        return {
          rawQuery: query,
          keyword,
          anchorText,
          url,
          wordCount: wordMatch ? parseInt(wordMatch[1]) : 1000
        };
      }
    }

    return null;
  }

  /**
   * Generate blog post from template query
   */
  async generateFromTemplate(templateQuery: TemplateQuery, userId?: string): Promise<TemplateBlogResult> {
    try {
      console.log('🎯 Starting template-based blog generation:', {
        keyword: templateQuery.keyword,
        anchorText: templateQuery.anchorText,
        url: templateQuery.url,
        wordCount: templateQuery.wordCount
      });

      // Create metadata for this generation
      const metadata: BlogGenerationMetadata = {
        keyword: templateQuery.keyword,
        anchorText: templateQuery.anchorText,
        targetUrl: templateQuery.url,
        template: templateQuery.rawQuery,
        wordCount: templateQuery.wordCount || 1000,
        generationMethod: 'template',
        userQuery: templateQuery.rawQuery
      };

      // Generate content using OpenAI
      const contentResult = await this.generateContentWithTemplate(templateQuery);

      if (!contentResult.success) {
        return {
          success: false,
          error: contentResult.error || 'Content generation failed'
        };
      }

      // Extract title from generated content or use enhanced metadata
      const title = contentResult.metadata?.title ||
                   this.extractTitle(contentResult.content) ||
                   this.generateFallbackTitle(templateQuery.keyword);
      
      // Create blog post
      const slug = this.generateSlug(title);
      const publishedUrl = `${window.location.origin}/blog/${slug}`;

      // Create blog post data using enhanced metadata when available
      const enhancedMetadata = contentResult.metadata;

      const blogPostData = {
        id: this.generateId(),
        title,
        content: contentResult.content,
        slug,
        meta_description: enhancedMetadata?.metaDescription || this.generateMetaDescription(contentResult.content, templateQuery.keyword),
        keywords: this.extractKeywords(templateQuery),
        target_url: templateQuery.url,
        anchor_text: templateQuery.anchorText,
        word_count: enhancedMetadata?.wordCount || this.countWords(contentResult.content),
        seo_score: enhancedMetadata?.seoScore || this.calculateSeoScore(contentResult.content, templateQuery),
        reading_time: enhancedMetadata?.readingTime || Math.ceil(this.countWords(contentResult.content) / 200),
        is_trial_post: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        user_id: userId,
        author_name: 'Backlink ∞',
        category: this.categorizeContent(templateQuery.keyword),
        tags: this.generateTags(templateQuery),
        published_url: publishedUrl,
        // Store template metadata
        template_metadata: {
          ...metadata,
          enhancedGeneration: !!enhancedMetadata,
          generationSource: enhancedMetadata ? 'template-netlify-function' : 'fallback-openai'
        }
      };

      // Save to localStorage for immediate availability
      await this.saveBlogPost(blogPostData);

      // Try to save to database if available
      if (userId) {
        await this.saveToDatabaseSafely(blogPostData, userId);
      }

      console.log('✅ Template blog generation completed successfully');

      return {
        success: true,
        post: {
          id: blogPostData.id,
          title: blogPostData.title,
          content: blogPostData.content,
          slug: blogPostData.slug,
          publishedUrl: blogPostData.published_url,
          metadata
        },
        templateUsed: templateQuery.rawQuery
      };

    } catch (error: any) {
      console.error('❌ Template blog generation failed:', error);
      return {
        success: false,
        error: error.message || 'Blog generation failed'
      };
    }
  }

  /**
   * Generate content using OpenAI with template-specific prompts
   */
  private async generateContentWithTemplate(templateQuery: TemplateQuery): Promise<{
    success: boolean;
    content: string;
    error?: string;
    metadata?: any;
  }> {
    try {
      console.log('🚀 Calling template blog generation Netlify function...');

      // Use dedicated template blog generation function
      const response = await fetch('/.netlify/functions/generate-template-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: templateQuery.keyword,
          anchorText: templateQuery.anchorText,
          targetUrl: templateQuery.url,
          wordCount: templateQuery.wordCount || 1000,
          template: templateQuery.rawQuery,
          userQuery: templateQuery.rawQuery
        })
      });

      if (!response.ok) {
        throw new Error(`Template generation failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.content) {
        return {
          success: false,
          content: '',
          error: result.error || 'Template generation failed'
        };
      }

      console.log('✅ Template blog generation successful');

      return {
        success: true,
        content: result.content,
        metadata: result.metadata
      };

    } catch (error: any) {
      console.error('❌ Template generation error:', error);

      // Fallback to the original OpenAI service if template function fails
      console.log('🔄 Falling back to original OpenAI service...');

      try {
        const enhancedPrompt = this.buildEnhancedPrompt(templateQuery);

        const result = await this.openAIService.generateContent(enhancedPrompt, {
          maxTokens: Math.min(4000, templateQuery.wordCount * 3),
          temperature: 0.7,
          systemPrompt: this.getSystemPrompt()
        });

        if (!result.success || !result.content) {
          return {
            success: false,
            content: '',
            error: result.error || 'Content generation failed'
          };
        }

        // Post-process the content to ensure proper formatting
        const processedContent = this.postProcessContent(result.content, templateQuery);

        return {
          success: true,
          content: processedContent
        };
      } catch (fallbackError: any) {
        return {
          success: false,
          content: '',
          error: fallbackError.message || 'Content generation error'
        };
      }
    }
  }

  /**
   * Build an enhanced prompt based on template query
   */
  private buildEnhancedPrompt(templateQuery: TemplateQuery): string {
    return `Create a comprehensive ${templateQuery.wordCount}-word blog post about "${templateQuery.keyword}" that naturally incorporates a contextual backlink.

SPECIFIC REQUIREMENTS:
- Primary topic: "${templateQuery.keyword}"
- Target word count: ${templateQuery.wordCount} words
- Include backlink: "${templateQuery.anchorText}" → ${templateQuery.url}
- Make the backlink placement natural and valuable to readers

CONTENT STRUCTURE:
1. Compelling H1 title featuring the keyword "${templateQuery.keyword}"
2. Engaging introduction (150-200 words)
3. 4-6 main sections with descriptive H2 headings
4. Practical, actionable content in each section
5. Natural integration of "${templateQuery.anchorText}" linking to ${templateQuery.url}
6. Strong conclusion with key takeaways

SEO OPTIMIZATION:
- Use "${templateQuery.keyword}" naturally throughout the content
- Include related keywords and semantic variations
- Add numbered lists, bullet points, and practical examples
- Ensure proper heading hierarchy (H1 > H2 > H3)

BACKLINK INTEGRATION:
- Place "${templateQuery.anchorText}" contextually within the content
- Ensure the link adds genuine value to the reader
- Make the anchor text flow naturally in the sentence
- Position the link where it most benefits the reader's understanding

FORMAT:
Return clean HTML with proper semantic structure:
- <h1> for main title
- <h2> for main sections  
- <h3> for subsections
- <p> for paragraphs
- <ul>/<ol> and <li> for lists
- <strong> for emphasis
- <a href="${templateQuery.url}" target="_blank" rel="noopener noreferrer">${templateQuery.anchorText}</a> for the backlink

Focus on creating genuinely helpful content that serves the reader while achieving SEO goals.`;
  }

  /**
   * Get system prompt for blog generation
   */
  private getSystemPrompt(): string {
    return `You are an expert SEO content writer specializing in creating high-quality, comprehensive blog posts that rank well in search engines. Your content is always original, valuable, and genuinely helpful to readers. You excel at natural backlink integration that adds value rather than appearing promotional. Focus on practical advice, step-by-step guidance, and actionable insights.`;
  }

  /**
   * Post-process generated content to ensure quality
   */
  private postProcessContent(content: string, templateQuery: TemplateQuery): string {
    let processed = content;

    // Ensure backlink is properly formatted if not already
    const backlinkRegex = new RegExp(templateQuery.anchorText, 'i');
    if (!processed.includes(`href="${templateQuery.url}"`)) {
      processed = processed.replace(
        backlinkRegex,
        `<a href="${templateQuery.url}" target="_blank" rel="noopener noreferrer">${templateQuery.anchorText}</a>`
      );
    }

    // Ensure proper HTML structure
    if (!processed.includes('<h1>')) {
      const titleMatch = processed.match(/^#+\s*(.+)$/m);
      if (titleMatch) {
        processed = processed.replace(titleMatch[0], `<h1>${titleMatch[1]}</h1>`);
      }
    }

    // Clean up and format HTML
    processed = processed
      .replace(/#{2}\s*(.+)/g, '<h2>$1</h2>')
      .replace(/#{3}\s*(.+)/g, '<h3>$1</h3>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h1-6]|<p|<ul|<ol)/gm, '<p>')
      .replace(/(?<!>)$/gm, '</p>');

    return processed;
  }

  /**
   * Utility methods
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private extractTitle(content: string): string | null {
    const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) return h1Match[1];

    const titleMatch = content.match(/^#+\s*(.+)$/m);
    if (titleMatch) return titleMatch[1];

    return null;
  }

  private generateFallbackTitle(keyword: string): string {
    return `The Complete Guide to ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private generateId(): string {
    return `blog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private countWords(content: string): number {
    return content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
  }

  private generateMetaDescription(content: string, keyword: string): string {
    const plainText = content.replace(/<[^>]*>/g, '');
    const words = plainText.split(/\s+/).slice(0, 25).join(' ');
    return `${words}... Learn more about ${keyword} in our comprehensive guide.`;
  }

  private extractKeywords(templateQuery: TemplateQuery): string[] {
    const keywords = [templateQuery.keyword];
    
    // Add variations and related terms
    const keywordWords = templateQuery.keyword.split(/\s+/);
    keywords.push(...keywordWords);
    
    if (templateQuery.anchorText !== templateQuery.keyword) {
      keywords.push(templateQuery.anchorText);
    }

    return [...new Set(keywords)];
  }

  private calculateSeoScore(content: string, templateQuery: TemplateQuery): number {
    let score = 70; // Base score

    // Check keyword presence
    const keywordCount = (content.match(new RegExp(templateQuery.keyword, 'gi')) || []).length;
    if (keywordCount >= 3) score += 10;
    if (keywordCount >= 5) score += 5;

    // Check structure
    if (content.includes('<h1>')) score += 5;
    if (content.includes('<h2>')) score += 5;
    if (content.includes('<ul>') || content.includes('<ol>')) score += 5;

    return Math.min(100, score);
  }

  private categorizeContent(keyword: string): string {
    const keyword_lower = keyword.toLowerCase();
    
    if (keyword_lower.includes('how to') || keyword_lower.includes('guide')) return 'Guides';
    if (keyword_lower.includes('best') || keyword_lower.includes('top')) return 'Reviews';
    if (keyword_lower.includes('tips') || keyword_lower.includes('advice')) return 'Tips';
    if (keyword_lower.includes('business') || keyword_lower.includes('marketing')) return 'Business';
    if (keyword_lower.includes('tech') || keyword_lower.includes('software')) return 'Technology';
    
    return 'General';
  }

  private generateTags(templateQuery: TemplateQuery): string[] {
    const tags = [templateQuery.keyword];
    
    // Add category-based tags
    const category = this.categorizeContent(templateQuery.keyword);
    tags.push(category.toLowerCase());
    
    // Add word-based tags
    templateQuery.keyword.split(/\s+/).forEach(word => {
      if (word.length > 3) tags.push(word);
    });

    return [...new Set(tags)].slice(0, 5);
  }

  private async saveBlogPost(blogPostData: any): Promise<void> {
    try {
      // Save to localStorage
      localStorage.setItem(`blog_post_${blogPostData.slug}`, JSON.stringify(blogPostData));
      
      // Update the blog posts index
      const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
      allBlogPosts.unshift({
        slug: blogPostData.slug,
        title: blogPostData.title,
        created_at: blogPostData.created_at
      });
      localStorage.setItem('all_blog_posts', JSON.stringify(allBlogPosts));

      console.log('✅ Blog post saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save blog post to localStorage:', error);
    }
  }

  private async saveToDatabaseSafely(blogPostData: any, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('published_blog_posts')
        .insert([{
          ...blogPostData,
          user_id: userId,
          status: 'published'
        }]);

      if (error) {
        console.warn('⚠️ Database save failed (not critical):', error.message);
      } else {
        console.log('✅ Blog post saved to database');
      }
    } catch (error) {
      console.warn('⚠️ Database save failed (not critical):', error);
    }
  }
}

export const templateBlogGenerator = new TemplateBlogGenerator();
