import { promptManager, type PlatformConfig, type PromptType } from './promptManager';

export interface PlatformOpportunity {
  platform: PlatformConfig;
  score: number;
  reasons: string[];
  estimatedReach: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeToPublish: string;
  requiredFields: string[];
  successProbability: number;
}

export interface ContentStrategy {
  keyword: string;
  targetUrl: string;
  anchorText: string;
  recommendedPrompts: PromptType[];
  platformOpportunities: PlatformOpportunity[];
  contentTone: 'informative' | 'professional' | 'friendly' | 'conversational';
  estimatedBacklinks: number;
}

export interface KeywordAnalysis {
  keyword: string;
  category: 'technology' | 'business' | 'lifestyle' | 'education' | 'general';
  competitiveness: 'low' | 'medium' | 'high';
  suggestedPlatforms: string[];
  contentTypes: PromptType[];
  estimatedValue: number;
}

class PlatformDiscoveryService {
  private platformDatabase: PlatformConfig[];
  private keywordPatterns: Record<string, string[]>;

  constructor() {
    this.platformDatabase = [...promptManager.getActivePlatforms(), ...this.getCloudStoragePlatforms()];
    this.keywordPatterns = {
      technology: [
        'code', 'programming', 'development', 'software', 'api', 'framework',
        'javascript', 'python', 'react', 'nodejs', 'database', 'cloud',
        'ai', 'machine learning', 'data science', 'cybersecurity', 'devops'
      ],
      business: [
        'marketing', 'business', 'strategy', 'sales', 'finance', 'management',
        'startup', 'entrepreneur', 'investment', 'productivity', 'leadership',
        'consulting', 'analytics', 'growth', 'revenue', 'customer'
      ],
      lifestyle: [
        'health', 'fitness', 'wellness', 'travel', 'food', 'fashion',
        'beauty', 'home', 'family', 'relationships', 'hobbies', 'entertainment'
      ],
      education: [
        'learning', 'education', 'tutorial', 'course', 'training', 'study',
        'skill', 'certification', 'university', 'school', 'teaching'
      ]
    };
  }

  // Analyze keyword and suggest optimal strategy
  analyzeKeyword(keyword: string): KeywordAnalysis {
    const category = this.categorizeKeyword(keyword);
    const competitiveness = this.assessCompetitiveness(keyword);
    const suggestedPlatforms = this.suggestPlatformsForCategory(category);
    const contentTypes = this.suggestContentTypes(category, competitiveness);
    const estimatedValue = this.calculateKeywordValue(category, competitiveness);

    return {
      keyword,
      category,
      competitiveness,
      suggestedPlatforms,
      contentTypes,
      estimatedValue
    };
  }

  // Generate comprehensive content strategy
  generateContentStrategy(keyword: string, targetUrl: string, anchorText: string): ContentStrategy {
    const analysis = this.analyzeKeyword(keyword);
    const recommendedPrompts = analysis.contentTypes;
    const platformOpportunities = this.findPlatformOpportunities(keyword, analysis);
    const contentTone = this.selectOptimalTone(analysis.category);
    const estimatedBacklinks = this.estimateBacklinkPotential(platformOpportunities);

    return {
      keyword,
      targetUrl,
      anchorText,
      recommendedPrompts,
      platformOpportunities,
      contentTone,
      estimatedBacklinks
    };
  }

  // Find and score platform opportunities
  findPlatformOpportunities(keyword: string, analysis: KeywordAnalysis): PlatformOpportunity[] {
    const opportunities: PlatformOpportunity[] = [];

    this.platformDatabase.forEach(platform => {
      const score = this.scorePlatformForKeyword(platform, keyword, analysis);
      const reasons = this.generateReasons(platform, analysis);
      const estimatedReach = this.estimateReach(platform, analysis.category);
      const difficulty = this.assessDifficulty(platform, analysis.competitiveness);
      const timeToPublish = this.estimateTimeToPublish(platform);
      const requiredFields = this.getRequiredFields(platform);
      const successProbability = this.calculateSuccessProbability(platform, analysis);

      if (score > 50) { // Only include viable opportunities
        opportunities.push({
          platform,
          score,
          reasons,
          estimatedReach,
          difficulty,
          timeToPublish,
          requiredFields,
          successProbability
        });
      }
    });

    // Sort by score (highest first)
    return opportunities.sort((a, b) => b.score - a.score);
  }

