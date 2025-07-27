import { supabase } from '@/integrations/supabase/client';

interface FilterResult {
  isAllowed: boolean;
  blockedTerms: string[];
  severity: 'low' | 'medium' | 'high';
  reason?: string;
  suggestions?: string[];
}

interface ContentFilterConfig {
  enabled: boolean;
  blockExplicitContent: boolean;
  blockGambling: boolean;
  blockAdultContent: boolean;
  blockHateSpeech: boolean;
  customBlockedTerms: string[];
  whitelist: string[];
}

export class ContentFilterService {
  // Explicit terms that should be blocked
  private readonly explicitTerms = [
    // Adult content
    'porn', 'pornography', 'pornographic', 'xxx', 'adult videos', 'sex videos',
    'naked', 'nude', 'nudity', 'erotic', 'sexual content', 'adult entertainment',
    'cam girls', 'escort', 'prostitution', 'strip club', 'adult dating',
    
    // Gambling related
    'casino', 'gambling', 'poker', 'blackjack', 'roulette', 'slot machine',
    'betting', 'sportsbook', 'lottery', 'jackpot', 'casino online',
    'gambling addiction', 'bet online', 'sports betting', 'online slots',
    
    // R-rated and violent content
    'violence', 'killing', 'murder', 'torture', 'gore', 'graphic violence',
    'death videos', 'brutal', 'massacre', 'assassination', 'terrorism',
    'weapons for sale', 'gun sales', 'explosive', 'bomb making',
    
    // Illegal substances
    'drugs for sale', 'buy drugs', 'cocaine', 'heroin', 'methamphetamine',
    'illegal drugs', 'drug dealing', 'cannabis for sale', 'marijuana sales',
    
    // Hate speech indicators
    'hate speech', 'racial slurs', 'discrimination', 'supremacist',
    'nazi', 'fascist', 'terrorist', 'extremist content',
    
    // Scam/fraud related
    'get rich quick', 'guaranteed money', 'no risk investment', 'pyramid scheme',
    'ponzi scheme', 'fake reviews', 'spam content', 'click fraud'
  ];

  // Pattern-based detection for more sophisticated filtering
  private readonly suspiciousPatterns = [
    /\b(porn|sex|adult)\s*(video|content|site|movies?)\b/i,
    /\b(casino|gambling|bet)\s*(online|site|platform)\b/i,
    /\b(buy|sell|purchase)\s*(drugs?|weapons?|guns?)\b/i,
    /\b(hack|crack|pirat[ed]?)\s*(software|games?|movies?)\b/i,
    /\b(fake|false|misleading)\s*(reviews?|testimonials?)\b/i,
    /\b(guaranteed|instant|immediate)\s*(money|income|profit)\b/i
  ];

  private config: ContentFilterConfig = {
    enabled: true,
    blockExplicitContent: true,
    blockGambling: true,
    blockAdultContent: true,
    blockHateSpeech: true,
    customBlockedTerms: [],
    whitelist: []
  };

  constructor() {
    this.loadConfiguration();
  }

