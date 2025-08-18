import guestPostingSites from '@/data/guestPostingSites.json';

export interface PlatformConfig {
  id: string;
  name: string;
  url: string;
  domainAuthority: number;
  htmlSupport: boolean;
  linksAllowed: boolean;
  accountRequired: boolean;
  apiAvailable: boolean;
  costPerPost: number;
  features: string[];
  rateLimits: {
    postsPerHour: number;
    postsPerDay: number;
  };
  requirements: {
    minContentLength: number;
    supportedFormats: string[];
    requiresAuthentication: boolean;
    allowsAnonymous: boolean;
    authMethod?: string;
  };
}

export interface PlatformCategory {
  name: string;
  description: string;
  platforms: string[];
}

export interface AuthMethod {
  platforms: string[];
  description: string;
}

/**
 * Get all available platform configurations
 */
export function getAllPlatforms(): PlatformConfig[] {
  return guestPostingSites.publishingPlatforms.platforms as PlatformConfig[];
}

/**
 * Get platform configuration by ID
 */
export function getPlatformById(id: string): PlatformConfig | null {
  const platforms = getAllPlatforms();
  return platforms.find(platform => platform.id === id) || null;
}

/**
 * Get platforms by category
 */
export function getPlatformsByCategory(category: string): PlatformConfig[] {
  const categoryData = guestPostingSites.platformCategories[category as keyof typeof guestPostingSites.platformCategories];
  if (!categoryData) return [];
  
  const platforms = getAllPlatforms();
  return platforms.filter(platform => categoryData.platforms.includes(platform.id));
}

/**
 * Get platforms that support instant publishing
 */
export function getInstantPublishPlatforms(): PlatformConfig[] {
  return getPlatformsByCategory('instant_publish');
}

/**
 * Get high authority platforms (DA > 90)
 */
export function getHighAuthorityPlatforms(): PlatformConfig[] {
  return getPlatformsByCategory('high_authority');
}

/**
 * Get platforms with API integration
 */
export function getApiEnabledPlatforms(): PlatformConfig[] {
  return getAllPlatforms().filter(platform => platform.apiAvailable);
}

/**
 * Get platforms by authentication method
 */
export function getPlatformsByAuthMethod(authMethod: string): PlatformConfig[] {
  const authData = guestPostingSites.authenticationMethods[authMethod as keyof typeof guestPostingSites.authenticationMethods];
  if (!authData) return [];
  
  const platforms = getAllPlatforms();
  return platforms.filter(platform => authData.platforms.includes(platform.id));
}

/**
 * Get platforms that don't require authentication
 */
export function getAnonymousPlatforms(): PlatformConfig[] {
  return getAllPlatforms().filter(platform => !platform.requirements.requiresAuthentication);
}

/**
 * Get platforms by cost range
 */
export function getPlatformsByCost(maxCost: number): PlatformConfig[] {
  return getAllPlatforms().filter(platform => platform.costPerPost <= maxCost);
}

/**
 * Get free platforms
 */
export function getFreePlatforms(): PlatformConfig[] {
  return getPlatformsByCost(0);
}

/**
 * Get platforms that support specific content format
 */
export function getPlatformsByFormat(format: 'html' | 'markdown'): PlatformConfig[] {
  return getAllPlatforms().filter(platform => 
    platform.requirements.supportedFormats.includes(format)
  );
}

/**
 * Get platforms suitable for content length
 */
export function getPlatformsByContentLength(wordCount: number): PlatformConfig[] {
  return getAllPlatforms().filter(platform => 
    wordCount >= platform.requirements.minContentLength
  );
}

/**
 * Get recommended platforms based on use case
 */
export function getRecommendedPlatforms(useCase: 'quick_backlinks' | 'authority_content' | 'developer_content' | 'professional_publishing'): {
  platforms: PlatformConfig[];
  pros: string[];
  cons: string[];
} {
  const recommendation = guestPostingSites.recommendedUse[useCase];
  if (!recommendation) {
    return { platforms: [], pros: [], cons: [] };
  }
  
  const platforms = getAllPlatforms().filter(platform => 
    recommendation.recommendedPlatforms.includes(platform.id)
  );
  
  return {
    platforms,
    pros: recommendation.pros,
    cons: recommendation.cons
  };
}

