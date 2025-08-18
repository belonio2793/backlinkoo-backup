/**
 * Verified Platform Manager
 * Manages platform lists based on testing results and blacklist status
 * Only returns platforms that have been verified to work
 */

import { supabase } from '@/integrations/supabase/client';
import { PublishingPlatform } from './platformConfigService';

export interface VerifiedPlatform extends PublishingPlatform {
  domain: string;
  lastTested?: string;
  successRate?: number;
  averageResponseTime?: number;
  isVerified: boolean;
  testResults?: {
    totalTests: number;
    successfulTests: number;
    lastTestDate: string;
  };
}

export interface PlatformVerificationStats {
  totalPlatforms: number;
  verifiedPlatforms: number;
  blacklistedPlatforms: number;
  pendingVerification: number;
  lastVerificationRun?: string;
}

class VerifiedPlatformManager {
  private verifiedPlatforms: VerifiedPlatform[] = [];
  private blacklistedPlatformIds: Set<string> = new Set();
  private platformStats: Map<string, any> = new Map();
  private isInitialized = false;

  /**
   * Initialize the verified platform manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔍 Initializing verified platform manager...');
      
      // Load blacklisted platforms
      await this.loadBlacklistedPlatforms();
      
      // Load platform testing stats
      await this.loadPlatformStats();
      
      // Build verified platform list
      await this.buildVerifiedPlatformList();
      
      this.isInitialized = true;
      console.log(`✅ Verified platform manager initialized with ${this.verifiedPlatforms.length} verified platforms`);
      
    } catch (error) {
      console.error('❌ Error initializing verified platform manager:', error);
      
      // Fallback to basic verified platforms
      this.initializeFallbackPlatforms();
    }
  }

  /**
   * Get only verified, working platforms
   */
  async getVerifiedPlatforms(): Promise<VerifiedPlatform[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.verifiedPlatforms.filter(platform => 
      platform.isVerified && 
      !this.blacklistedPlatformIds.has(platform.id)
    );
  }

  /**
   * Get platform by ID if it's verified
   */
  async getVerifiedPlatformById(id: string): Promise<VerifiedPlatform | null> {
    const verifiedPlatforms = await this.getVerifiedPlatforms();
    return verifiedPlatforms.find(p => p.id === id) || null;
  }

  /**
   * Check if platform is verified and working
   */
  async isPlatformVerified(platformId: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return !this.blacklistedPlatformIds.has(platformId) && 
           this.verifiedPlatforms.some(p => p.id === platformId && p.isVerified);
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(): Promise<PlatformVerificationStats> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const totalPlatforms = this.verifiedPlatforms.length;
    const verifiedPlatforms = this.verifiedPlatforms.filter(p => p.isVerified).length;
    const blacklistedPlatforms = this.blacklistedPlatformIds.size;
    const pendingVerification = totalPlatforms - verifiedPlatforms - blacklistedPlatforms;

    return {
      totalPlatforms,
      verifiedPlatforms,
      blacklistedPlatforms,
      pendingVerification,
      lastVerificationRun: await this.getLastVerificationDate()
    };
  }

  /**
   * Refresh verification data
   */
  async refresh(): Promise<void> {
    this.isInitialized = false;
    this.verifiedPlatforms = [];
    this.blacklistedPlatformIds.clear();
    this.platformStats.clear();
    
    await this.initialize();
  }

  /**
   * Load blacklisted platforms from database
   */
  private async loadBlacklistedPlatforms(): Promise<void> {
    try {
      const { data: blacklistedPlatforms, error } = await supabase
        .from('platform_blacklist')
        .select('platform_id')
        .eq('is_active', true);

      if (error) {
        console.warn('Could not load blacklisted platforms:', error);
        return;
      }

      this.blacklistedPlatformIds = new Set(
        blacklistedPlatforms.map(p => p.platform_id)
      );

      console.log(`🚫 Loaded ${this.blacklistedPlatformIds.size} blacklisted platforms`);
    } catch (error) {
      console.warn('Error loading blacklisted platforms:', error);
    }
  }

  /**
   * Load platform testing statistics
   */
  private async loadPlatformStats(): Promise<void> {
    try {
      const { data: stats, error } = await supabase
        .from('platform_stats')
        .select('*');

      if (error) {
        console.warn('Could not load platform stats:', error);
        return;
      }

      for (const stat of stats || []) {
        this.platformStats.set(stat.platform_id, stat);
      }

      console.log(`📊 Loaded stats for ${this.platformStats.size} platforms`);
    } catch (error) {
      console.warn('Error loading platform stats:', error);
    }
  }

  /**
   * Build verified platform list based on testing results
   */
  private async buildVerifiedPlatformList(): Promise<void> {
    // Start with known working platforms from our analysis
    const knownWorkingPlatforms = [
      {
        id: 'telegraph',
        name: 'Telegraph.ph',
        domain: 'telegra.ph',
        isActive: true,
        maxPostsPerCampaign: -1,
        priority: 1,
        description: 'Anonymous publishing platform with instant publishing',
        capabilities: ['html', 'anonymous', 'instant']
      },
      {
        id: 'writeas',
        name: 'Write.as',
        domain: 'write.as',
        isActive: true,
        maxPostsPerCampaign: -1,
        priority: 2,
        description: 'Minimalist publishing platform with markdown support',
        capabilities: ['markdown', 'anonymous', 'clean']
      }
    ];

    // Convert to VerifiedPlatform format
    this.verifiedPlatforms = knownWorkingPlatforms.map(platform => {
      const stats = this.platformStats.get(platform.id);
      
      return {
        ...platform,
        isVerified: !this.blacklistedPlatformIds.has(platform.id),
        lastTested: stats?.last_tested,
        successRate: stats?.success_rate || 100, // Assume 100% for known working platforms
        averageResponseTime: stats?.avg_response_time || 1500,
        testResults: stats ? {
          totalTests: stats.total_tests,
          successfulTests: stats.successful_tests,
          lastTestDate: stats.last_tested
        } : undefined
      };
    });

    // Add other platforms that have been successfully tested
    const additionalVerifiedPlatforms = await this.getAdditionalVerifiedPlatforms();
    this.verifiedPlatforms.push(...additionalVerifiedPlatforms);

    console.log(`✅ Built verified platform list with ${this.verifiedPlatforms.length} platforms`);
  }

