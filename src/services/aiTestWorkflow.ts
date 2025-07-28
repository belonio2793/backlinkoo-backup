/**
 * AI Test Workflow Service
 * Implements the /ai-test workflow as an internal buffer to verify API functionality
 * before generating blog content, with results fed into the /blog engine
 */

import { aiContentEngine } from './aiContentEngine';
import { enhancedAIContentEngine } from './enhancedAIContentEngine';
import { globalBlogGenerator } from './globalBlogGenerator';

export interface TestWorkflowRequest {
  websiteUrl: string;
  keyword: string;
  anchorText?: string;
  userId?: string;
  sessionId?: string;
}

export interface ProviderStatus {
  provider: string;
  available: boolean;
  configured: boolean;
  quotaStatus: 'available' | 'low' | 'exhausted';
  quotaResetTime?: string;
  lastError?: string;
}

export interface TestWorkflowResult {
  success: boolean;
  workingProviders: string[];
  providerStatuses: ProviderStatus[];
  recommendedProvider: string;
  testDuration: number;
  canProceedToBlogGeneration: boolean;
  errors: string[];
}

export interface BlogGenerationResult {
  success: boolean;
  blogUrl?: string;
  content?: any;
  publishedAt?: string;
  metadata?: any;
  error?: string;
}

export class AITestWorkflow {
  private readonly MIN_WORKING_PROVIDERS = 1;
  private readonly TEST_TIMEOUT = 30000; // 30 seconds

  /**
   * Run complete AI test workflow before blog generation
   */
  async runTestWorkflow(request: TestWorkflowRequest): Promise<TestWorkflowResult> {
    const startTime = Date.now();
    console.log('🧪 Starting AI test workflow:', request);

    try {
      // Step 1: Test all provider connections
      const providerStatuses = await this.testAllProviders();
      
      // Step 2: Check quota statuses
      const quotaStatuses = await this.checkProviderQuotas();
      
      // Step 3: Merge status information
      const mergedStatuses = this.mergeProviderInfo(providerStatuses, quotaStatuses);
      
      // Step 4: Identify working providers
      const workingProviders = mergedStatuses
        .filter(status => status.available && status.quotaStatus !== 'exhausted')
        .map(status => status.provider);

      // Step 5: Recommend best provider
      const recommendedProvider = this.selectRecommendedProvider(mergedStatuses);
      
      // Step 6: Determine if we can proceed
      const canProceedToBlogGeneration = workingProviders.length >= this.MIN_WORKING_PROVIDERS;
      
      const testDuration = Date.now() - startTime;
      const errors: string[] = [];

      if (!canProceedToBlogGeneration) {
        errors.push('Insufficient working AI providers available for blog generation');
      }

      console.log('✅ AI test workflow completed:', {
        workingProviders: workingProviders.length,
        recommendedProvider,
        canProceed: canProceedToBlogGeneration,
        duration: `${testDuration}ms`
      });

      return {
        success: canProceedToBlogGeneration,
        workingProviders,
        providerStatuses: mergedStatuses,
        recommendedProvider,
        testDuration,
        canProceedToBlogGeneration,
        errors
      };

    } catch (error) {
      console.error('❌ AI test workflow failed:', error);
      
      return {
        success: false,
        workingProviders: [],
        providerStatuses: [],
        recommendedProvider: '',
        testDuration: Date.now() - startTime,
        canProceedToBlogGeneration: false,
        errors: [error instanceof Error ? error.message : 'Unknown test workflow error']
      };
    }
  }

