/**
 * Direct OpenAI Service for Blog Generation
 * Simplified service that directly calls OpenAI without complex templates
 */

import { LocalDevAPI } from '@/services/localDevAPI';
import { environmentVariablesService } from '@/services/environmentVariablesService';
import { blogService } from '@/services/blogService';

interface BlogRequest {
  keyword: string;
  anchorText: string;
  targetUrl: string;
  tone?: string;
  length?: string;
  industry?: string;
  additionalInstructions?: string;
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
   * Generate blog post using direct OpenAI API call or local dev API
   */
  static async generateBlogPost(request: BlogRequest): Promise<BlogResponse> {
    try {
      console.log('🚀 Starting direct blog generation...');

      // Check if we should use local dev API
      if (LocalDevAPI.shouldUseMockAPI()) {
        console.log('🧪 Using local development API...');
        return await this.generateWithLocalAPI(request);
      }

      // Check if OpenAI API key is configured (but allow Netlify functions to handle it)
      const clientApiKey = await environmentVariablesService.getOpenAIKey();

      // Don't fail if no local API key - Netlify functions might have it configured
      console.log('🔑 Local API key check:', clientApiKey ? 'Found' : 'Not found (will try Netlify function)');

      // Build the prompt dynamically with enhanced parameters
      const toneMap = {
        'professional': 'professional and authoritative',
        'conversational': 'conversational and friendly',
        'technical': 'technical and detailed',
        'casual': 'casual and engaging',
        'persuasive': 'persuasive and action-oriented'
      };

      const lengthMap = {
        'short': '500-800 words',
        'medium': '800-1200 words',
        'long': '1200-1800 words',
        'comprehensive': '1800+ words'
      };

      const targetTone = toneMap[request.tone || 'professional'] || 'professional and engaging';
      const targetLength = lengthMap[request.length || 'medium'] || '800-1200 words';

      // Use enhanced query patterns for superior content generation
      const eliteQueryPatterns = [
        `Create an authoritative ${targetLength} expert guide on ${request.keyword} that naturally integrates ${request.anchorText} as a valuable resource linking to ${request.targetUrl}`,
        `Write a comprehensive ${targetLength} industry-leading analysis of ${request.keyword} featuring ${request.anchorText} as a strategic reference to ${request.targetUrl}`,
        `Develop a ${targetLength} thought leadership piece on ${request.keyword} that seamlessly incorporates ${request.anchorText} directing readers to ${request.targetUrl}`
      ];

      const selectedPattern = eliteQueryPatterns[Math.floor(Math.random() * eliteQueryPatterns.length)];
      console.log('🚀 Selected elite query pattern:', selectedPattern);

      let prompt = `${selectedPattern}

🎯 CONTENT EXCELLENCE FRAMEWORK:
Create premium, viral-worthy content that positions this as the definitive resource on "${request.keyword}". This should be content that industry experts bookmark and reference.

📊 AUTHORITY REQUIREMENTS:
- Write ${targetLength} of expert-level, research-backed content
- Include 3-5 specific data points, statistics, or case studies
- Demonstrate deep subject matter expertise throughout
- Use ${targetTone} tone while maintaining authoritative credibility
- Create content that drives social shares and backlinks naturally
- Strategic placement of "${request.anchorText}" linking to ${request.targetUrl} where it adds maximum value

🏗️ PREMIUM STRUCTURE:
- Compelling H1 that promises specific, valuable outcomes
- Hook introduction with surprising insight or provocative question
- 4-6 main sections (H2) that each solve specific problems
- Actionable H3 subsections with concrete examples
- Natural integration of "${request.anchorText}" → ${request.targetUrl}
- Powerful conclusion with clear next steps

🚀 ENGAGEMENT OPTIMIZATION:
- Open with a statistic or insight that challenges conventional thinking
- Include numbered frameworks, step-by-step processes, or checklists
- Use psychological triggers and persuasive writing techniques
- Add transition phrases that maintain reading momentum
- Include rhetorical questions that increase engagement
- End sections with compelling hooks to continue reading`;

      if (request.industry) {
        prompt += `\n- Focus on ${request.industry} industry context and examples`;
      }

      if (request.additionalInstructions) {
        prompt += `\n- Additional requirements: ${request.additionalInstructions}`;
      }

      prompt += `

💻 ENHANCED OUTPUT FORMAT:
Return the content as well-structured HTML using semantic tags:
- <h1> for the main title (include primary keyword "${request.keyword}")
- <h2> for major sections with compelling, benefit-driven headlines
- <h3> for subsections and detailed breakdowns
- <p> for paragraphs with proper spacing and flow
- <ul>/<ol> and <li> for actionable lists and frameworks
- <strong> for key concepts and important phrases
- <em> for emphasis and transitional elements
- <blockquote> for highlighted insights, quotes, or key takeaways
- <a href="${request.targetUrl}" target="_blank" rel="noopener noreferrer">${request.anchorText}</a> for the strategic backlink

🎨 CONTENT EXCELLENCE STANDARDS:
- Every paragraph must provide immediate value
- Use specific examples and real-world applications
- Include actionable advice readers can implement today
- Write with confidence and authoritative expertise
- Create content that feels like a conversation with an industry leader
- Ensure the backlink enhances rather than interrupts the user experience

📈 SEO & VIRALITY OPTIMIZATION:
- Naturally incorporate "${request.keyword}" throughout the content
- Use semantic keywords and related industry terminology
- Create scannable content with clear visual hierarchy
- Include social proof elements and credibility indicators
- Write headlines that make readers want to share
- End with a compelling call-to-action that drives engagement

Generate content so valuable that readers feel they've discovered insider knowledge. This should be the kind of post that gets saved, shared, and referenced by industry professionals.`;

      console.log('🎯 Enhanced prompt:', prompt.substring(0, 200) + '...');

      console.log('📝 Generated prompt:', prompt);

      // Call OpenAI via Netlify function
      console.log('🚀 Calling OpenAI Netlify function...');
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
          contentType: 'blog-post',
          tone: 'professional',
          apiKey: clientApiKey || null // Pass API key or let Netlify function use its configured key
        })
      });

      // Read response body once and handle both success and error cases
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        throw new Error(`OpenAI API call failed: ${response.status} - Unable to parse response`);
      }

      if (!response.ok) {
        const errorMessage = `OpenAI API call failed: ${response.status} - ${result.error || 'Unknown error'}`;
        throw new Error(errorMessage);
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

      // Save to blog posts using blog service (no manual ID setting)
      const blogData = {
        title,
        content: contentWithLink,
        targetUrl: request.targetUrl,
        anchorText: request.anchorText,
        wordCount: contentWithLink.split(/\s+/).length,
        readingTime: this.calculateReadingTime(contentWithLink),
        seoScore: 85,
        customSlug: slug
      };

      // Save the blog post using blog service
      const savedPost = await this.saveBlogPostData(blogData);
      const blogUrl = savedPost.published_url || `/blog/${savedPost.slug}`;

      console.log('✅ Blog post generated successfully');

      return {
        success: true,
        title,
        content: contentWithLink,
        slug,
        excerpt,
        blogUrl,
        metadata: savedPost
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
      let firstLine = lines[0].trim();
      // Strip HTML tags from the title
      firstLine = firstLine.replace(/<[^>]*>/g, '');
      // Clean Title: prefixes and markdown artifacts
      firstLine = firstLine
        .replace(/^\s*\*\*Title:\s*([^*]*)\*\*\s*/i, '$1') // Remove **Title:** wrapper and extract content
        .replace(/^\*\*H1\*\*:\s*/i, '')
        .replace(/^\*\*Title\*\*:\s*/i, '') // Remove **Title**: prefix
        .replace(/^Title:\s*/gi, '') // Remove Title: prefix (global + case insensitive)
        .replace(/^\*\*([^*]+?)\*\*:\s*/i, '$1')
        .replace(/^\*\*(.+?)\*\*$/i, '$1') // Handle **title** format
        .replace(/\*\*/g, '') // Remove any remaining ** symbols
        .replace(/\*/g, '') // Remove any remaining * symbols
        .replace(/^#{1,6}\s+/, '')
        .trim();
      // Decode HTML entities and normalize special characters
      firstLine = this.decodeHtmlEntities(firstLine);
      // Remove problematic special characters but keep common punctuation
      firstLine = firstLine.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
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
   * Decode HTML entities to prevent display issues
   */
  private static decodeHtmlEntities(text: string): string {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  }

  /**
   * Generate URL-friendly slug with timestamp for uniqueness
   */
  private static generateSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      // Strip HTML tags first
      .replace(/<[^>]*>/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 80); // Leave room for timestamp

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36);
    return `${baseSlug}-${timestamp}`;
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
      // Import blog service
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

  /**
   * Generate blog post using local development API
   */
  private static async generateWithLocalAPI(request: BlogRequest): Promise<BlogResponse> {
    try {
      const result = await LocalDevAPI.generateBlogPost({
        keyword: request.keyword,
        anchorText: request.anchorText,
        targetUrl: request.targetUrl,
        wordCount: 1000,
        contentType: 'blog-post',
        tone: 'professional'
      });

      if (!result.success || !result.content) {
        throw new Error(result.error || 'Failed to generate mock content');
      }

      const content = result.content;

      // Process the generated content
      const title = this.extractTitle(content, request.keyword);
      const slug = this.generateSlug(title);
      const excerpt = this.extractExcerpt(content);

      // Save to blog posts
      const blogData = {
        title,
        content,
        targetUrl: request.targetUrl,
        anchorText: request.anchorText,
        wordCount: content.replace(/<[^>]*>/g, '').split(/\s+/).length,
        readingTime: this.calculateReadingTime(content),
        seoScore: 85,
        customSlug: slug
      };

      // Save the blog post to database
      const savedPost = await this.saveBlogPostData(blogData);
      const blogUrl = savedPost.published_url || `/blog/${savedPost.slug}`;

      console.log('✅ Mock blog post generated and saved to database:', {
        id: savedPost.id,
        slug: savedPost.slug,
        title: savedPost.title
      });

      return {
        success: true,
        title,
        content,
        slug,
        excerpt,
        blogUrl,
        metadata: savedPost
      };

    } catch (error) {
      console.error('❌ Mock blog generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mock generation failed'
      };
    }
  }

  /**
   * Save blog post data using the blog service
   */
  private static async saveBlogPostData(blogData: any) {
    // Clean up old posts before creating new ones
    try {
      await LocalDevAPI.cleanupInvalidPosts();
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }

    return await blogService.createBlogPost(
      blogData,
      null, // no user_id for trial posts
      true  // is_trial_post = true
    );
  }


}
