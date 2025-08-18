/**
 * Platform Tester Service
 * Tests all platforms with real submissions to verify they work
 * Automatically blacklists non-responsive platforms
 */

import { supabase } from '@/integrations/supabase/client';

export interface PlatformTestResult {
  platformId: string;
  platformName: string;
  domain: string;
  isWorking: boolean;
  responseTime: number;
  error?: string;
  publishedUrl?: string;
  statusCode?: number;
  testData: {
    keyword: string;
    anchorText: string;
    targetUrl: string;
  };
  timestamp: string;
}

export interface BlacklistedPlatform {
  platformId: string;
  domain: string;
  reason: string;
  failureCount: number;
  lastFailure: string;
  blacklistedAt: string;
}

class PlatformTester {
  private testResults: Map<string, PlatformTestResult> = new Map();
  private blacklistedPlatforms: Set<string> = new Set();
  private isTestingInProgress = false;

  /**
   * Test all platforms with real submissions
   */
  async testAllPlatforms(testData: {
    keyword: string;
    anchorText: string;
    targetUrl: string;
  }): Promise<PlatformTestResult[]> {
    if (this.isTestingInProgress) {
      throw new Error('Platform testing already in progress');
    }

    this.isTestingInProgress = true;
    console.log('🧪 Starting comprehensive platform testing...');

    try {
      const platforms = await this.getAllPlatformsToTest();
      const results: PlatformTestResult[] = [];

      console.log(`📊 Testing ${platforms.length} platforms...`);

      // Test platforms in parallel with controlled concurrency
      const chunks = this.chunkArray(platforms, 3); // Test 3 at a time to avoid overwhelming APIs
      
      for (const chunk of chunks) {
        const chunkResults = await Promise.allSettled(
          chunk.map(platform => this.testSinglePlatform(platform, testData))
        );

        chunkResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
            this.testResults.set(result.value.platformId, result.value);
          } else {
            const platform = chunk[index];
            const failedResult: PlatformTestResult = {
              platformId: platform.id,
              platformName: platform.name,
              domain: platform.domain,
              isWorking: false,
              responseTime: 0,
              error: result.reason?.message || 'Test failed',
              testData,
              timestamp: new Date().toISOString()
            };
            results.push(failedResult);
            this.testResults.set(platform.id, failedResult);
          }
        });

        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Update blacklist based on results
      await this.updateBlacklist(results);

      // Save results to database
      await this.saveTestResults(results);

      console.log(`✅ Platform testing completed. ${results.filter(r => r.isWorking).length}/${results.length} platforms working`);
      
