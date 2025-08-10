/**
 * Safety Manager - Ensures compliance and safe operation of automation system
 */

import { SystemLogger } from './SystemLogger.js';

export class SafetyManager {
  constructor() {
    this.logger = new SystemLogger('SafetyManager');
    this.rateLimits = new Map();
    this.ipTracker = new Map();
    this.siteTracker = new Map();
    this.globalLimits = new Map();
    this.blacklistedDomains = new Set();
    this.suspiciousPatterns = new Set();
    this.lastActions = new Map();
    this.initialized = false;
  }

  async initialize() {
    this.logger.info('Initializing Safety Manager...');
    
    try {
      // Initialize default rate limits
      this.setupDefaultRateLimits();
      
      // Load blacklisted domains
      this.loadBlacklistedDomains();
      
      // Setup suspicious pattern detection
      this.setupSuspiciousPatterns();
      
      this.initialized = true;
      this.logger.success('Safety Manager initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize Safety Manager:', error);
      throw error;
    }
  }

  setupDefaultRateLimits() {
    // Global rate limits
    this.setRateLimit('global', 'actions_per_hour', 200);
    this.setRateLimit('global', 'actions_per_day', 2000);
    this.setRateLimit('global', 'sites_per_hour', 50);
    this.setRateLimit('global', 'sites_per_day', 300);

    // Per-IP rate limits
    this.setRateLimit('ip', 'actions_per_hour', 50);
    this.setRateLimit('ip', 'actions_per_day', 500);
    this.setRateLimit('ip', 'sites_per_hour', 20);

    // Per-site rate limits
    this.setRateLimit('site', 'actions_per_hour', 5);
    this.setRateLimit('site', 'actions_per_day', 20);
    this.setRateLimit('site', 'min_delay_between_actions', 30000); // 30 seconds

    // Engine-specific limits
    this.setRateLimit('blog-commenting', 'per_site_per_day', 3);
    this.setRateLimit('blog-posting', 'per_site_per_day', 1);
    this.setRateLimit('forum-profiles', 'per_site_per_day', 1);
    this.setRateLimit('social-media', 'per_platform_per_day', 10);
    this.setRateLimit('web2', 'per_platform_per_day', 2);
    this.setRateLimit('guest-posting', 'outreach_per_day', 20);
  }

  loadBlacklistedDomains() {
    // Common blacklisted domains and patterns
    const defaultBlacklist = [
      'google.com',
      'facebook.com',
      'twitter.com',
      'linkedin.com',
      'instagram.com',
      'youtube.com',
      'amazon.com',
      'wikipedia.org',
      'github.com',
      'stackoverflow.com',
      'reddit.com'
    ];

    defaultBlacklist.forEach(domain => this.blacklistedDomains.add(domain));
  }

  setupSuspiciousPatterns() {
    // Patterns that might indicate problematic behavior
    this.suspiciousPatterns.add(/password|login|signin|admin|wp-admin/i);
    this.suspiciousPatterns.add(/captcha|recaptcha|verification/i);
    this.suspiciousPatterns.add(/blocked|banned|suspended/i);
    this.suspiciousPatterns.add(/403|404|500|error/i);
  }

  async validateCampaign(campaignConfig) {
    this.logger.info('Validating campaign configuration...');
    
    const issues = [];

    // Check if engines are properly configured
    if (!campaignConfig.engines) {
      issues.push('No engines configured');
    }

    // Validate target URLs
    if (campaignConfig.targetUrls) {
      for (const url of campaignConfig.targetUrls) {
        if (this.isBlacklistedDomain(url)) {
          issues.push(`Blacklisted domain in targets: ${url}`);
        }
      }
    }

    // Check rate limit compliance
    const estimatedActions = this.estimateCampaignActions(campaignConfig);
    if (estimatedActions > this.getRateLimit('global', 'actions_per_day')) {
      issues.push(`Campaign exceeds daily action limit: ${estimatedActions}`);
    }

    if (issues.length > 0) {
      throw new Error(`Campaign validation failed: ${issues.join(', ')}`);
    }

    this.logger.success('Campaign validation passed');
    return true;
  }

  async canProcessTask(task) {
    if (!this.initialized) {
      this.logger.warn('Safety Manager not initialized, allowing task');
      return true;
    }

    try {
      // Check global rate limits
      if (!this.checkGlobalRateLimits()) {
        this.logger.warn('Global rate limits exceeded');
        return false;
      }

      // Check IP-specific rate limits
      if (task.ip && !this.checkIPRateLimits(task.ip)) {
        this.logger.warn(`IP rate limits exceeded: ${task.ip}`);
        return false;
      }

      // Check site-specific rate limits
      if (task.targetUrl && !this.checkSiteRateLimits(task.targetUrl)) {
        this.logger.warn(`Site rate limits exceeded: ${task.targetUrl}`);
        return false;
      }

      // Check domain blacklist
      if (task.targetUrl && this.isBlacklistedDomain(task.targetUrl)) {
        this.logger.warn(`Blacklisted domain: ${task.targetUrl}`);
        return false;
      }

      // Check minimum delays
      if (!this.checkMinimumDelays(task)) {
        this.logger.debug('Minimum delay not met');
        return false;
      }

      // Check for suspicious patterns
      if (this.detectSuspiciousPatterns(task)) {
        this.logger.warn('Suspicious patterns detected in task');
        return false;
      }

      return true;

    } catch (error) {
      this.logger.error('Error in safety check:', error);
      return false;
    }
  }

  checkGlobalRateLimits() {
    const now = Date.now();
    const hourlyLimit = this.getRateLimit('global', 'actions_per_hour');
    const dailyLimit = this.getRateLimit('global', 'actions_per_day');

    const hourlyActions = this.getActionCount('global', 'hour');
    const dailyActions = this.getActionCount('global', 'day');

    return hourlyActions < hourlyLimit && dailyActions < dailyLimit;
  }

