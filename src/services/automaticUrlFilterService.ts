/**
 * Automatic URL Filtration Service
 * Tests and filters target platforms based on API availability and functionality
 * Removes platforms that can't post content immediately or retrieve live URLs
 */

import { targetSitesManager, type TargetSite } from './targetSitesManager';
import { automationLogger } from './automationLogger';

export interface PlatformTest {
  platform: string;
  url: string;
  tests: {
    apiAvailable: boolean;
    authenticationWorking: boolean;
    immediatePosting: boolean;
    urlRetrieval: boolean;
  };
  result: 'pass' | 'fail';
  reason?: string;
  responseTime?: number;
}

export interface FilterResults {
  totalTested: number;
  passed: number;
  failed: number;
  removed: string[];
  kept: string[];
  tests: PlatformTest[];
}

class AutomaticUrlFilterService {
  private readonly TIMEOUT_MS = 10000; // 10 seconds max per test
  private readonly TEST_CONTENT = {
    title: 'Automated Test Post',
    content: 'This is a test post to verify API functionality and immediate URL retrieval.',
    author: 'API Tester'
  };

  async filterAllPlatforms(): Promise<FilterResults> {
    automationLogger.info('system', 'Starting automatic URL filtration process');
    
    // Get all current target sites
    await targetSitesManager.loadSites();
    const allSites = targetSitesManager.getAllSites();
    
    const results: FilterResults = {
      totalTested: allSites.length,
      passed: 0,
      failed: 0,
      removed: [],
      kept: [],
      tests: []
    };

    // Test each platform
    for (const site of allSites) {
      const test = await this.testPlatform(site);
      results.tests.push(test);
      
      if (test.result === 'pass') {
        results.passed++;
        results.kept.push(site.domain);
        automationLogger.info('url_filtration', `Platform passed: ${site.domain}`);
      } else {
        results.failed++;
        results.removed.push(site.domain);
        automationLogger.warn('url_filtration', `Platform failed: ${site.domain} - ${test.reason}`);
        
        // Mark site as inactive in the system
        await this.deactivatePlatform(site);
      }
    }

    automationLogger.info('system', 'URL filtration completed', {
      total: results.totalTested,
      passed: results.passed,
      failed: results.failed,
      removed: results.removed
    });

    return results;
  }

  private async testPlatform(site: TargetSite): Promise<PlatformTest> {
    const startTime = Date.now();
    
    const test: PlatformTest = {
      platform: site.domain,
      url: site.url,
      tests: {
        apiAvailable: false,
        authenticationWorking: false,
        immediatePosting: false,
        urlRetrieval: false
      },
      result: 'fail'
    };

    try {
      // Test based on platform type
      switch (site.domain) {
        case 'telegra.ph':
          await this.testTelegraph(test);
          break;
        case 'medium.com':
          await this.testMedium(test);
          break;
        case 'dev.to':
          await this.testDevTo(test);
          break;
        case 'hashnode.com':
          await this.testHashnode(test);
          break;
        default:
          await this.testGenericPlatform(test, site);
      }

      // Platform passes if it meets all requirements
      const allTestsPassed = Object.values(test.tests).every(result => result);
      test.result = allTestsPassed ? 'pass' : 'fail';
      
      if (test.result === 'fail') {
        test.reason = this.getFailureReason(test.tests);
      }

    } catch (error) {
      test.result = 'fail';
      test.reason = `Test failed with error: ${error instanceof Error ? error.message : String(error)}`;
      automationLogger.error('url_filtration', `Platform test error: ${site.domain}`, {}, undefined, error as Error);
    }

    test.responseTime = Date.now() - startTime;
    return test;
  }

