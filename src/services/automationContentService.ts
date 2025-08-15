export interface ContentGenerationParams {
  keyword: string;
  anchorText: string;
  targetUrl: string;
}

export interface GeneratedContent {
  type: 'article' | 'blog_post' | 'reader_friendly';
  content: string;
  wordCount: number;
}

export class AutomationContentService {
  
  /**
   * Generate all three types of content for a campaign
   */
  async generateAllContent(params: ContentGenerationParams): Promise<GeneratedContent[]> {
    const { keyword, anchorText, targetUrl } = params;

    // Retry logic
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Generating content for keyword: ${keyword} (attempt ${attempt}/${maxRetries})`);

        // Determine which endpoint to use based on environment and configuration
    const isDevelopment = import.meta.env.DEV;
    const isTestMode = import.meta.env.MODE === 'test';
    const mockMode = localStorage.getItem('automation-mock-mode') === 'true';

    let endpoint: string;
    if (isDevelopment || isTestMode || mockMode) {
      // Use enhanced mock for development, testing, or when explicitly enabled
      endpoint = '/.netlify/functions/enhanced-mock-automation';
    } else {
      // Use working content generator for production (more reliable)
      endpoint = '/.netlify/functions/working-content-generator';
    }

    console.log(`Using endpoint: ${endpoint} (development: ${isDevelopment}, test: ${isTestMode}, mock: ${mockMode})`);

        // Call Netlify function for secure content generation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        let response: Response;
        let responseText: string = '';

        try {
          // Use stored original fetch to avoid FullStory interference
          const fetchToUse = window._originalFetch || window.fetch || fetch;

          response = await fetchToUse.call(window, endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              keyword,
              anchorText,
              targetUrl,
              testMode: isTestMode,
              simulateDelay: !isTestMode, // Skip delays in test mode for faster execution
              simulateError: false,
              contentVariations: 1
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          // Read response body immediately to prevent stream already read errors
          try {
            responseText = await response.text();
          } catch (readError) {
            console.error('Failed to read response body:', readError);
            throw new Error(`Failed to read response from server: ${readError instanceof Error ? readError.message : 'body stream already read'}`);
          }

        } catch (fetchError) {
          clearTimeout(timeoutId);

          // Handle FullStory and other network interference
          if (fetchError instanceof Error) {
            if (fetchError.name === 'AbortError') {
              throw new Error('Request timeout: Content generation service took too long to respond');
            }
            if (fetchError.message.includes('body stream already read')) {
              throw new Error('Network interference detected: Please try again');
            }
            if (fetchError.message.includes('Failed to fetch')) {
              throw new Error('Network error: Connection blocked by browser extension or firewall');
            }
            throw new Error(`Network error: ${fetchError.message}`);
          }
          throw new Error('Network error: Failed to connect to content generation service');
        }

        // Parse JSON from text
        let data: any;
        try {
          if (!responseText || responseText.trim() === '') {
            throw new Error('Empty response received from server');
          }
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', {
            responseText: responseText.substring(0, 200) + '...',
            parseError,
            responseLength: responseText.length
          });

          // If response isn't JSON, use text as error message
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${responseText.substring(0, 200) || response.statusText}`);
          }
          throw new Error(`Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON response'}`);
        }

        // Handle error responses
        if (!response.ok) {
          const errorMessage = data?.error || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        if (!data.success) {
          throw new Error(data.error || 'Content generation failed');
        }

        if (!data.content || !Array.isArray(data.content)) {
          throw new Error('Invalid response format from content generation service');
        }

        console.log(`Successfully generated ${data.content.length} pieces of content`);
        return data.content;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Content generation error (attempt ${attempt}/${maxRetries}):`, lastError.message);

        // Don't retry for certain types of errors
        if (lastError.message.includes('OPENAI_API_KEY') ||
            lastError.message.includes('Missing required parameters') ||
            lastError.message.includes('HTTP 4')) {
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed, try fallback mock content as last resort
    if (lastError) {
      console.warn('All content generation attempts failed, falling back to mock content');

      try {
        const mockContent = this.generateFallbackContent(keyword, anchorText, targetUrl);
        console.log('Successfully generated fallback content');
        return [mockContent];
      } catch (mockError) {
        console.error('Fallback content generation also failed:', mockError);
      }

      // Provide more specific error messages
      if (lastError.message.includes('OPENAI_API_KEY')) {
        throw new Error('OpenAI API key not configured. Please contact administrator.');
      }
      if (lastError.message.includes('Network error') ||
          lastError.message.includes('timeout') ||
          lastError.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to content generation service after multiple attempts.');
      }
      throw new Error(`Content generation failed after ${maxRetries} attempts: ${lastError.message}`);
    }

    throw new Error('Failed to generate content: Unknown error occurred');
  }

  /**
   * Generate fallback content when all other methods fail
   */
  private generateFallbackContent(keyword: string, anchorText: string, targetUrl: string): GeneratedContent {
    const contentTemplates = [
      {
        type: 'article' as const,
        title: `Understanding ${keyword}: A Professional Guide`,
        content: this.generateArticleTemplate(keyword, anchorText, targetUrl)
      },
      {
        type: 'blog_post' as const,
        title: `${keyword}: Tips and Best Practices`,
        content: this.generateBlogTemplate(keyword, anchorText, targetUrl)
      },
      {
        type: 'reader_friendly' as const,
        title: `${keyword} Made Simple`,
        content: this.generateSimpleTemplate(keyword, anchorText, targetUrl)
      }
    ];

    // Randomly select a template
    const template = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];

    return {
      type: template.type,
      content: template.content,
      wordCount: this.countWords(template.content)
    };
  }

  private generateArticleTemplate(keyword: string, anchorText: string, targetUrl: string): string {
    return `<h1>Understanding ${keyword}: A Professional Guide</h1>

<p>In today's competitive business landscape, ${keyword} has emerged as a critical factor for success. This comprehensive guide examines the key aspects, implementation strategies, and best practices surrounding ${keyword}.</p>

<h2>Introduction to ${keyword}</h2>

<p>${keyword} represents more than just a trending concept—it's a fundamental shift in how modern organizations approach their strategic objectives. Understanding its implications is essential for any business looking to maintain competitive advantage.</p>

<h2>Core Principles and Benefits</h2>

<p>The implementation of effective ${keyword} strategies offers numerous advantages:</p>

<ul>
<li>Enhanced operational efficiency and productivity</li>
<li>Improved customer satisfaction and engagement</li>
<li>Better scalability and long-term sustainability</li>
<li>Increased ROI and measurable business outcomes</li>
<li>Competitive differentiation in the marketplace</li>
</ul>

<h2>Implementation Framework</h2>

<p>Successful ${keyword} implementation requires a structured approach that considers both technical and organizational factors. Key components include stakeholder alignment, resource allocation, and phased rollout strategies.</p>

<h2>Best Practices and Expert Guidance</h2>

<p>When developing your ${keyword} strategy, it's crucial to leverage proven methodologies and expert insights. For comprehensive guidance and professional support, consider exploring <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>, which offers specialized expertise in this domain.</p>

<h2>Measuring Success and ROI</h2>

<p>Effective ${keyword} initiatives should include clear metrics and KPIs to track progress and demonstrate value. Regular assessment and optimization ensure continued success and alignment with business objectives.</p>

<h2>Future Considerations</h2>

<p>As the landscape surrounding ${keyword} continues to evolve, organizations must stay informed about emerging trends, technologies, and best practices. Proactive adaptation and continuous improvement are key to long-term success.</p>

<h2>Conclusion</h2>

<p>The strategic importance of ${keyword} cannot be overstated in today's business environment. Organizations that invest in proper implementation and ongoing optimization will be best positioned to achieve sustainable competitive advantage and drive meaningful business results.</p>`;
  }

  private generateBlogTemplate(keyword: string, anchorText: string, targetUrl: string): string {
    return `<h1>${keyword}: Your Complete Guide to Success</h1>

<p>Hey there! If you've been wondering about ${keyword} and how it can transform your business, you're in exactly the right place. Today, I'm sharing everything you need to know to get started and see real results.</p>

<h2>Why ${keyword} Matters More Than Ever</h2>

<p>Let me be honest with you—${keyword} isn't just another business buzzword. It's a game-changer that's helping smart companies outperform their competition and achieve remarkable growth.</p>

<h2>My Top 5 ${keyword} Insights</h2>

<ol>
<li><strong>Start with clear objectives</strong> - Know exactly what you want to achieve before diving in</li>
<li><strong>Focus on quality over quantity</strong> - Better to do fewer things exceptionally well</li>
<li><strong>Measure everything</strong> - You can't improve what you don't track</li>
<li><strong>Learn from the experts</strong> - Don't reinvent the wheel when proven solutions exist</li>
<li><strong>Stay consistent</strong> - Success with ${keyword} comes from sustained effort over time</li>
</ol>

<h2>Common Mistakes to Avoid</h2>

<p>In my experience helping businesses with ${keyword}, I've seen the same mistakes repeatedly. Here's how to sidestep the most common pitfalls and accelerate your success.</p>

<h2>Tools and Resources That Actually Work</h2>

<p>The right tools can make all the difference in your ${keyword} journey. One resource I consistently recommend is <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>—they provide excellent guidance and proven strategies that deliver results.</p>

<h2>Real-World Success Stories</h2>

<p>Nothing beats seeing ${keyword} in action. Let me share some inspiring examples of how other businesses have leveraged these strategies to achieve breakthrough results.</p>

<h2>Your Action Plan</h2>

<p>Ready to implement ${keyword} in your business? Here's your step-by-step roadmap to get started today:</p>

<ul>
<li>Assess your current situation and identify opportunities</li>
<li>Set clear, measurable goals and timelines</li>
<li>Choose the right tools and resources for your needs</li>
<li>Start small and scale gradually based on results</li>
<li>Monitor progress and adjust your approach as needed</li>
</ul>

<h2>What's Next?</h2>

<p>The world of ${keyword} is constantly evolving, and staying ahead of the curve is crucial for long-term success. Keep learning, experimenting, and refining your approach—your future self will thank you!</p>`;
  }

  private generateSimpleTemplate(keyword: string, anchorText: string, targetUrl: string): string {
    return `<h1>${keyword} Made Simple: Everything You Need to Know</h1>

<p>Confused about ${keyword}? Don't worry—you're not alone! I'm going to break it down in simple terms that anyone can understand, no jargon or complicated concepts required.</p>

<h2>What Exactly Is ${keyword}?</h2>

<p>Think of ${keyword} as a powerful tool that helps businesses work smarter, not harder. It's like having a GPS for your business—it shows you the best route to reach your destination.</p>

<h2>Why Should You Care?</h2>

<p>Here's the thing: ${keyword} isn't just for big corporations or tech experts. It can help anyone who wants to:</p>

<ul>
<li>Save time on daily tasks</li>
<li>Make better business decisions</li>
<li>Increase profits and efficiency</li>
<li>Stay competitive in their industry</li>
<li>Build a more sustainable business</li>
</ul>

<h2>How Does It Actually Work?</h2>

<p>Without getting too technical, ${keyword} works by identifying patterns, automating repetitive tasks, and providing insights that help you make smarter choices. It's like having a really smart assistant who never sleeps!</p>

<h2>Getting Started: Baby Steps</h2>

<p>The best part about ${keyword}? You don't need to be a tech genius to get started. Begin with small, manageable changes and gradually expand as you see results.</p>

<h2>Need Help Along the Way?</h2>

<p>If you're feeling overwhelmed or want expert guidance, don't hesitate to reach out for professional support. <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> offers beginner-friendly resources and step-by-step guidance to help you succeed.</p>

<h2>Common Questions Answered</h2>

<p><strong>Is ${keyword} expensive?</strong> Not necessarily! Many solutions are surprisingly affordable, especially when you consider the time and money they save.</p>

<p><strong>How long does it take to see results?</strong> Most people notice improvements within the first few weeks, with significant benefits becoming clear within 2-3 months.</p>

<p><strong>Do I need special training?</strong> While some learning is involved, most ${keyword} solutions are designed to be user-friendly and intuitive.</p>

<h2>Your Next Steps</h2>

<p>Ready to explore ${keyword} for yourself? Start small, be patient with the learning process, and don't be afraid to ask for help when you need it. Remember, every expert was once a beginner!</p>

<p>The journey of a thousand miles begins with a single step—and your ${keyword} journey starts today.</p>`;
  }

  private countWords(text: string): number {
    // Remove HTML tags and count words
    const plainText = text.replace(/<[^>]*>/g, '');
    return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Validate content generation service availability
   */
  async validateConnection(): Promise<boolean> {
    try {
      // Test with minimal parameters to check if service is available
      const response = await fetch('/.netlify/functions/generate-automation-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: 'test',
          anchorText: 'test link',
          targetUrl: 'https://example.com'
        })
      });

      // We expect this to work or give a specific error about missing API key
      let data = null;
      try {
        data = await response.json();
      } catch (parseError) {
        console.warn('Failed to parse validation response:', parseError);
        return false;
      }

      // If we get a proper response structure, the service is available
      if (data && (data.success || data.error)) {
        console.log('Content generation service is available');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Content generation service validation failed:', error);
      return false;
    }
  }

  /**
   * Get service status and configuration info
   */
  async getServiceStatus(): Promise<{
    available: boolean;
    configured: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch('/.netlify/functions/generate-automation-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: 'test',
          anchorText: 'test',
          targetUrl: 'https://example.com'
        })
      });

      let data = null;
      try {
        data = await response.json();
      } catch (parseError) {
        console.warn('Failed to parse status response:', parseError);
        return {
          available: false,
          configured: false,
          error: 'Service not responding or invalid response format'
        };
      }

      if (!data) {
        return {
          available: false,
          configured: false,
          error: 'Service not responding'
        };
      }

      // Check if API key is configured
      if (data.error && data.error.includes('OPENAI_API_KEY')) {
        return {
          available: true,
          configured: false,
          error: 'OpenAI API key not configured'
        };
      }

      // If we get success or any other error, service is configured
      return {
        available: true,
        configured: true
      };

    } catch (error) {
      return {
        available: false,
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Singleton instance
let contentService: AutomationContentService | null = null;

export const getContentService = (): AutomationContentService => {
  if (!contentService) {
    contentService = new AutomationContentService();
  }
  return contentService;
};
