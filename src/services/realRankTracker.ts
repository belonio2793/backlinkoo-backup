/**
 * Real Rank Tracker Service
 * 
 * Uses server-side Netlify function to perform actual Google search scraping
 * without CORS limitations. Falls back to intelligent simulation if needed.
 */

export interface RealRankingResult {
  keyword: string;
  targetUrl: string;
  position: number | null;
  found: boolean;
  searchEngine: string;
  location: string;
  totalResults: number;
  competitorAnalysis: CompetitorResult[];
  timestamp: string;
  searchUrl: string;
  confidence: 'high' | 'medium' | 'low';
  method: 'server-scrape' | 'simulation';
  processingTime?: number;
}

export interface CompetitorResult {
  position: number;
  url: string;
  domain: string;
  title: string;
  description: string;
  estimatedTraffic?: number;
}

export interface RankTrackingParams {
  targetUrl: string;
  keyword: string;
  country?: string;
  device?: 'desktop' | 'mobile';
  numResults?: number;
}

export class RealRankTracker {
  private static activeRequests = new Map<string, Promise<RealRankingResult>>();

  /**
   * Check real Google rankings using server-side scraping
   */
  static async checkRanking(params: RankTrackingParams): Promise<RealRankingResult> {
    const startTime = Date.now();

    // Create a unique key for request deduplication
    const requestKey = `${params.targetUrl}-${params.keyword}-${params.country || 'US'}`;

    // If there's already an active request for this exact same parameters, return that promise
    if (this.activeRequests.has(requestKey)) {
      console.log('🔄 Reusing active request for:', requestKey);
      return this.activeRequests.get(requestKey)!;
    }

    // Create new request promise
    const requestPromise = this.performRankCheck(params, startTime);

    // Store the promise to prevent duplicate requests
    this.activeRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up the active request when done
      this.activeRequests.delete(requestKey);
    }
  }

  private static async performRankCheck(params: RankTrackingParams, startTime: number, retryCount = 0): Promise<RealRankingResult> {
    const maxRetries = 2;

    try {
      console.log('🚀 Starting REAL rank tracking:', params, retryCount > 0 ? `(retry ${retryCount})` : '');

      // Call our Netlify function for server-side scraping with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/.netlify/functions/rank-checker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          targetUrl: params.targetUrl,
          keyword: params.keyword,
          country: params.country || 'US',
          device: params.device || 'desktop',
          numResults: params.numResults || 100,
          timestamp: Date.now() // Add timestamp to prevent caching issues
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check if response is valid
      if (!response) {
        throw new Error('No response received from server');
      }

      // Read response body - let any stream errors bubble up naturally
      const responseText = await response.text();

      if (!response.ok) {
        console.error('❌ Server function error:', response.status, responseText);
        throw new Error(`Server error: ${response.status} - ${responseText}`);
      }

      // Parse the successful response
      let result: RealRankingResult;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse response JSON:', parseError);
        throw new Error('Invalid response format from server');
      }
      const processingTime = Date.now() - startTime;
      
      console.log('✅ Real rank tracking completed:', {
        method: result.method,
        found: result.found,
        position: result.position,
        confidence: result.confidence,
        processingTime: `${processingTime}ms`
      });

      return {
        ...result,
        processingTime
      };

    } catch (error) {
      console.error('❌ Real rank tracking failed:', error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('⏰ Request timed out after 30 seconds');
        } else if (error.message.includes('Failed to fetch')) {
          console.log('🌐 Network error - unable to reach server');
        } else if (error.message.includes('Server error')) {
          console.log('🖥️ Server-side error occurred');
        } else if (error.message.includes('body stream already read') || error.message.includes('Failed to read response stream')) {
          console.log('🔄 Request stream conflict detected');
          if (retryCount < maxRetries) {
            console.log(`🔄 Retrying request (${retryCount + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
            return this.performRankCheck(params, startTime, retryCount + 1);
          }
        }
      }

      // Fallback to client-side simulation
      console.log('🔄 Falling back to client-side intelligent simulation');
      return this.generateClientFallback(params, Date.now() - startTime);
    }
  }

  /**
   * Track multiple keywords for the same URL
   */
  static async trackMultipleKeywords(
    targetUrl: string,
    keywords: string[],
    options: Partial<RankTrackingParams> = {}
  ): Promise<RealRankingResult[]> {
    console.log(`📊 Tracking ${keywords.length} keywords for ${targetUrl}`);
    
    const results: RealRankingResult[] = [];
    
    // Process keywords with delays to avoid rate limiting
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      console.log(`🔍 Processing keyword ${i + 1}/${keywords.length}: ${keyword}`);
      
      try {
        const result = await this.checkRanking({
          targetUrl,
          keyword,
          ...options
        });
        
        results.push(result);
        
        // Add delay between requests (2-4 seconds)
        if (i < keywords.length - 1) {
          const delay = 2000 + Math.random() * 2000;
          console.log(`⏳ Waiting ${Math.round(delay/1000)}s before next request...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error(`❌ Failed to track keyword: ${keyword}`, error);
        // Continue with other keywords
      }
    }
    
    return results;
  }

  /**
   * Get ranking history for a target
   */
  static async getRankingHistory(targetUrl: string, keyword: string, days: number = 30): Promise<any[]> {
    // This would typically query your database for historical ranking data
    // For now, return simulated historical data
    const history = [];
    const currentDate = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      
      // Simulate position changes over time
      const basePosition = 15;
      const variation = Math.sin(i / 7) * 5; // Weekly cycles
      const randomNoise = (Math.random() - 0.5) * 4;
      const position = Math.max(1, Math.min(100, Math.round(basePosition + variation + randomNoise)));
      
      history.push({
        date: date.toISOString().split('T')[0],
        position: position,
        found: position <= 100,
        keyword,
        targetUrl
      });
    }
    
    return history;
  }

  /**
   * Analyze ranking trends
   */
  static analyzeRankingTrends(history: any[]): {
    trend: 'improving' | 'declining' | 'stable';
    averagePosition: number;
    bestPosition: number;
    worstPosition: number;
    volatility: number;
  } {
    if (history.length === 0) {
      return {
        trend: 'stable',
        averagePosition: 0,
        bestPosition: 0,
        worstPosition: 0,
        volatility: 0
      };
    }

    const positions = history.map(h => h.position).filter(p => p > 0);
    const recentPositions = positions.slice(-7); // Last 7 days
    const earlierPositions = positions.slice(0, 7); // First 7 days

    const recentAvg = recentPositions.reduce((a, b) => a + b, 0) / recentPositions.length;
    const earlierAvg = earlierPositions.reduce((a, b) => a + b, 0) / earlierPositions.length;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentAvg < earlierAvg - 2) trend = 'improving'; // Lower position numbers = better
    else if (recentAvg > earlierAvg + 2) trend = 'declining';

    const averagePosition = positions.reduce((a, b) => a + b, 0) / positions.length;
    const bestPosition = Math.min(...positions);
    const worstPosition = Math.max(...positions);
    
    // Calculate volatility (standard deviation)
    const variance = positions.reduce((acc, pos) => acc + Math.pow(pos - averagePosition, 2), 0) / positions.length;
    const volatility = Math.sqrt(variance);

    return {
      trend,
      averagePosition: Math.round(averagePosition),
      bestPosition,
      worstPosition,
      volatility: Math.round(volatility * 100) / 100
    };
  }

  /**
   * Generate SERP feature analysis
   */
  static analyzeSERPFeatures(competitorAnalysis: CompetitorResult[]): {
    hasKnowledgePanel: boolean;
    hasFeaturedSnippet: boolean;
    hasLocalPack: boolean;
    hasShoppingResults: boolean;
    organicCompetitors: number;
  } {
    // Analyze competitor domains to infer SERP features
    const domains = competitorAnalysis.map(c => c.domain);
    
    return {
      hasKnowledgePanel: domains.includes('wikipedia.org') || domains.includes('wikidata.org'),
      hasFeaturedSnippet: competitorAnalysis.length > 0 && competitorAnalysis[0].position === 1,
      hasLocalPack: domains.some(d => d.includes('maps.google') || d.includes('yelp.com')),
      hasShoppingResults: domains.some(d => d.includes('amazon.com') || d.includes('shopping.google')),
      organicCompetitors: competitorAnalysis.length
    };
  }

  /**
   * Client-side fallback when server function fails
   */
  private static generateClientFallback(params: RankTrackingParams, processingTime: number): RealRankingResult {
    const { targetUrl, keyword, country = 'US' } = params;
    
    console.log('🧠 Generating client-side fallback for:', { targetUrl, keyword });
    
    // Intelligent position estimation
    const domain = this.extractDomain(targetUrl);
    const position = this.estimateRealisticPosition(domain, keyword);
    
    // Generate realistic competitors
    const competitors = this.generateRealisticCompetitors(keyword, domain);
    
    return {
      keyword,
      targetUrl: this.normalizeUrl(targetUrl),
      position,
      found: position !== null,
      searchEngine: 'google',
      location: country,
      totalResults: this.estimateTotalResults(keyword),
      competitorAnalysis: competitors,
      timestamp: new Date().toISOString(),
      searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
      confidence: 'low',
      method: 'simulation',
      processingTime
    };
  }

  /**
   * Estimate realistic position based on domain and keyword characteristics
   */
  private static estimateRealisticPosition(domain: string, keyword: string): number | null {
    const keywordWords = keyword.toLowerCase().split(' ');
    const domainParts = domain.toLowerCase().split('.');
    
    // Check for exact keyword match in domain
    const hasExactMatch = domainParts.some(part => 
      keywordWords.some(word => part.includes(word) && word.length > 2)
    );
    
    // Check domain authority indicators
    const commonTLDs = ['com', 'org', 'net', 'edu', 'gov'];
    const hasGoodTLD = commonTLDs.includes(domainParts[domainParts.length - 1]);
    const isDomainShort = domain.length < 15;
    
    // Calculate base score
    let score = 50; // Base position
    
    if (hasExactMatch) score -= 20; // Keyword match improves ranking
    if (hasGoodTLD) score -= 5; // Good TLD improves ranking
    if (isDomainShort) score -= 5; // Short domains often rank better
    if (keywordWords.length > 3) score -= 10; // Long-tail keywords easier to rank
    
    // Add some randomness
    score += (Math.random() - 0.5) * 20;
    
    // Determine if ranking at all (70% chance for reasonable domains)
    const rankingProbability = hasExactMatch ? 0.9 : hasGoodTLD ? 0.7 : 0.5;
    
    if (Math.random() > rankingProbability) {
      return null; // Not ranking in top 100
    }
    
    return Math.max(1, Math.min(100, Math.round(score)));
  }

  /**
   * Generate realistic competitors based on keyword type
   */
  private static generateRealisticCompetitors(keyword: string, excludeDomain: string): CompetitorResult[] {
    const keywordLower = keyword.toLowerCase();
    let competitors: string[] = [];
    
    // Industry-specific competitor selection
    if (keywordLower.includes('buy') || keywordLower.includes('shop') || keywordLower.includes('store')) {
      competitors = ['amazon.com', 'ebay.com', 'walmart.com', 'target.com', 'bestbuy.com', 'etsy.com'];
    } else if (keywordLower.includes('how to') || keywordLower.includes('tutorial') || keywordLower.includes('guide')) {
      competitors = ['youtube.com', 'wikihow.com', 'medium.com', 'instructables.com', 'skillshare.com'];
    } else if (keywordLower.includes('news') || keywordLower.includes('latest')) {
      competitors = ['cnn.com', 'bbc.com', 'reuters.com', 'nytimes.com', 'npr.org'];
    } else if (keywordLower.includes('health') || keywordLower.includes('medical')) {
      competitors = ['mayoclinic.org', 'webmd.com', 'healthline.com', 'nih.gov', 'cdc.gov'];
    } else if (keywordLower.includes('tech') || keywordLower.includes('software')) {
      competitors = ['github.com', 'stackoverflow.com', 'techcrunch.com', 'wired.com', 'medium.com'];
    } else {
      competitors = ['wikipedia.org', 'youtube.com', 'reddit.com', 'medium.com', 'quora.com', 'linkedin.com'];
    }
    
    // Filter out the target domain and randomize
    competitors = competitors
      .filter(domain => domain !== excludeDomain)
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);
    
    return competitors.map((domain, index) => ({
      position: index + 1,
      url: `https://${domain}`,
      domain: domain,
      title: `${keyword} - ${domain.split('.')[0].toUpperCase()}`,
      description: `Comprehensive information about ${keyword} on ${domain}`,
      estimatedTraffic: this.estimateTrafficByPosition(index + 1)
    }));
  }

  /**
   * Estimate traffic based on ranking position
   */
  private static estimateTrafficByPosition(position: number): number {
    const ctrRates: { [key: number]: number } = {
      1: 0.284, 2: 0.147, 3: 0.103, 4: 0.073, 5: 0.053,
      6: 0.040, 7: 0.031, 8: 0.025, 9: 0.020, 10: 0.016
    };
    
    const ctr = ctrRates[position] || 0.01;
    const estimatedSearches = Math.floor(Math.random() * 50000) + 1000;
    
    return Math.floor(estimatedSearches * ctr);
  }

  /**
   * Estimate total search results
   */
  private static estimateTotalResults(keyword: string): number {
    const words = keyword.split(' ').length;
    let baseResults = 1000000; // 1M default
    
    // Longer keywords typically have fewer results
    if (words >= 4) baseResults = 50000;
    else if (words >= 3) baseResults = 200000;
    else if (words >= 2) baseResults = 500000;
    
    // Add realistic variance
    const variance = 0.5 + (Math.random() * 1.0); // 0.5 to 1.5x
    return Math.floor(baseResults * variance);
  }

  /**
   * Normalize URL for consistent comparison
   */
  private static normalizeUrl(url: string): string {
    try {
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }
      
      const urlObj = new URL(url);
      
      if (urlObj.hostname.startsWith('www.')) {
        urlObj.hostname = urlObj.hostname.substring(4);
      }
      
      if (urlObj.pathname.endsWith('/') && urlObj.pathname.length > 1) {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      
      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }

  /**
   * Extract domain from URL
   */
  private static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
      let domain = urlObj.hostname;
      
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }
      
      return domain;
    } catch (error) {
      return url;
    }
  }
}
