/**
 * Local Development API Service
 * Simulates OpenAI API for development when no API key is configured
 */

interface LocalBlogRequest {
  keyword: string;
  anchorText: string;
  targetUrl: string;
  wordCount?: number;
  contentType?: string;
  tone?: string;
}

interface LocalBlogResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: {
    tokens: number;
    cost: number;
  };
  timestamp?: string;
}

export class LocalDevAPI {
  /**
   * Generate mock blog content for development
   */
  static async generateBlogPost(request: LocalBlogRequest): Promise<LocalBlogResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    try {
      const { keyword, anchorText, targetUrl } = request;
      
      // Generate mock content based on the keyword
      const content = this.generateMockContent(keyword, anchorText, targetUrl);
      
      return {
        success: true,
        content,
        usage: {
          tokens: Math.floor(Math.random() * 2000) + 1000,
          cost: 0.002 + Math.random() * 0.003
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mock generation failed'
      };
    }
  }

  /**
   * Generate mock blog content
   */
  private static generateMockContent(keyword: string, anchorText: string, targetUrl: string): string {
    const keywordCapitalized = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    
    return `<h1>The Ultimate Guide to ${keywordCapitalized}</h1>

<p>In today's digital landscape, understanding ${keyword} has become more important than ever. Whether you're a beginner or an experienced professional, this comprehensive guide will help you master the fundamentals and advanced concepts of ${keyword}.</p>

<h2>Understanding the Basics</h2>

<p>Before diving into the advanced strategies, it's crucial to understand what ${keyword} really means and why it matters for your business. ${keywordCapitalized} encompasses a wide range of techniques and methodologies that can significantly impact your success.</p>

<p>The foundation of effective ${keyword} lies in understanding your audience and their needs. When you focus on providing value and solving real problems, you naturally create content that resonates with your target market.</p>

<h2>Best Practices and Strategies</h2>

<p>Implementing ${keyword} successfully requires a strategic approach. Here are the key strategies that industry experts recommend:</p>

<ul>
<li><strong>Research and Planning:</strong> Always start with thorough research to understand your market and competition.</li>
<li><strong>Quality Content:</strong> Focus on creating high-quality, valuable content that serves your audience.</li>
<li><strong>Consistent Implementation:</strong> Consistency is key to seeing long-term results with ${keyword}.</li>
<li><strong>Performance Monitoring:</strong> Regularly track and analyze your results to optimize your approach.</li>
</ul>

<h2>Advanced Techniques</h2>

<p>Once you've mastered the basics, you can explore more advanced techniques. For those looking to take their ${keyword} to the next level, consider exploring <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>, which offers comprehensive insights and tools.</p>

<p>Advanced practitioners often employ sophisticated methodologies that go beyond basic implementation. These techniques require a deeper understanding of the underlying principles and often involve complex analysis and optimization processes.</p>

<h2>Common Mistakes to Avoid</h2>

<p>Even experienced professionals can fall into common traps when working with ${keyword}. Here are the most frequent mistakes to avoid:</p>

<ol>
<li>Rushing the implementation process without proper planning</li>
<li>Neglecting to measure and analyze results regularly</li>
<li>Focusing too much on quantity over quality</li>
<li>Ignoring the importance of user experience</li>
<li>Failing to adapt strategies based on performance data</li>
</ol>

<h2>Tools and Resources</h2>

<p>Success with ${keyword} often depends on having the right tools and resources at your disposal. The market offers numerous solutions, from free tools for beginners to enterprise-level platforms for large organizations.</p>

<p>When selecting tools, consider factors such as ease of use, scalability, integration capabilities, and cost-effectiveness. The right combination of tools can significantly streamline your workflow and improve your results.</p>

<h2>Future Trends and Considerations</h2>

<p>The field of ${keyword} is constantly evolving, with new trends and technologies emerging regularly. Staying ahead of these developments is crucial for maintaining a competitive edge.</p>

<p>Industry experts predict that the future will bring even more sophisticated approaches to ${keyword}, with increased emphasis on automation, artificial intelligence, and personalization.</p>

<h2>Conclusion</h2>

<p>Mastering ${keyword} is a journey that requires dedication, continuous learning, and strategic thinking. By following the best practices outlined in this guide and staying updated with the latest trends, you'll be well-equipped to achieve your goals.</p>

<p>Remember that success with ${keyword} doesn't happen overnight. It requires patience, persistence, and a willingness to adapt your strategies based on results and changing market conditions. Start with the fundamentals, gradually implement advanced techniques, and always focus on providing value to your audience.</p>

<p>With the right approach and commitment, ${keyword} can become a powerful driver of growth and success for your business or personal goals.</p>`;
  }

  /**
   * Check if we should use local dev API
   */
  static shouldUseMockAPI(): boolean {
    // Only use mock API if we're in development AND no OpenAI key is available
    if (!import.meta.env.DEV) {
      return false; // Never use mock in production
    }

    // Check for OpenAI API key in various locations
    const envKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
    if (envKey) {
      console.log('🔑 OpenAI API key found in environment, using real OpenAI');
      return false;
    }

    // Check localStorage for admin-configured API key
    try {
      const adminEnvVars = localStorage.getItem('admin_env_vars');
      if (adminEnvVars) {
        const vars = JSON.parse(adminEnvVars);
        const openaiVar = vars.find((v: any) => v.key === 'OPENAI_API_KEY');
        if (openaiVar && openaiVar.value && openaiVar.value.startsWith('sk-')) {
          console.log('🔑 OpenAI API key found in localStorage, using real OpenAI');
          return false;
        }
      }
    } catch (error) {
      console.warn('Error checking localStorage for API key:', error);
    }

    console.log('🧪 No OpenAI API key found, using mock API for development');
    return true;
  }

  /**
   * Clean up invalid/expired blog posts
   */
  static async cleanupInvalidPosts(): Promise<number> {
    try {
      const { blogService } = await import('@/services/blogService');
      const deletedCount = await blogService.cleanupExpiredTrialPosts();
      console.log(`🧹 Cleaned up ${deletedCount} expired trial posts`);
      return deletedCount;
    } catch (error) {
      console.warn('⚠️ Cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Get mock API status
   */
  static getAPIStatus() {
    return {
      online: true,
      message: 'Local development (mock API active)',
      providers: {
        OpenAI: {
          configured: true,
          status: 'configured'
        }
      },
      timestamp: new Date().toISOString()
    };
  }
}
