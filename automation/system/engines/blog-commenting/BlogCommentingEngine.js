/**
 * Blog Commenting Engine - Automated blog comment posting system
 */

import { SystemLogger } from '../../core/SystemLogger.js';
import { BaseEngine } from '../BaseEngine.js';
import { CommentGenerator } from './CommentGenerator.js';
import { BlogDiscovery } from './BlogDiscovery.js';
import { CommentPoster } from './CommentPoster.js';

export class BlogCommentingEngine extends BaseEngine {
  constructor(config) {
    super('BlogCommenting', config);
    this.commentGenerator = new CommentGenerator(config);
    this.blogDiscovery = new BlogDiscovery(config);
    this.commentPoster = new CommentPoster(config);
  }

  async initialize() {
    this.logger.info('Initializing Blog Commenting Engine...');
    
    try {
      await super.initialize();
      await this.commentGenerator.initialize();
      await this.blogDiscovery.initialize();
      await this.commentPoster.initialize();
      
      this.logger.success('Blog Commenting Engine initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Blog Commenting Engine:', error);
      throw error;
    }
  }

  async generateTasks(campaignConfig) {
    this.logger.info('Generating blog commenting tasks...');
    
    const tasks = [];
    const targetBlogs = campaignConfig.targetBlogs || [];
    
    // If no specific targets, discover blogs
    if (targetBlogs.length === 0) {
      const discoveredBlogs = await this.blogDiscovery.discoverBlogs({
        keywords: campaignConfig.keywords || [],
        niche: campaignConfig.niche,
        minQuality: campaignConfig.minBlogQuality || 30,
        maxBlogs: campaignConfig.maxBlogs || 50
      });
      targetBlogs.push(...discoveredBlogs);
    }

    for (const blog of targetBlogs) {
      // Find recent posts to comment on
      const posts = await this.blogDiscovery.getRecentPosts(blog, {
        maxAge: campaignConfig.maxPostAge || 30, // days
        maxPosts: this.config.maxCommentsPerSite || 3
      });

      for (const post of posts) {
        tasks.push({
          type: 'blog-comment',
          engineType: 'blog-commenting',
          targetUrl: post.url,
          blogUrl: blog.url,
          postTitle: post.title,
          postContent: post.excerpt,
          postDate: post.date,
          priority: this.calculatePriority(blog, post),
          metadata: {
            blogDomain: blog.domain,
            blogAuthority: blog.authority,
            postCategories: post.categories,
            allowsLinks: blog.allowsLinks,
            moderationLevel: blog.moderationLevel
          },
          campaignId: campaignConfig.campaignId
        });
      }
    }

    this.logger.info(`Generated ${tasks.length} blog commenting tasks`);
    return tasks;
  }

