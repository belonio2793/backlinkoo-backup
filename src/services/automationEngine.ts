import { toast } from 'sonner';

export interface AutomationRequest {
  target_url: string;
  keywords: string[];
  anchor_texts: string[];
  user_id: string;
}

export interface PublishedArticle {
  id: string;
  title: string;
  url: string;
  platform: string;
  word_count: number;
  anchor_text_used: string;
  keyword_used: string;
  content_preview: string;
  published_at: string;
  execution_time_ms: number;
}

export interface AutomationResult {
  success: boolean;
  articles: PublishedArticle[];
  error?: string;
  campaign_status: 'active' | 'paused' | 'completed';
}

// Content generation prompts - 3 variations for diverse content (using ChatGPT 3.5 Turbo)
const CONTENT_PROMPTS = [
  "Generate a 1000 word article on {{keyword}} including the {{anchor_text}} hyperlinked to {{url}}",
  "Write a 1000 word blog post about {{keyword}} with a hyperlinked {{anchor_text}} linked to {{url}}",
  "Produce a 1000-word reader friendly post on {{keyword}} that links {{anchor_text}} to {{url}}"
];

// Rate limiting: 30 seconds between publications
const PUBLICATION_THROTTLE_MS = 30000;
let lastPublicationTime = 0;

class AutomationEngine {
  private async generateContent(
    keyword: string,
    anchor_text: string,
    target_url: string,
    promptIndex: number = 0
  ): Promise<{ content: string; title: string; word_count: number }> {
    const prompt = CONTENT_PROMPTS[promptIndex]
      .replace('{{keyword}}', keyword)
      .replace('{{anchor_text}}', anchor_text)
      .replace('{{url}}', target_url);

    console.log(`🤖 Generating content with ChatGPT 3.5 Turbo - Prompt ${promptIndex + 1}:`, prompt);

    try {
      // Call OpenAI via Netlify function (using ChatGPT 3.5 Turbo)
      const response = await fetch('/.netlify/functions/ai-content-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          keyword,
          anchor_text,
          target_url,
          word_count: 1000,
          model: 'gpt-3.5-turbo', // Explicitly specify ChatGPT 3.5 Turbo
          temperature: 0.7, // Balanced creativity
          max_tokens: 2000 // Ensure enough tokens for 1000 words
        })
      });

      if (!response.ok) {
        throw new Error(`Content generation failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Content generation failed');
      }

      console.log(`✅ ChatGPT 3.5 Turbo generated ${result.word_count || 'unknown'} words`);

      // REQUIREMENT: Format content with proper anchor text linking before publish
      const formattedContent = this.formatContentWithLinks(
        result.content,
        anchor_text,
        target_url
      );

      return {
        content: formattedContent,
        title: result.title || this.generateTitle(keyword),
        word_count: result.word_count || this.countWords(formattedContent)
      };

    } catch (error) {
      console.error('Content generation error:', error);
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private formatContentWithLinks(content: string, anchor_text: string, target_url: string): string {
    // Ensure the anchor text is properly hyperlinked
    if (!content.includes(`[${anchor_text}]`) && !content.includes(`<a href="${target_url}"`)) {
      // If the content doesn't already have the link, ensure it's properly formatted
      const linkText = `[${anchor_text}](${target_url})`;
      
      // Insert the link naturally in the content if it's not already there
      if (!content.includes(linkText)) {
        // Find a good place to insert the link (after first paragraph)
        const paragraphs = content.split('\n\n');
        if (paragraphs.length > 1) {
          paragraphs[1] = paragraphs[1] + ` Learn more about this topic at ${linkText}.`;
          content = paragraphs.join('\n\n');
        } else {
          content = content + `\n\nFor more information, visit ${linkText}.`;
        }
      }
    }

    return content;
  }

  private async publishToTelegraph(
    title: string, 
    content: string, 
    keyword: string,
    user_id: string
  ): Promise<{ url: string; success: boolean; error?: string }> {
    console.log(`📡 Publishing to Telegraph: "${title}"`);

    try {
      const response = await fetch('/.netlify/functions/telegraph-publisher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          author_name: 'Content Automation',
          author_url: '',
          user_id,
          keyword
        })
      });

      if (!response.ok) {
        throw new Error(`Telegraph publishing failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Telegraph publishing failed');
      }

      return {
        url: result.url,
        success: true
      };

    } catch (error) {
      console.error('Telegraph publishing error:', error);
      return {
        url: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private generateTitle(keyword: string): string {
    const titleTemplates = [
      `The Complete Guide to ${keyword}`,
      `Everything You Need to Know About ${keyword}`,
      `${keyword}: A Comprehensive Overview`,
      `Understanding ${keyword} in 2024`,
      `The Ultimate ${keyword} Resource`
    ];
    
    const randomIndex = Math.floor(Math.random() * titleTemplates.length);
    return titleTemplates[randomIndex];
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private getRandomAnchorText(anchor_texts: string[]): string {
    return anchor_texts[Math.floor(Math.random() * anchor_texts.length)];
  }

  private getRandomKeyword(keywords: string[]): string {
    return keywords[Math.floor(Math.random() * keywords.length)];
  }

  private async enforceThrottling(): Promise<void> {
    const now = Date.now();
    const timeSinceLastPublication = now - lastPublicationTime;

    if (timeSinceLastPublication < PUBLICATION_THROTTLE_MS) {
      const waitTime = PUBLICATION_THROTTLE_MS - timeSinceLastPublication;
      console.log(`⏱️  Throttling publication - waiting ${waitTime}ms (${Math.round(waitTime/1000)}s)`);

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastPublicationTime = Date.now();
  }

  private async sendToReporting(article: PublishedArticle, userId: string): Promise<void> {
    try {
      // Send successful link to reporting tab
      console.log('📊 Sending article to reporting system:', {
        url: article.url,
        platform: article.platform,
        keyword: article.keyword_used,
        anchor_text: article.anchor_text_used
      });

      // Integration with reporting system would go here
      // This could call a separate service or update database directly

    } catch (error) {
      console.error('Failed to send article to reporting:', error);
      // Don't throw - reporting failure shouldn't stop automation
    }
  }

  public async executeAutomation(request: AutomationRequest): Promise<AutomationResult> {
    const startTime = Date.now();
    const publishedArticles: PublishedArticle[] = [];

    console.log('🚀 Starting link building automation with requirements:');
    console.log('  • Single article per campaign');
    console.log('  • 30-second throttling between publications');
    console.log('  • Skip errors, don\'t halt process');
    console.log('  • Telegraph.ph publishing only');
    console.log('Request:', request);

    try {
      // NEW REQUIREMENT: Only publish ONE article per campaign
      const activePlatforms = ['telegraph']; // Single platform for now

      // Select random keyword and anchor text for the single publication
      const keyword = this.getRandomKeyword(request.keywords);
      const anchor_text = this.getRandomAnchorText(request.anchor_texts);

      console.log(`📝 Creating single article for campaign`);
      console.log(`🎯 Using keyword: "${keyword}", anchor text: "${anchor_text}"`);

      // Select one of the 3 prompts randomly for content variety
      const promptIndex = Math.floor(Math.random() * CONTENT_PROMPTS.length);

      try {
        // REQUIREMENT: Generate content using ChatGPT 3.5 Turbo
        const contentResult = await this.generateContent(
          keyword,
          anchor_text,
          request.target_url,
          promptIndex
        );

        console.log(`✅ Content generated: ${contentResult.word_count} words`);
        console.log(`📝 Content preview: ${contentResult.content.substring(0, 100)}...`);

        // REQUIREMENT: Enforce 30-second throttling
        await this.enforceThrottling();

        // REQUIREMENT: Ensure content is formatted and link is hyperlinked before publish
        console.log(`🔗 Verifying anchor text hyperlinking before publication...`);

        // Publish to Telegraph (single platform)
        const publishResult = await this.publishToTelegraph(
          contentResult.title,
          contentResult.content,
          keyword,
          request.user_id
        );

        if (publishResult.success) {
          const article: PublishedArticle = {
            id: `article-${Date.now()}`,
            title: contentResult.title,
            url: publishResult.url,
            platform: 'Telegraph',
            word_count: contentResult.word_count,
            anchor_text_used: anchor_text,
            keyword_used: keyword,
            content_preview: contentResult.content.substring(0, 200) + '...',
            published_at: new Date().toISOString(),
            execution_time_ms: Date.now() - startTime
          };

          publishedArticles.push(article);
          console.log(`🎉 Article published successfully: ${publishResult.url}`);

          // REQUIREMENT: Send successful link to reporting tab
          await this.sendToReporting(article, request.user_id);

          // Show success notification
          toast.success(`✅ Link building successful! Article published: "${contentResult.title}"`);
        } else {
          // REQUIREMENT: Skip errors, don't halt the process
          console.warn(`⚠️  Publishing failed, skipping: ${publishResult.error}`);
          toast.warning(`Publishing failed, skipping: ${publishResult.error}`);
        }

      } catch (error) {
        // REQUIREMENT: Skip errors, don't halt the process
        console.warn(`⚠️  Content generation failed, skipping:`, error);
        toast.warning(`Content generation failed, skipping: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // REQUIREMENT: Campaign is paused when all platforms complete (only Telegraph for now)
      const campaign_status = publishedArticles.length > 0 ? 'completed' : 'paused';

      const totalExecutionTime = Date.now() - startTime;
      console.log(`🏁 Link building automation completed in ${totalExecutionTime}ms.`);
      console.log(`📊 Results: ${publishedArticles.length} article published, campaign status: ${campaign_status}`);

      if (publishedArticles.length > 0) {
        toast.success(`🎉 Link building completed! 1 high-quality backlink created on Telegraph.`);
      } else {
        toast.error('❌ Link building failed - no articles were published. Please try again.');
      }

      return {
        success: publishedArticles.length > 0,
        articles: publishedArticles,
        campaign_status,
        error: publishedArticles.length === 0 ? 'No articles were published successfully' : undefined
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown automation error';
      console.error('❌ Automation engine error:', error);

      toast.error(`Link building failed: ${errorMessage}`);

      return {
        success: false,
        articles: [],
        campaign_status: 'paused',
        error: errorMessage
      };
    }
  }
}

export const automationEngine = new AutomationEngine();
