/**
 * Platform Configuration for Automation Targets
 * Contains API documentation, endpoints, and implementation details
 */

export interface PlatformConfig {
  id: string;
  name: string;
  domain: string;
  apiUrl: string;
  documentation: string;
  features: {
    anonymous: boolean;
    instantPublish: boolean;
    customSlugs: boolean;
    markdown: boolean;
    html: boolean;
    editing: boolean;
    analytics: boolean;
  };
  limits: {
    maxLength?: number;
    minLength?: number;
    rateLimit?: string;
    dailyLimit?: number;
  };
  authentication: {
    required: boolean;
    type?: 'api_key' | 'oauth' | 'token' | 'none';
    headers?: Record<string, string>;
  };
  implementation: {
    status: 'implemented' | 'planned' | 'testing';
    notes: string;
    priority: 'high' | 'medium' | 'low';
  };
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  'telegraph': {
    id: 'telegraph',
    name: 'Telegraph',
    domain: 'telegra.ph',
    apiUrl: 'https://api.telegra.ph',
    documentation: 'https://telegra.ph/api',
    features: {
      anonymous: true,
      instantPublish: true,
      customSlugs: false,
      markdown: false,
      html: true,
      editing: true,
      analytics: false
    },
    limits: {
      maxLength: 64000,
      minLength: 1,
      rateLimit: 'No official limit',
      dailyLimit: undefined
    },
    authentication: {
      required: false,
      type: 'none'
    },
    implementation: {
      status: 'implemented',
      notes: 'Fully working with both Netlify functions and client-side fallback',
      priority: 'high'
    }
  },
  
  'write-as': {
    id: 'write-as',
    name: 'Write.as',
    domain: 'write.as',
    apiUrl: 'https://write.as/api',
    documentation: 'https://developers.write.as/docs/api/',
    features: {
      anonymous: true,
      instantPublish: true,
      customSlugs: true,
      markdown: true,
      html: false,
      editing: true,
      analytics: false
    },
    limits: {
      maxLength: undefined,
      minLength: 1,
      rateLimit: '100 requests per hour',
      dailyLimit: undefined
    },
    authentication: {
      required: false,
      type: 'none',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Backlink-Automation/1.0'
      }
    },
    implementation: {
      status: 'planned',
      notes: 'API endpoint: POST /api/posts - supports markdown content, anonymous posting',
      priority: 'high'
    }
  },
  
  'rentry-co': {
    id: 'rentry-co',
    name: 'Rentry.co',
    domain: 'rentry.co',
    apiUrl: 'https://rentry.co/api',
    documentation: 'https://rentry.co/api',
    features: {
      anonymous: true,
      instantPublish: true,
      customSlugs: true,
      markdown: true,
      html: false,
      editing: true,
      analytics: false
    },
    limits: {
      maxLength: undefined,
      minLength: 1,
      rateLimit: 'Reasonable use',
      dailyLimit: undefined
    },
    authentication: {
      required: false,
      type: 'none',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://rentry.co/'
      }
    },
    implementation: {
      status: 'planned',
      notes: 'Simple form-based API, supports markdown, anonymous posting with custom URLs',
      priority: 'medium'
    }
  },
  
  'justpaste-it': {
    id: 'justpaste-it',
    name: 'JustPaste.it',
    domain: 'justpaste.it',
    apiUrl: 'https://justpaste.it/api',
    documentation: 'https://justpaste.it/api',
    features: {
      anonymous: true,
      instantPublish: true,
      customSlugs: false,
      markdown: false,
      html: true,
      editing: false,
      analytics: false
    },
    limits: {
      maxLength: undefined,
      minLength: 1,
      rateLimit: 'Not specified',
      dailyLimit: undefined
    },
    authentication: {
      required: false,
      type: 'none',
      headers: {
        'Content-Type': 'application/json'
      }
    },
    implementation: {
      status: 'planned',
      notes: 'Simple paste service with API, supports anonymous posting',
      priority: 'low'
    }
  }
};

/**
 * Get configuration for a specific platform
 */
export function getPlatformConfig(platformId: string): PlatformConfig | null {
  return PLATFORM_CONFIGS[platformId] || null;
}

/**
 * Get all implemented platforms
 */
export function getImplementedPlatforms(): PlatformConfig[] {
  return Object.values(PLATFORM_CONFIGS).filter(
    config => config.implementation.status === 'implemented'
  );
}

/**
 * Get all planned platforms
 */
export function getPlannedPlatforms(): PlatformConfig[] {
  return Object.values(PLATFORM_CONFIGS).filter(
    config => config.implementation.status === 'planned'
  );
}

/**
 * Get platform publishing requirements
 */
export function getPlatformRequirements(platformId: string): {
  contentFormat: 'markdown' | 'html' | 'plain';
  authRequired: boolean;
  maxLength?: number;
  minLength?: number;
} | null {
  const config = getPlatformConfig(platformId);
  if (!config) return null;

  let contentFormat: 'markdown' | 'html' | 'plain' = 'plain';
  if (config.features.markdown) contentFormat = 'markdown';
  else if (config.features.html) contentFormat = 'html';

  return {
    contentFormat,
    authRequired: config.authentication.required,
    maxLength: config.limits.maxLength,
    minLength: config.limits.minLength
  };
}

/**
 * Get platform API documentation links
 */
export function getPlatformDocs(): Record<string, string> {
  const docs: Record<string, string> = {};
  Object.values(PLATFORM_CONFIGS).forEach(config => {
    docs[config.id] = config.documentation;
  });
  return docs;
}

export default PLATFORM_CONFIGS;
