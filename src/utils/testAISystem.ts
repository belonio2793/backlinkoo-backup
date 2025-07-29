/**
 * AI System Test Utility
 * Quick verification of the AI content generation system
 */

import { enhancedAIContentEngine } from '@/services/enhancedAIContentEngine';
import { aiContentEngine } from '@/services/aiContentEngine';
import { globalBlogGenerator } from '@/services/globalBlogGenerator';

export interface SystemTestResult {
  component: string;
  success: boolean;
  duration: number;
  details?: any;
  error?: string;
}

export class AISystemTester {
  
  /**
   * Test the enhanced AI content engine
   */
  static async testEnhancedEngine(): Promise<SystemTestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Testing Enhanced AI Content Engine...');
      
      const result = await enhancedAIContentEngine.generateContent({
        keyword: 'artificial intelligence',
        targetUrl: 'https://example-ai.com',
        anchorText: 'AI solutions',
        contentLength: 'short',
        contentTone: 'professional',
        seoFocus: true
      });

      const duration = Date.now() - startTime;
      
      if (result.finalContent && result.finalContent.length > 200) {
        return {
          component: 'Enhanced AI Content Engine',
          success: true,
          duration,
          details: {
            wordCount: result.metadata.wordCount,
            seoScore: result.metadata.seoScore,
            bestProvider: result.bestProvider,
            totalCost: result.totalCost,
            providersUsed: result.providers.filter(p => p.success).length
          }
        };
      } else {
        throw new Error('Generated content too short or empty');
      }
      
    } catch (error) {
      return {
        component: 'Enhanced AI Content Engine',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test the full AI content engine
   */
  static async testFullAIEngine(): Promise<SystemTestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🤖 Testing Full AI Content Engine...');
      
      const result = await aiContentEngine.generateContentWithFailover({
        keyword: 'machine learning',
        targetUrl: 'https://example-ml.com',
        anchorText: 'ML platform',
        wordCount: 1000
      });

      const duration = Date.now() - startTime;
      
      if (result.bestContent && result.bestContent.length > 200) {
        return {
          component: 'Full AI Content Engine',
          success: true,
          duration,
          details: {
            wordCount: result.metadata.wordCount,
            seoScore: result.metadata.seoScore,
            selectedProvider: result.selectedProvider,
            totalCost: result.totalCost,
            processingTime: result.processingTime
          }
        };
      } else {
        throw new Error('Generated content too short or empty');
      }
      
    } catch (error) {
      return {
        component: 'Full AI Content Engine',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test the global blog generator with AI integration
   */
  static async testGlobalBlogGenerator(): Promise<SystemTestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🌍 Testing Global Blog Generator...');
      
      const sessionId = crypto.randomUUID();
      const result = await globalBlogGenerator.generateGlobalBlogPost({
        targetUrl: 'https://test-example.com',
        primaryKeyword: 'content strategy',
        anchorText: 'content strategy tools',
        sessionId,
        additionalContext: {
          contentTone: 'professional',
          contentLength: 'medium',
          seoFocus: 'high'
        }
      });

      const duration = Date.now() - startTime;
      
      if (result.success && result.data?.blogPost?.content) {
        return {
          component: 'Global Blog Generator',
          success: true,
          duration,
          details: {
            blogId: result.data.blogPost.id,
            title: result.data.blogPost.title,
            wordCount: result.data.blogPost.word_count,
            seoScore: result.data.blogPost.seo_score,
            readingTime: result.data.blogPost.reading_time,
            aiProvider: result.data.blogPost.ai_provider || 'template'
          }
        };
      } else {
        throw new Error(result.error || 'Blog generation failed');
      }
      
    } catch (error) {
      return {
        component: 'Global Blog Generator',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test provider availability
   */
  static async testProviderStatus(): Promise<SystemTestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Testing AI Provider Status...');
      
      const status = await aiContentEngine.testProviders();
      const duration = Date.now() - startTime;
      
      const configuredProviders = Object.values(status).filter(p => p.configured).length;
      const availableProviders = Object.values(status).filter(p => p.available).length;
      
      return {
        component: 'Provider Status Check',
        success: true,
        duration,
        details: {
          totalProviders: Object.keys(status).length,
          configuredProviders,
          availableProviders,
          providerDetails: status
        }
      };
      
    } catch (error) {
      return {
        component: 'Provider Status Check',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Run comprehensive system test
   */
  static async runFullSystemTest(): Promise<{
    overallSuccess: boolean;
    totalDuration: number;
    results: SystemTestResult[];
    summary: {
      passed: number;
      failed: number;
      averageDuration: number;
    };
  }> {
    const startTime = Date.now();
    console.log('🚀 Starting comprehensive AI system test...');
    
    const tests = [
      this.testProviderStatus,
      this.testEnhancedEngine,
      this.testFullAIEngine,
      this.testGlobalBlogGenerator
    ];

    const results: SystemTestResult[] = [];
    
    for (const test of tests) {
      try {
        const result = await test();
        results.push(result);
        
        if (result.success) {
          console.log(`✅ ${result.component} - PASSED (${result.duration}ms)`);
        } else {
          console.log(`❌ ${result.component} - FAILED: ${result.error}`);
        }
      } catch (error) {
        console.error(`❌ Test failed unexpectedly:`, error);
        results.push({
          component: 'Unknown Test',
          success: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const totalDuration = Date.now() - startTime;
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    
    const overallSuccess = failed === 0;
    
    console.log(`\n📊 Test Summary:`);
    console.log(`   Total: ${results.length}`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Duration: ${totalDuration}ms`);
    console.log(`   Average: ${averageDuration.toFixed(0)}ms`);
    console.log(`   Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    return {
      overallSuccess,
      totalDuration,
      results,
      summary: {
        passed,
        failed,
        averageDuration
      }
    };
  }

  /**
   * Quick smoke test for basic functionality
   */
  static async quickSmokeTest(): Promise<boolean> {
    try {
      console.log('⚡ Running quick smoke test...');
      
      // Test basic provider status
      const statusResult = await this.testProviderStatus();
      if (!statusResult.success) {
        console.log('❌ Provider status check failed');
        return false;
      }

      // Test enhanced engine with minimal content
      const enhancedResult = await enhancedAIContentEngine.generateContent({
        keyword: 'test',
        targetUrl: 'https://example.com',
        contentLength: 'short',
        contentTone: 'professional'
      });

      if (!enhancedResult.finalContent || enhancedResult.finalContent.length < 100) {
        console.log('❌ Enhanced engine smoke test failed');
        return false;
      }

      console.log('✅ Smoke test passed - System appears functional');
      return true;
      
    } catch (error) {
      console.log('❌ Smoke test failed:', error);
      return false;
    }
  }
}

// Quick test functions for console use
export const quickTest = () => AISystemTester.quickSmokeTest();
export const fullTest = () => AISystemTester.runFullSystemTest();
export const testProviders = () => AISystemTester.testProviderStatus();
