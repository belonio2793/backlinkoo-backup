/**
 * Centralized Platform Configuration Service
 * Single source of truth for all platform configurations
 */

export interface PublishingPlatform {
  id: string;
  name: string;
  isActive: boolean;
  maxPostsPerCampaign: number;
  priority: number;
  description?: string;
  capabilities?: string[];
}

/**
 * Central platform configuration - Single source of truth
 * When adding new platforms, only update this list
 */
export const AVAILABLE_PLATFORMS: PublishingPlatform[] = [
  { 
    id: 'telegraph', 
    name: 'Telegraph.ph', 
    isActive: true, 
    maxPostsPerCampaign: 1, 
    priority: 1,
    description: 'Anonymous publishing platform',
    capabilities: ['html', 'anonymous']
  },
  { 
    id: 'writeas', 
    name: 'Write.as', 
    isActive: true, 
    maxPostsPerCampaign: 1, 
    priority: 2,
    description: 'Minimalist publishing platform',
    capabilities: ['markdown', 'anonymous']
  },
  { 
    id: 'medium', 
    name: 'Medium.com', 
    isActive: false, 
    maxPostsPerCampaign: 1, 
    priority: 3,
    description: 'Professional publishing platform',
    capabilities: ['html', 'account_required']
  },
  { 
    id: 'devto', 
    name: 'Dev.to', 
    isActive: false, 
    maxPostsPerCampaign: 1, 
    priority: 4,
    description: 'Developer community platform',
    capabilities: ['markdown', 'account_required']
  },
  { 
    id: 'linkedin', 
    name: 'LinkedIn Articles', 
    isActive: false, 
    maxPostsPerCampaign: 1, 
    priority: 5,
    description: 'Professional network articles',
    capabilities: ['html', 'account_required']
  },
  { 
    id: 'hashnode', 
    name: 'Hashnode', 
    isActive: false, 
    maxPostsPerCampaign: 1, 
    priority: 6,
    description: 'Developer blogging platform',
    capabilities: ['markdown', 'account_required']
  },
  { 
    id: 'substack', 
    name: 'Substack', 
    isActive: false, 
    maxPostsPerCampaign: 1, 
    priority: 7,
    description: 'Newsletter and publishing platform',
    capabilities: ['html', 'account_required']
  }
];

/**
 * Platform Configuration Service
 */
export class PlatformConfigService {
  /**
   * Get all platforms
   */
  static getAllPlatforms(): PublishingPlatform[] {
    return [...AVAILABLE_PLATFORMS];
  }

  /**
   * Get only active platforms sorted by priority
   */
  static getActivePlatforms(): PublishingPlatform[] {
    return AVAILABLE_PLATFORMS
      .filter(p => p.isActive)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get platform by ID
   */
  static getPlatformById(id: string): PublishingPlatform | null {
    return AVAILABLE_PLATFORMS.find(p => p.id === id) || null;
  }

  /**
   * Get platform names for display
   */
  static getActivePlatformNames(): string[] {
    return this.getActivePlatforms().map(p => p.name);
  }

  /**
   * Get platform count
   */
  static getActivePlatformCount(): number {
    return this.getActivePlatforms().length;
  }

  /**
   * Check if platform is active
   */
  static isPlatformActive(platformId: string): boolean {
    const platform = this.getPlatformById(platformId);
    return platform?.isActive === true;
  }

  /**
   * Get next available platform for rotation
   */
  static getNextPlatformForCampaign(usedPlatformIds: string[]): PublishingPlatform | null {
    const activePlatforms = this.getActivePlatforms();
    
    // Normalize used platform IDs
    const normalizedUsedIds = new Set(
      usedPlatformIds.map(id => this.normalizePlatformId(id))
    );

    // Find first unused platform
    for (const platform of activePlatforms) {
      if (!normalizedUsedIds.has(platform.id)) {
        return platform;
      }
    }

    return null; // All platforms used
  }

  /**
   * Normalize platform ID for consistency
   */
  static normalizePlatformId(platformId: string): string {
    const normalized = platformId.toLowerCase();
    
    // Handle legacy platform names
    if (normalized === 'write.as' || normalized === 'writeas') return 'writeas';
    if (normalized === 'telegraph.ph' || normalized === 'telegraph') return 'telegraph';
    if (normalized === 'medium.com') return 'medium';
    if (normalized === 'dev.to') return 'devto';
    
    return normalized;
  }

  /**
   * Get platform rotation description for UI
   */
  static getPlatformRotationDescription(): string {
    const activeNames = this.getActivePlatformNames();
    if (activeNames.length === 0) return 'No active platforms';
    if (activeNames.length === 1) return `Publishing to ${activeNames[0]}`;
    if (activeNames.length === 2) return `Publishing to ${activeNames[0]} and ${activeNames[1]}`;
    
    const lastPlatform = activeNames.pop();
    return `Publishing to ${activeNames.join(', ')}, and ${lastPlatform}`;
  }

  /**
   * Check if all platforms completed for a campaign
   */
  static areAllPlatformsCompleted(publishedPlatformIds: string[]): boolean {
    const activePlatforms = this.getActivePlatforms();
    const normalizedPublished = new Set(
      publishedPlatformIds.map(id => this.normalizePlatformId(id))
    );

    return activePlatforms.every(platform => normalizedPublished.has(platform.id));
  }

  /**
   * Get platform completion summary
   */
  static getPlatformCompletionSummary(publishedPlatformIds: string[]): {
    completed: number;
    total: number;
    remaining: string[];
    allCompleted: boolean;
  } {
    const activePlatforms = this.getActivePlatforms();
    const normalizedPublished = new Set(
      publishedPlatformIds.map(id => this.normalizePlatformId(id))
    );

    const remaining = activePlatforms
      .filter(platform => !normalizedPublished.has(platform.id))
      .map(platform => platform.name);

    return {
      completed: activePlatforms.length - remaining.length,
      total: activePlatforms.length,
      remaining,
      allCompleted: remaining.length === 0
    };
  }
}
