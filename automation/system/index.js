/**
 * Backlink Automation System - Main Orchestrator
 * Independent engine for managing all automated backlinking operations
 */

import { BlogCommentingEngine } from './engines/blog-commenting/BlogCommentingEngine.js';
import { BlogPostingEngine } from './engines/blog-posting/BlogPostingEngine.js';
import { ForumProfileEngine } from './engines/forum-profiles/ForumProfileEngine.js';
import { SocialMediaEngine } from './engines/social-media/SocialMediaEngine.js';
import { Web2Engine } from './engines/web2/Web2Engine.js';
import { GuestPostingEngine } from './engines/guest-posting/GuestPostingEngine.js';
import { SystemLogger } from './core/SystemLogger.js';
import { ConfigManager } from './core/ConfigManager.js';
import { QueueManager } from './core/QueueManager.js';
import { SafetyManager } from './core/SafetyManager.js';

export class AutomationOrchestrator {
  constructor(config = {}) {
    this.config = new ConfigManager(config);
    this.logger = new SystemLogger('AutomationOrchestrator');
    this.queueManager = new QueueManager();
    this.safetyManager = new SafetyManager();
    
    this.engines = {
      blogCommenting: new BlogCommentingEngine(this.config.getBlogCommentingConfig()),
      blogPosting: new BlogPostingEngine(this.config.getBlogPostingConfig()),
      forumProfiles: new ForumProfileEngine(this.config.getForumProfileConfig()),
      socialMedia: new SocialMediaEngine(this.config.getSocialMediaConfig()),
      web2: new Web2Engine(this.config.getWeb2Config()),
      guestPosting: new GuestPostingEngine(this.config.getGuestPostingConfig())
    };

    this.isRunning = false;
    this.campaigns = new Map();
  }

  async initialize() {
    this.logger.info('Initializing Automation System...');
    
    try {
      // Initialize core systems
      await this.config.load();
      await this.queueManager.initialize();
      await this.safetyManager.initialize();
      
      // Initialize all engines
      for (const [name, engine] of Object.entries(this.engines)) {
        this.logger.info(`Initializing ${name} engine...`);
        await engine.initialize();
      }
      
      this.logger.info('Automation System initialized successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize Automation System:', error);
      throw error;
    }
  }

  async startCampaign(campaignConfig) {
    const campaignId = this.generateCampaignId();
    this.logger.info(`Starting campaign: ${campaignId}`);
    
    try {
      // Validate campaign configuration
      await this.safetyManager.validateCampaign(campaignConfig);
      
      // Create campaign instance
      const campaign = {
        id: campaignId,
        config: campaignConfig,
        status: 'active',
        startTime: new Date(),
        stats: {
          totalTargets: 0,
          completed: 0,
          failed: 0,
          pending: 0
        }
      };
      
      this.campaigns.set(campaignId, campaign);
      
      // Queue tasks for each enabled engine
      if (campaignConfig.engines.blogCommenting.enabled) {
        await this.queueManager.addTasks('blog-commenting', 
          await this.engines.blogCommenting.generateTasks(campaignConfig));
      }
      
      if (campaignConfig.engines.blogPosting.enabled) {
        await this.queueManager.addTasks('blog-posting', 
          await this.engines.blogPosting.generateTasks(campaignConfig));
      }
      
      if (campaignConfig.engines.forumProfiles.enabled) {
        await this.queueManager.addTasks('forum-profiles', 
          await this.engines.forumProfiles.generateTasks(campaignConfig));
      }
      
      if (campaignConfig.engines.socialMedia.enabled) {
        await this.queueManager.addTasks('social-media', 
          await this.engines.socialMedia.generateTasks(campaignConfig));
      }
      
      if (campaignConfig.engines.web2.enabled) {
        await this.queueManager.addTasks('web2', 
          await this.engines.web2.generateTasks(campaignConfig));
      }
      
      if (campaignConfig.engines.guestPosting.enabled) {
        await this.queueManager.addTasks('guest-posting', 
          await this.engines.guestPosting.generateTasks(campaignConfig));
      }
      
      this.logger.info(`Campaign ${campaignId} started successfully`);
      return campaignId;
      
    } catch (error) {
      this.logger.error(`Failed to start campaign ${campaignId}:`, error);
      throw error;
    }
  }

  async startProcessing() {
    if (this.isRunning) {
      this.logger.warn('Automation System is already running');
      return;
    }
    
    this.isRunning = true;
    this.logger.info('Starting Automation System processing...');
    
    // Start processing loops for each engine type
    this.processQueues();
  }

  async stopProcessing() {
    this.isRunning = false;
    this.logger.info('Stopping Automation System processing...');
    
    // Gracefully stop all engines
    for (const [name, engine] of Object.entries(this.engines)) {
      await engine.stop();
    }
  }

  async processQueues() {
    while (this.isRunning) {
      try {
        // Process each queue with rate limiting and safety checks
        await this.processEngineQueue('blog-commenting', this.engines.blogCommenting);
        await this.processEngineQueue('blog-posting', this.engines.blogPosting);
        await this.processEngineQueue('forum-profiles', this.engines.forumProfiles);
        await this.processEngineQueue('social-media', this.engines.socialMedia);
        await this.processEngineQueue('web2', this.engines.web2);
        await this.processEngineQueue('guest-posting', this.engines.guestPosting);
        
        // Wait before next processing cycle
        await this.sleep(this.config.getProcessingInterval());
        
      } catch (error) {
        this.logger.error('Error in processing loop:', error);
        await this.sleep(5000); // Wait 5s before retrying
      }
    }
  }

  async processEngineQueue(queueName, engine) {
    const tasks = await this.queueManager.getTasks(queueName, 
      this.config.getBatchSize(queueName));
    
    if (tasks.length === 0) return;
    
    this.logger.info(`Processing ${tasks.length} ${queueName} tasks`);
    
    for (const task of tasks) {
      try {
        // Safety check before processing
        if (!await this.safetyManager.canProcessTask(task)) {
          this.logger.warn(`Task ${task.id} blocked by safety manager`);
          await this.queueManager.markTaskFailed(task.id, 'Blocked by safety manager');
          continue;
        }
        
        // Process the task
        const result = await engine.processTask(task);
        
        if (result.success) {
          await this.queueManager.markTaskCompleted(task.id, result);
          this.updateCampaignStats(task.campaignId, 'completed');
        } else {
          await this.queueManager.markTaskFailed(task.id, result.error);
          this.updateCampaignStats(task.campaignId, 'failed');
        }
        
      } catch (error) {
        this.logger.error(`Error processing task ${task.id}:`, error);
        await this.queueManager.markTaskFailed(task.id, error.message);
        this.updateCampaignStats(task.campaignId, 'failed');
      }
    }
  }

  updateCampaignStats(campaignId, status) {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      campaign.stats[status]++;
    }
  }

  generateCampaignId() {
    return `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getCampaignStatus(campaignId) {
    return this.campaigns.get(campaignId);
  }

  getAllCampaigns() {
    return Array.from(this.campaigns.values());
  }
}