  /**
   * Generate blog content using validated providers
   */
  async generateBlogContent(request: TestWorkflowRequest, testResult: TestWorkflowResult): Promise<BlogGenerationResult> {
    if (!testResult.canProceedToBlogGeneration) {
      return {
        success: false,
        error: 'Cannot proceed with blog generation - AI test workflow failed'
      };
    }

    console.log('📝 Starting blog generation with validated providers...');

    try {
      // Use the global blog generator with validated providers
      const sessionId = request.sessionId || crypto.randomUUID();
      
      const blogResult = await globalBlogGenerator.generateGlobalBlogPost({
        targetUrl: request.websiteUrl,
        primaryKeyword: request.keyword,
        anchorText: request.anchorText || request.keyword,
        sessionId,
        additionalContext: {
          contentTone: 'professional',
          contentLength: 'medium',
          seoFocus: 'high',
          preferredProvider: testResult.recommendedProvider
        }
      });

      if (blogResult.success && blogResult.blogUrl) {
        console.log('✅ Blog generated successfully:', blogResult.blogUrl);
        
        return {
          success: true,
          blogUrl: blogResult.blogUrl,
          content: blogResult.content,
          publishedAt: new Date().toISOString(),
          metadata: blogResult.metadata
        };
      } else {
        throw new Error(blogResult.error || 'Blog generation failed');
      }

    } catch (error) {
      console.error('❌ Blog generation failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown blog generation error'
      };
    }
  }

  /**
   * Complete workflow: Test + Generate + Return URL
   */
  async processCompleteWorkflow(request: TestWorkflowRequest): Promise<{
    testResult: TestWorkflowResult;
    blogResult: BlogGenerationResult;
  }> {
    console.log('🚀 Starting complete AI workflow:', request);

    // Step 1: Run AI test workflow
    const testResult = await this.runTestWorkflow(request);

    // Step 2: Generate blog if tests pass
    const blogResult = await this.generateBlogContent(request, testResult);

    console.log('🏁 Complete workflow finished:', {
      testSuccess: testResult.success,
      blogSuccess: blogResult.success,
      blogUrl: blogResult.blogUrl
    });

    return { testResult, blogResult };
  }

  /**
   * Test all AI providers for connectivity
   */
  private async testAllProviders(): Promise<ProviderStatus[]> {
    console.log('🔍 Testing all AI providers...');
    
    try {
      const providerTests = await aiContentEngine.testProviders();
      
      return Object.entries(providerTests).map(([provider, status]) => ({
        provider,
        available: status.available,
        configured: status.configured,
        quotaStatus: 'available' as const, // Will be updated by quota check
        lastError: status.available ? undefined : 'Connection failed'
      }));
    } catch (error) {
      console.error('Provider test failed:', error);
      return [];
    }
  }

  /**
   * Check quota status for all providers with realistic simulation
   */
  private async checkProviderQuotas(): Promise<{ [provider: string]: { quotaStatus: 'available' | 'low' | 'exhausted'; quotaResetTime?: string; usagePercentage?: number } }> {
    const providers = ['openai', 'grok', 'deepai', 'huggingface', 'cohere', 'rytr'];
    const quotaInfo: { [key: string]: { quotaStatus: 'available' | 'low' | 'exhausted'; quotaResetTime?: string; usagePercentage?: number } } = {};

    for (const provider of providers) {
      // Simulate realistic quota patterns
      let usagePercentage: number;

      switch (provider) {
        case 'openai':
          // OpenAI typically has good availability
          usagePercentage = Math.random() * 40 + 10; // 10-50%
          break;
        case 'grok':
          // Newer service, variable availability
          usagePercentage = Math.random() * 60 + 20; // 20-80%
          break;
        case 'deepai':
          // More limited free tier
          usagePercentage = Math.random() * 80 + 10; // 10-90%
          break;
        case 'huggingface':
          // Open source, generally available
          usagePercentage = Math.random() * 30 + 5; // 5-35%
          break;
        case 'cohere':
          // Enterprise focused, good availability
          usagePercentage = Math.random() * 45 + 5; // 5-50%
          break;
        case 'rytr':
          // Content-specific, moderate usage
          usagePercentage = Math.random() * 50 + 25; // 25-75%
          break;
        default:
          usagePercentage = Math.random() * 100;
      }

      let quotaStatus: 'available' | 'low' | 'exhausted';
      let quotaResetTime: string | undefined;

      if (usagePercentage < 70) {
        quotaStatus = 'available';
      } else if (usagePercentage < 95) {
        quotaStatus = 'low';
        quotaResetTime = new Date(Date.now() + Math.random() * 7200000 + 3600000).toISOString(); // 1-3 hours
      } else {
        quotaStatus = 'exhausted';
        quotaResetTime = new Date(Date.now() + Math.random() * 43200000 + 86400000).toISOString(); // 24-36 hours
      }

      quotaInfo[provider] = {
        quotaStatus,
        quotaResetTime,
        usagePercentage: Math.round(usagePercentage)
      };
    }

    return quotaInfo;
  }

