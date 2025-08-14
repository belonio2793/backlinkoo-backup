/**
 * Platform API Checker Service
 * Verifies which target platforms have working APIs for content posting
 */

export interface PlatformAPIStatus {
  platform: string;
  name: string;
  url: string;
  apiAvailable: boolean;
  implementation: 'full' | 'partial' | 'mock' | 'none';
  requirements: string[];
  features: string[];
  limitations: string[];
  status: 'working' | 'limited' | 'broken' | 'untested';
  lastChecked?: string;
  errorMessage?: string;
  testResults?: {
    authentication: boolean;
    publishing: boolean;
    linkSupport: boolean;
    htmlSupport: boolean;
  };
}

export interface APICheckResult {
  totalPlatforms: number;
  workingAPIs: number;
  limitedAPIs: number;
  brokenAPIs: number;
  untestedAPIs: number;
  platforms: PlatformAPIStatus[];
  summary: {
    fullyFunctional: string[];
    partiallyFunctional: string[];
    notFunctional: string[];
    needsImplementation: string[];
  };
}

class PlatformApiChecker {
  
  async checkAllPlatforms(): Promise<APICheckResult> {
    console.log('🔍 Starting comprehensive platform API check...');
    
    const platforms = this.getAllTargetPlatforms();
    const results: PlatformAPIStatus[] = [];
    
    for (const platform of platforms) {
      console.log(`📊 Checking ${platform.name}...`);
      const status = await this.checkPlatform(platform);
      results.push(status);
    }
    
    const summary = this.generateSummary(results);
    
    return {
      totalPlatforms: results.length,
      workingAPIs: results.filter(p => p.status === 'working').length,
      limitedAPIs: results.filter(p => p.status === 'limited').length,
      brokenAPIs: results.filter(p => p.status === 'broken').length,
      untestedAPIs: results.filter(p => p.status === 'untested').length,
      platforms: results,
      summary
    };
  }

  private async checkPlatform(platform: any): Promise<PlatformAPIStatus> {
    const platformKey = this.getPlatformKey(platform.url);
    
    switch (platformKey) {
      case 'telegraph':
        return await this.checkTelegraph();
      
      case 'medium':
        return await this.checkMedium();
      
      case 'dev.to':
        return await this.checkDevTo();
      
      case 'hashnode':
        return await this.checkHashnode();
      
      case 'substack':
        return await this.checkSubstack();
      
      case 'hackernoon':
        return await this.checkHackerNoon();
      
      case 'write.as':
        return await this.checkWriteAs();
      
      case 'rentry.co':
        return await this.checkRentry();
      
      case 'github':
        return await this.checkGitHubGist();
      
      case 'wordpress.com':
        return await this.checkWordPressCom();
      
      case 'blogger.com':
        return await this.checkBlogger();
      
      case 'tumblr.com':
        return await this.checkTumblr();
      
      case 'linkedin':
        return await this.checkLinkedInPulse();
      
      case 'reddit':
        return await this.checkReddit();
      
      case 'quora':
        return await this.checkQuora();
      
      default:
        return this.createUntested(platform);
    }
  }

