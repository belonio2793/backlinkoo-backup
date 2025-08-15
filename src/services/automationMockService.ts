import { supabase } from '@/integrations/supabase/client';

export interface MockCampaignConfig {
  keyword: string;
  anchorText: string;
  targetUrl: string;
  contentVariations?: number;
  publishingDelay?: number;
  simulateErrors?: boolean;
  publishToPlatforms?: string[];
}

export interface MockEnvironmentConfig {
  enabled: boolean;
  mode: 'development' | 'testing' | 'staging';
  database: 'mock' | 'sandbox' | 'real';
  contentGeneration: 'mock' | 'real';
  publishing: 'mock' | 'real';
}

export interface MockCampaignResult {
  campaignId: string;
  status: 'draft' | 'active' | 'completed' | 'paused' | 'failed';
  publishedUrls: string[];
  generatedContent: Array<{
    type: string;
    content: string;
    wordCount: number;
  }>;
  logs: Array<{
    timestamp: Date;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>;
  performance: {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    steps: Array<{
      name: string;
      duration: number;
      success: boolean;
    }>;
  };
}

export class AutomationMockService {
  private config: MockEnvironmentConfig;
  private mockDatabase: Map<string, any> = new Map();
  private activeCampaigns: Map<string, MockCampaignResult> = new Map();

  constructor(config?: Partial<MockEnvironmentConfig>) {
    this.config = {
      enabled: import.meta.env.DEV || import.meta.env.MODE === 'development',
      mode: (import.meta.env.MODE as any) || 'development',
      database: import.meta.env.DEV ? 'mock' : 'real',
      contentGeneration: import.meta.env.DEV ? 'mock' : 'real',
      publishing: import.meta.env.DEV ? 'mock' : 'real',
      ...config
    };

    this.initializeMockDatabase();
  }

  /**
   * Check if mock mode is enabled
   */
  isMockEnabled(): boolean {
    return this.config.enabled && this.config.mode === 'development';
  }

