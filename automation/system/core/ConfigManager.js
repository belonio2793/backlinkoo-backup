/**
 * Configuration Manager - Centralized configuration for automation system
 */

import { SystemLogger } from './SystemLogger.js';

export class ConfigManager {
  constructor(initialConfig = {}) {
    this.logger = new SystemLogger('ConfigManager');
    this.config = {
      // Global settings
      global: {
        processingInterval: 5000, // 5 seconds
        maxConcurrentTasks: 10,
        retryAttempts: 3,
        retryDelay: 2000,
        enableSafetyChecks: true,
        enableRateLimiting: true,
        enableProxyRotation: true,
        enableUserAgentRotation: true,
        ...initialConfig.global
      },

      // Blog commenting engine configuration
      blogCommenting: {
        enabled: true,
        batchSize: 5,
        commentDelay: { min: 30000, max: 120000 }, // 30s - 2min
        maxCommentsPerSite: 3,
        maxCommentsPerDay: 50,
        commentLength: { min: 50, max: 200 },
        enableSpinning: true,
        enableNLP: true,
        requireModeration: true,
        targetSites: [],
        blacklistedSites: [],
        commentTemplates: [],
        userProfiles: [],
        ...initialConfig.blogCommenting
      },

      // Blog posting engine configuration
      blogPosting: {
        enabled: true,
        batchSize: 3,
        postDelay: { min: 300000, max: 900000 }, // 5-15 min
        maxPostsPerSite: 1,
        maxPostsPerDay: 10,
        articleLength: { min: 500, max: 2000 },
        enableSEOOptimization: true,
        enableImageInsertion: true,
        enableVideoEmbedding: true,
        targetPlatforms: [],
        contentCategories: [],
        authorProfiles: [],
        ...initialConfig.blogPosting
      },

      // Forum profiles engine configuration
      forumProfiles: {
        enabled: true,
        batchSize: 2,
        profileCreationDelay: { min: 600000, max: 1800000 }, // 10-30 min
        maxProfilesPerSite: 1,
        maxProfilesPerDay: 5,
        enableSignatureLinks: true,
        enableProfileLinks: true,
        enablePostLinks: true,
        targetForums: [],
        profileTemplates: [],
        signatureTemplates: [],
        ...initialConfig.forumProfiles
      },

      // Social media engine configuration
      socialMedia: {
        enabled: true,
        batchSize: 8,
        postDelay: { min: 180000, max: 600000 }, // 3-10 min
        maxPostsPerPlatform: 5,
        maxPostsPerDay: 25,
        enableHashtags: true,
        enableMentions: true,
        enableMediaUploads: true,
        platforms: {
          twitter: { enabled: true, maxPosts: 10 },
          facebook: { enabled: true, maxPosts: 5 },
          linkedin: { enabled: true, maxPosts: 3 },
          instagram: { enabled: true, maxPosts: 5 },
          pinterest: { enabled: true, maxPosts: 8 },
          tumblr: { enabled: true, maxPosts: 6 }
        },
        contentTemplates: [],
        accountProfiles: [],
        ...initialConfig.socialMedia
      },

      // Web 2.0 engine configuration
      web2: {
        enabled: true,
        batchSize: 4,
        siteCreationDelay: { min: 900000, max: 2700000 }, // 15-45 min
        maxSitesPerPlatform: 2,
        maxSitesPerDay: 8,
        enableContentSeeding: true,
        enableInterlinking: true,
        enableRSSFeeds: true,
        targetPlatforms: [],
        siteTemplates: [],
        contentSchedules: [],
        ...initialConfig.web2
      },

      // Guest posting engine configuration
      guestPosting: {
        enabled: true,
        batchSize: 2,
        outreachDelay: { min: 1800000, max: 3600000 }, // 30-60 min
        maxOutreachPerDay: 20,
        maxSubmissionsPerDay: 5,
        enableAutomatedOutreach: true,
        enableFollowUps: true,
        enableContentCustomization: true,
        targetSites: [],
        outreachTemplates: [],
        contentTemplates: [],
        ...initialConfig.guestPosting
      },

      // Safety and compliance settings
      safety: {
        enableIPRotation: true,
        enableCaptchaSolving: true,
        enableHumanSimulation: true,
        maxActionsPerIP: 100,
        maxActionsPerHour: 50,
        blacklistedDomains: [],
        requiredDelays: {
          betweenActions: 5000,
          betweenSites: 30000,
          betweenCampaigns: 300000
        },
        ...initialConfig.safety
      },

      // Proxy settings
      proxies: {
        enabled: true,
        rotation: true,
        types: ['http', 'https', 'socks5'],
        providers: [],
        testTimeout: 10000,
        maxFailures: 3,
        ...initialConfig.proxies
      },

      // Database settings
      database: {
        connectionString: process.env.AUTOMATION_DB_URL,
        maxConnections: 20,
        queryTimeout: 30000,
        enableLogging: false,
        ...initialConfig.database
      }
    };

    this.loaded = false;
  }

