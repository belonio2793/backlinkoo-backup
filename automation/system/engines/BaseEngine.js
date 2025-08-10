/**
 * Base Engine - Abstract base class for all automation engines
 */

import { SystemLogger } from '../core/SystemLogger.js';

export class BaseEngine {
  constructor(engineName, config) {
    this.engineName = engineName;
    this.config = config || {};
    this.logger = new SystemLogger(`${engineName}Engine`);
    this.isInitialized = false;
    this.isRunning = false;
    this.stats = {
      tasksProcessed: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      totalProcessingTime: 0,
      avgProcessingTime: 0,
      lastProcessed: null,
      startTime: null
    };
    this.proxies = [];
    this.userAgents = [];
    this.currentProxyIndex = 0;
    this.currentUserAgentIndex = 0;
  }

  async initialize() {
    this.logger.info(`Initializing ${this.engineName} Engine...`);
    
    try {
      // Load proxies if enabled
      if (this.config.global?.enableProxyRotation) {
        await this.loadProxies();
      }
      
      // Load user agents if enabled
      if (this.config.global?.enableUserAgentRotation) {
        await this.loadUserAgents();
      }
      
      // Initialize engine-specific resources
      await this.initializeEngine();
      
      this.stats.startTime = new Date();
      this.isInitialized = true;
      
      this.logger.success(`${this.engineName} Engine initialized successfully`);
      
    } catch (error) {
      this.logger.error(`Failed to initialize ${this.engineName} Engine:`, error);
      throw error;
    }
  }

  async initializeEngine() {
    // Override in subclasses for engine-specific initialization
  }

  async generateTasks(campaignConfig) {
    throw new Error(`generateTasks not implemented in ${this.engineName}Engine`);
  }

  async processTask(task) {
    throw new Error(`processTask not implemented in ${this.engineName}Engine`);
  }

  async stop() {
    this.logger.info(`Stopping ${this.engineName} Engine...`);
    this.isRunning = false;
    await this.cleanup();
    this.logger.info(`${this.engineName} Engine stopped`);
  }

  async cleanup() {
    // Override in subclasses for cleanup logic
  }

  async loadProxies() {
    // Load proxy list from configuration or external source
    this.proxies = this.config.proxies?.list || [];
    
    if (this.proxies.length === 0) {
      this.logger.warn('No proxies configured');
    } else {
      this.logger.info(`Loaded ${this.proxies.length} proxies`);
    }
  }

  async loadUserAgents() {
    // Default user agents for rotation
    this.userAgents = this.config.userAgents || [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];
    
    this.logger.debug(`Loaded ${this.userAgents.length} user agents`);
  }

  getProxy() {
    if (this.proxies.length === 0) return null;
    
    const proxy = this.proxies[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
    
    return proxy;
  }

  getUserAgent() {
    if (this.userAgents.length === 0) {
      return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    }
    
    const userAgent = this.userAgents[this.currentUserAgentIndex];
    this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % this.userAgents.length;
    
    return userAgent;
  }

  async delay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    this.logger.debug(`Waiting ${delay}ms...`);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  updateStats(success, processingTime = 0) {
    this.stats.tasksProcessed++;
    this.stats.lastProcessed = new Date();
    this.stats.totalProcessingTime += processingTime;
    
    if (success) {
      this.stats.tasksCompleted++;
    } else {
      this.stats.tasksFailed++;
    }
    
    // Calculate average processing time
    if (this.stats.tasksProcessed > 0) {
      this.stats.avgProcessingTime = this.stats.totalProcessingTime / this.stats.tasksProcessed;
    }
  }

  getEngineStats() {
    return {
      engineName: this.engineName,
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      stats: { ...this.stats },
      config: {
        enabled: this.config.enabled,
        batchSize: this.config.batchSize,
        hasProxies: this.proxies.length > 0,
        hasUserAgents: this.userAgents.length > 0
      }
    };
  }

  getSuccessRate() {
    if (this.stats.tasksProcessed === 0) return 0;
    return (this.stats.tasksCompleted / this.stats.tasksProcessed) * 100;
  }

  getFailureRate() {
    if (this.stats.tasksProcessed === 0) return 0;
    return (this.stats.tasksFailed / this.stats.tasksProcessed) * 100;
  }

  getUptime() {
    if (!this.stats.startTime) return 0;
    return Date.now() - this.stats.startTime.getTime();
  }

  validateTaskInput(task, requiredFields = []) {
    const missingFields = requiredFields.filter(field => !task[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    return true;
  }

  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Basic input sanitization
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  generateRandomDelay() {
    const config = this.config;
    const min = config.actionDelay?.min || config.postDelay?.min || config.commentDelay?.min || 1000;
    const max = config.actionDelay?.max || config.postDelay?.max || config.commentDelay?.max || 5000;
    
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  shouldRetry(error, attempt, maxAttempts = 3) {
    // Common retry logic for all engines
    if (attempt >= maxAttempts) return false;
    
    // Retry on network errors, timeouts, rate limits
    const retryableErrors = [
      'ECONNRESET',
      'ENOTFOUND', 
      'ETIMEDOUT',
      'ECONNREFUSED',
      'rate limit',
      'too many requests',
      '503',
      '502',
      '504'
    ];
    
    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  async retry(fn, maxAttempts = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (!this.shouldRetry(error, attempt, maxAttempts)) {
          throw error;
        }
        
        if (attempt < maxAttempts) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          this.logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
          await this.delay(delay, delay);
        }
      }
    }
    
    throw lastError;
  }

  log(level, message, data = null) {
    return this.logger[level](message, data);
  }
}
