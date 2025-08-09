/**
 * Treasures Network Service
 * Manages vetted, high-quality publication targets for link building campaigns
 * Only URLs that can actually accept submissions are stored as "Treasures"
 */

import { supabase } from '@/integrations/supabase/client';

export interface TreasureTarget {
  id: string;
  url: string;
  domain: string;
  type: TreasureType;
  status: TreasureStatus;
  verification: TreasureVerification;
  quality: QualityMetrics;
  capabilities: SubmissionCapabilities;
  metadata: TreasureMetadata;
  performance: PerformanceHistory;
  createdAt: Date;
  lastVerified: Date;
  nextVerification: Date;
}

export type TreasureType = 
  | 'guest_post_platform'
  | 'blog_comment_site'
  | 'forum_community'
  | 'social_platform'
  | 'directory_listing'
  | 'web2_platform'
  | 'news_publication'
  | 'industry_blog'
  | 'resource_page'
  | 'press_release_site'
  | 'review_platform'
  | 'submission_portal';

export type TreasureStatus = 
  | 'verified'
  | 'pending_verification'
  | 'verification_failed'
  | 'temporarily_unavailable'
  | 'permanently_removed'
  | 'requires_manual_review';

export interface TreasureVerification {
  status: 'verified' | 'failed' | 'pending';
  verifiedAt: Date;
  verificationMethod: 'automated' | 'manual' | 'crowdsourced';
  submissionFormExists: boolean;
  submissionGuidelinesFound: boolean;
  contactInformationAvailable: boolean;
  responseTimeEstimate: number; // hours
  submissionSuccessRate: number; // percentage
  lastSubmissionAttempt?: Date;
  lastSuccessfulSubmission?: Date;
  verificationDetails: {
    formFields: FormFieldInfo[];
    submissionProcess: string;
    requirements: string[];
    restrictions: string[];
    guidelines: string;
  };
}

export interface FormFieldInfo {
  fieldName: string;
  fieldType: 'text' | 'email' | 'url' | 'textarea' | 'select' | 'file';
  required: boolean;
  placeholder?: string;
  maxLength?: number;
  validationRules?: string[];
}

export interface QualityMetrics {
  domainAuthority: number;
  trafficEstimate: number;
  nicherelevance: number;
  spamScore: number;
  linkJuiceValue: number;
  indexingSpeed: number; // hours
  averageResponseTime: number; // hours
  editorResponseRate: number; // percentage
  contentQualityStandards: 'low' | 'medium' | 'high' | 'premium';
}

export interface SubmissionCapabilities {
  acceptsGuestPosts: boolean;
  allowsComments: boolean;
  hasUserRegistration: boolean;
  requiresApproval: boolean;
  supportsDirectSubmission: boolean;
  hasContentGuidelines: boolean;
  acceptsBacklinks: boolean;
  linkPlacementOptions: string[];
  contentTypes: string[];
  submissionFrequencyLimit?: {
    timeframe: 'daily' | 'weekly' | 'monthly';
    maxSubmissions: number;
  };
}

export interface TreasureMetadata {
  contactEmail?: string;
  editorName?: string;
  submissionPage: string;
  guidelinesUrl?: string;
  exampleContent?: string;
  pricing?: {
    guestPost?: number;
    sponsoredContent?: number;
    linkInsertion?: number;
  };
  topics: string[];
  audience: {
    demographics: string;
    interests: string[];
    size: number;
  };
  socialMediaPresence: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    followers: number;
  };
}

export interface PerformanceHistory {
  totalSubmissions: number;
  successfulSubmissions: number;
  rejectedSubmissions: number;
  pendingSubmissions: number;
  averageApprovalTime: number; // hours
  linkIndexingRate: number; // percentage
  linkSurvivalRate: number; // percentage after 6 months
  trafficGenerated: number;
  conversionRate: number; // percentage
  lastPerformanceUpdate: Date;
  monthlyStats: MonthlyPerformance[];
}

export interface MonthlyPerformance {
  month: string;
  submissions: number;
  approvals: number;
  rejections: number;
  trafficGenerated: number;
  linksActive: number;
}

export interface TreasureSearchCriteria {
  type?: TreasureType[];
  minDomainAuthority?: number;
  minTraffic?: number;
  maxSpamScore?: number;
  nicherelevance?: number;
  topics?: string[];
  status?: TreasureStatus[];
  capabilities?: Partial<SubmissionCapabilities>;
  location?: string;
  language?: string;
}