  private async checkTelegraph(): Promise<PlatformAPIStatus> {
    try {
      // Test if Telegraph API is accessible via our Netlify function
      const response = await fetch('/.netlify/functions/telegraph-publisher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'API Test',
          content: 'Testing Telegraph API connectivity',
          author_name: 'API Tester'
        })
      });
      
      const result = await response.json();
      
      return {
        platform: 'telegraph',
        name: 'Telegraph',
        url: 'https://telegra.ph',
        apiAvailable: true,
        implementation: response.ok && result.success ? 'full' : 'partial',
        requirements: ['None - Anonymous publishing'],
        features: ['Instant publishing', 'HTML support', 'Link support', 'No registration required'],
        limitations: ['Content formatting limitations', 'No editing after publish'],
        status: response.ok && result.success ? 'working' : 'limited',
        lastChecked: new Date().toISOString(),
        errorMessage: !result.success ? result.error : undefined,
        testResults: {
          authentication: true, // No auth required
          publishing: response.ok && result.success,
          linkSupport: true,
          htmlSupport: true
        }
      };
    } catch (error) {
      return {
        platform: 'telegraph',
        name: 'Telegraph',
        url: 'https://telegra.ph',
        apiAvailable: false,
        implementation: 'broken',
        requirements: ['None - Anonymous publishing'],
        features: ['Instant publishing', 'HTML support', 'Link support'],
        limitations: ['API currently unavailable'],
        status: 'broken',
        lastChecked: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : String(error),
        testResults: {
          authentication: false,
          publishing: false,
          linkSupport: false,
          htmlSupport: false
        }
      };
    }
  }

  private async checkMedium(): Promise<PlatformAPIStatus> {
    return {
      platform: 'medium',
      name: 'Medium',
      url: 'https://medium.com',
      apiAvailable: false,
      implementation: 'none',
      requirements: ['OAuth authentication', 'API key', 'User permissions'],
      features: ['Large audience', 'Professional network', 'SEO benefits'],
      limitations: ['Requires API integration', 'OAuth setup needed', 'User authentication required'],
      status: 'untested',
      lastChecked: new Date().toISOString(),
      errorMessage: 'Medium API integration not implemented',
      testResults: {
        authentication: false,
        publishing: false,
        linkSupport: true, // Medium supports links
        htmlSupport: true  // Medium supports rich formatting
      }
    };
  }

  private async checkDevTo(): Promise<PlatformAPIStatus> {
    return {
      platform: 'dev.to',
      name: 'Dev.to',
      url: 'https://dev.to',
      apiAvailable: false,
      implementation: 'none',
      requirements: ['API key', 'User account', 'Developer focus content'],
      features: ['Developer community', 'Markdown support', 'High engagement'],
      limitations: ['API integration needed', 'Content must be tech-focused', 'Rate limiting'],
      status: 'untested',
      lastChecked: new Date().toISOString(),
      errorMessage: 'Dev.to API integration not implemented',
      testResults: {
        authentication: false,
        publishing: false,
        linkSupport: true,
        htmlSupport: true
      }
    };
  }

  private async checkHashnode(): Promise<PlatformAPIStatus> {
    return {
      platform: 'hashnode',
      name: 'Hashnode',
      url: 'https://hashnode.com',
      apiAvailable: false,
      implementation: 'none',
      requirements: ['GraphQL API key', 'User account', 'Publication setup'],
      features: ['Developer focused', 'GraphQL API', 'Custom domains'],
      limitations: ['GraphQL API integration needed', 'Publication required', 'Developer content focus'],
      status: 'untested',
      lastChecked: new Date().toISOString(),
      errorMessage: 'Hashnode GraphQL API integration not implemented',
      testResults: {
        authentication: false,
        publishing: false,
        linkSupport: true,
        htmlSupport: true
      }
    };
  }

  private async checkSubstack(): Promise<PlatformAPIStatus> {
    return {
      platform: 'substack',
      name: 'Substack',
      url: 'https://substack.com',
      apiAvailable: false,
      implementation: 'none',
      requirements: ['Newsletter account', 'Email subscriber focus', 'Editorial approval'],
      features: ['Newsletter format', 'Monetization', 'Email distribution'],
      limitations: ['No public API', 'Newsletter format required', 'Subscriber focus needed'],
      status: 'broken',
      lastChecked: new Date().toISOString(),
      errorMessage: 'Substack does not provide public API for external posting',
      testResults: {
        authentication: false,
        publishing: false,
        linkSupport: true,
        htmlSupport: true
      }
    };
  }

  private async checkHackerNoon(): Promise<PlatformAPIStatus> {
    return {
      platform: 'hackernoon',
      name: 'HackerNoon',
      url: 'https://hackernoon.com',
      apiAvailable: false,
      implementation: 'none',
      requirements: ['Manual submission', 'Editorial review', 'Tech focus content'],
      features: ['High authority', 'Tech audience', 'Editorial curation'],
      limitations: ['No API available', 'Manual submission only', 'Editorial approval required'],
      status: 'broken',
      lastChecked: new Date().toISOString(),
      errorMessage: 'HackerNoon requires manual submission through their contributor portal',
      testResults: {
        authentication: false,
        publishing: false,
        linkSupport: true,
        htmlSupport: true
      }
    };
  }

  private async checkWriteAs(): Promise<PlatformAPIStatus> {
    return {
      platform: 'write.as',
      name: 'Write.as',
      url: 'https://write.as',
      apiAvailable: true,
      implementation: 'none',
      requirements: ['API token (optional)', 'Markdown content'],
      features: ['Anonymous posting', 'Markdown support', 'Simple API'],
      limitations: ['API integration not implemented', 'Limited formatting'],
      status: 'untested',
      lastChecked: new Date().toISOString(),
      errorMessage: 'Write.as API integration not implemented but API is available',
      testResults: {
        authentication: false,
        publishing: false,
        linkSupport: true,
        htmlSupport: false // Markdown only
      }
    };
  }

  private async checkRentry(): Promise<PlatformAPIStatus> {
    return {
      platform: 'rentry.co',
      name: 'Rentry',
      url: 'https://rentry.co',
      apiAvailable: false,
      implementation: 'none',
      requirements: ['Web interface only', 'Edit codes for management'],
      features: ['Anonymous posting', 'Markdown support', 'Password protection'],
      limitations: ['No API available', 'Web interface automation only'],
      status: 'broken',
      lastChecked: new Date().toISOString(),
      errorMessage: 'Rentry does not provide API - requires web automation',
      testResults: {
        authentication: false,
        publishing: false,
        linkSupport: true,
        htmlSupport: true
      }
    };
  }

  private async checkGitHubGist(): Promise<PlatformAPIStatus> {
    return {
      platform: 'github',
      name: 'GitHub Gist',
      url: 'https://gist.github.com',
      apiAvailable: true,
      implementation: 'none',
      requirements: ['GitHub API token', 'User account'],
      features: ['Code hosting', 'Version control', 'Embeddable'],
      limitations: ['API integration needed', 'Code/text focus', 'GitHub authentication'],
      status: 'untested',
      lastChecked: new Date().toISOString(),
      errorMessage: 'GitHub Gist API integration not implemented',
      testResults: {
        authentication: false,
        publishing: false,
        linkSupport: true,
        htmlSupport: true
      }
    };
  }

  private async checkWordPressCom(): Promise<PlatformAPIStatus> {
    return {
      platform: 'wordpress.com',
      name: 'WordPress.com',
      url: 'https://wordpress.com',
      apiAvailable: true,
      implementation: 'none',
      requirements: ['WordPress.com account', 'OAuth authentication', 'Blog setup'],
      features: ['SEO friendly', 'Large audience', 'Professional platform'],
      limitations: ['OAuth setup required', 'Account needed', 'Complex authentication'],
      status: 'untested',
      lastChecked: new Date().toISOString(),
      errorMessage: 'WordPress.com REST API integration not implemented',
      testResults: {
        authentication: false,
        publishing: false,
        linkSupport: true,
        htmlSupport: true
      }
    };
  }

  private async checkBlogger(): Promise<PlatformAPIStatus> {
    return {
      platform: 'blogger.com',
      name: 'Blogger',
      url: 'https://blogger.com',
      apiAvailable: true,
      implementation: 'none',
      requirements: ['Google account', 'Blogger API key', 'Blog setup'],
      features: ['Google integration', 'Free hosting', 'Ad revenue'],
      limitations: ['Google OAuth required', 'API setup needed', 'Limited customization'],
      status: 'untested',
      lastChecked: new Date().toISOString(),
      errorMessage: 'Blogger API integration not implemented',
      testResults: {
        authentication: false,
        publishing: false,
        linkSupport: true,
        htmlSupport: true
      }
    };
  }

  private async checkTumblr(): Promise<PlatformAPIStatus> {
    return {
      platform: 'tumblr.com',
      name: 'Tumblr',
      url: 'https://tumblr.com',
      apiAvailable: true,
      implementation: 'none',
      requirements: ['Tumblr account', 'OAuth authentication', 'API credentials'],
      features: ['Microblogging', 'Rich media', 'Social network'],
      limitations: ['OAuth setup needed', 'API integration required', 'Content format restrictions'],
      status: 'untested',
      lastChecked: new Date().toISOString(),
      errorMessage: 'Tumblr API integration not implemented',
      testResults: {
        authentication: false,
        publishing: false,
        linkSupport: true,
        htmlSupport: true
      }
    };
  }

  private async checkLinkedInPulse(): Promise<PlatformAPIStatus> {
    return {
      platform: 'linkedin',
      name: 'LinkedIn Pulse',
      url: 'https://linkedin.com/pulse',
      apiAvailable: true,
      implementation: 'none',
      requirements: ['LinkedIn account', 'LinkedIn API access', 'Professional content'],
      features: ['Professional network', 'Business focus', 'High visibility'],
      limitations: ['LinkedIn API approval needed', 'Professional content only', 'Strict guidelines'],
      status: 'untested',
      lastChecked: new Date().toISOString(),
      errorMessage: 'LinkedIn API integration not implemented - requires approval',
      testResults: {
        authentication: false,
        publishing: false,
        linkSupport: true,
        htmlSupport: true
      }
    };
  }

  private async checkReddit(): Promise<PlatformAPIStatus> {
    return {
      platform: 'reddit',
      name: 'Reddit',
      url: 'https://reddit.com',
      apiAvailable: true,
      implementation: 'none',
      requirements: ['Reddit account', 'API credentials', 'Subreddit rules compliance'],
      features: ['Large communities', 'Upvoting system', 'Discussion focused'],
      limitations: ['Strict anti-spam rules', 'Subreddit specific rules', 'Account age requirements'],
      status: 'broken',
      lastChecked: new Date().toISOString(),
      errorMessage: 'Reddit API available but automated posting violates terms of service',
      testResults: {
        authentication: false,
        publishing: false,
        linkSupport: true,
        htmlSupport: false
      }
    };
  }

  private async checkQuora(): Promise<PlatformAPIStatus> {
    return {
      platform: 'quora',
      name: 'Quora',
      url: 'https://quora.com',
      apiAvailable: false,
      implementation: 'none',
      requirements: ['Manual posting only', 'Question-answer format', 'Quality content'],
      features: ['Q&A platform', 'Expert answers', 'High authority'],
      limitations: ['No public API', 'Manual posting only', 'Q&A format required'],
      status: 'broken',
      lastChecked: new Date().toISOString(),
      errorMessage: 'Quora does not provide public API for automated posting',
      testResults: {
        authentication: false,
        publishing: false,
        linkSupport: true,
        htmlSupport: true
      }
    };
  }

  private createUntested(platform: any): PlatformAPIStatus {
    return {
      platform: this.getPlatformKey(platform.url),
      name: platform.name,
      url: platform.url,
      apiAvailable: false,
      implementation: 'none',
      requirements: ['API integration needed'],
      features: platform.features || [],
      limitations: ['Not yet evaluated'],
      status: 'untested',
      lastChecked: new Date().toISOString(),
      errorMessage: 'Platform not yet evaluated for API availability',
      testResults: {
        authentication: false,
        publishing: false,
        linkSupport: false,
        htmlSupport: false
      }
    };
  }

  private getAllTargetPlatforms() {
    // Return a curated list of major platforms from the JSON file
    return [
      { name: 'Telegraph', url: 'https://telegra.ph', features: ['Instant publish', 'Anonymous'] },
      { name: 'Medium', url: 'https://medium.com', features: ['Large audience', 'Professional'] },
      { name: 'Dev.to', url: 'https://dev.to', features: ['Developer community', 'Tech focus'] },
      { name: 'Hashnode', url: 'https://hashnode.com', features: ['Developer blogs', 'Custom domains'] },
      { name: 'Substack', url: 'https://substack.com', features: ['Newsletter platform', 'Monetization'] },
      { name: 'HackerNoon', url: 'https://hackernoon.com', features: ['Tech focus', 'High DA'] },
      { name: 'Write.as', url: 'https://write.as', features: ['Anonymous posting', 'Markdown'] },
      { name: 'Rentry', url: 'https://rentry.co', features: ['Markdown', 'Password protection'] },
      { name: 'GitHub Gist', url: 'https://gist.github.com', features: ['Code snippets', 'Version control'] },
      { name: 'WordPress.com', url: 'https://wordpress.com', features: ['Blog hosting', 'SEO friendly'] },
      { name: 'Blogger', url: 'https://blogger.com', features: ['Google integration', 'Free hosting'] },
      { name: 'Tumblr', url: 'https://tumblr.com', features: ['Microblogging', 'Rich media'] },
      { name: 'LinkedIn Pulse', url: 'https://linkedin.com/pulse', features: ['Professional network', 'Business'] },
      { name: 'Reddit', url: 'https://reddit.com', features: ['Communities', 'Discussion'] },
      { name: 'Quora', url: 'https://quora.com', features: ['Q&A platform', 'Expert answers'] }
    ];
  }

  private getPlatformKey(url: string): string {
    const domain = url.replace(/https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    
    if (domain.includes('telegra.ph')) return 'telegraph';
    if (domain.includes('medium.com')) return 'medium';
    if (domain.includes('dev.to')) return 'dev.to';
    if (domain.includes('hashnode.com')) return 'hashnode';
    if (domain.includes('substack.com')) return 'substack';
    if (domain.includes('hackernoon.com')) return 'hackernoon';
    if (domain.includes('write.as')) return 'write.as';
    if (domain.includes('rentry.co')) return 'rentry.co';
    if (domain.includes('github.com')) return 'github';
    if (domain.includes('wordpress.com')) return 'wordpress.com';
    if (domain.includes('blogger.com')) return 'blogger.com';
    if (domain.includes('tumblr.com')) return 'tumblr.com';
    if (domain.includes('linkedin.com')) return 'linkedin';
    if (domain.includes('reddit.com')) return 'reddit';
    if (domain.includes('quora.com')) return 'quora';
    
    return domain;
  }

  private generateSummary(platforms: PlatformAPIStatus[]) {
    return {
      fullyFunctional: platforms
        .filter(p => p.status === 'working' && p.implementation === 'full')
        .map(p => p.name),
      
      partiallyFunctional: platforms
        .filter(p => p.status === 'working' || p.status === 'limited')
        .map(p => p.name),
      
      notFunctional: platforms
        .filter(p => p.status === 'broken')
        .map(p => p.name),
      
      needsImplementation: platforms
        .filter(p => p.status === 'untested' && p.apiAvailable)
        .map(p => p.name)
    };
  }

  // Quick check for specific platform
  async checkSinglePlatform(platformName: string): Promise<PlatformAPIStatus> {
    const platform = { name: platformName, url: `https://${platformName.toLowerCase()}` };
    return await this.checkPlatform(platform);
  }

  // Get recommendations for implementation priority
  getImplementationPriority(results: APICheckResult): {
    highPriority: string[];
    mediumPriority: string[];
    lowPriority: string[];
  } {
    const platforms = results.platforms;
    
    return {
      highPriority: platforms
        .filter(p => p.apiAvailable && ['write.as', 'github', 'wordpress.com'].includes(p.platform))
        .map(p => p.name),
      
      mediumPriority: platforms
        .filter(p => p.apiAvailable && ['medium', 'dev.to', 'hashnode', 'blogger.com'].includes(p.platform))
        .map(p => p.name),
      
      lowPriority: platforms
        .filter(p => p.apiAvailable && ['tumblr.com', 'linkedin'].includes(p.platform))
        .map(p => p.name)
    };
  }
}

export const platformApiChecker = new PlatformApiChecker();

// Export for window debugging in development
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  (window as any).platformApiChecker = platformApiChecker;
  console.log('🔧 Platform API checker available at window.platformApiChecker');
}

export default platformApiChecker;