  private async loadConfiguration(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('setting_key', 'content_filter_config')
        .single();

      if (data && !error) {
        this.config = { ...this.config, ...JSON.parse(data.setting_value) };
      }
    } catch (error) {
      console.warn('Could not load content filter configuration:', error);
    }
  }

  async updateConfiguration(newConfig: Partial<ContentFilterConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    try {
      await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'content_filter_config',
          setting_value: JSON.stringify(this.config),
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to save content filter configuration:', error);
    }
  }

  /**
   * Main content filtering method
   */
  filterContent(content: string, context?: string): FilterResult {
    if (!this.config.enabled) {
      return { isAllowed: true, blockedTerms: [], severity: 'low' };
    }

    const blockedTerms: string[] = [];
    const normalizedContent = content.toLowerCase().trim();
    
    // Check for explicit terms
    for (const term of this.explicitTerms) {
      if (normalizedContent.includes(term.toLowerCase())) {
        blockedTerms.push(term);
      }
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(content)) {
        const match = content.match(pattern);
        if (match) {
          blockedTerms.push(match[0]);
        }
      }
    }

    // Check custom blocked terms
    for (const term of this.config.customBlockedTerms) {
      if (normalizedContent.includes(term.toLowerCase())) {
        blockedTerms.push(term);
      }
    }

    // Check whitelist exceptions
    for (const whitelistedTerm of this.config.whitelist) {
      if (normalizedContent.includes(whitelistedTerm.toLowerCase())) {
        // Remove false positives if they're whitelisted
        const index = blockedTerms.findIndex(term => 
          term.toLowerCase().includes(whitelistedTerm.toLowerCase())
        );
        if (index > -1) {
          blockedTerms.splice(index, 1);
        }
      }
    }

    // Determine severity and create response
    if (blockedTerms.length === 0) {
      return { isAllowed: true, blockedTerms: [], severity: 'low' };
    }

    const severity = this.determineSeverity(blockedTerms);
    const suggestions = this.generateSuggestions(blockedTerms);

    return {
      isAllowed: false,
      blockedTerms: [...new Set(blockedTerms)], // Remove duplicates
      severity,
      reason: this.generateBlockReason(blockedTerms, severity),
      suggestions
    };
  }

  /**
   * Filter blog post requests before generation
   */
  filterBlogRequest(targetUrl: string, primaryKeyword: string, anchorText?: string): FilterResult {
    const combinedContent = `${targetUrl} ${primaryKeyword} ${anchorText || ''}`;
    return this.filterContent(combinedContent, 'blog_request');
  }

  /**
   * Filter generated blog content before publishing
   */
  filterBlogPost(title: string, content: string, keywords: string[]): FilterResult {
    const combinedContent = `${title} ${content} ${keywords.join(' ')}`;
    return this.filterContent(combinedContent, 'blog_content');
  }

  private determineSeverity(blockedTerms: string[]): 'low' | 'medium' | 'high' {
    const highSeverityTerms = ['porn', 'pornography', 'drugs for sale', 'weapons for sale', 'hate speech'];
    const mediumSeverityTerms = ['gambling', 'casino', 'betting', 'get rich quick'];

    if (blockedTerms.some(term => highSeverityTerms.some(high => term.toLowerCase().includes(high)))) {
      return 'high';
    }
    
    if (blockedTerms.some(term => mediumSeverityTerms.some(medium => term.toLowerCase().includes(medium)))) {
      return 'medium';
    }

    return 'low';
  }

  private generateBlockReason(blockedTerms: string[], severity: 'low' | 'medium' | 'high'): string {
    switch (severity) {
      case 'high':
        return 'Content blocked due to explicit, illegal, or harmful material. This type of content violates our content policy.';
      case 'medium':
        return 'Content blocked due to potentially inappropriate material including gambling or misleading claims.';
      case 'low':
        return 'Content blocked due to terms that may not align with our content guidelines.';
      default:
        return 'Content blocked due to policy violations.';
    }
  }

  private generateSuggestions(blockedTerms: string[]): string[] {
    const suggestions: string[] = [];

    if (blockedTerms.some(term => ['porn', 'adult', 'sex'].includes(term.toLowerCase()))) {
      suggestions.push('Consider focusing on family-friendly, educational, or business-related content');
    }

    if (blockedTerms.some(term => ['gambling', 'casino', 'betting'].includes(term.toLowerCase()))) {
      suggestions.push('Try entertainment, gaming (non-gambling), or sports analysis content instead');
    }

    if (blockedTerms.some(term => ['drugs', 'weapons'].includes(term.toLowerCase()))) {
      suggestions.push('Focus on legal products, services, or educational content');
    }

    if (blockedTerms.some(term => term.includes('get rich quick'))) {
      suggestions.push('Consider legitimate business advice, financial education, or career development content');
    }

    if (suggestions.length === 0) {
      suggestions.push('Try using more professional, educational, or business-focused keywords');
      suggestions.push('Consider content related to technology, health, education, or legitimate services');
    }

    return suggestions;
  }

  /**
   * Get current filter configuration for admin interface
   */
  getConfiguration(): ContentFilterConfig {
    return { ...this.config };
  }

  /**
   * Log filter events for admin monitoring
   */
  async logFilterEvent(
    content: string, 
    result: FilterResult, 
    userId?: string, 
    context?: string
  ): Promise<void> {
    try {
      await supabase.from('content_filter_logs').insert({
        content_sample: content.substring(0, 500), // First 500 chars only
        blocked_terms: result.blockedTerms,
        severity: result.severity,
        is_blocked: !result.isAllowed,
        user_id: userId,
        context: context || 'unknown',
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to log filter event:', error);
    }
  }

  /**
   * Get filter statistics for admin dashboard
   */
  async getFilterStats(days: number = 7): Promise<any> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('content_filter_logs')
        .select('*')
        .gte('created_at', since);

      if (error) throw error;

      const total = data.length;
      const blocked = data.filter(log => log.is_blocked).length;
      const byCategory = data.reduce((acc, log) => {
        const severity = log.severity || 'unknown';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {});

      return {
        total,
        blocked,
        allowed: total - blocked,
        blockRate: total > 0 ? ((blocked / total) * 100).toFixed(1) : '0',
        byCategory,
        topBlockedTerms: this.getTopBlockedTerms(data)
      };
    } catch (error) {
      console.warn('Failed to get filter stats:', error);
      return {
        total: 0,
        blocked: 0,
        allowed: 0,
        blockRate: '0',
        byCategory: {},
        topBlockedTerms: []
      };
    }
  }

  private getTopBlockedTerms(logs: any[]): Array<{ term: string; count: number }> {
    const termCounts: { [key: string]: number } = {};
    
    logs.forEach(log => {
      if (log.blocked_terms && Array.isArray(log.blocked_terms)) {
        log.blocked_terms.forEach((term: string) => {
          termCounts[term] = (termCounts[term] || 0) + 1;
        });
      }
    });

    return Object.entries(termCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([term, count]) => ({ term, count }));
  }

  /**
   * Test if specific content would be blocked (for admin testing)
   */
  testContent(content: string): FilterResult {
    return this.filterContent(content, 'admin_test');
  }
}

export const contentFilterService = new ContentFilterService();