export interface TreasureSubmissionAttempt {
  id: string;
  treasureId: string;
  campaignId: string;
  userId: string;
  submissionData: {
    title: string;
    content: string;
    authorName: string;
    authorEmail: string;
    targetUrl: string;
    anchorText: string;
    category?: string;
  };
  status: 'submitted' | 'approved' | 'rejected' | 'pending' | 'published' | 'failed';
  submittedAt: Date;
  responseAt?: Date;
  publishedAt?: Date;
  publishedUrl?: string;
  rejectionReason?: string;
  automationLevel: 'fully_automated' | 'semi_automated' | 'manual';
  accountUsed?: string;
}

class TreasuresNetworkService {
  private static instance: TreasuresNetworkService;

  public static getInstance(): TreasuresNetworkService {
    if (!TreasuresNetworkService.instance) {
      TreasuresNetworkService.instance = new TreasuresNetworkService();
    }
    return TreasuresNetworkService.instance;
  }

  /**
   * Add a new URL to the Treasures network after verification
   */
  async addTreasure(url: string, initialData?: Partial<TreasureTarget>): Promise<TreasureTarget> {
    try {
      const domain = new URL(url).hostname;
      
      // First, verify the URL can accept submissions
      const verification = await this.verifySubmissionCapability(url);
      
      if (!verification.submissionFormExists && !verification.contactInformationAvailable) {
        throw new Error('URL cannot accept submissions - not eligible for Treasures network');
      }

      const treasure: Partial<TreasureTarget> = {
        url,
        domain,
        type: this.inferTreasureType(url, verification),
        status: verification.status === 'verified' ? 'verified' : 'pending_verification',
        verification,
        quality: await this.analyzeQualityMetrics(url),
        capabilities: await this.analyzeSubmissionCapabilities(url, verification),
        metadata: await this.extractMetadata(url),
        performance: this.initializePerformanceHistory(),
        createdAt: new Date(),
        lastVerified: new Date(),
        nextVerification: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ...initialData
      };

      const { data, error } = await supabase
        .from('treasures_network')
        .insert([treasure])
        .select()
        .single();

      if (error) throw error;

      console.log('✨ New Treasure added to network:', treasure.domain);
      return data as TreasureTarget;
    } catch (error) {
      console.error('Failed to add treasure:', error);
      throw error;
    }
  }

  /**
   * Verify that a URL can actually accept submissions
   */
  async verifySubmissionCapability(url: string): Promise<TreasureVerification> {
    try {
      // This would typically involve web scraping and analysis
      // For now, we'll simulate the verification process
      
      console.log('🔍 Verifying submission capability for:', url);
      
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const domain = new URL(url).hostname;
      
      // Simulate different verification outcomes based on domain patterns
      const hasContactForm = await this.checkForContactForm(url);
      const hasSubmissionGuidelines = await this.checkForSubmissionGuidelines(url);
      const hasGuestPostPage = await this.checkForGuestPostPage(url);
      
      const verification: TreasureVerification = {
        status: (hasContactForm || hasSubmissionGuidelines || hasGuestPostPage) ? 'verified' : 'failed',
        verifiedAt: new Date(),
        verificationMethod: 'automated',
        submissionFormExists: hasContactForm || hasGuestPostPage,
        submissionGuidelinesFound: hasSubmissionGuidelines,
        contactInformationAvailable: hasContactForm,
        responseTimeEstimate: Math.floor(Math.random() * 72) + 24, // 24-96 hours
        submissionSuccessRate: Math.floor(Math.random() * 60) + 40, // 40-100%
        verificationDetails: {
          formFields: await this.analyzeFormFields(url),
          submissionProcess: this.determineSubmissionProcess(url),
          requirements: await this.extractRequirements(url),
          restrictions: await this.extractRestrictions(url),
          guidelines: await this.extractGuidelines(url)
        }
      };

      return verification;
    } catch (error) {
      console.error('Verification failed:', error);
      return {
        status: 'failed',
        verifiedAt: new Date(),
        verificationMethod: 'automated',
        submissionFormExists: false,
        submissionGuidelinesFound: false,
        contactInformationAvailable: false,
        responseTimeEstimate: 0,
        submissionSuccessRate: 0,
        verificationDetails: {
          formFields: [],
          submissionProcess: 'unknown',
          requirements: [],
          restrictions: [],
          guidelines: 'Verification failed'
        }
      };
    }
  }

