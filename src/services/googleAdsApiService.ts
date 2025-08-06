/**
 * Google Ads API Service for Keyword Research
 * Uses Google Ads API Keyword Planner to get real search volume data
 */

interface GoogleAdsConfig {
  developerToken: string;
  customerAccountId: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

interface KeywordMetrics {
  keyword: string;
  searchVolume: number;
  cpc: number;
  competition: 'LOW' | 'MEDIUM' | 'HIGH';
  competitionIndex: number;
}

interface KeywordPlanRequest {
  keywords: string[];
  geoTargetConstants: string[];
  language: string;
  networkSetting?: 'GOOGLE_SEARCH' | 'GOOGLE_SEARCH_AND_PARTNERS';
}

export class GoogleAdsApiService {
  private config: GoogleAdsConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: GoogleAdsConfig) {
    this.config = config;
  }

  /**
   * Get access token using OAuth 2.0 refresh token
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Subtract 1 minute for safety

    return this.accessToken;
  }

  /**
   * Generate keyword ideas using Google Ads API
   */
  async generateKeywordIdeas(seedKeywords: string[], geoTargets: string[] = ['2840'], language: string = 'en'): Promise<KeywordMetrics[]> {
    const accessToken = await this.getAccessToken();
    
    const url = `https://googleads.googleapis.com/v16/customers/${this.config.customerAccountId}/keywordPlanIdeas:generateKeywordIdeas`;
    
    const requestBody = {
      customer_id: this.config.customerAccountId,
      language: `languageConstants/${this.getLanguageConstant(language)}`,
      geo_target_constants: geoTargets.map(geo => `geoTargetConstants/${geo}`),
      keyword_plan_network: 'GOOGLE_SEARCH_AND_PARTNERS',
      keyword_seed: {
        keywords: seedKeywords
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': this.config.developerToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Ads API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return this.parseKeywordIdeas(data);
  }

  /**
   * Get historical keyword metrics using Google Ads API
   */
  async getHistoricalMetrics(keywords: string[], geoTargets: string[] = ['2840'], language: string = 'en'): Promise<KeywordMetrics[]> {
    const accessToken = await this.getAccessToken();
    
    const url = `https://googleads.googleapis.com/v16/customers/${this.config.customerAccountId}/keywordPlanIdeas:generateKeywordHistoricalMetrics`;
    
    const requestBody = {
      customer_id: this.config.customerAccountId,
      language: `languageConstants/${this.getLanguageConstant(language)}`,
      geo_target_constants: geoTargets.map(geo => `geoTargetConstants/${geo}`),
      keyword_plan_network: 'GOOGLE_SEARCH_AND_PARTNERS',
      keywords: keywords
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': this.config.developerToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Ads API historical metrics request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return this.parseHistoricalMetrics(data);
  }

  /**
   * Parse keyword ideas response from Google Ads API
   */
  private parseKeywordIdeas(data: any): KeywordMetrics[] {
    if (!data.results) {
      return [];
    }

    return data.results.map((result: any) => {
      const keywordIdea = result.keyword_idea_metrics;
      const keyword = result.text;
      
      return {
        keyword: keyword,
        searchVolume: keywordIdea?.avg_monthly_searches || 0,
        cpc: keywordIdea?.suggested_bid_micros ? keywordIdea.suggested_bid_micros / 1000000 : 0,
        competition: this.mapCompetitionLevel(keywordIdea?.competition || 'UNKNOWN'),
        competitionIndex: keywordIdea?.competition_index || 0,
      };
    });
  }

  /**
   * Parse historical metrics response from Google Ads API
   */
  private parseHistoricalMetrics(data: any): KeywordMetrics[] {
    if (!data.results) {
      return [];
    }

    return data.results.map((result: any) => {
      const metrics = result.keyword_metrics;
      const keyword = result.text;
      
      return {
        keyword: keyword,
        searchVolume: metrics?.avg_monthly_searches || 0,
        cpc: metrics?.suggested_bid_micros ? metrics.suggested_bid_micros / 1000000 : 0,
        competition: this.mapCompetitionLevel(metrics?.competition || 'UNKNOWN'),
        competitionIndex: metrics?.competition_index || 0,
      };
    });
  }

  /**
   * Map Google Ads API competition levels to our format
   */
  private mapCompetitionLevel(competition: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    switch (competition) {
      case 'LOW':
        return 'LOW';
      case 'MEDIUM':
        return 'MEDIUM';
      case 'HIGH':
        return 'HIGH';
      default:
        return 'MEDIUM';
    }
  }

  /**
   * Get language constant for Google Ads API
   */
  private getLanguageConstant(languageCode: string): string {
    const languageConstants: { [key: string]: string } = {
      'en': '1000', // English
      'es': '1003', // Spanish
      'fr': '1002', // French
      'de': '1001', // German
      'it': '1004', // Italian
      'pt': '1014', // Portuguese
      'ja': '1005', // Japanese
      'ko': '1012', // Korean
      'zh': '1018', // Chinese (Simplified)
      'ru': '1007', // Russian
      'ar': '1019', // Arabic
      'hi': '1011', // Hindi
      'nl': '1006', // Dutch
      'sv': '1015', // Swedish
      'da': '1009', // Danish
      'no': '1013', // Norwegian
      'fi': '1010', // Finnish
      'pl': '1016', // Polish
      'tr': '1017', // Turkish
      'th': '1020', // Thai
      'vi': '1021', // Vietnamese
    };
    
    return languageConstants[languageCode] || '1000'; // Default to English
  }

  /**
   * Get geo target constant for a country code
   */
  public static getGeoTargetConstant(countryCode: string): string {
    const geoTargets: { [key: string]: string } = {
      'US': '2840', // United States
      'GB': '2826', // United Kingdom
      'CA': '2124', // Canada
      'AU': '2036', // Australia
      'DE': '2276', // Germany
      'FR': '2250', // France
      'ES': '2724', // Spain
      'IT': '2380', // Italy
      'JP': '2392', // Japan
      'BR': '2076', // Brazil
      'MX': '2484', // Mexico
      'IN': '2356', // India
      'CN': '2156', // China
      'RU': '2643', // Russia
      'KR': '2410', // South Korea
      'NL': '2528', // Netherlands
      'SE': '2752', // Sweden
      'CH': '2756', // Switzerland
      'AT': '2040', // Austria
      'BE': '2056', // Belgium
      'DK': '2208', // Denmark
      'FI': '2246', // Finland
      'IE': '2372', // Ireland
      'NO': '2578', // Norway
      'PL': '2616', // Poland
      'PT': '2620', // Portugal
      'CZ': '2203', // Czech Republic
      'HU': '2348', // Hungary
      'GR': '2300', // Greece
      'IL': '2376', // Israel
      'ZA': '2710', // South Africa
      'AR': '2032', // Argentina
      'CL': '2152', // Chile
      'CO': '2170', // Colombia
      'PE': '2604', // Peru
      'VE': '2862', // Venezuela
      'TH': '2764', // Thailand
      'MY': '2458', // Malaysia
      'SG': '2702', // Singapore
      'PH': '2608', // Philippines
      'ID': '2360', // Indonesia
      'VN': '2704', // Vietnam
      'EG': '2818', // Egypt
      'SA': '2682', // Saudi Arabia
      'AE': '2784', // United Arab Emirates
      'TR': '2792', // Turkey
      'UA': '2804', // Ukraine
      'RO': '2642', // Romania
      'BG': '2100', // Bulgaria
      'HR': '2191', // Croatia
      'SI': '2705', // Slovenia
      'SK': '2703', // Slovakia
      'LT': '2440', // Lithuania
      'LV': '2428', // Latvia
      'EE': '2233', // Estonia
    };
    
    return geoTargets[countryCode] || '2840'; // Default to US
  }

  /**
   * Advanced keyword research with related keywords and competition analysis
   */
  async performAdvancedKeywordResearch(
    seedKeyword: string, 
    countryCode: string = 'US', 
    languageCode: string = 'en'
  ): Promise<{
    primaryKeyword: KeywordMetrics;
    relatedKeywords: KeywordMetrics[];
    competitorKeywords: KeywordMetrics[];
  }> {
    const geoTarget = GoogleAdsApiService.getGeoTargetConstant(countryCode);
    
    try {
      // Generate keyword ideas first
      const keywordIdeas = await this.generateKeywordIdeas([seedKeyword], [geoTarget], languageCode);
      
      // Get historical metrics for the primary keyword and top ideas
      const topKeywords = [seedKeyword, ...keywordIdeas.slice(0, 9).map(k => k.keyword)];
      const historicalMetrics = await this.getHistoricalMetrics(topKeywords, [geoTarget], languageCode);
      
      // Find the primary keyword metrics
      const primaryKeyword = historicalMetrics.find(k => k.keyword.toLowerCase() === seedKeyword.toLowerCase()) || {
        keyword: seedKeyword,
        searchVolume: 0,
        cpc: 0,
        competition: 'MEDIUM' as const,
        competitionIndex: 50,
      };

      // Separate related and competitor keywords
      const relatedKeywords = historicalMetrics.filter(k => k.keyword.toLowerCase() !== seedKeyword.toLowerCase());
      const competitorKeywords = keywordIdeas.slice(0, 10);

      return {
        primaryKeyword,
        relatedKeywords,
        competitorKeywords,
      };
    } catch (error) {
      console.error('Google Ads API error:', error);
      
      // Fallback to basic keyword structure if API fails
      return {
        primaryKeyword: {
          keyword: seedKeyword,
          searchVolume: 0,
          cpc: 0,
          competition: 'MEDIUM',
          competitionIndex: 50,
        },
        relatedKeywords: [],
        competitorKeywords: [],
      };
    }
  }
}

export default GoogleAdsApiService;