  /**
   * Get current environment configuration
   */
  getConfig(): MockEnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Update environment configuration
   */
  updateConfig(updates: Partial<MockEnvironmentConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Initialize mock database with sample data
   */
  private initializeMockDatabase(): void {
    if (!this.isMockEnabled()) return;

    // Mock user data
    this.mockDatabase.set('users', [
      {
        id: 'mock-user-1',
        email: 'test@example.com',
        role: 'user',
        subscription_tier: 'premium',
        created_at: new Date().toISOString()
      }
    ]);

    // Mock campaigns
    this.mockDatabase.set('campaigns', []);
    this.mockDatabase.set('content', []);
    this.mockDatabase.set('published_links', []);
    this.mockDatabase.set('logs', []);

    console.log('🎭 Mock database initialized for automation testing');
  }

  /**
   * Create a mock campaign
   */
  async createMockCampaign(config: MockCampaignConfig): Promise<MockCampaignResult> {
    const campaignId = `mock-campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const mockResult: MockCampaignResult = {
      campaignId,
      status: 'draft',
      publishedUrls: [],
      generatedContent: [],
      logs: [{
        timestamp: new Date(),
        level: 'info',
        message: `Mock campaign created for keyword: ${config.keyword}`
      }],
      performance: {
        startTime: new Date(),
        steps: []
      }
    };

    this.activeCampaigns.set(campaignId, mockResult);

    // Simulate campaign processing
    if (!config.simulateErrors) {
      this.simulateCampaignProcessing(campaignId, config);
    }

    return mockResult;
  }

  /**
   * Simulate campaign processing with realistic delays and steps
   */
  private async simulateCampaignProcessing(campaignId: string, config: MockCampaignConfig): Promise<void> {
    const campaign = this.activeCampaigns.get(campaignId);
    if (!campaign) return;

    const steps = [
      { name: 'Initializing campaign', duration: 500 },
      { name: 'Generating content', duration: 2000 },
      { name: 'Optimizing for SEO', duration: 1000 },
      { name: 'Publishing to platforms', duration: 1500 },
      { name: 'Collecting published URLs', duration: 800 },
      { name: 'Finalizing campaign', duration: 300 }
    ];

    try {
      campaign.status = 'active';
      this.addLog(campaignId, 'info', 'Campaign processing started');

      for (const step of steps) {
        const stepStart = Date.now();
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, step.duration));
        
        const stepEnd = Date.now();
        const actualDuration = stepEnd - stepStart;

        campaign.performance.steps.push({
          name: step.name,
          duration: actualDuration,
          success: true
        });

        this.addLog(campaignId, 'info', `Completed: ${step.name} (${actualDuration}ms)`);

        // Generate mock content during content generation step
        if (step.name === 'Generating content') {
          const content = this.generateMockContent(config);
          campaign.generatedContent.push(content);
        }

        // Generate mock published URLs during publishing step
        if (step.name === 'Publishing to platforms') {
          const publishedUrl = this.generateMockPublishedUrl(config);
          campaign.publishedUrls.push(publishedUrl);
        }
      }

      campaign.status = 'completed';
      campaign.performance.endTime = new Date();
      campaign.performance.duration = campaign.performance.endTime.getTime() - campaign.performance.startTime.getTime();
      
      this.addLog(campaignId, 'info', `Campaign completed successfully in ${campaign.performance.duration}ms`);

    } catch (error) {
      campaign.status = 'failed';
      this.addLog(campaignId, 'error', `Campaign failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate mock content for testing
   */
  private generateMockContent(config: MockCampaignConfig) {
    const templates = [
      {
        type: 'article',
        content: `<h1>Comprehensive Guide to ${config.keyword}</h1>
<p>This article explores the fundamentals of ${config.keyword} and provides actionable insights for implementation.</p>
<h2>Understanding ${config.keyword}</h2>
<p>${config.keyword} represents a crucial aspect of modern digital strategies. For expert guidance and resources, check out <a href="${config.targetUrl}" target="_blank" rel="noopener noreferrer">${config.anchorText}</a>.</p>
<h2>Best Practices</h2>
<p>When working with ${config.keyword}, it's essential to follow industry-standard practices and leverage proven methodologies.</p>
<h2>Conclusion</h2>
<p>By implementing effective ${config.keyword} strategies, organizations can achieve significant improvements in their operations and outcomes.</p>`,
        wordCount: 150
      },
      {
        type: 'blog_post',
        content: `<h1>${config.keyword}: Your Complete Guide</h1>
<p>Welcome to your ultimate resource for mastering ${config.keyword}! In this comprehensive guide, we'll cover everything you need to know.</p>
<h2>Getting Started</h2>
<p>If you're new to ${config.keyword}, don't worry - we'll walk you through the basics step by step.</p>
<h2>Advanced Techniques</h2>
<p>Ready to take your ${config.keyword} skills to the next level? Here are some advanced strategies to consider. For additional tools and resources, visit <a href="${config.targetUrl}" target="_blank" rel="noopener noreferrer">${config.anchorText}</a>.</p>
<h2>Real-World Applications</h2>
<p>Let's explore how ${config.keyword} is being used successfully in various industries and scenarios.</p>`,
        wordCount: 120
      },
      {
        type: 'reader_friendly',
        content: `<h1>Understanding ${config.keyword}: A Simple Guide</h1>
<p>Ever wondered about ${config.keyword}? You're in the right place! This guide breaks down everything in simple, easy-to-understand terms.</p>
<h2>What is ${config.keyword}?</h2>
<p>${config.keyword} is an important concept that affects many aspects of modern business and technology.</p>
<h2>Why Should You Care?</h2>
<p>Understanding ${config.keyword} can help you make better decisions and improve your results. If you're looking for expert help with ${config.keyword}, consider checking out <a href="${config.targetUrl}" target="_blank" rel="noopener noreferrer">${config.anchorText}</a>.</p>
<h2>Getting Started</h2>
<p>Here's how you can begin implementing ${config.keyword} strategies today.</p>`,
        wordCount: 100
      }
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate mock published URL
   */
  private generateMockPublishedUrl(config: MockCampaignConfig): string {
    const platforms = config.publishToPlatforms || ['telegraph', 'medium', 'hashnode'];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const slug = config.keyword.toLowerCase().replace(/\s+/g, '-');
    const randomId = Math.random().toString(36).substr(2, 8);

    const mockUrls = {
      telegraph: `https://telegra.ph/${slug}-${randomId}`,
      medium: `https://medium.com/@mock-user/${slug}-${randomId}`,
      hashnode: `https://mock-user.hashnode.dev/${slug}-${randomId}`
    };

    return mockUrls[platform as keyof typeof mockUrls] || mockUrls.telegraph;
  }

  /**
   * Add log entry to campaign
   */
  private addLog(campaignId: string, level: 'info' | 'warning' | 'error', message: string): void {
    const campaign = this.activeCampaigns.get(campaignId);
    if (campaign) {
      campaign.logs.push({
        timestamp: new Date(),
        level,
        message
      });
    }
  }

  /**
   * Get campaign status and results
   */
  getCampaignResult(campaignId: string): MockCampaignResult | null {
    return this.activeCampaigns.get(campaignId) || null;
  }

  /**
   * Get all active mock campaigns
   */
  getAllMockCampaigns(): MockCampaignResult[] {
    return Array.from(this.activeCampaigns.values());
  }

  /**
   * Simulate campaign failure for testing error handling
   */
  async simulateCampaignFailure(campaignId: string, errorType: 'content_generation' | 'publishing' | 'database'): Promise<void> {
    const campaign = this.activeCampaigns.get(campaignId);
    if (!campaign) return;

    const errorMessages = {
      content_generation: 'Content generation service unavailable',
      publishing: 'Publishing platform rejected content',
      database: 'Database connection timeout'
    };

    campaign.status = 'failed';
    this.addLog(campaignId, 'error', errorMessages[errorType]);
  }

  /**
   * Clean up mock data
   */
  cleanupMockData(): void {
    this.activeCampaigns.clear();
    this.mockDatabase.clear();
    this.initializeMockDatabase();
    console.log('🧹 Mock data cleaned up');
  }

  /**
   * Export mock data for analysis
   */
  exportMockData(): {
    campaigns: MockCampaignResult[];
    database: Record<string, any>;
    config: MockEnvironmentConfig;
  } {
    return {
      campaigns: Array.from(this.activeCampaigns.values()),
      database: Object.fromEntries(this.mockDatabase.entries()),
      config: this.config
    };
  }

  /**
   * Run parallel campaign tests
   */
  async runParallelTests(configs: MockCampaignConfig[], maxConcurrency = 3): Promise<MockCampaignResult[]> {
    console.log(`🚀 Running ${configs.length} parallel campaign tests (max concurrency: ${maxConcurrency})`);
    
    const results: MockCampaignResult[] = [];
    
    // Process campaigns in batches
    for (let i = 0; i < configs.length; i += maxConcurrency) {
      const batch = configs.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(config => this.createMockCampaign(config));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
      
      // Wait for campaigns to complete processing
      await this.waitForCampaignsCompletion(batchResults.map(r => r.campaignId));
    }

    console.log(`✅ Completed ${results.length} parallel tests`);
    return results;
  }

  /**
   * Wait for campaigns to complete processing
   */
  private async waitForCampaignsCompletion(campaignIds: string[], timeout = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const allCompleted = campaignIds.every(id => {
        const campaign = this.activeCampaigns.get(id);
        return campaign && ['completed', 'failed'].includes(campaign.status);
      });

      if (allCompleted) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.warn('⚠️ Timeout waiting for campaigns to complete');
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): {
    totalCampaigns: number;
    completed: number;
    failed: number;
    averageProcessingTime: number;
    slowestStep: string;
    fastestStep: string;
  } {
    const campaigns = Array.from(this.activeCampaigns.values());
    const completedCampaigns = campaigns.filter(c => c.status === 'completed');
    
    const totalProcessingTime = completedCampaigns.reduce((sum, c) => sum + (c.performance.duration || 0), 0);
    const averageProcessingTime = completedCampaigns.length > 0 ? totalProcessingTime / completedCampaigns.length : 0;

    // Analyze step performance
    const allSteps = completedCampaigns.flatMap(c => c.performance.steps);
    const stepsByName = allSteps.reduce((acc, step) => {
      if (!acc[step.name]) acc[step.name] = [];
      acc[step.name].push(step.duration);
      return acc;
    }, {} as Record<string, number[]>);

    let slowestStep = '';
    let fastestStep = '';
    let maxAvgDuration = 0;
    let minAvgDuration = Infinity;

    Object.entries(stepsByName).forEach(([name, durations]) => {
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      if (avgDuration > maxAvgDuration) {
        maxAvgDuration = avgDuration;
        slowestStep = name;
      }
      if (avgDuration < minAvgDuration) {
        minAvgDuration = avgDuration;
        fastestStep = name;
      }
    });

    return {
      totalCampaigns: campaigns.length,
      completed: completedCampaigns.length,
      failed: campaigns.filter(c => c.status === 'failed').length,
      averageProcessingTime,
      slowestStep,
      fastestStep
    };
  }
}

// Singleton instance
let mockService: AutomationMockService | null = null;

export const getAutomationMockService = (): AutomationMockService => {
  if (!mockService) {
    mockService = new AutomationMockService();
  }
  return mockService;
};
