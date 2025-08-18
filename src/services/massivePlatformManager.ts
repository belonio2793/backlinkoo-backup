/**
 * Massive Platform Manager
 * Manages thousands of domains/URLs for link building automation
 * Provides intelligent platform selection and rotation
 */

import { PublishingPlatform } from './platformConfigService';
import massivePlatformList from '@/data/massivePlatformList.json';
import massPlatformDatabase from '@/data/massPlatformDatabase.json';

export interface MassivePlatform {
  id: string;
  name: string;
  domain: string;
  url: string;
  domainAuthority: number;
  isActive: boolean;
  category: string;
  priority: number;
  difficulty: 'easy' | 'medium' | 'hard';
  authRequired: boolean;
  backlinksAllowed: boolean;
  submissionMethod: string;
  urlPattern?: string;
  metadata: {
    traffic?: string;
    lastUsed?: string;
    successRate?: number;
    automationDifficulty: string;
    category: string;
  };
}

export interface PlatformSelectionCriteria {
  minDomainAuthority?: number;
  maxDifficulty?: 'easy' | 'medium' | 'hard';
  categories?: string[];
  excludeUsed?: string[];
  preferAnonymous?: boolean;
  requireBacklinks?: boolean;
}

class MassivePlatformManager {
  private platforms: MassivePlatform[] = [];
  private activePlatforms: MassivePlatform[] = [];
  private platformUsageMap = new Map<string, number>();
  private isInitialized = false;

  constructor() {
    this.initializePlatforms();
  }

  /**
   * Initialize platforms from the massive database
   */
  private initializePlatforms(): void {
    try {
      console.log('🚀 Initializing massive platform database...');
      
      // Load from massivePlatformList.json
      if (massivePlatformList?.platforms) {
        this.platforms = massivePlatformList.platforms.map(this.normalizePlatform);
        console.log(`📊 Loaded ${this.platforms.length} platforms from massive database`);
      }

      // Load additional platforms from massPlatformDatabase.json
      if (massPlatformDatabase?.platformCategories) {
        const additionalPlatforms = this.loadFromCategorizedDatabase();
        this.platforms.push(...additionalPlatforms);
        console.log(`📊 Added ${additionalPlatforms.length} additional platforms`);
      }

      // Filter to active platforms with good criteria
      this.activePlatforms = this.platforms.filter(platform => 
        platform.domainAuthority >= 50 && // Minimum DA of 50
        platform.backlinksAllowed &&     // Must allow backlinks
        platform.difficulty !== 'hard'   // Exclude hard-to-automate platforms
      );

      console.log(`✅ Initialized ${this.activePlatforms.length} active platforms from ${this.platforms.length} total`);
      this.isInitialized = true;

    } catch (error) {
      console.error('❌ Error initializing platforms:', error);
      // Fallback to basic platforms
      this.initializeFallbackPlatforms();
    }
  }

  /**
   * Load platforms from categorized database
   */
  private loadFromCategorizedDatabase(): MassivePlatform[] {
    const platforms: MassivePlatform[] = [];
    
    Object.entries(massPlatformDatabase.platformCategories).forEach(([category, categoryData]: [string, any]) => {
      if (categoryData.platforms) {
        categoryData.platforms.forEach((platform: any, index: number) => {
          platforms.push({
            id: `${category}_${platform.domain.replace(/\./g, '_')}`,
            name: this.formatPlatformName(platform.domain),
            domain: platform.domain,
            url: `https://${platform.domain}`,
            domainAuthority: platform.da || 50,
            isActive: true,
            category,
            priority: index + 1,
            difficulty: this.determineDifficulty(platform),
            authRequired: platform.auth !== 'none',
            backlinksAllowed: platform.backlinks !== false,
            submissionMethod: 'form',
            metadata: {
              traffic: this.estimateTraffic(platform.da),
              automationDifficulty: this.determineDifficulty(platform),
              category
            }
          });
        });
      }
    });

    return platforms;
  }

  /**
   * Normalize platform data from different sources
   */
  private normalizePlatform(platform: any): MassivePlatform {
    return {
      id: platform.id || `platform_${platform.domain?.replace(/\./g, '_') || Date.now()}`,
      name: platform.name || this.formatPlatformName(platform.domain || platform.url),
      domain: platform.domain || this.extractDomain(platform.url),
      url: platform.url || `https://${platform.domain}`,
      domainAuthority: platform.domainAuthority || platform.da || 50,
      isActive: platform.isActive !== false,
      category: platform.metadata?.category || 'general',
      priority: platform.priority || 1,
      difficulty: platform.difficulty as 'easy' | 'medium' | 'hard' || 'medium',
      authRequired: platform.accountRequired !== false,
      backlinksAllowed: platform.backlinksAllowed !== false,
      submissionMethod: platform.submissionMethod || 'form',
      urlPattern: platform.urlPattern,
      metadata: {
        traffic: platform.estimatedTraffic,
        automationDifficulty: platform.metadata?.automationDifficulty || platform.difficulty || 'medium',
        category: platform.metadata?.category || 'general'
      }
    };
  }