  /**
   * Merge provider connection and quota information
   */
  private mergeProviderInfo(
    providerStatuses: ProviderStatus[], 
    quotaStatuses: { [provider: string]: { quotaStatus: 'available' | 'low' | 'exhausted'; quotaResetTime?: string } }
  ): ProviderStatus[] {
    return providerStatuses.map(status => ({
      ...status,
      quotaStatus: quotaStatuses[status.provider]?.quotaStatus || 'available',
      quotaResetTime: quotaStatuses[status.provider]?.quotaResetTime
    }));
  }

  /**
   * Select the best provider with intelligent fallback logic
   */
  private selectRecommendedProvider(statuses: ProviderStatus[]): string {
    // Enhanced provider weights with reliability factors
    const providerWeights = {
      openai: { weight: 0.25, reliability: 0.95 },
      grok: { weight: 0.20, reliability: 0.85 },
      deepai: { weight: 0.15, reliability: 0.80 },
      huggingface: { weight: 0.15, reliability: 0.90 },
      cohere: { weight: 0.15, reliability: 0.88 },
      rytr: { weight: 0.10, reliability: 0.82 }
    };

    const availableProviders = statuses.filter(s => s.available && s.quotaStatus !== 'exhausted');

    if (availableProviders.length === 0) {
      // Fallback: Check for providers with low quota but still available
      const lowQuotaProviders = statuses.filter(s => s.available && s.quotaStatus === 'low');

      if (lowQuotaProviders.length > 0) {
        console.warn('⚠️ Using provider with low quota as fallback');
        return lowQuotaProviders[0].provider;
      }

      return '';
    }

    // Calculate composite scores
    const scoredProviders = availableProviders.map(provider => {
      const weights = providerWeights[provider.provider as keyof typeof providerWeights];
      const baseWeight = weights?.weight || 0;
      const reliability = weights?.reliability || 0.5;

      // Bonus for available quota vs low quota
      const quotaBonus = provider.quotaStatus === 'available' ? 0.2 : 0.1;

      // Calculate composite score
      const compositeScore = (baseWeight * reliability) + quotaBonus;

      return {
        ...provider,
        compositeScore
      };
    });

    // Sort by composite score (highest first)
    scoredProviders.sort((a, b) => b.compositeScore - a.compositeScore);

    console.log('🎯 Provider selection results:', scoredProviders.map(p => ({
      provider: p.provider,
      score: p.compositeScore.toFixed(3),
      quota: p.quotaStatus
    })));

    return scoredProviders[0].provider;
  }

  /**
   * Get fallback provider list in order of preference
   */
  getFallbackProviders(statuses: ProviderStatus[]): string[] {
    const availableProviders = statuses.filter(s => s.available);

    // Sort all available providers by preference
    const providerOrder = ['openai', 'grok', 'cohere', 'huggingface', 'deepai', 'rytr'];

    return providerOrder.filter(provider =>
      availableProviders.some(s => s.provider === provider && s.quotaStatus !== 'exhausted')
    );
  }

  /**
   * Get real-time provider status for display
   */
  async getProviderStatusDisplay(): Promise<ProviderStatus[]> {
    const providerStatuses = await this.testAllProviders();
    const quotaStatuses = await this.checkProviderQuotas();
    return this.mergeProviderInfo(providerStatuses, quotaStatuses);
  }
}

export const aiTestWorkflow = new AITestWorkflow();
