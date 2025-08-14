/**
 * Mock Automation Service for Development Environment
 * Provides simulated content generation and publishing for testing without external APIs
 */

export interface MockContentGenerationParams {
  keyword: string;
  anchor_text: string;
  target_url: string;
  user_id: string;
  word_count?: number;
  tone?: string;
}

export interface MockContentResult {
  success: boolean;
  title: string;
  content: string;
  word_count: number;
  generation_time_ms: number;
  error?: string;
}

export interface MockPublishingParams {
  title: string;
  content: string;
  user_id: string;
  target_site?: string;
  author_name?: string;
}

export interface MockPublishingResult {
  success: boolean;
  url: string;
  publishing_time_ms: number;
  error?: string;
}

class MockAutomationService {
  private isDevEnvironment(): boolean {
    // Always use mock in development-like environments
    if (typeof window === 'undefined') return true; // Server-side, assume dev

    return import.meta.env.MODE === 'development' ||
           import.meta.env.DEV === true ||
           window.location.hostname === 'localhost' ||
           window.location.hostname.includes('127.0.0.1') ||
           window.location.hostname.includes('.fly.dev') || // Development server
           window.location.port !== '' || // Any port suggests development
           !window.location.hostname.includes('.com'); // Not a production domain
  }

  // Generate realistic mock content based on keyword and anchor text
  async generateMockContent(params: MockContentGenerationParams): Promise<MockContentResult> {
    const startTime = Date.now();
    
    // Simulate network delay
    await this.simulateDelay(1500, 3000);

    const { keyword, anchor_text, target_url } = params;
    
    // Generate mock title
    const titleTemplates = [
      `The Ultimate Guide to ${keyword}: Boost Your Success Today`,
      `How ${keyword} Can Transform Your Business in 2024`,
      `${keyword}: Everything You Need to Know`,
      `Mastering ${keyword}: A Complete Professional Guide`,
      `Why ${keyword} is Essential for Modern Businesses`,
      `${keyword} Best Practices: Expert Tips and Strategies`
    ];
    
    const title = titleTemplates[Math.floor(Math.random() * titleTemplates.length)]
      .replace(keyword, this.capitalizeFirst(keyword));

    // Generate mock content with embedded anchor text
    const content = this.generateMockArticleContent(keyword, anchor_text, target_url);
    
    const executionTime = Date.now() - startTime;
    
    console.log('🎭 Mock content generated:', {
      title: title.substring(0, 50) + '...',
      word_count: content.split(' ').length,
      generation_time_ms: executionTime,
      keyword,
      anchor_text
    });

    return {
      success: true,
      title,
      content,
      word_count: content.split(' ').length,
      generation_time_ms: executionTime
    };
  }

  // Generate mock publishing result
  async publishMockContent(params: MockPublishingParams): Promise<MockPublishingResult> {
    const startTime = Date.now();
    
    // Simulate network delay
    await this.simulateDelay(800, 2000);
    
    // Generate mock Telegraph-style URL
    const urlSlug = this.generateUrlSlug(params.title);
    const mockUrl = `https://telegra.ph/${urlSlug}-${Date.now().toString(36)}`;
    
    const executionTime = Date.now() - startTime;
    
    console.log('🎭 Mock content published:', {
      url: mockUrl,
      title: params.title.substring(0, 50) + '...',
      target_site: params.target_site || 'telegraph',
      publishing_time_ms: executionTime
    });

    return {
      success: true,
      url: mockUrl,
      publishing_time_ms: executionTime
    };
  }

  // Check if we should use mock services
  shouldUseMockServices(): boolean {
    const shouldUse = this.isDevEnvironment();
    console.log('🎭 Mock service check:', {
      isDev: this.isDevEnvironment(),
      shouldUse,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
    });
    return shouldUse;
  }