  /**
   * Get platforms based on selection criteria
   */
  public getPlatforms(criteria: PlatformSelectionCriteria = {}): MassivePlatform[] {
    if (!this.isInitialized) {
      this.initializePlatforms();
    }

    let filtered = [...this.activePlatforms];

    // Filter by minimum domain authority
    if (criteria.minDomainAuthority) {
      filtered = filtered.filter(p => p.domainAuthority >= criteria.minDomainAuthority!);
    }

    // Filter by difficulty
    if (criteria.maxDifficulty) {
      const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
      const maxLevel = difficultyOrder[criteria.maxDifficulty];
      filtered = filtered.filter(p => difficultyOrder[p.difficulty] <= maxLevel);
    }

    // Filter by categories
    if (criteria.categories && criteria.categories.length > 0) {
      filtered = filtered.filter(p => criteria.categories!.includes(p.category));
    }

    // Exclude previously used platforms
    if (criteria.excludeUsed && criteria.excludeUsed.length > 0) {
      const excludeSet = new Set(criteria.excludeUsed);
      filtered = filtered.filter(p => !excludeSet.has(p.id) && !excludeSet.has(p.domain));
    }

    // Prefer anonymous platforms
    if (criteria.preferAnonymous) {
      filtered = filtered.sort((a, b) => {
        if (!a.authRequired && b.authRequired) return -1;
        if (a.authRequired && !b.authRequired) return 1;
        return 0;
      });
    }

    // Require backlinks
    if (criteria.requireBacklinks) {
      filtered = filtered.filter(p => p.backlinksAllowed);
    }

    // Sort by domain authority (highest first) and usage (least used first)
    return filtered.sort((a, b) => {
      const usageA = this.platformUsageMap.get(a.id) || 0;
      const usageB = this.platformUsageMap.get(b.id) || 0;
      
      // First by usage (least used first)
      if (usageA !== usageB) {
        return usageA - usageB;
      }
      
      // Then by domain authority (highest first)
      return b.domainAuthority - a.domainAuthority;
    });
  }

  /**
   * Get next platform for a campaign (intelligent rotation)
   */
  public getNextPlatform(campaignId: string, usedPlatformIds: string[] = []): MassivePlatform | null {
    const criteria: PlatformSelectionCriteria = {
      minDomainAuthority: 50,
      maxDifficulty: 'medium',
      excludeUsed: usedPlatformIds,
      requireBacklinks: true
    };

    const availablePlatforms = this.getPlatforms(criteria);
    
    if (availablePlatforms.length === 0) {
      // Relax criteria if no platforms available
      const relaxedCriteria = {
        ...criteria,
        minDomainAuthority: 40,
        maxDifficulty: 'hard' as const
      };
      const relaxedPlatforms = this.getPlatforms(relaxedCriteria);
      
      if (relaxedPlatforms.length === 0) {
        console.warn('⚠️ No available platforms found even with relaxed criteria');
        return null;
      }
      
      return relaxedPlatforms[0];
    }

    // Return the best available platform
    const selectedPlatform = availablePlatforms[0];
    
    // Track usage
    this.recordPlatformUsage(selectedPlatform.id);
    
    console.log(`🎯 Selected platform: ${selectedPlatform.name} (DA: ${selectedPlatform.domainAuthority}, Category: ${selectedPlatform.category})`);
    
    return selectedPlatform;
  }

  /**
   * Get platform statistics
   */
  public getStats(): {
    total: number;
    active: number;
    byCategory: Record<string, number>;
    byDifficulty: Record<string, number>;
    averageDA: number;
    highAuthorityCount: number;
  } {
    if (!this.isInitialized) {
      this.initializePlatforms();
    }

    const byCategory: Record<string, number> = {};
    const byDifficulty: Record<string, number> = {};
    let totalDA = 0;
    let highAuthorityCount = 0;

    this.activePlatforms.forEach(platform => {
      byCategory[platform.category] = (byCategory[platform.category] || 0) + 1;
      byDifficulty[platform.difficulty] = (byDifficulty[platform.difficulty] || 0) + 1;
      totalDA += platform.domainAuthority;
      
      if (platform.domainAuthority >= 80) {
        highAuthorityCount++;
      }
    });

    return {
      total: this.platforms.length,
      active: this.activePlatforms.length,
      byCategory,
      byDifficulty,
      averageDA: Math.round(totalDA / this.activePlatforms.length),
      highAuthorityCount
    };
  }

