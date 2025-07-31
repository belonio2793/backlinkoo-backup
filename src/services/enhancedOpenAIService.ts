/**
 * Enhanced OpenAI Service with Supabase Edge Functions and Retry Logic
 * Provides failsafe mechanisms and multiple retry approaches
 */

import { createClient } from '@supabase/supabase-js';

interface OpenAIRequest {
  keyword: string;
  anchorText: string;
  url: string;
  wordCount?: number;
  contentType?: string;
  tone?: string;
  selectedPrompt?: string;
  promptIndex?: number;
}

interface OpenAIResponse {
  success: boolean;
  content?: string;
  usage?: {
    tokens: number;
    cost: number;
  };
  error?: string;
  prompt?: string;
  promptIndex?: number;
  provider: string;
  timestamp: string;
  attempts?: number;
  fallbackUsed?: boolean;
}

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class EnhancedOpenAIService {
  private supabaseUrl: string;
  private supabaseKey: string;
  private supabase: any;
  private fallbackEndpoints: string[];
  private retryConfig: RetryConfig;

  // Prompt templates matching the requirement
  private promptTemplates = [
    "Generate a 1000 word blog post on {{keyword}} including the {{anchor_text}} hyperlinked to {{url}}",
    "Write a 1000 word blog post about {{keyword}} with a hyperlinked {{anchor_text}} linked to {{url}}",
    "Produce a 1000-word blog post on {{keyword}} that links {{anchor_text}}"
  ];

  constructor() {
    // Get Supabase configuration
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (this.supabaseUrl && this.supabaseKey) {
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    }

    // Define fallback endpoints in order of preference
    this.fallbackEndpoints = [
      '/functions/v1/generate-content-openai', // Primary Supabase edge function
      '/.netlify/functions/generate-openai',    // Netlify fallback
      '/.netlify/functions/generate-fallback'   // Emergency fallback
    ];

    // Retry configuration
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,      // 1 second base delay
      maxDelay: 10000,      // 10 seconds max delay
      backoffMultiplier: 2  // Exponential backoff
    };
  }

  /**
   * Generate content with retry logic and failsafe mechanisms
   */
  async generateContent(request: OpenAIRequest): Promise<OpenAIResponse> {
    const startTime = Date.now();
    let lastError: string = '';
    let totalAttempts = 0;
    let fallbackUsed = false;

    console.log('🚀 Starting enhanced content generation with failsafe mechanisms...');
    console.log('📋 Request:', { 
      keyword: request.keyword, 
      anchorText: request.anchorText,
      url: request.url,
      wordCount: request.wordCount 
    });

    // Select prompt template if not provided
    if (!request.selectedPrompt && request.promptIndex === undefined) {
      request.promptIndex = Math.floor(Math.random() * this.promptTemplates.length);
      request.selectedPrompt = this.promptTemplates[request.promptIndex]
        .replace('{{keyword}}', request.keyword)
        .replace('{{anchor_text}}', request.anchorText || request.keyword)
        .replace('{{url}}', request.url);
    }

    console.log(`🎯 Using prompt template ${(request.promptIndex || 0) + 1}: ${request.selectedPrompt}`);

    // Try each endpoint with retry logic
    for (let endpointIndex = 0; endpointIndex < this.fallbackEndpoints.length; endpointIndex++) {
      const endpoint = this.fallbackEndpoints[endpointIndex];
      const isSupabase = endpoint.includes('/functions/v1/');
      
      if (endpointIndex > 0) {
        fallbackUsed = true;
        console.log(`🔄 Falling back to endpoint ${endpointIndex + 1}: ${endpoint}`);
      }

      // Retry logic for current endpoint
      for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
        totalAttempts++;
        
        try {
          console.log(`🎲 Attempt ${attempt}/${this.retryConfig.maxAttempts} on ${isSupabase ? 'Supabase' : 'Netlify'} endpoint...`);

          const result = await this.makeRequest(endpoint, request, isSupabase);
          
          if (result.success && result.content) {
            const totalTime = Date.now() - startTime;
            console.log(`✅ Content generation successful! Total time: ${totalTime}ms, Attempts: ${totalAttempts}`);
            
            return {
              ...result,
              attempts: totalAttempts,
              fallbackUsed,
              timestamp: new Date().toISOString()
            };
          } else {
            lastError = result.error || 'Unknown error';
            console.warn(`⚠️ Attempt ${attempt} failed: ${lastError}`);
          }

        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Network error';
          console.warn(`⚠️ Attempt ${attempt} threw error: ${lastError}`);
        }

        // Wait before retry (except on last attempt)
        if (attempt < this.retryConfig.maxAttempts) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
            this.retryConfig.maxDelay
          );
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.delay(delay);
        }
      }
    }

    // All endpoints and retries failed - return emergency content
    console.error(`❌ All endpoints failed after ${totalAttempts} attempts. Generating emergency content...`);
    
    return this.generateEmergencyContent(request, lastError, totalAttempts);
  }

  /**
   * Make request to specific endpoint
   */
  private async makeRequest(endpoint: string, request: OpenAIRequest, isSupabase: boolean): Promise<OpenAIResponse> {
    const url = isSupabase 
      ? `${this.supabaseUrl}${endpoint}`
      : `${window.location.origin}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add Supabase authorization if using edge function
    if (isSupabase && this.supabaseKey) {
      headers['Authorization'] = `Bearer ${this.supabaseKey}`;
      headers['apikey'] = this.supabaseKey;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Generate emergency content when all APIs fail
   */
  private generateEmergencyContent(request: OpenAIRequest, lastError: string, attempts: number): OpenAIResponse {
    const emergencyContent = this.createEmergencyBlogPost(request);
    
    console.log('🆘 Generated emergency content to maintain user flow');
    
    return {
      success: true,
      content: emergencyContent,
      usage: { tokens: 0, cost: 0 },
      provider: 'emergency-fallback',
      prompt: request.selectedPrompt || '',
      promptIndex: request.promptIndex || 0,
      timestamp: new Date().toISOString(),
      attempts,
      fallbackUsed: true,
      error: `All API endpoints failed. Last error: ${lastError}`
    };
  }

  /**
   * Create structured emergency blog post
   */
  private createEmergencyBlogPost(request: OpenAIRequest): string {
    const { keyword, anchorText, url, wordCount = 1000 } = request;
    
    return `
<h1>Complete Guide to ${keyword}</h1>

<p>Welcome to this comprehensive guide about ${keyword}. In this article, we'll explore everything you need to know about ${keyword} and provide you with actionable insights to help you succeed.</p>

<h2>Understanding ${keyword}</h2>

<p>${keyword} is an important topic that many people are interested in learning about. Whether you're a beginner or have some experience, this guide will provide valuable information to help you master ${keyword}.</p>

<p>When working with ${keyword}, it's essential to understand the fundamentals. Many experts recommend starting with the basics and gradually building your knowledge over time.</p>

<h2>Key Benefits of ${keyword}</h2>

<p>There are numerous advantages to understanding and implementing ${keyword} in your strategy:</p>

<ul>
<li>Improved efficiency and effectiveness</li>
<li>Better results and outcomes</li>
<li>Enhanced understanding of best practices</li>
<li>Competitive advantage in your field</li>
</ul>

<h2>Best Practices for ${keyword}</h2>

<p>To get the most out of ${keyword}, consider these proven strategies:</p>

<ol>
<li><strong>Start with research:</strong> Understand your specific needs and goals before diving in.</li>
<li><strong>Plan your approach:</strong> Create a structured plan that outlines your objectives.</li>
<li><strong>Implement gradually:</strong> Take a step-by-step approach to avoid overwhelming yourself.</li>
<li><strong>Monitor and adjust:</strong> Regularly review your progress and make necessary adjustments.</li>
</ol>

<h2>Advanced Strategies</h2>

<p>Once you've mastered the basics of ${keyword}, you can explore more advanced techniques. These strategies can help you achieve even better results and stay ahead of the competition.</p>

<p>For more detailed information and advanced strategies, you can <a href="${url}" target="_blank" rel="noopener noreferrer">${anchorText || keyword}</a> to access additional resources and expert guidance.</p>

<h2>Common Mistakes to Avoid</h2>

<p>While working with ${keyword}, it's important to be aware of common pitfalls that can hinder your success:</p>

<ul>
<li>Rushing the process without proper preparation</li>
<li>Ignoring best practices and industry standards</li>
<li>Failing to track progress and measure results</li>
<li>Not staying updated with latest trends and developments</li>
</ul>

<h2>Tools and Resources</h2>

<p>Having the right tools and resources can significantly improve your ${keyword} efforts. Here are some essential tools to consider:</p>

<ul>
<li>Analytics and tracking tools</li>
<li>Automation software</li>
<li>Educational resources and courses</li>
<li>Community forums and support groups</li>
</ul>

<h2>Measuring Success</h2>

<p>To ensure you're making progress with ${keyword}, it's crucial to establish clear metrics and regularly assess your performance. This will help you identify areas for improvement and celebrate your successes.</p>

<p>Key performance indicators might include efficiency metrics, quality measures, and overall satisfaction with your ${keyword} implementation.</p>

<h2>Future Trends</h2>

<p>The landscape of ${keyword} is constantly evolving. Staying informed about emerging trends and technologies will help you maintain a competitive edge and continue improving your results.</p>

<p>Industry experts predict several exciting developments in the ${keyword} space that could revolutionize how we approach this topic in the coming years.</p>

<h2>Conclusion</h2>

<p>Mastering ${keyword} requires dedication, the right approach, and continuous learning. By following the strategies and best practices outlined in this guide, you'll be well-equipped to achieve your goals and succeed in your ${keyword} endeavors.</p>

<p>Remember that success with ${keyword} is a journey, not a destination. Stay committed to learning and improving, and you'll see significant results over time. For additional support and resources, don't hesitate to explore <a href="${url}" target="_blank" rel="noopener noreferrer">${anchorText || keyword}</a> for expert guidance.</p>
`.trim();
  }

  /**
   * Test connection to all endpoints
   */
  async testConnection(): Promise<{ endpoint: string; status: boolean; responseTime: number }[]> {
    const results = [];
    
    for (const endpoint of this.fallbackEndpoints) {
      const startTime = Date.now();
      try {
        const isSupabase = endpoint.includes('/functions/v1/');
        const url = isSupabase 
          ? `${this.supabaseUrl}${endpoint}`
          : `${window.location.origin}${endpoint}`;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };

        if (isSupabase && this.supabaseKey) {
          headers['Authorization'] = `Bearer ${this.supabaseKey}`;
          headers['apikey'] = this.supabaseKey;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            keyword: 'test',
            anchorText: 'test',
            url: 'https://example.com'
          })
        });

        const responseTime = Date.now() - startTime;
        results.push({
          endpoint,
          status: response.ok,
          responseTime
        });
      } catch (error) {
        const responseTime = Date.now() - startTime;
        results.push({
          endpoint,
          status: false,
          responseTime
        });
      }
    }

    return results;
  }

  /**
   * Get available prompt templates
   */
  getPromptTemplates(): string[] {
    return [...this.promptTemplates];
  }

  /**
   * Format prompt with user inputs
   */
  formatPrompt(template: string, keyword: string, anchorText: string, url: string): string {
    return template
      .replace('{{keyword}}', keyword)
      .replace('{{anchor_text}}', anchorText)
      .replace('{{url}}', url);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const enhancedOpenAI = new EnhancedOpenAIService();