  checkIPRateLimits(ip) {
    const hourlyLimit = this.getRateLimit('ip', 'actions_per_hour');
    const dailyLimit = this.getRateLimit('ip', 'actions_per_day');

    const hourlyActions = this.getActionCount(`ip:${ip}`, 'hour');
    const dailyActions = this.getActionCount(`ip:${ip}`, 'day');

    return hourlyActions < hourlyLimit && dailyActions < dailyLimit;
  }

  checkSiteRateLimits(url) {
    const domain = this.extractDomain(url);
    const hourlyLimit = this.getRateLimit('site', 'actions_per_hour');
    const dailyLimit = this.getRateLimit('site', 'actions_per_day');

    const hourlyActions = this.getActionCount(`site:${domain}`, 'hour');
    const dailyActions = this.getActionCount(`site:${domain}`, 'day');

    return hourlyActions < hourlyLimit && dailyActions < dailyLimit;
  }

  checkMinimumDelays(task) {
    const key = task.targetUrl ? this.extractDomain(task.targetUrl) : 'global';
    const lastAction = this.lastActions.get(key);
    
    if (!lastAction) return true;

    const minDelay = this.getRateLimit('site', 'min_delay_between_actions');
    const timeSinceLastAction = Date.now() - lastAction;

    return timeSinceLastAction >= minDelay;
  }

  detectSuspiciousPatterns(task) {
    const textToCheck = [
      task.targetUrl || '',
      task.content || '',
      task.title || ''
    ].join(' ');

    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(textToCheck)) {
        return true;
      }
    }

    return false;
  }

  isBlacklistedDomain(url) {
    const domain = this.extractDomain(url);
    return this.blacklistedDomains.has(domain);
  }

  recordAction(task) {
    const now = Date.now();

    // Record global action
    this.incrementActionCount('global', now);

    // Record IP action
    if (task.ip) {
      this.incrementActionCount(`ip:${task.ip}`, now);
    }

    // Record site action
    if (task.targetUrl) {
      const domain = this.extractDomain(task.targetUrl);
      this.incrementActionCount(`site:${domain}`, now);
      this.lastActions.set(domain, now);
    }

    // Record engine-specific action
    if (task.engineType) {
      this.incrementActionCount(`engine:${task.engineType}`, now);
    }
  }

  setRateLimit(category, type, limit) {
    const key = `${category}:${type}`;
    this.rateLimits.set(key, limit);
  }

  getRateLimit(category, type) {
    const key = `${category}:${type}`;
    return this.rateLimits.get(key) || 0;
  }

  getActionCount(key, timeframe) {
    const now = Date.now();
    const timeframeDuration = timeframe === 'hour' ? 3600000 : 86400000; // 1 hour or 24 hours
    const cutoff = now - timeframeDuration;

    if (!this.globalLimits.has(key)) {
      return 0;
    }

    const actions = this.globalLimits.get(key);
    return actions.filter(timestamp => timestamp > cutoff).length;
  }

  incrementActionCount(key, timestamp = Date.now()) {
    if (!this.globalLimits.has(key)) {
      this.globalLimits.set(key, []);
    }

    const actions = this.globalLimits.get(key);
    actions.push(timestamp);

    // Clean up old entries (older than 24 hours)
    const cutoff = timestamp - 86400000;
    const filteredActions = actions.filter(ts => ts > cutoff);
    this.globalLimits.set(key, filteredActions);
  }

  extractDomain(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  estimateCampaignActions(campaignConfig) {
    let totalActions = 0;

    // Estimate based on enabled engines and their configurations
    Object.entries(campaignConfig.engines || {}).forEach(([engineType, config]) => {
      if (config.enabled) {
        switch (engineType) {
          case 'blogCommenting':
            totalActions += (config.targetSites?.length || 10) * (config.maxCommentsPerSite || 3);
            break;
          case 'blogPosting':
            totalActions += (config.targetPlatforms?.length || 5) * (config.maxPostsPerSite || 1);
            break;
          case 'forumProfiles':
            totalActions += (config.targetForums?.length || 5) * (config.maxProfilesPerSite || 1);
            break;
          case 'socialMedia':
            totalActions += Object.values(config.platforms || {}).reduce((sum, platform) => 
              sum + (platform.enabled ? platform.maxPosts || 5 : 0), 0);
            break;
          case 'web2':
            totalActions += (config.targetPlatforms?.length || 8) * (config.maxSitesPerPlatform || 2);
            break;
          case 'guestPosting':
            totalActions += config.maxOutreachPerDay || 20;
            break;
        }
      }
    });

    return totalActions;
  }

  addBlacklistedDomain(domain) {
    this.blacklistedDomains.add(domain);
    this.logger.info(`Domain added to blacklist: ${domain}`);
  }

  removeBlacklistedDomain(domain) {
    this.blacklistedDomains.delete(domain);
    this.logger.info(`Domain removed from blacklist: ${domain}`);
  }

  getStats() {
    return {
      blacklistedDomains: Array.from(this.blacklistedDomains),
      rateLimits: Object.fromEntries(this.rateLimits),
      currentActions: {
        global: this.getActionCount('global', 'hour'),
        totalSites: this.siteTracker.size,
        totalIPs: this.ipTracker.size
      },
      recentActions: Array.from(this.lastActions.entries()).slice(-10)
    };
  }

  reset() {
    this.globalLimits.clear();
    this.lastActions.clear();
    this.ipTracker.clear();
    this.siteTracker.clear();
    this.logger.info('Safety Manager reset completed');
  }
}