/**
 * Get platform categories
 */
export function getPlatformCategories(): Record<string, PlatformCategory> {
  return guestPostingSites.platformCategories as Record<string, PlatformCategory>;
}

/**
 * Get authentication methods
 */
export function getAuthenticationMethods(): Record<string, AuthMethod> {
  return guestPostingSites.authenticationMethods as Record<string, AuthMethod>;
}

/**
 * Get platform integration status
 */
export function getPlatformsByStatus(status: 'live' | 'ready' | 'testing'): PlatformConfig[] {
  const statusData = guestPostingSites.integrationStatus[status];
  if (!statusData) return [];
  
  const platforms = getAllPlatforms();
  return platforms.filter(platform => statusData.platforms.includes(platform.id));
}

/**
 * Get live platforms (currently working)
 */
export function getLivePlatforms(): PlatformConfig[] {
  return getPlatformsByStatus('live');
}

/**
 * Get ready platforms (implemented but not yet integrated)
 */
export function getReadyPlatforms(): PlatformConfig[] {
  return getPlatformsByStatus('ready');
}

/**
 * Filter platforms by requirements
 */
export function filterPlatforms(filters: {
  maxCost?: number;
  minDomainAuthority?: number;
  requiresAuth?: boolean;
  supportedFormats?: string[];
  minContentLength?: number;
  apiRequired?: boolean;
}): PlatformConfig[] {
  let platforms = getAllPlatforms();
  
  if (filters.maxCost !== undefined) {
    platforms = platforms.filter(p => p.costPerPost <= filters.maxCost!);
  }
  
  if (filters.minDomainAuthority !== undefined) {
    platforms = platforms.filter(p => p.domainAuthority >= filters.minDomainAuthority!);
  }
  
  if (filters.requiresAuth !== undefined) {
    platforms = platforms.filter(p => p.requirements.requiresAuthentication === filters.requiresAuth);
  }
  
  if (filters.supportedFormats && filters.supportedFormats.length > 0) {
    platforms = platforms.filter(p => 
      filters.supportedFormats!.some(format => 
        p.requirements.supportedFormats.includes(format)
      )
    );
  }
  
  if (filters.minContentLength !== undefined) {
    platforms = platforms.filter(p => 
      p.requirements.minContentLength <= filters.minContentLength!
    );
  }
  
  if (filters.apiRequired !== undefined) {
    platforms = platforms.filter(p => p.apiAvailable === filters.apiRequired);
  }
  
  return platforms;
}

/**
 * Sort platforms by domain authority (highest first)
 */
export function sortPlatformsByAuthority(platforms: PlatformConfig[]): PlatformConfig[] {
  return [...platforms].sort((a, b) => b.domainAuthority - a.domainAuthority);
}

/**
 * Sort platforms by cost (lowest first)
 */
export function sortPlatformsByCost(platforms: PlatformConfig[]): PlatformConfig[] {
  return [...platforms].sort((a, b) => a.costPerPost - b.costPerPost);
}

/**
 * Sort platforms by rate limits (highest throughput first)
 */
export function sortPlatformsByThroughput(platforms: PlatformConfig[]): PlatformConfig[] {
  return [...platforms].sort((a, b) => 
    (b.rateLimits.postsPerDay * 100 + b.rateLimits.postsPerHour) - 
    (a.rateLimits.postsPerDay * 100 + a.rateLimits.postsPerHour)
  );
}

/**
 * Get platform statistics
 */
export function getPlatformStats(): {
  totalPlatforms: number;
  apiEnabled: number;
  freeOptions: number;
  instantPublish: number;
  averageDA: number;
  averageCost: number;
} {
  const platforms = getAllPlatforms();
  
  return {
    totalPlatforms: platforms.length,
    apiEnabled: platforms.filter(p => p.apiAvailable).length,
    freeOptions: platforms.filter(p => p.costPerPost === 0).length,
    instantPublish: platforms.filter(p => !p.requirements.requiresAuthentication).length,
    averageDA: Math.round(platforms.reduce((sum, p) => sum + p.domainAuthority, 0) / platforms.length),
    averageCost: Math.round((platforms.reduce((sum, p) => sum + p.costPerPost, 0) / platforms.length) * 100) / 100
  };
}