      return results;

    } finally {
      this.isTestingInProgress = false;
    }
  }

  /**
   * Test a single platform
   */
  private async testSinglePlatform(
    platform: any, 
    testData: { keyword: string; anchorText: string; targetUrl: string }
  ): Promise<PlatformTestResult> {
    const startTime = Date.now();
    console.log(`🔍 Testing platform: ${platform.name} (${platform.domain})`);

    try {
      let result: PlatformTestResult;

      // Test based on platform type
      switch (platform.id.toLowerCase()) {
        case 'telegraph':
        case 'telegraph.ph':
          result = await this.testTelegraphPlatform(platform, testData);
          break;
        
        case 'writeas':
        case 'write.as':
          result = await this.testWriteAsPlatform(platform, testData);
          break;
        
        case 'medium':
        case 'medium.com':
          result = await this.testMediumPlatform(platform, testData);
          break;
        
        case 'devto':
        case 'dev.to':
          result = await this.testDevToPlatform(platform, testData);
          break;
        
        case 'linkedin':
          result = await this.testLinkedInPlatform(platform, testData);
          break;
        
        case 'hashnode':
          result = await this.testHashnodePlatform(platform, testData);
          break;
        
        case 'substack':
          result = await this.testSubstackPlatform(platform, testData);
          break;
        
        default:
          result = await this.testGenericPlatform(platform, testData);
          break;
      }

      result.responseTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();

      console.log(`${result.isWorking ? '✅' : '��'} ${platform.name}: ${result.isWorking ? 'WORKING' : 'FAILED'} (${result.responseTime}ms)`);
      
      return result;

    } catch (error) {
      console.error(`❌ Error testing ${platform.name}:`, error);
      
      return {
        platformId: platform.id,
        platformName: platform.name,
        domain: platform.domain,
        isWorking: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        testData,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test Telegraph platform
   */
  private async testTelegraphPlatform(
    platform: any,
    testData: { keyword: string; anchorText: string; targetUrl: string }
  ): Promise<PlatformTestResult> {
    try {
      // Test via our working campaign processor
      const response = await fetch('/api/test-telegraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Test: ${testData.keyword}`,
          content: this.generateTestContent(testData),
          testMode: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.url) {
        // Verify the published URL is accessible
        const verifyResponse = await fetch(result.url, { method: 'HEAD' });
        
        return {
          platformId: platform.id,
          platformName: platform.name,
          domain: platform.domain,
          isWorking: verifyResponse.ok,
          responseTime: 0, // Will be set by caller
          publishedUrl: result.url,
          statusCode: verifyResponse.status,
          testData,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(result.error || 'Publishing failed');
      }

    } catch (error) {
      return {
        platformId: platform.id,
        platformName: platform.name,
        domain: platform.domain,
        isWorking: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Telegraph test failed',
        testData,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test Write.as platform
   */
  private async testWriteAsPlatform(
    platform: any,
    testData: { keyword: string; anchorText: string; targetUrl: string }
  ): Promise<PlatformTestResult> {
    try {
      // Test via our working campaign processor
      const response = await fetch('/api/test-writeas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Test: ${testData.keyword}`,
          content: this.generateTestContent(testData),
          testMode: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.url) {
        // Verify the published URL is accessible
        const verifyResponse = await fetch(result.url, { method: 'HEAD' });
        
        return {
          platformId: platform.id,
          platformName: platform.name,
          domain: platform.domain,
          isWorking: verifyResponse.ok,
          responseTime: 0,
          publishedUrl: result.url,
          statusCode: verifyResponse.status,
          testData,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(result.error || 'Publishing failed');
      }

    } catch (error) {
      return {
        platformId: platform.id,
        platformName: platform.name,
        domain: platform.domain,
        isWorking: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Write.as test failed',
        testData,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test Medium platform (expect failure - no implementation)
   */
  private async testMediumPlatform(
    platform: any,
    testData: { keyword: string; anchorText: string; targetUrl: string }
  ): Promise<PlatformTestResult> {
    // Medium requires OAuth authentication which we don't have implemented
    return {
      platformId: platform.id,
      platformName: platform.name,
      domain: platform.domain,
      isWorking: false,
      responseTime: 0,
      error: 'Medium publishing not implemented - requires OAuth authentication',
      testData,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test Dev.to platform (expect failure - no implementation)
   */
  private async testDevToPlatform(
    platform: any,
    testData: { keyword: string; anchorText: string; targetUrl: string }
  ): Promise<PlatformTestResult> {
    // Dev.to requires API key which we don't have implemented
    return {
      platformId: platform.id,
      platformName: platform.name,
      domain: platform.domain,
      isWorking: false,
      responseTime: 0,
      error: 'Dev.to publishing not implemented - requires API key authentication',
      testData,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test LinkedIn platform (expect failure - no implementation)
   */
  private async testLinkedInPlatform(
    platform: any,
    testData: { keyword: string; anchorText: string; targetUrl: string }
  ): Promise<PlatformTestResult> {
    return {
      platformId: platform.id,
      platformName: platform.name,
      domain: platform.domain,
      isWorking: false,
      responseTime: 0,
      error: 'LinkedIn publishing not implemented - requires LinkedIn API access',
      testData,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test Hashnode platform (expect failure - no implementation)
   */
  private async testHashnodePlatform(
    platform: any,
    testData: { keyword: string; anchorText: string; targetUrl: string }
  ): Promise<PlatformTestResult> {
    return {
      platformId: platform.id,
      platformName: platform.name,
      domain: platform.domain,
      isWorking: false,
      responseTime: 0,
      error: 'Hashnode publishing not implemented - requires GraphQL API integration',
      testData,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test Substack platform (expect failure - no implementation)
   */
  private async testSubstackPlatform(
    platform: any,
    testData: { keyword: string; anchorText: string; targetUrl: string }
  ): Promise<PlatformTestResult> {
    return {
      platformId: platform.id,
      platformName: platform.name,
      domain: platform.domain,
      isWorking: false,
      responseTime: 0,
      error: 'Substack publishing not implemented - requires authentication',
      testData,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test generic platform by checking if domain is accessible
   */
  private async testGenericPlatform(
    platform: any,
    testData: { keyword: string; anchorText: string; targetUrl: string }
  ): Promise<PlatformTestResult> {
    try {
      // For generic platforms, just test if the domain is accessible
      const response = await fetch(`https://${platform.domain}`, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      return {
        platformId: platform.id,
        platformName: platform.name,
        domain: platform.domain,
        isWorking: response.ok,
        responseTime: 0,
        statusCode: response.status,
        error: response.ok ? undefined : `Domain not accessible (HTTP ${response.status})`,
        testData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        platformId: platform.id,
        platformName: platform.name,
        domain: platform.domain,
        isWorking: false,
        responseTime: 0,
        error: `Domain accessibility test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        testData,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate test content for platform testing
   */
  private generateTestContent(testData: { keyword: string; anchorText: string; targetUrl: string }): string {
    return `
# Platform Test Article: ${testData.keyword}

This is a test article to verify platform functionality. 

## Test Content

We are testing the ability to publish content about ${testData.keyword} and include a link.

For more information about ${testData.keyword}, you can [${testData.anchorText}](${testData.targetUrl}).

## Test Details

- **Keyword**: ${testData.keyword}
- **Anchor Text**: ${testData.anchorText}
- **Target URL**: ${testData.targetUrl}
- **Test Time**: ${new Date().toISOString()}

This is an automated test to verify platform publishing capabilities.
`.trim();
  }

  /**
   * Get all platforms that need testing
   */
  private async getAllPlatformsToTest(): Promise<any[]> {
    // Get platforms from both basic config and massive platform database
    const basicPlatforms = [
      { id: 'telegraph', name: 'Telegraph.ph', domain: 'telegra.ph' },
      { id: 'writeas', name: 'Write.as', domain: 'write.as' },
      { id: 'medium', name: 'Medium.com', domain: 'medium.com' },
      { id: 'devto', name: 'Dev.to', domain: 'dev.to' },
      { id: 'linkedin', name: 'LinkedIn Articles', domain: 'linkedin.com' },
      { id: 'hashnode', name: 'Hashnode', domain: 'hashnode.com' },
      { id: 'substack', name: 'Substack', domain: 'substack.com' }
    ];

    // Also test platforms from massive database (sample)
    try {
      const { massivePlatformManager } = await import('./massivePlatformManager');
      const massivePlatforms = massivePlatformManager.getPlatforms({ maxDifficulty: 'medium' }).slice(0, 10);
      
      const additionalPlatforms = massivePlatforms.map(platform => ({
        id: platform.id,
        name: platform.name,
        domain: platform.domain
      }));

      return [...basicPlatforms, ...additionalPlatforms];
    } catch (error) {
      console.warn('Could not load massive platforms for testing, using basic platforms only');
      return basicPlatforms;
    }
  }

  /**
   * Update blacklist based on test results
   */
  private async updateBlacklist(results: PlatformTestResult[]): Promise<void> {
    const failedPlatforms = results.filter(r => !r.isWorking);
    
    for (const failed of failedPlatforms) {
      this.blacklistedPlatforms.add(failed.platformId);
      
      // Save to database
      await this.addToBlacklist({
        platformId: failed.platformId,
        domain: failed.domain,
        reason: failed.error || 'Platform test failed',
        failureCount: 1,
        lastFailure: failed.timestamp,
        blacklistedAt: new Date().toISOString()
      });
    }
  }

  /**
   * Add platform to blacklist
   */
  private async addToBlacklist(blacklistedPlatform: BlacklistedPlatform): Promise<void> {
    try {
      const { error } = await supabase
        .from('platform_blacklist')
        .upsert({
          platform_id: blacklistedPlatform.platformId,
          domain: blacklistedPlatform.domain,
          reason: blacklistedPlatform.reason,
          failure_count: blacklistedPlatform.failureCount,
          last_failure: blacklistedPlatform.lastFailure,
          blacklisted_at: blacklistedPlatform.blacklistedAt,
          is_active: true
        });

      if (error) {
        console.warn('Error adding platform to blacklist:', error);
      } else {
        console.log(`🚫 Blacklisted platform: ${blacklistedPlatform.platformId} (${blacklistedPlatform.reason})`);
      }
    } catch (error) {
      console.warn('Error saving blacklist entry:', error);
    }
  }

  /**
   * Save test results to database
   */
  private async saveTestResults(results: PlatformTestResult[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('platform_test_results')
        .insert(
          results.map(result => ({
            platform_id: result.platformId,
            platform_name: result.platformName,
            domain: result.domain,
            is_working: result.isWorking,
            response_time: result.responseTime,
            error_message: result.error,
            published_url: result.publishedUrl,
            status_code: result.statusCode,
            test_keyword: result.testData.keyword,
            test_anchor_text: result.testData.anchorText,
            test_target_url: result.testData.targetUrl,
            tested_at: result.timestamp
          }))
        );

      if (error) {
        console.warn('Error saving test results:', error);
      } else {
        console.log(`💾 Saved ${results.length} test results to database`);
      }
    } catch (error) {
      console.warn('Error saving test results:', error);
    }
  }

  /**
   * Get working platforms only
   */
  getWorkingPlatforms(): PlatformTestResult[] {
    return Array.from(this.testResults.values()).filter(result => result.isWorking);
  }

  /**
   * Get blacklisted platforms
   */
  getBlacklistedPlatforms(): string[] {
    return Array.from(this.blacklistedPlatforms);
  }

  /**
   * Check if platform is blacklisted
   */
  isPlatformBlacklisted(platformId: string): boolean {
    return this.blacklistedPlatforms.has(platformId);
  }

  /**
   * Get test results summary
   */
  getTestSummary(): {
    total: number;
    working: number;
    failed: number;
    blacklisted: number;
    workingPlatforms: string[];
    failedPlatforms: string[];
  } {
    const results = Array.from(this.testResults.values());
    const working = results.filter(r => r.isWorking);
    const failed = results.filter(r => !r.isWorking);

    return {
      total: results.length,
      working: working.length,
      failed: failed.length,
      blacklisted: this.blacklistedPlatforms.size,
      workingPlatforms: working.map(r => r.platformName),
      failedPlatforms: failed.map(r => r.platformName)
    };
  }

  /**
   * Utility: Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Export singleton instance
export const platformTester = new PlatformTester();
export default platformTester;