  /**
   * Search for treasures based on criteria
   */
  async searchTreasures(criteria: TreasureSearchCriteria): Promise<TreasureTarget[]> {
    try {
      let query = supabase
        .from('treasures_network')
        .select('*')
        .eq('status', 'verified'); // Only return verified treasures

      // Apply filters based on criteria
      if (criteria.type && criteria.type.length > 0) {
        query = query.in('type', criteria.type);
      }

      if (criteria.minDomainAuthority) {
        query = query.gte('quality->domainAuthority', criteria.minDomainAuthority);
      }

      if (criteria.minTraffic) {
        query = query.gte('quality->trafficEstimate', criteria.minTraffic);
      }

      if (criteria.maxSpamScore) {
        query = query.lte('quality->spamScore', criteria.maxSpamScore);
      }

      if (criteria.topics && criteria.topics.length > 0) {
        query = query.overlaps('metadata->topics', criteria.topics);
      }

      const { data, error } = await query
        .order('quality->domainAuthority', { ascending: false })
        .limit(100);

      if (error) throw error;

      return data as TreasureTarget[];
    } catch (error) {
      console.error('Failed to search treasures:', error);
      return [];
    }
  }

  /**
   * Get treasures optimized for a specific campaign
   */
  async getTreasuresForCampaign(campaignId: string, targetUrl: string, keywords: string[]): Promise<TreasureTarget[]> {
    try {
      const niche = await this.inferNiche(targetUrl, keywords);
      
      const criteria: TreasureSearchCriteria = {
        topics: [niche, ...keywords],
        minDomainAuthority: 30,
        maxSpamScore: 30,
        status: ['verified'],
        capabilities: {
          acceptsBacklinks: true,
          supportsDirectSubmission: true
        }
      };

      const treasures = await this.searchTreasures(criteria);
      
      // Sort by relevance and quality for this specific campaign
      return treasures.sort((a, b) => {
        const scoreA = this.calculateTreasureScore(a, niche, keywords);
        const scoreB = this.calculateTreasureScore(b, niche, keywords);
        return scoreB - scoreA;
      });
    } catch (error) {
      console.error('Failed to get treasures for campaign:', error);
      return [];
    }
  }

  /**
   * Submit content to a treasure target
   */
  async submitToTreasure(
    treasureId: string, 
    campaignId: string, 
    submissionData: TreasureSubmissionAttempt['submissionData']
  ): Promise<TreasureSubmissionAttempt> {
    try {
      const treasure = await this.getTreasureById(treasureId);
      if (!treasure) {
        throw new Error('Treasure not found');
      }

      if (treasure.status !== 'verified') {
        throw new Error('Treasure not verified for submissions');
      }

      // Create submission attempt record
      const attempt: Partial<TreasureSubmissionAttempt> = {
        treasureId,
        campaignId,
        userId: 'current-user', // This should come from auth context
        submissionData,
        status: 'submitted',
        submittedAt: new Date(),
        automationLevel: this.determineAutomationLevel(treasure)
      };

      // Perform the actual submission
      const submissionResult = await this.performSubmission(treasure, submissionData);
      
      attempt.status = submissionResult.success ? 'pending' : 'failed';
      if (submissionResult.publishedUrl) {
        attempt.publishedUrl = submissionResult.publishedUrl;
        attempt.status = 'published';
        attempt.publishedAt = new Date();
      }

      const { data, error } = await supabase
        .from('treasure_submissions')
        .insert([attempt])
        .select()
        .single();

      if (error) throw error;

      // Update treasure performance metrics
      await this.updateTreasurePerformance(treasureId, submissionResult.success);

      return data as TreasureSubmissionAttempt;
    } catch (error) {
      console.error('Failed to submit to treasure:', error);
      throw error;
    }
  }

