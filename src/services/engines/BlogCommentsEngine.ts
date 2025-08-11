import { BaseEngine, type EngineTask, type LinkPlacementResult, type PlacementOpportunity, type GeneratedContent, type SubmissionResult } from './BaseEngine';
import { WebCrawler } from '../infrastructure/WebCrawler';
import { BlogDiscoveryService } from '../discovery/BlogDiscoveryService';
import { CommentSubmissionService } from '../submission/CommentSubmissionService';

export class BlogCommentsEngine extends BaseEngine {
  readonly engineType = 'blog_comments' as const;
  readonly supportedPlacements = ['blog_comment'] as const;
  readonly averageProcessingTime = 45000; // 45 seconds
  readonly maxConcurrentTasks = 20;

  private blogDiscovery: BlogDiscoveryService;
  private crawler: WebCrawler;
  private submissionService: CommentSubmissionService;

  constructor() {
    super();
    this.blogDiscovery = new BlogDiscoveryService();
    this.crawler = new WebCrawler();
    this.submissionService = new CommentSubmissionService();
  }

  async execute(task: EngineTask): Promise<LinkPlacementResult> {
    const startTime = Date.now();
    let attemptsCount = 0;
    const resourcesUsed: string[] = [];

    try {
      // 1. Validate task
      const validation = await this.validateTask(task);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: validation.errors.join(', '),
            retryable: false
          },
          metrics: {
            processingTimeMs: Date.now() - startTime,
            attemptsCount: 0,
            resourcesUsed: []
          }
        };
      }

      // 2. Discover blog opportunities
      resourcesUsed.push('blog_discovery');
      const opportunities = await this.discoverOpportunities(task);
      
      if (opportunities.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_OPPORTUNITIES',
            message: 'No suitable blogs found for the given criteria',
            retryable: true,
            retryAfter: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          },
          metrics: {
            processingTimeMs: Date.now() - startTime,
            attemptsCount: 0,
            resourcesUsed
          }
        };
      }

      // 3. Try each opportunity until successful
      for (const opportunity of opportunities.slice(0, 3)) { // Try top 3 opportunities
        attemptsCount++;
        
        try {
          // Generate contextual comment
          resourcesUsed.push('content_generation');
          const content = await this.generateContent(opportunity, task);
          
          // Assess content quality
          const quality = await this.assessContentQuality(content.content, task);
          if (quality.score < 0.7) {
            continue; // Try next opportunity
          }

          // Submit comment
          resourcesUsed.push('comment_submission');
          const submission = await this.submitPlacement(content, opportunity);
          
          if (submission.success) {
            const placement = {
              sourceUrl: submission.placementUrl!,
              sourceDomain: opportunity.domain,
              targetUrl: task.targetUrl,
              anchorText: task.anchorText,
              placementType: 'blog_comment' as const,
              status: submission.requiresModeration ? 'pending' : 'live' as const,
              domainAuthority: opportunity.domainAuthority,
              pageAuthority: opportunity.pageAuthority,
              qualityScore: quality.score * 100,
              cost: opportunity.estimatedCost,
              placementDate: new Date(),
              verificationScheduled: new Date(Date.now() + (submission.estimatedApprovalTime || 2) * 60 * 60 * 1000),
              engineData: {
                blogUrl: opportunity.url,
                commentId: submission.submissionId,
                moderationRequired: submission.requiresModeration,
                contextAnalysis: {
                  topicRelevance: quality.keywordRelevance,
                  sentimentMatch: quality.score
                }
              },
              contentSnippet: content.content.substring(0, 200) + '...'
            };

            const result: LinkPlacementResult = {
              success: true,
              placement,
              metrics: {
                processingTimeMs: Date.now() - startTime,
                attemptsCount,
                resourcesUsed
              }
            };

            // Post-processing
            await this.postProcess(result, task);
            
            return result;
          }
        } catch (opportunityError: any) {
          console.warn(`Failed attempt ${attemptsCount} for opportunity ${opportunity.id}:`, opportunityError.message);
          continue;
        }
      }

      // If all opportunities failed
      return {
        success: false,
        error: {
          code: 'ALL_OPPORTUNITIES_FAILED',
          message: `Failed to place comment after ${attemptsCount} attempts`,
          retryable: true,
          retryAfter: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
        },
        metrics: {
          processingTimeMs: Date.now() - startTime,
          attemptsCount,
          resourcesUsed
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ENGINE_ERROR',
          message: error.message,
          retryable: true
        },
        metrics: {
          processingTimeMs: Date.now() - startTime,
          attemptsCount,
          resourcesUsed
        }
      };
    }
  }

  protected async discoverOpportunities(task: EngineTask): Promise<PlacementOpportunity[]> {
    const discoveryParams = {
      keywords: task.keywords,
      niche: task.niche,
      minDomainAuthority: task.requirements.minDomainAuthority,
      maxCostPerLink: task.requirements.maxCostPerLink,
      language: task.requirements.language,
      avoidDomains: task.requirements.avoid_domains || [],
      geoTargeting: task.requirements.geographic_targeting
    };

    // Use blog discovery service to find relevant blogs
    const blogs = await this.blogDiscovery.findRelevantBlogs(discoveryParams);
    
    // Convert blogs to opportunities
    const opportunities: PlacementOpportunity[] = [];
    
    for (const blog of blogs) {
      // Check if blog accepts comments and has recent activity
      const blogAnalysis = await this.analyyzeBlog(blog);
      
      if (blogAnalysis.acceptsComments && blogAnalysis.isActive) {
        opportunities.push({
          id: `blog_${blog.domain}_${Date.now()}`,
          domain: blog.domain,
          url: blogAnalysis.targetPost.url,
          placementType: 'blog_comment',
          domainAuthority: blog.domainAuthority,
          pageAuthority: blogAnalysis.targetPost.pageAuthority,
          estimatedCost: this.calculateCost(blog.domainAuthority, blog.acceptanceRate),
          difficultyScore: this.calculateDifficulty(blog, task),
          requirements: {
            postTopic: blogAnalysis.targetPost.topic,
            commentGuidelines: blogAnalysis.commentGuidelines,
            moderationLevel: blogAnalysis.moderationLevel,
            authorProfile: blogAnalysis.requiredProfileFields
          },
          discoveredAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
      }
    }

    // Sort by quality score (combination of DA, relevance, and ease of placement)
    return opportunities.sort((a, b) => {
      const scoreA = this.calculateOpportunityScore(a, task);
      const scoreB = this.calculateOpportunityScore(b, task);
      return scoreB - scoreA;
    });
  }

  protected async generateContent(opportunity: PlacementOpportunity, task: EngineTask): Promise<GeneratedContent> {
    // Analyze the target blog post for context
    const postAnalysis = await this.crawler.analyzePost(opportunity.url);
    
    // Generate contextual comment using AI
    const generationParams = {
      type: 'comment' as const,
      topic: postAnalysis.mainTopic,
      keywords: task.keywords,
      tone: task.requirements.contentTone,
      length: task.requirements.contentLength,
      context: postAnalysis.content.substring(0, 1000), // First 1000 chars for context
      targetUrl: task.targetUrl,
      anchorText: task.anchorText,
      commentGuidelines: opportunity.requirements.commentGuidelines,
      existingComments: postAnalysis.existingComments.slice(0, 5) // Analyze last 5 comments for style
    };

    const content = await this.contentGenerator.generate(generationParams);
    
    // Enhance with natural link placement
    const enhancedContent = await this.optimizeLinkPlacement(content, task, postAnalysis);
    
    return enhancedContent;
  }

  protected async submitPlacement(content: GeneratedContent, opportunity: PlacementOpportunity): Promise<SubmissionResult> {
    const submissionParams = {
      blogUrl: opportunity.url,
      comment: content.content,
      authorProfile: {
        name: this.generateAuthorName(),
        email: this.generateAuthorEmail(),
        website: opportunity.requirements.authorProfile?.requiresWebsite ? this.generateAuthorWebsite() : undefined
      },
      antiSpamMeasures: {
        humanDelay: this.calculateHumanDelay(),
        browserFingerprint: this.generateBrowserFingerprint(),
        sessionBehavior: this.simulateNaturalBehavior()
      }
    };

    return await this.submissionService.submitComment(submissionParams);
  }

  // Helper methods for blog comment specific logic
  private async analyyzeBlog(blog: any): Promise<any> {
    // Analyze blog for comment acceptance, activity, etc.
    const recentPosts = await this.crawler.getRecentPosts(blog.domain, 10);
    const latestPost = recentPosts[0];
    
    if (!latestPost) {
      return { acceptsComments: false, isActive: false };
    }

    const postDetails = await this.crawler.analyzePost(latestPost.url);
    
    return {
      acceptsComments: postDetails.commentFormPresent,
      isActive: new Date(latestPost.publishDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
      targetPost: latestPost,
      commentGuidelines: postDetails.commentGuidelines,
      moderationLevel: postDetails.moderationLevel,
      requiredProfileFields: postDetails.requiredFields
    };
  }

  private calculateCost(domainAuthority: number, acceptanceRate: number): number {
    // Cost calculation based on DA and acceptance rate
    const baseCost = 5; // $5 base cost
    const daCost = (domainAuthority - 30) * 0.5; // $0.50 per DA point above 30
    const difficultyMultiplier = 1 + (1 - acceptanceRate); // Higher cost for lower acceptance rate
    
    return Math.round((baseCost + daCost) * difficultyMultiplier * 100) / 100;
  }

  private calculateDifficulty(blog: any, task: EngineTask): number {
    // Calculate difficulty score 0-100
    let difficulty = 0;
    
    // Domain authority factor
    difficulty += Math.min(blog.domainAuthority, 100) * 0.3;
    
    // Moderation level factor
    const moderationMultiplier = {
      'none': 0,
      'basic': 20,
      'manual': 50,
      'strict': 80
    };
    difficulty += moderationMultiplier[blog.moderationLevel] || 40;
    
    // Niche relevance factor
    const nicheMatch = this.calculateNicheRelevance(blog.categories, task.niche);
    difficulty += (1 - nicheMatch) * 30;
    
    return Math.min(Math.round(difficulty), 100);
  }

  private calculateOpportunityScore(opportunity: PlacementOpportunity, task: EngineTask): number {
    // Higher score = better opportunity
    let score = 0;
    
    // Domain authority weight (40%)
    score += opportunity.domainAuthority * 0.4;
    
    // Low difficulty weight (30%)
    score += (100 - opportunity.difficultyScore) * 0.3;
    
    // Cost efficiency weight (20%)
    const maxCost = task.requirements.maxCostPerLink;
    const costEfficiency = Math.max(0, (maxCost - opportunity.estimatedCost) / maxCost);
    score += costEfficiency * 100 * 0.2;
    
    // Freshness weight (10%)
    const hoursSinceDiscovery = (Date.now() - opportunity.discoveredAt.getTime()) / (1000 * 60 * 60);
    const freshnessScore = Math.max(0, 100 - hoursSinceDiscovery * 2); // Decline 2 points per hour
    score += freshnessScore * 0.1;
    
    return score;
  }

  private async optimizeLinkPlacement(content: GeneratedContent, task: EngineTask, postAnalysis: any): Promise<GeneratedContent> {
    // Find the most natural position for the link within the content
    const sentences = content.content.split('. ');
    const targetKeywordSentences = sentences.filter(sentence => 
      task.keywords.some(keyword => 
        sentence.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    let linkSentence = targetKeywordSentences[0] || sentences[Math.floor(sentences.length / 2)];
    
    // Replace first occurrence of anchor text or insert naturally
    if (linkSentence.toLowerCase().includes(task.anchorText.toLowerCase())) {
      linkSentence = linkSentence.replace(
        new RegExp(task.anchorText, 'i'),
        `<a href="${task.targetUrl}">${task.anchorText}</a>`
      );
    } else {
      // Insert anchor text naturally
      linkSentence += ` I found <a href="${task.targetUrl}">${task.anchorText}</a> helpful for this topic.`;
    }

    const linkPosition = content.content.indexOf(sentences.find(s => s === linkSentence.replace(/<[^>]*>/g, '')) || '');
    
    return {
      ...content,
      content: content.content.replace(sentences.find(s => s === linkSentence.replace(/<[^>]*>/g, '')) || '', linkSentence),
      placementInstructions: {
        anchorPlacement: linkPosition,
        contextBefore: content.content.substring(Math.max(0, linkPosition - 100), linkPosition),
        contextAfter: content.content.substring(linkPosition + 100, linkPosition + 200)
      }
    };
  }

  private calculateNicheRelevance(blogCategories: string[], taskNiches: string[]): number {
    // Calculate relevance score between blog categories and task niches
    const matches = blogCategories.filter(category => 
      taskNiches.some(niche => 
        category.toLowerCase().includes(niche.toLowerCase()) ||
        niche.toLowerCase().includes(category.toLowerCase())
      )
    );
    
    return matches.length / Math.max(blogCategories.length, taskNiches.length);
  }

  private generateAuthorName(): string {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];
    
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  private generateAuthorEmail(): string {
    const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];
    const username = `user${Math.floor(Math.random() * 10000)}`;
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    return `${username}@${domain}`;
  }

  private generateAuthorWebsite(): string {
    const domains = ['myblog.com', 'mysite.net', 'portfolio.org'];
    const subdomain = `user${Math.floor(Math.random() * 1000)}`;
    
    return `https://${subdomain}.${domains[Math.floor(Math.random() * domains.length)]}`;
  }

  private calculateHumanDelay(): number {
    // Simulate human typing speed: 40-80 WPM
    return Math.floor(Math.random() * 1000) + 500; // 500-1500ms
  }

  private generateBrowserFingerprint(): Record<string, any> {
    return {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      screenResolution: '1920x1080',
      timezone: 'America/New_York',
      language: 'en-US'
    };
  }

  private simulateNaturalBehavior(): Record<string, any> {
    return {
      pageVisitDuration: Math.floor(Math.random() * 120000) + 30000, // 30s - 2.5min
      scrollBehavior: 'natural',
      clickPattern: 'human-like',
      mouseMovements: 'organic'
    };
  }
}