  async processTask(task) {
    this.logger.debug(`Processing blog commenting task: ${task.id}`);
    
    try {
      // Analyze the blog post content
      const postAnalysis = await this.analyzePost(task);
      
      // Generate contextual comment
      const comment = await this.commentGenerator.generateComment({
        postTitle: task.postTitle,
        postContent: task.postContent,
        postUrl: task.targetUrl,
        blogDomain: task.metadata.blogDomain,
        targetKeywords: task.metadata.targetKeywords,
        backlink: task.metadata.backlink,
        allowsLinks: task.metadata.allowsLinks
      });

      // Validate comment quality
      if (!this.validateComment(comment, task)) {
        throw new Error('Generated comment failed quality validation');
      }

      // Post the comment
      const result = await this.commentPoster.postComment({
        url: task.targetUrl,
        comment: comment,
        authorName: this.selectAuthorProfile().name,
        authorEmail: this.selectAuthorProfile().email,
        authorWebsite: this.selectAuthorProfile().website,
        userAgent: this.getUserAgent(),
        proxy: this.getProxy()
      });

      if (result.success) {
        this.logger.success(`Comment posted successfully: ${task.targetUrl}`);
        return {
          success: true,
          commentId: result.commentId,
          commentUrl: result.commentUrl,
          comment: comment.text,
          needsModeration: result.needsModeration,
          timestamp: new Date()
        };
      } else {
        throw new Error(result.error || 'Failed to post comment');
      }

    } catch (error) {
      this.logger.error(`Failed to process blog commenting task ${task.id}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async analyzePost(task) {
    this.logger.debug(`Analyzing post: ${task.postTitle}`);
    
    try {
      const analysis = {
        topics: [],
        sentiment: 'neutral',
        commentContext: [],
        keyPhrases: [],
        hasComments: false,
        commentCount: 0,
        lastCommentDate: null
      };

      // Extract topics and key phrases from post content
      if (task.postContent) {
        analysis.topics = this.extractTopics(task.postContent);
        analysis.keyPhrases = this.extractKeyPhrases(task.postContent);
        analysis.sentiment = this.analyzeSentiment(task.postContent);
      }

      // Check existing comments if accessible
      try {
        const existingComments = await this.commentPoster.getExistingComments(task.targetUrl);
        analysis.hasComments = existingComments.length > 0;
        analysis.commentCount = existingComments.length;
        analysis.commentContext = existingComments.slice(-3); // Last 3 comments for context
        
        if (existingComments.length > 0) {
          analysis.lastCommentDate = existingComments[existingComments.length - 1].date;
        }
      } catch (error) {
        this.logger.debug('Could not fetch existing comments:', error.message);
      }

      return analysis;

    } catch (error) {
      this.logger.warn(`Failed to analyze post ${task.targetUrl}:`, error);
      return { topics: [], sentiment: 'neutral', commentContext: [] };
    }
  }

  extractTopics(content) {
    // Simple topic extraction - could be enhanced with NLP
    const topics = [];
    const words = content.toLowerCase().split(/\s+/);
    const topicKeywords = {
      'technology': ['tech', 'software', 'app', 'digital', 'online', 'internet'],
      'business': ['business', 'marketing', 'sales', 'revenue', 'profit', 'company'],
      'lifestyle': ['life', 'health', 'fitness', 'travel', 'food', 'fashion'],
      'education': ['learn', 'education', 'study', 'course', 'tutorial', 'guide']
    };

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const matches = keywords.filter(keyword => words.includes(keyword));
      if (matches.length > 0) {
        topics.push({ topic, confidence: matches.length / keywords.length });
      }
    });

    return topics.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  extractKeyPhrases(content) {
    // Extract meaningful phrases from content
    const sentences = content.split(/[.!?]+/);
    return sentences
      .filter(sentence => sentence.length > 20 && sentence.length < 100)
      .map(sentence => sentence.trim())
      .slice(0, 5);
  }

  analyzeSentiment(content) {
    // Basic sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'helpful', 'useful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'disappointing', 'useless', 'poor'];
    
    const words = content.toLowerCase().split(/\s+/);
    const positiveCount = positiveWords.filter(word => words.includes(word)).length;
    const negativeCount = negativeWords.filter(word => words.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  validateComment(comment, task) {
    // Validate comment meets quality standards
    if (!comment || !comment.text) return false;
    
    const text = comment.text.trim();
    
    // Length check
    if (text.length < this.config.commentLength.min || 
        text.length > this.config.commentLength.max) {
      return false;
    }

    // Spam detection
    if (this.isSpammy(text)) return false;
    
    // Relevance check
    if (!this.isRelevant(text, task)) return false;
    
    return true;
  }

  isSpammy(text) {
    const spamIndicators = [
      /visit\s+my\s+website/i,
      /check\s+out\s+my\s+blog/i,
      /click\s+here/i,
      /buy\s+now/i,
      /\$\d+/,
      /http[s]?:\/\/[^\s]+/g.length > 1 // Multiple URLs
    ];

    return spamIndicators.some(pattern => pattern.test(text));
  }

  isRelevant(commentText, task) {
    // Check if comment is relevant to the post
    const postWords = (task.postTitle + ' ' + task.postContent).toLowerCase().split(/\s+/);
    const commentWords = commentText.toLowerCase().split(/\s+/);
    
    const overlap = commentWords.filter(word => 
      word.length > 3 && postWords.includes(word)
    ).length;
    
    return overlap >= 2; // At least 2 meaningful word overlaps
  }

  calculatePriority(blog, post) {
    let priority = 5; // Default priority
    
    // Higher authority blogs get higher priority
    if (blog.authority > 50) priority -= 1;
    if (blog.authority > 70) priority -= 1;
    
    // Recent posts get higher priority
    const daysSincePost = (Date.now() - new Date(post.date)) / (1000 * 60 * 60 * 24);
    if (daysSincePost < 7) priority -= 1;
    if (daysSincePost < 3) priority -= 1;
    
    // Posts with few comments get higher priority
    if (post.commentCount < 5) priority -= 1;
    
    return Math.max(1, Math.min(10, priority));
  }

  selectAuthorProfile() {
    // Select from configured author profiles
    const profiles = this.config.userProfiles || [{
      name: 'John Smith',
      email: 'john@example.com',
      website: 'https://example.com'
    }];
    
    return profiles[Math.floor(Math.random() * profiles.length)];
  }

  getEngineStats() {
    return {
      ...super.getEngineStats(),
      totalComments: this.stats.completed,
      averageCommentLength: this.stats.avgCommentLength || 0,
      moderationRate: this.stats.moderationRate || 0,
      topBlogs: this.stats.topBlogs || []
    };
  }
}