  // Score platform compatibility for specific keyword
  private scorePlatformForKeyword(platform: PlatformConfig, keyword: string, analysis: KeywordAnalysis): number {
    let score = 0;

    // Base score from domain rating
    score += platform.domainRating * 0.3;

    // Category alignment bonus
    if (this.isPlatformSuitableForCategory(platform, analysis.category)) {
      score += 25;
    }

    // Link policy bonus
    switch (platform.linkPolicy) {
      case 'friendly': score += 20; break;
      case 'moderate': score += 10; break;
      case 'strict': score -= 10; break;
    }

    // Platform type bonus based on keyword
    if (analysis.category === 'technology' && platform.type === 'blog') {
      score += 15;
    }

    if (analysis.category === 'business' && platform.name === 'LinkedIn') {
      score += 20;
    }

    // Competitiveness adjustment
    if (analysis.competitiveness === 'low' && platform.domainRating > 80) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  // Categorize keyword into main categories
  private categorizeKeyword(keyword: string): KeywordAnalysis['category'] {
    const lowerKeyword = keyword.toLowerCase();

    for (const [category, patterns] of Object.entries(this.keywordPatterns)) {
      if (patterns.some(pattern => lowerKeyword.includes(pattern))) {
        return category as KeywordAnalysis['category'];
      }
    }

    return 'general';
  }

  // Assess keyword competitiveness
  private assessCompetitiveness(keyword: string): 'low' | 'medium' | 'high' {
    const wordCount = keyword.split(' ').length;
    const hasCommercialIntent = /buy|best|top|review|price|cost|cheap/.test(keyword.toLowerCase());
    
    if (wordCount >= 4 && !hasCommercialIntent) return 'low';
    if (wordCount >= 3 || hasCommercialIntent) return 'medium';
    return 'high';
  }

  // Suggest platforms based on category
  private suggestPlatformsForCategory(category: string): string[] {
    const platformMap = {
      technology: ['Dev.to', 'Hashnode', 'Medium', 'Discourse'],
      business: ['LinkedIn', 'Medium', 'WordPress', 'Ghost CMS'],
      lifestyle: ['Medium', 'Tumblr', 'WordPress'],
      education: ['Medium', 'Dev.to', 'WordPress', 'Ghost CMS'],
      general: ['WordPress', 'Medium', 'Ghost CMS']
    };

    return platformMap[category] || platformMap.general;
  }

  // Suggest optimal content types
  private suggestContentTypes(category: string, competitiveness: string): PromptType[] {
    const baseTypes: PromptType[] = ['long-form-blog'];

    if (category === 'technology') {
      baseTypes.push('how-to-guide', 'qa-answer');
    }

    if (category === 'business') {
      baseTypes.push('press-release', 'directory-entry');
    }

    if (competitiveness === 'low') {
      baseTypes.push('forum-reply', 'microblog-social');
    }

    return baseTypes;
  }

  // Select optimal content tone
  private selectOptimalTone(category: string): ContentStrategy['contentTone'] {
    const toneMap = {
      technology: 'informative' as const,
      business: 'professional' as const,
      lifestyle: 'friendly' as const,
      education: 'informative' as const,
      general: 'friendly' as const
    };

    return toneMap[category] || 'friendly';
  }

  // Check if platform is suitable for category
  private isPlatformSuitableForCategory(platform: PlatformConfig, category: string): boolean {
    const suitabilityMap = {
      technology: ['Dev.to', 'Hashnode', 'Discourse'],
      business: ['LinkedIn', 'Medium'],
      lifestyle: ['Tumblr', 'Medium'],
      education: ['Medium', 'WordPress', 'Ghost CMS']
    };

    const suitablePlatforms = suitabilityMap[category] || [];
    return suitablePlatforms.includes(platform.name);
  }

  // Generate reasons for platform recommendation
  private generateReasons(platform: PlatformConfig, analysis: KeywordAnalysis): string[] {
    const reasons: string[] = [];

    if (platform.domainRating >= 90) {
      reasons.push(`High domain authority (DR ${platform.domainRating})`);
    }

    if (platform.linkPolicy === 'friendly') {
      reasons.push('Link-friendly platform with minimal restrictions');
    }

    if (this.isPlatformSuitableForCategory(platform, analysis.category)) {
      reasons.push(`Perfect fit for ${analysis.category} content`);
    }

    if (analysis.competitiveness === 'low' && platform.type === 'forum') {
      reasons.push('Low competition keyword ideal for community engagement');
    }

    return reasons;
  }

  // Estimate potential reach
  private estimateReach(platform: PlatformConfig, category: string): number {
    const baseReach = platform.domainRating * 1000;
    
    if (this.isPlatformSuitableForCategory(platform, category)) {
      return Math.floor(baseReach * 1.5);
    }

    return Math.floor(baseReach);
  }

  // Assess publishing difficulty
  private assessDifficulty(platform: PlatformConfig, competitiveness: string): PlatformOpportunity['difficulty'] {
    if (platform.linkPolicy === 'strict' || competitiveness === 'high') {
      return 'hard';
    }
    if (platform.linkPolicy === 'moderate' || competitiveness === 'medium') {
      return 'medium';
    }
    return 'easy';
  }

  // Estimate time to publish
  private estimateTimeToPublish(platform: PlatformConfig): string {
    const timeMap = {
      'Dev.to': '5-10 minutes',
      'Medium': '10-15 minutes',
      'LinkedIn': '5 minutes',
      'Tumblr': '5 minutes',
      'WordPress': '10-20 minutes',
      'Ghost CMS': '10-15 minutes',
      'Hashnode': '10-15 minutes',
      'Discourse': '5-10 minutes'
    };

    return timeMap[platform.name] || '10-15 minutes';
  }

  // Get required fields for platform
  private getRequiredFields(platform: PlatformConfig): string[] {
    const fieldsMap = {
      'Dev.to': ['title', 'content', 'tags'],
      'Medium': ['title', 'content', 'tags'],
      'LinkedIn': ['title', 'content'],
      'Tumblr': ['title', 'content'],
      'WordPress': ['title', 'content', 'categories'],
      'Ghost CMS': ['title', 'content', 'excerpt'],
      'Hashnode': ['title', 'content', 'publication'],
      'Discourse': ['title', 'content', 'category']
    };

    return fieldsMap[platform.name] || ['title', 'content'];
  }

  // Calculate success probability
  private calculateSuccessProbability(platform: PlatformConfig, analysis: KeywordAnalysis): number {
    let probability = 60; // Base probability

    if (platform.linkPolicy === 'friendly') probability += 20;
    if (platform.linkPolicy === 'strict') probability -= 20;

    if (analysis.competitiveness === 'low') probability += 15;
    if (analysis.competitiveness === 'high') probability -= 15;

    if (this.isPlatformSuitableForCategory(platform, analysis.category)) {
      probability += 10;
    }

    return Math.min(95, Math.max(30, probability));
  }

  // Calculate keyword value score
  private calculateKeywordValue(category: string, competitiveness: string): number {
    let value = 50; // Base value

    if (category === 'technology' || category === 'business') value += 20;
    if (competitiveness === 'low') value += 15;
    if (competitiveness === 'high') value -= 10;

    return Math.min(100, Math.max(20, value));
  }

  // Estimate total backlink potential
  private estimateBacklinkPotential(opportunities: PlatformOpportunity[]): number {
    return opportunities.reduce((total, opp) => {
      return total + (opp.successProbability / 100);
    }, 0);
  }

  // Get top platforms for immediate use
  getTopPlatforms(limit: number = 5): PlatformConfig[] {
    return this.platformDatabase
      .sort((a, b) => b.domainRating - a.domainRating)
      .slice(0, limit);
  }

  // Find platforms by content type
  findPlatformsByContentType(contentType: PromptType): PlatformConfig[] {
    return this.platformDatabase.filter(platform =>
      platform.preferredPrompts.includes(contentType)
    );
  }
}

export const platformDiscoveryService = new PlatformDiscoveryService();
export default platformDiscoveryService;