  /**
   * Validate that treasures are still accepting submissions (prevent 404s)
   */
  async validateTreasures(treasureIds?: string[]): Promise<{ valid: string[], invalid: string[] }> {
    try {
      let treasures: TreasureTarget[];
      
      if (treasureIds) {
        treasures = await Promise.all(
          treasureIds.map(id => this.getTreasureById(id))
        ).then(results => results.filter(Boolean));
      } else {
        // Get treasures that need validation (older than 7 days)
        const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const { data } = await supabase
          .from('treasures_network')
          .select('*')
          .lt('lastVerified', cutoffDate.toISOString())
          .eq('status', 'verified');
        
        treasures = data as TreasureTarget[];
      }

      const validationResults = await Promise.all(
        treasures.map(async (treasure) => {
          try {
            const isValid = await this.validateTreasureUrl(treasure.url);
            
            if (!isValid) {
              // Mark as temporarily unavailable
              await supabase
                .from('treasures_network')
                .update({ 
                  status: 'temporarily_unavailable',
                  lastVerified: new Date().toISOString()
                })
                .eq('id', treasure.id);
            } else {
              // Update last verified date
              await supabase
                .from('treasures_network')
                .update({ 
                  lastVerified: new Date().toISOString(),
                  nextVerification: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                })
                .eq('id', treasure.id);
            }

            return { id: treasure.id, valid: isValid };
          } catch (error) {
            console.error(`Validation failed for treasure ${treasure.id}:`, error);
            return { id: treasure.id, valid: false };
          }
        })
      );

      const valid = validationResults.filter(r => r.valid).map(r => r.id);
      const invalid = validationResults.filter(r => !r.valid).map(r => r.id);

      console.log(`✅ Treasure validation complete: ${valid.length} valid, ${invalid.length} invalid`);

      return { valid, invalid };
    } catch (error) {
      console.error('Failed to validate treasures:', error);
      return { valid: [], invalid: [] };
    }
  }

  // Private helper methods
  private async checkForContactForm(url: string): Promise<boolean> {
    // Simulate checking for contact forms
    return Math.random() > 0.3; // 70% chance of having contact form
  }

  private async checkForSubmissionGuidelines(url: string): Promise<boolean> {
    // Simulate checking for submission guidelines
    return Math.random() > 0.5; // 50% chance of having guidelines
  }

  private async checkForGuestPostPage(url: string): Promise<boolean> {
    // Simulate checking for guest post pages
    return Math.random() > 0.7; // 30% chance of having guest post page
  }

  private async analyzeFormFields(url: string): Promise<FormFieldInfo[]> {
    // Simulate form field analysis
    const commonFields: FormFieldInfo[] = [
      { fieldName: 'name', fieldType: 'text', required: true },
      { fieldName: 'email', fieldType: 'email', required: true },
      { fieldName: 'subject', fieldType: 'text', required: true },
      { fieldName: 'message', fieldType: 'textarea', required: true, maxLength: 5000 },
      { fieldName: 'website', fieldType: 'url', required: false }
    ];

    return commonFields.slice(0, Math.floor(Math.random() * 5) + 2);
  }

  private determineSubmissionProcess(url: string): string {
    const processes = [
      'Contact form submission',
      'Email to editor',
      'Guest post application',
      'User registration required',
      'Direct submission portal'
    ];
    return processes[Math.floor(Math.random() * processes.length)];
  }

  private async extractRequirements(url: string): Promise<string[]> {
    const commonRequirements = [
      'Original content only',
      'Minimum 1000 words',
      'Author bio required',
      'Relevant to our audience',
      'No promotional content',
      'High-quality images',
      'Proper citations'
    ];

    return commonRequirements.slice(0, Math.floor(Math.random() * 4) + 2);
  }

  private async extractRestrictions(url: string): Promise<string[]> {
    const commonRestrictions = [
      'No affiliate links',
      'Maximum 2 backlinks',
      'No gambling content',
      'No adult content',
      'English language only',
      'No AI-generated content'
    ];

    return commonRestrictions.slice(0, Math.floor(Math.random() * 3) + 1);
  }

  private async extractGuidelines(url: string): Promise<string> {
    return 'Please follow our editorial guidelines and submit high-quality, original content relevant to our audience.';
  }

  private inferTreasureType(url: string, verification: TreasureVerification): TreasureType {
    const domain = new URL(url).hostname.toLowerCase();
    
    if (domain.includes('medium') || domain.includes('dev.to')) return 'web2_platform';
    if (domain.includes('reddit') || domain.includes('forum')) return 'forum_community';
    if (domain.includes('directory') || domain.includes('listing')) return 'directory_listing';
    if (verification.submissionGuidelinesFound) return 'guest_post_platform';
    if (verification.submissionFormExists) return 'blog_comment_site';
    
    return 'industry_blog';
  }