/**
 * Get cost analysis
 */
export function getCostAnalysis(): Record<string, string[]> {
  return guestPostingSites.costAnalysis;
}

/**
 * Get upcoming platforms
 */
export function getUpcomingPlatforms(): any[] {
  return guestPostingSites.upcomingPlatforms.candidates;
}

/**
 * Get removed platforms with reasons
 */
export function getRemovedPlatforms(): any[] {
  return guestPostingSites.removedPlatforms.examples;
}

/**
 * Check if platform supports backlinks
 */
export function platformSupportsBacklinks(platformId: string): boolean {
  const platform = getPlatformById(platformId);
  return platform ? platform.linksAllowed : false;
}

/**
 * Get optimal platforms for campaign requirements
 */
export function getOptimalPlatforms(requirements: {
  budget?: number;
  minDomainAuthority?: number;
  contentLength?: number;
  contentFormat?: 'html' | 'markdown';
  needsInstantPublish?: boolean;
  allowsAuthentication?: boolean;
}): PlatformConfig[] {
  let platforms = getAllPlatforms();
  
  // Apply filters based on requirements
  if (requirements.budget !== undefined) {
    platforms = platforms.filter(p => p.costPerPost <= requirements.budget!);
  }
  
  if (requirements.minDomainAuthority !== undefined) {
    platforms = platforms.filter(p => p.domainAuthority >= requirements.minDomainAuthority!);
  }
  
  if (requirements.contentLength !== undefined) {
    platforms = platforms.filter(p => requirements.contentLength! >= p.requirements.minContentLength);
  }
  
  if (requirements.contentFormat) {
    platforms = platforms.filter(p => 
      p.requirements.supportedFormats.includes(requirements.contentFormat!)
    );
  }
  
  if (requirements.needsInstantPublish) {
    platforms = platforms.filter(p => !p.requirements.requiresAuthentication);
  }
  
  if (requirements.allowsAuthentication === false) {
    platforms = platforms.filter(p => !p.requirements.requiresAuthentication);
  }
  
  // Sort by a combination of domain authority and cost efficiency
  return platforms.sort((a, b) => {
    const scoreA = a.domainAuthority - (a.costPerPost * 10);
    const scoreB = b.domainAuthority - (b.costPerPost * 10);
    return scoreB - scoreA;
  });
}

/**
 * Get platform API documentation links
 */
export function getPlatformApiDocs(): Record<string, string> {
  return {
    wordpress: 'https://developer.wordpress.org/rest-api/',
    medium: 'https://github.com/Medium/medium-api-docs',
    devto: 'https://developers.forem.com/api',
    hashnode: 'https://apidocs.hashnode.com/',
    ghost: 'https://ghost.org/docs/admin-api/',
    telegraph: 'https://telegra.ph/api'
  };
}

/**
 * Get platform setup guides
 */
export function getPlatformSetupGuides(): Record<string, string[]> {
  return {
    wordpress: [
      'Create WordPress account or install self-hosted',
      'Generate Application Password in user settings',
      'Configure API endpoint URL',
      'Test connection with credentials'
    ],
    medium: [
      'Create Medium account',
      'Apply for API access via Medium Partner Program',
      'Set up OAuth application',
      'Obtain access token through OAuth flow'
    ],
    devto: [
      'Create Dev.to account',
      'Go to Settings > Account',
      'Generate API key',
      'Copy API key for configuration'
    ],
    hashnode: [
      'Create Hashnode account',
      'Create a publication/blog',
      'Generate Personal Access Token',
      'Configure publication settings'
    ],
    ghost: [
      'Set up Ghost blog (self-hosted or Ghost Pro)',
      'Create Custom Integration in admin panel',
      'Copy Admin API Key',
      'Note the API URL endpoint'
    ],
    telegraph: [
      'No setup required',
      'Platform supports anonymous posting',
      'API available without authentication'
    ]
  };
}

/**
 * Export default configuration
 */
export default {
  getAllPlatforms,
  getPlatformById,
  getPlatformsByCategory,
  getApiEnabledPlatforms,
  getOptimalPlatforms,
  getPlatformStats
};