  private async testTelegraph(test: PlatformTest): Promise<void> {
    try {
      // Test Telegraph API through our Netlify function
      const response = await this.timeoutFetch('/.netlify/functions/telegraph-publisher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: this.TEST_CONTENT.title,
          content: this.TEST_CONTENT.content,
          author_name: this.TEST_CONTENT.author
        })
      });

      test.tests.apiAvailable = response.status !== 404;
      
      if (response.ok) {
        const result = await response.json();
        test.tests.authenticationWorking = true; // Telegraph doesn't require auth
        test.tests.immediatePosting = result.success === true;
        test.tests.urlRetrieval = !!(result.url && result.url.startsWith('https://'));
      }

    } catch (error) {
      automationLogger.error('url_filtration', 'Telegraph test failed', {}, undefined, error as Error);
    }
  }

  private async testMedium(test: PlatformTest): Promise<void> {
    // Medium requires OAuth and API setup - mark as failed
    test.tests.apiAvailable = true; // API exists but not implemented
    test.tests.authenticationWorking = false;
    test.tests.immediatePosting = false;
    test.tests.urlRetrieval = false;
  }

  private async testDevTo(test: PlatformTest): Promise<void> {
    // Dev.to has API but requires authentication setup
    test.tests.apiAvailable = true;
    test.tests.authenticationWorking = false;
    test.tests.immediatePosting = false;
    test.tests.urlRetrieval = false;
  }

  private async testHashnode(test: PlatformTest): Promise<void> {
    // Hashnode has GraphQL API but requires setup
    test.tests.apiAvailable = true;
    test.tests.authenticationWorking = false;
    test.tests.immediatePosting = false;
    test.tests.urlRetrieval = false;
  }

  private async testGenericPlatform(test: PlatformTest, site: TargetSite): Promise<void> {
    // For platforms without known APIs, check if they have any publishing endpoint
    try {
      // Check if platform responds to basic requests
      const response = await this.timeoutFetch(site.url, { method: 'GET' });
      test.tests.apiAvailable = response.ok;
      
      // Without specific API implementation, these will fail
      test.tests.authenticationWorking = false;
      test.tests.immediatePosting = false;
      test.tests.urlRetrieval = false;
      
    } catch (error) {
      // Platform is not accessible
      test.tests.apiAvailable = false;
    }
  }

  private async timeoutFetch(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private getFailureReason(tests: PlatformTest['tests']): string {
    const failures: string[] = [];
    
    if (!tests.apiAvailable) failures.push('No API available');
    if (!tests.authenticationWorking) failures.push('Authentication not working');
    if (!tests.immediatePosting) failures.push('Cannot post immediately');
    if (!tests.urlRetrieval) failures.push('Cannot retrieve live URL');
    
    return failures.join(', ');
  }

  private async deactivatePlatform(site: TargetSite): Promise<void> {
    try {
      // Mark site as inactive
      site.status = 'inactive';
      
      // Log deactivation
      automationLogger.warn('url_filtration', `Platform deactivated: ${site.domain}`, {
        reason: 'Failed automated filtration tests',
        domain: site.domain,
        url: site.url
      });

      // In a real implementation, you might want to update the database
      // For now, we'll just mark it as inactive in memory
      
    } catch (error) {
      automationLogger.error('url_filtration', `Failed to deactivate platform: ${site.domain}`, {}, undefined, error as Error);
    }
  }

  // Get only working platforms
  async getWorkingPlatforms(): Promise<TargetSite[]> {
    await targetSitesManager.loadSites();
    const allSites = targetSitesManager.getAllSites();
    
    // Filter to only active sites that we know work
    return allSites.filter(site => {
      // Only keep Telegraph for now as it's the only one we know works
      return site.status === 'active' && site.domain === 'telegra.ph';
    });
  }

  // Get curated list of platforms with confirmed working APIs
  getCuratedWorkingPlatforms(): TargetSite[] {
    const workingPlatforms: TargetSite[] = [
      {
        id: 'telegraph-working',
        domain: 'telegra.ph',
        url: 'https://telegra.ph',
        type: 'blog',
        status: 'active',
        domain_rating: 85,
        success_rate: 95,
        total_attempts: 0,
        successful_submissions: 0,
        requirements: {
          min_word_count: 200,
          topics: ['any'],
          approval_process: false,
          registration_required: false
        },
        metadata: {
          submission_guidelines: 'Anonymous instant publishing platform with working API',
          response_time_hours: 0,
          notes: 'Fully automated posting via Telegraph API - confirmed working'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return workingPlatforms;
  }

  // Run periodic filtration (can be called on schedule)
  async runPeriodicFiltration(): Promise<FilterResults> {
    automationLogger.info('system', 'Running periodic platform filtration check');
    
    const results = await this.filterAllPlatforms();
    
    // If too many platforms failed, log a warning
    if (results.failed > results.passed) {
      automationLogger.warn('system', 'High platform failure rate detected', {
        failed: results.failed,
        passed: results.passed,
        failureRate: Math.round((results.failed / results.totalTested) * 100)
      });
    }

    return results;
  }

  // Test a single platform on demand
  async testSinglePlatform(domain: string): Promise<PlatformTest | null> {
    await targetSitesManager.loadSites();
    const site = targetSitesManager.getAllSites().find(s => s.domain === domain);
    
    if (!site) {
      automationLogger.warn('url_filtration', `Platform not found for testing: ${domain}`);
      return null;
    }

    return await this.testPlatform(site);
  }

  // Get summary of platform status
  async getPlatformSummary(): Promise<{
    total: number;
    working: number;
    broken: number;
    workingPlatforms: string[];
    brokenPlatforms: string[];
  }> {
    const results = await this.filterAllPlatforms();
    
    return {
      total: results.totalTested,
      working: results.passed,
      broken: results.failed,
      workingPlatforms: results.kept,
      brokenPlatforms: results.removed
    };
  }

  // Override target sites manager to only use working platforms
  async overrideTargetSites(): Promise<void> {
    const workingPlatforms = this.getCuratedWorkingPlatforms();
    
    // Replace the sites in target sites manager
    (targetSitesManager as any).sites = workingPlatforms;
    (targetSitesManager as any).isLoaded = true;
    
    automationLogger.info('system', `Target sites overridden with ${workingPlatforms.length} working platforms`, {
      platforms: workingPlatforms.map(p => p.domain)
    });
  }
}

export const automaticUrlFilterService = new AutomaticUrlFilterService();

// Export for window debugging in development
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  (window as any).automaticUrlFilterService = automaticUrlFilterService;
  console.log('🔧 Automatic URL filter service available at window.automaticUrlFilterService');
}

export default automaticUrlFilterService;