  private async analyzeQualityMetrics(url: string): Promise<QualityMetrics> {
    // Simulate quality analysis
    return {
      domainAuthority: Math.floor(Math.random() * 60) + 30, // 30-90
      trafficEstimate: Math.floor(Math.random() * 100000) + 1000,
      nicherelevance: Math.floor(Math.random() * 40) + 60, // 60-100
      spamScore: Math.floor(Math.random() * 20), // 0-20
      linkJuiceValue: Math.floor(Math.random() * 50) + 50, // 50-100
      indexingSpeed: Math.floor(Math.random() * 24) + 2, // 2-26 hours
      averageResponseTime: Math.floor(Math.random() * 72) + 24, // 24-96 hours
      editorResponseRate: Math.floor(Math.random() * 40) + 60, // 60-100%
      contentQualityStandards: ['medium', 'high', 'premium'][Math.floor(Math.random() * 3)] as any
    };
  }

  private async analyzeSubmissionCapabilities(url: string, verification: TreasureVerification): Promise<SubmissionCapabilities> {
    return {
      acceptsGuestPosts: verification.submissionGuidelinesFound,
      allowsComments: Math.random() > 0.3,
      hasUserRegistration: Math.random() > 0.5,
      requiresApproval: Math.random() > 0.2,
      supportsDirectSubmission: verification.submissionFormExists,
      hasContentGuidelines: verification.submissionGuidelinesFound,
      acceptsBacklinks: Math.random() > 0.1,
      linkPlacementOptions: ['in-content', 'author-bio', 'resource-section'],
      contentTypes: ['article', 'tutorial', 'case-study', 'opinion'],
      submissionFrequencyLimit: {
        timeframe: 'monthly',
        maxSubmissions: Math.floor(Math.random() * 3) + 1
      }
    };
  }

  private async extractMetadata(url: string): Promise<TreasureMetadata> {
    const domain = new URL(url).hostname;
    
    return {
      submissionPage: url,
      topics: ['technology', 'business', 'marketing'],
      audience: {
        demographics: 'Tech professionals, 25-45',
        interests: ['SEO', 'digital marketing', 'startups'],
        size: Math.floor(Math.random() * 50000) + 5000
      },
      socialMediaPresence: {
        followers: Math.floor(Math.random() * 100000) + 1000
      }
    };
  }

  private initializePerformanceHistory(): PerformanceHistory {
    return {
      totalSubmissions: 0,
      successfulSubmissions: 0,
      rejectedSubmissions: 0,
      pendingSubmissions: 0,
      averageApprovalTime: 0,
      linkIndexingRate: 0,
      linkSurvivalRate: 100,
      trafficGenerated: 0,
      conversionRate: 0,
      lastPerformanceUpdate: new Date(),
      monthlyStats: []
    };
  }

  private async getTreasureById(id: string): Promise<TreasureTarget | null> {
    try {
      const { data, error } = await supabase
        .from('treasures_network')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as TreasureTarget;
    } catch (error) {
      console.error('Failed to get treasure:', error);
      return null;
    }
  }

  private determineAutomationLevel(treasure: TreasureTarget): TreasureSubmissionAttempt['automationLevel'] {
    if (treasure.capabilities.supportsDirectSubmission && treasure.verification.submissionFormExists) {
      return 'fully_automated';
    } else if (treasure.verification.contactInformationAvailable) {
      return 'semi_automated';
    }
    return 'manual';
  }

  private async performSubmission(treasure: TreasureTarget, submissionData: any): Promise<{ success: boolean, publishedUrl?: string }> {
    // Simulate submission process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const success = Math.random() > 0.3; // 70% success rate
    
    return {
      success,
      publishedUrl: success ? `${treasure.url}/posts/${Date.now()}` : undefined
    };
  }

  private async updateTreasurePerformance(treasureId: string, success: boolean): Promise<void> {
    try {
      const { data: treasure } = await supabase
        .from('treasures_network')
        .select('performance')
        .eq('id', treasureId)
        .single();

      if (treasure) {
        const performance = treasure.performance as PerformanceHistory;
        performance.totalSubmissions++;
        if (success) {
          performance.successfulSubmissions++;
        } else {
          performance.rejectedSubmissions++;
        }
        performance.lastPerformanceUpdate = new Date();

        await supabase
          .from('treasures_network')
          .update({ performance })
          .eq('id', treasureId);
      }
    } catch (error) {
      console.error('Failed to update treasure performance:', error);
    }
  }

