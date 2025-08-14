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

// Content generation prompts - 3 variations for diverse content
const CONTENT_PROMPTS = [
  "Generate a 1000 word article on {{keyword}} including the {{anchor_text}} hyperlinked to {{url}}",
  "Write a 1000 word blog post about {{keyword}} with a hyperlinked {{anchor_text}} linked to {{url}}",
  "Produce a 1000-word reader friendly post on {{keyword}} that links {{anchor_text}} to {{url}}"
];

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

    console.log(`🤖 Generating content with prompt ${promptIndex + 1}:`, prompt);

    try {
      // Call OpenAI via Netlify function
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
          word_count: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`Content generation failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Content generation failed');
      }

      // Format content with proper anchor text linking
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

  public async executeAutomation(request: AutomationRequest): Promise<AutomationResult> {
    const startTime = Date.now();
    const publishedArticles: PublishedArticle[] = [];
    
    console.log('🚀 Starting automation engine with request:', request);

    try {
      // Currently only Telegraph is active, but this is designed for multiple platforms
      const activePlatforms = ['telegraph']; // Will expand to ['telegraph', 'write.as', 'medium', etc.]
      
      for (let platformIndex = 0; platformIndex < activePlatforms.length; platformIndex++) {
        const platform = activePlatforms[platformIndex];
        
        // Select random keyword and anchor text for variety
        const keyword = this.getRandomKeyword(request.keywords);
        const anchor_text = this.getRandomAnchorText(request.anchor_texts);
        
        console.log(`📝 Processing platform ${platformIndex + 1}/${activePlatforms.length}: ${platform}`);
        console.log(`🎯 Using keyword: "${keyword}", anchor text: "${anchor_text}"`);

        // Use different prompt for each platform to ensure content variety
        const promptIndex = platformIndex % CONTENT_PROMPTS.length;
        
        try {
          // Generate content
          const contentResult = await this.generateContent(
            keyword, 
            anchor_text, 
            request.target_url, 
            promptIndex
          );

          console.log(`✅ Content generated: ${contentResult.word_count} words`);

          // Publish to platform (currently only Telegraph)
          if (platform === 'telegraph') {
            const publishResult = await this.publishToTelegraph(
              contentResult.title,
              contentResult.content,
              keyword,
              request.user_id
            );

            if (publishResult.success) {
              const article: PublishedArticle = {
                id: `article-${Date.now()}-${platformIndex}`,
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
              
              // Show success notification
              toast.success(`✅ Article published on ${platform}: "${contentResult.title}"`);
            } else {
              console.error(`❌ Failed to publish to ${platform}:`, publishResult.error);
              toast.error(`Failed to publish to ${platform}: ${publishResult.error}`);
            }
          }

          // Add delay between platforms to avoid rate limiting
          if (platformIndex < activePlatforms.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (error) {
          console.error(`❌ Error processing platform ${platform}:`, error);
          toast.error(`Error on ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Determine campaign status
      const campaign_status = publishedArticles.length > 0 ? 'completed' : 'paused';
      
      const totalExecutionTime = Date.now() - startTime;
      console.log(`🏁 Automation completed in ${totalExecutionTime}ms. Published ${publishedArticles.length} articles.`);

      if (publishedArticles.length > 0) {
        toast.success(`🎉 Campaign completed! ${publishedArticles.length} article(s) published successfully.`);
      } else {
        toast.error('❌ Campaign failed - no articles were published.');
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
      
      toast.error(`Automation failed: ${errorMessage}`);

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