  /**
   * Convert to PublishingPlatform format for compatibility
   */
  public toPublishingPlatforms(limit?: number): PublishingPlatform[] {
    const platforms = this.getPlatforms({ minDomainAuthority: 50 });
    const selected = limit ? platforms.slice(0, limit) : platforms;
    
    return selected.map((platform, index) => ({
      id: platform.id,
      name: platform.name,
      isActive: platform.isActive,
      maxPostsPerCampaign: -1, // Unlimited
      priority: index + 1,
      description: `${platform.domain} (DA: ${platform.domainAuthority})`,
      capabilities: [
        platform.submissionMethod,
        platform.authRequired ? 'account_required' : 'anonymous',
        platform.backlinksAllowed ? 'backlinks' : 'no_backlinks'
      ]
    }));
  }

  /**
   * Record platform usage for rotation tracking
   */
  private recordPlatformUsage(platformId: string): void {
    const currentUsage = this.platformUsageMap.get(platformId) || 0;
    this.platformUsageMap.set(platformId, currentUsage + 1);
  }

  /**
   * Helper methods
   */
  private formatPlatformName(domain: string): string {
    if (!domain) return 'Unknown Platform';
    return domain.split('.')[0]
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  private determineDifficulty(platform: any): 'easy' | 'medium' | 'hard' {
    if (platform.auth === 'none') return 'easy';
    if (platform.type === 'instant' || platform.type === 'blog') return 'easy';
    if (platform.auth === 'account') return 'medium';
    return 'hard';
  }

  private estimateTraffic(da: number): string {
    if (da >= 90) return '10M+';
    if (da >= 80) return '5M+';
    if (da >= 70) return '1M+';
    if (da >= 60) return '500K+';
    return '100K+';
  }

  /**
   * Fallback platforms if database loading fails
   */
  private initializeFallbackPlatforms(): void {
    this.platforms = [
      {
        id: 'telegraph',
        name: 'Telegraph.ph',
        domain: 'telegra.ph',
        url: 'https://telegra.ph',
        domainAuthority: 91,
        isActive: true,
        category: 'web2_platforms',
        priority: 1,
        difficulty: 'easy',
        authRequired: false,
        backlinksAllowed: true,
        submissionMethod: 'form',
        metadata: { automationDifficulty: 'easy', category: 'web2_platforms' }
      },
      {
        id: 'writeas',
        name: 'Write.as',
        domain: 'write.as',
        url: 'https://write.as',
        domainAuthority: 75,
        isActive: true,
        category: 'web2_platforms',
        priority: 2,
        difficulty: 'easy',
        authRequired: false,
        backlinksAllowed: true,
        submissionMethod: 'form',
        metadata: { automationDifficulty: 'easy', category: 'web2_platforms' }
      }
    ];
    this.activePlatforms = [...this.platforms];
    this.isInitialized = true;
    console.log('✅ Initialized with fallback platforms');
  }

  /**
   * Refresh platform data from database
   */
  public refreshPlatforms(): void {
    this.platforms = [];
    this.activePlatforms = [];
    this.isInitialized = false;
    this.initializePlatforms();
  }

  /**
   * Get platform by ID or domain
   */
  public getPlatformById(id: string): MassivePlatform | null {
    return this.platforms.find(p => p.id === id || p.domain === id) || null;
  }

  /**
   * Add custom platform
   */
  public addCustomPlatform(platform: Partial<MassivePlatform>): void {
    const newPlatform: MassivePlatform = {
      id: platform.id || `custom_${Date.now()}`,
      name: platform.name || 'Custom Platform',
      domain: platform.domain || '',
      url: platform.url || `https://${platform.domain}`,
      domainAuthority: platform.domainAuthority || 50,
      isActive: platform.isActive !== false,
      category: platform.category || 'custom',
      priority: platform.priority || 999,
      difficulty: platform.difficulty || 'medium',
      authRequired: platform.authRequired !== false,
      backlinksAllowed: platform.backlinksAllowed !== false,
      submissionMethod: platform.submissionMethod || 'form',
      metadata: {
        automationDifficulty: platform.difficulty || 'medium',
        category: platform.category || 'custom',
        ...platform.metadata
      }
    };

    this.platforms.push(newPlatform);
    if (newPlatform.isActive) {
      this.activePlatforms.push(newPlatform);
    }
  }
}

// Export singleton instance
export const massivePlatformManager = new MassivePlatformManager();
export default massivePlatformManager;