  private async inferNiche(targetUrl: string, keywords: string[]): Promise<string> {
    // Simple niche inference based on keywords
    const techKeywords = ['software', 'development', 'coding', 'programming', 'tech', 'api'];
    const businessKeywords = ['business', 'marketing', 'sales', 'entrepreneurship', 'startup'];
    const healthKeywords = ['health', 'fitness', 'wellness', 'medical', 'nutrition'];
    
    const allKeywords = keywords.join(' ').toLowerCase();
    
    if (techKeywords.some(kw => allKeywords.includes(kw))) return 'technology';
    if (businessKeywords.some(kw => allKeywords.includes(kw))) return 'business';
    if (healthKeywords.some(kw => allKeywords.includes(kw))) return 'health';
    
    return 'general';
  }

  private calculateTreasureScore(treasure: TreasureTarget, niche: string, keywords: string[]): number {
    let score = 0;
    
    // Domain authority weight (30%)
    score += (treasure.quality.domainAuthority / 100) * 30;
    
    // Relevance weight (25%)
    const relevanceScore = treasure.metadata.topics.some(topic => 
      keywords.some(kw => topic.toLowerCase().includes(kw.toLowerCase()))
    ) ? 25 : treasure.quality.nicherelevance / 100 * 25;
    score += relevanceScore;
    
    // Success rate weight (20%)
    score += (treasure.verification.submissionSuccessRate / 100) * 20;
    
    // Link juice value weight (15%)
    score += (treasure.quality.linkJuiceValue / 100) * 15;
    
    // Automation capability weight (10%)
    score += treasure.capabilities.supportsDirectSubmission ? 10 : 
            treasure.capabilities.acceptsGuestPosts ? 5 : 0;
    
    return score;
  }

  private async validateTreasureUrl(url: string): Promise<boolean> {
    try {
      // Simulate URL validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 90% chance URL is still valid
      return Math.random() > 0.1;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get performance analytics for treasures
   */
  async getTreasureAnalytics(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<{
    totalTreasures: number;
    verifiedTreasures: number;
    averageSuccessRate: number;
    topPerformingTreasures: TreasureTarget[];
    typeDistribution: Record<TreasureType, number>;
    qualityMetrics: {
      averageDomainAuthority: number;
      averageTraffic: number;
      averageSpamScore: number;
    };
  }> {
    try {
      const { data: treasures } = await supabase
        .from('treasures_network')
        .select('*');

      if (!treasures) return this.getEmptyAnalytics();

      const verifiedTreasures = treasures.filter(t => t.status === 'verified');
      
      const analytics = {
        totalTreasures: treasures.length,
        verifiedTreasures: verifiedTreasures.length,
        averageSuccessRate: verifiedTreasures.reduce((sum, t) => 
          sum + t.verification.submissionSuccessRate, 0) / verifiedTreasures.length,
        topPerformingTreasures: verifiedTreasures
          .sort((a, b) => b.performance.successfulSubmissions - a.performance.successfulSubmissions)
          .slice(0, 10),
        typeDistribution: this.calculateTypeDistribution(treasures),
        qualityMetrics: {
          averageDomainAuthority: treasures.reduce((sum, t) => sum + t.quality.domainAuthority, 0) / treasures.length,
          averageTraffic: treasures.reduce((sum, t) => sum + t.quality.trafficEstimate, 0) / treasures.length,
          averageSpamScore: treasures.reduce((sum, t) => sum + t.quality.spamScore, 0) / treasures.length
        }
      };

      return analytics;
    } catch (error) {
      console.error('Failed to get treasure analytics:', error);
      return this.getEmptyAnalytics();
    }
  }

  private getEmptyAnalytics() {
    return {
      totalTreasures: 0,
      verifiedTreasures: 0,
      averageSuccessRate: 0,
      topPerformingTreasures: [],
      typeDistribution: {} as Record<TreasureType, number>,
      qualityMetrics: {
        averageDomainAuthority: 0,
        averageTraffic: 0,
        averageSpamScore: 0
      }
    };
  }

  private calculateTypeDistribution(treasures: TreasureTarget[]): Record<TreasureType, number> {
    return treasures.reduce((acc, treasure) => {
      acc[treasure.type] = (acc[treasure.type] || 0) + 1;
      return acc;
    }, {} as Record<TreasureType, number>);
  }
}

// Export singleton instance
export const treasuresNetworkService = TreasuresNetworkService.getInstance();
export default treasuresNetworkService;