  // Generate comprehensive article content
  private generateMockArticleContent(keyword: string, anchorText: string, targetUrl: string): string {
    const introduction = `In today's competitive digital landscape, understanding ${keyword} has become essential for businesses looking to thrive online. This comprehensive guide will explore the key aspects of ${keyword} and provide you with actionable insights to leverage its full potential.`;

    const sections = [
      {
        heading: `Understanding ${this.capitalizeFirst(keyword)}`,
        content: `${this.capitalizeFirst(keyword)} represents a crucial element in modern digital strategy. By implementing effective ${keyword} practices, businesses can significantly enhance their online presence and drive meaningful results. The fundamentals of ${keyword} encompass various methodologies and approaches that have proven successful across different industries.`
      },
      {
        heading: 'Key Benefits and Advantages',
        content: `When properly implemented, ${keyword} offers numerous advantages including improved visibility, enhanced user engagement, and increased conversion rates. Organizations that prioritize ${keyword} often see substantial improvements in their overall performance metrics and customer satisfaction scores.`
      },
      {
        heading: 'Best Practices and Implementation',
        content: `Successful ${keyword} implementation requires a strategic approach and attention to detail. Industry experts recommend focusing on quality over quantity and maintaining consistency across all efforts. For those looking to dive deeper into advanced strategies, you can <a href="${targetUrl}">${anchorText}</a> to explore comprehensive resources and tools.`
      },
      {
        heading: 'Common Challenges and Solutions',
        content: `While ${keyword} offers significant benefits, it's important to be aware of potential challenges. These may include resource allocation, timing considerations, and staying updated with industry changes. However, with the right approach and tools, these challenges can be effectively managed and overcome.`
      },
      {
        heading: 'Future Trends and Considerations',
        content: `As the digital landscape continues to evolve, ${keyword} will likely see new developments and innovations. Staying informed about emerging trends and adapting strategies accordingly will be crucial for maintaining competitive advantage in the coming years.`
      }
    ];

    const conclusion = `In conclusion, ${keyword} remains a powerful tool for achieving digital success. By implementing the strategies and best practices outlined in this guide, you'll be well-positioned to harness the full potential of ${keyword} for your business or organization. Remember that consistency and continuous optimization are key to long-term success.`;

    // Combine all content
    let fullContent = `<p>${introduction}</p>\n\n`;
    
    sections.forEach(section => {
      fullContent += `<h2>${section.heading}</h2>\n<p>${section.content}</p>\n\n`;
    });
    
    fullContent += `<p>${conclusion}</p>`;

    return fullContent;
  }

  private generateUrlSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
      .replace(/-$/, '');
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private async simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Test mock services functionality
  async testMockServices(): Promise<{
    contentGeneration: boolean;
    publishing: boolean;
    errors: string[];
    environment: string;
  }> {
    const errors: string[] = [];
    let contentGeneration = false;
    let publishing = false;

    try {
      const contentResult = await this.generateMockContent({
        keyword: 'test keyword',
        anchor_text: 'test link',
        target_url: 'https://example.com',
        user_id: 'test-user'
      });
      contentGeneration = contentResult.success;
      if (!contentGeneration) {
        errors.push('Mock content generation failed');
      }
    } catch (error) {
      errors.push(`Mock content generation error: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      const publishResult = await this.publishMockContent({
        title: 'Test Article',
        content: 'Test content for mock publishing',
        user_id: 'test-user'
      });
      publishing = publishResult.success;
      if (!publishing) {
        errors.push('Mock publishing failed');
      }
    } catch (error) {
      errors.push(`Mock publishing error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      contentGeneration,
      publishing,
      errors,
      environment: this.isDevEnvironment() ? 'development' : 'production'
    };
  }
}

export const mockAutomationService = new MockAutomationService();

// Export for window debugging in development
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  (window as any).mockAutomationService = mockAutomationService;
  console.log('🎭 Mock automation service available at window.mockAutomationService');
}

export default mockAutomationService;