  async load() {
    this.logger.info('Loading configuration...');
    
    try {
      // Load from environment variables
      this.loadFromEnvironment();
      
      // Load from database if available
      await this.loadFromDatabase();
      
      // Validate configuration
      this.validate();
      
      this.loaded = true;
      this.logger.success('Configuration loaded successfully');
      
    } catch (error) {
      this.logger.error('Failed to load configuration:', error);
      throw error;
    }
  }

  loadFromEnvironment() {
    // Load configuration from environment variables
    const envMappings = {
      'AUTOMATION_PROCESSING_INTERVAL': 'global.processingInterval',
      'AUTOMATION_MAX_CONCURRENT': 'global.maxConcurrentTasks',
      'AUTOMATION_ENABLE_SAFETY': 'global.enableSafetyChecks',
      'AUTOMATION_BLOG_COMMENTING_ENABLED': 'blogCommenting.enabled',
      'AUTOMATION_BLOG_POSTING_ENABLED': 'blogPosting.enabled',
      'AUTOMATION_FORUM_PROFILES_ENABLED': 'forumProfiles.enabled',
      'AUTOMATION_SOCIAL_MEDIA_ENABLED': 'socialMedia.enabled',
      'AUTOMATION_WEB2_ENABLED': 'web2.enabled',
      'AUTOMATION_GUEST_POSTING_ENABLED': 'guestPosting.enabled'
    };

    for (const [envVar, configPath] of Object.entries(envMappings)) {
      const value = process.env[envVar];
      if (value !== undefined) {
        this.setNestedValue(configPath, this.parseEnvValue(value));
      }
    }
  }

  async loadFromDatabase() {
    // Database configuration loading would be implemented here
    this.logger.debug('Database configuration loading not implemented yet');
  }

  validate() {
    const requiredSettings = [
      'global.processingInterval',
      'global.maxConcurrentTasks'
    ];

    for (const setting of requiredSettings) {
      const value = this.getNestedValue(setting);
      if (value === undefined || value === null) {
        throw new Error(`Required configuration setting missing: ${setting}`);
      }
    }

    // Validate numeric ranges
    if (this.config.global.processingInterval < 1000) {
      throw new Error('Processing interval must be at least 1000ms');
    }

    if (this.config.global.maxConcurrentTasks < 1) {
      throw new Error('Max concurrent tasks must be at least 1');
    }

    this.logger.debug('Configuration validation passed');
  }

  get(path) {
    return this.getNestedValue(path);
  }

  set(path, value) {
    this.setNestedValue(path, value);
  }

  getNestedValue(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  setNestedValue(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key] = obj[key] || {}, this.config);
    target[lastKey] = value;
  }

  parseEnvValue(value) {
    // Parse environment variable values
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(value)) return Number(value);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  // Getter methods for each engine configuration
  getBlogCommentingConfig() {
    return { ...this.config.blogCommenting, global: this.config.global };
  }

  getBlogPostingConfig() {
    return { ...this.config.blogPosting, global: this.config.global };
  }

  getForumProfileConfig() {
    return { ...this.config.forumProfiles, global: this.config.global };
  }

  getSocialMediaConfig() {
    return { ...this.config.socialMedia, global: this.config.global };
  }

  getWeb2Config() {
    return { ...this.config.web2, global: this.config.global };
  }

  getGuestPostingConfig() {
    return { ...this.config.guestPosting, global: this.config.global };
  }

  getSafetyConfig() {
    return this.config.safety;
  }

  getProxyConfig() {
    return this.config.proxies;
  }

  getProcessingInterval() {
    return this.config.global.processingInterval;
  }

  getBatchSize(engineType) {
    return this.config[engineType]?.batchSize || 5;
  }

  exportConfig() {
    return JSON.stringify(this.config, null, 2);
  }

  importConfig(configJson) {
    try {
      const newConfig = JSON.parse(configJson);
      this.config = { ...this.config, ...newConfig };
      this.validate();
      this.logger.success('Configuration imported successfully');
    } catch (error) {
      this.logger.error('Failed to import configuration:', error);
      throw error;
    }
  }
}