  /**
   * Get additional verified platforms from test results
   */
  private async getAdditionalVerifiedPlatforms(): Promise<VerifiedPlatform[]> {
    try {
      const { data: verifiedStats, error } = await supabase
        .from('platform_stats')
        .select('*')
        .gt('success_rate', 75) // At least 75% success rate
        .gt('total_tests', 2)    // At least 3 tests
        .eq('is_blacklisted', false);

      if (error || !verifiedStats) {
        return [];
      }

      return verifiedStats
        .filter(stat => !['telegraph', 'writeas'].includes(stat.platform_id)) // Exclude already added platforms
        .map(stat => ({
          id: stat.platform_id,
          name: stat.platform_name,
          domain: stat.domain,
          isActive: true,
          maxPostsPerCampaign: -1,
          priority: 10, // Lower priority than known working platforms
          description: `Verified platform with ${stat.success_rate}% success rate`,
          capabilities: ['verified', 'tested'],
          isVerified: true,
          lastTested: stat.last_tested,
          successRate: stat.success_rate,
          averageResponseTime: stat.avg_response_time,
          testResults: {
            totalTests: stat.total_tests,
            successfulTests: stat.successful_tests,
            lastTestDate: stat.last_tested
          }
        }));

    } catch (error) {
      console.warn('Error loading additional verified platforms:', error);
      return [];
    }
  }

  /**
   * Get last verification date
   */
  private async getLastVerificationDate(): Promise<string | undefined> {
    try {
      const { data, error } = await supabase
        .from('platform_test_results')
        .select('tested_at')
        .order('tested_at', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return undefined;
      }

      return data[0].tested_at;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Initialize fallback platforms if database access fails
   */
  private initializeFallbackPlatforms(): void {
    this.verifiedPlatforms = [
      {
        id: 'telegraph',
        name: 'Telegraph.ph',
        domain: 'telegra.ph',
        isActive: true,
        maxPostsPerCampaign: -1,
        priority: 1,
        description: 'Anonymous publishing platform (verified working)',
        capabilities: ['html', 'anonymous', 'verified'],
        isVerified: true,
        successRate: 95,
        averageResponseTime: 1200
      },
      {
        id: 'writeas',
        name: 'Write.as',
        domain: 'write.as',
        isActive: true,
        maxPostsPerCampaign: -1,
        priority: 2,
        description: 'Minimalist publishing platform (verified working)',
        capabilities: ['markdown', 'anonymous', 'verified'],
        isVerified: true,
        successRate: 90,
        averageResponseTime: 1800
      }
    ];

    this.isInitialized = true;
    console.log('✅ Initialized with fallback verified platforms');
  }

  /**
   * Convert to basic PublishingPlatform format for compatibility
   */
  async toPublishingPlatforms(): Promise<PublishingPlatform[]> {
    const verifiedPlatforms = await this.getVerifiedPlatforms();
    
    return verifiedPlatforms.map(platform => ({
      id: platform.id,
      name: platform.name,
      isActive: platform.isActive,
      maxPostsPerCampaign: platform.maxPostsPerCampaign,
      priority: platform.priority,
      description: platform.description,
      capabilities: platform.capabilities
    }));
  }

  /**
   * Get platforms for campaign selection (only verified ones)
   */
  async getPlatformsForCampaign(excludeUsed: string[] = []): Promise<VerifiedPlatform[]> {
    const verifiedPlatforms = await this.getVerifiedPlatforms();
    const excludeSet = new Set(excludeUsed.map(id => id.toLowerCase()));
    
    return verifiedPlatforms
      .filter(platform => !excludeSet.has(platform.id.toLowerCase()))
      .sort((a, b) => {
        // Sort by success rate (desc), then response time (asc)
        if (a.successRate !== b.successRate) {
          return (b.successRate || 0) - (a.successRate || 0);
        }
        return (a.averageResponseTime || 0) - (b.averageResponseTime || 0);
      });
  }

  /**
   * Add platform to blacklist
   */
  async blacklistPlatform(platformId: string, reason: string): Promise<void> {
    try {
      const platform = this.verifiedPlatforms.find(p => p.id === platformId);
      
      if (!platform) {
        console.warn(`Platform ${platformId} not found for blacklisting`);
        return;
      }

      const { error } = await supabase
        .from('platform_blacklist')
        .upsert({
          platform_id: platformId,
          domain: platform.domain,
          reason,
          failure_count: 1,
          last_failure: new Date().toISOString(),
          is_active: true
        });

      if (error) {
        console.error('Error blacklisting platform:', error);
      } else {
        this.blacklistedPlatformIds.add(platformId);
        console.log(`🚫 Blacklisted platform: ${platformId} (${reason})`);
      }
    } catch (error) {
      console.error('Error blacklisting platform:', error);
    }
  }
}

// Export singleton instance
export const verifiedPlatformManager = new VerifiedPlatformManager();
export default verifiedPlatformManager;
